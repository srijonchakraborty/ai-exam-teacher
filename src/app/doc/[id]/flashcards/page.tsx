"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/firebase/authContext";
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  addDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { MdDocument, FlashcardSet, Flashcard } from "@/lib/firebase/types";
import { DEFAULT_FREE_MODEL } from "@/lib/puter";

export default function FlashcardsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: mdDocId } = use(params);
  const { user } = useAuth();
  
  const [docData, setDocData] = useState<MdDocument | null>(null);
  const [cardSet, setCardSet] = useState<FlashcardSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [modelsList, setModelsList] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_FREE_MODEL);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const mdSnap = await getDoc(doc(db, "mdDocuments", mdDocId));
        if (mdSnap.exists()) {
          setDocData({ id: mdSnap.id, ...mdSnap.data() } as MdDocument);
        }

        const q = query(
          collection(db, "flashcardSets"),
          where("mdDocId", "==", mdDocId),
          where("userId", "==", user ? user.uid : "anonymous"),
          orderBy("createdAt", "desc"),
          limit(1)
        );
        const setSnap = await getDocs(q);
        if (!setSnap.empty) {
          const firstDoc = setSnap.docs[0];
          setCardSet({ id: firstDoc.id, ...firstDoc.data() } as FlashcardSet);
        }

        const modelRes = await fetch("/api/ai/models");
        const modelData = await modelRes.json();
        if (modelData.models) setModelsList(modelData.models);
      } catch (err) {
        console.error("Error loading flashcard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [mdDocId, user]);

  const handleGenerate = async (isRegen = false) => {
    if (!docData || !docData.markdown) return;
    setGenerating(true);
    setError(null);

    try {
      // Call Server-side API endpoint /api/ai/flashcards
      const aiRes = await fetch("/api/ai/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown: docData.markdown, model: selectedModel }),
      });

      const aiData = await aiRes.json();
      if (!aiRes.ok) throw new Error(aiData.error || "Server AI generation failed");

      const cardsData: Array<{ front: string; back: string; tags?: string[] }> = aiData.cards;
      
      const newCards: Flashcard[] = cardsData.map((c, idx) => ({
        id: `card_${idx}_${Date.now()}`,
        front: c.front,
        back: c.back,
        tags: c.tags || [],
      }));

      const newSetData = {
        mdDocId,
        userId: user ? user.uid : "anonymous",
        model: selectedModel,
        isPaidModel: !selectedModel.includes("nano") && !selectedModel.includes("flash"),
        cards: newCards,
        ...(isRegen && cardSet ? { regenerationOf: cardSet.id } : {}),
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "flashcardSets"), newSetData);
      setCardSet({ id: docRef.id, ...newSetData, createdAt: null as any });
      setActiveCardIndex(0);
      setIsFlipped(false);
    } catch (err: any) {
      console.error("Flashcard generation failed:", err);
      setError(err.message || "Failed to generate flashcards via server endpoint.");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-500 text-sm">Loading flashcards...</div>;
  }

  const currentCard = cardSet?.cards[activeCardIndex];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/doc/${mdDocId}`} className="text-xs text-indigo-400 font-medium hover:underline">
            ← Back to Document
          </Link>
          <h1 className="text-2xl font-bold text-white mt-1">Flashcard Deck</h1>
          <p className="text-slate-400 text-xs mt-0.5">{docData?.userTitle}</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none"
          >
            {modelsList.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => handleGenerate(!!cardSet)} className="px-3 py-1 bg-rose-600 text-white text-xs rounded-lg font-semibold">
            Retry
          </button>
        </div>
      )}

      {generating && (
        <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 rounded-xl text-xs flex items-center gap-3 font-semibold animate-pulse">
          <span className="animate-spin text-indigo-400">⚡</span>
          <span>Backend Server AI Processing: Generating Flashcards Deck...</span>
        </div>
      )}

      {!cardSet ? (
        <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 p-8">
          <div className="text-4xl">🃏</div>
          <h2 className="text-xl font-bold text-white">No Flashcards Yet</h2>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Click below to trigger server-side Puter / AI flashcard deck generation.
          </p>
          <button
            onClick={() => handleGenerate(false)}
            disabled={generating}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl shadow-lg transition-all text-sm"
          >
            {generating ? "Generating Deck..." : "Generate Flashcards"}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Card Viewer */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full min-h-[300px] bg-slate-900 border border-slate-800 hover:border-indigo-500/40 rounded-3xl p-8 flex flex-col justify-between cursor-pointer transition-all shadow-2xl select-none"
          >
            <div className="flex justify-between items-center text-xs text-slate-500 font-semibold uppercase tracking-wider">
              <span>Card {activeCardIndex + 1} of {cardSet.cards.length}</span>
              <span className="text-indigo-400">{isFlipped ? "Answer / Back" : "Question / Front (Click to Flip)"}</span>
            </div>

            <div className="my-auto py-8 text-center">
              <p className={`text-xl md:text-2xl font-medium leading-relaxed ${isFlipped ? "text-indigo-300" : "text-slate-100"}`}>
                {isFlipped ? currentCard?.back : currentCard?.front}
              </p>
            </div>

            <div className="flex justify-between items-center text-xs text-slate-500">
              <span className="bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
                Model: {cardSet.model}
              </span>
              <span>Click card to reveal side</span>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setActiveCardIndex((prev) => Math.max(0, prev - 1));
                setIsFlipped(false);
              }}
              disabled={activeCardIndex === 0}
              className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl text-sm font-medium disabled:opacity-40"
            >
              ← Previous
            </button>

            <button
              onClick={() => handleGenerate(true)}
              disabled={generating}
              className="px-4 py-2 bg-slate-900 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-600/10 rounded-xl text-xs font-semibold"
            >
              {generating ? "Regenerating..." : "🔄 Generate Again"}
            </button>

            <button
              onClick={() => {
                setActiveCardIndex((prev) => Math.min(cardSet.cards.length - 1, prev + 1));
                setIsFlipped(false);
              }}
              disabled={activeCardIndex === cardSet.cards.length - 1}
              className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl text-sm font-medium disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
