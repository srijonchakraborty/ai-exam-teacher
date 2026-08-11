"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/firebase/authContext";
import { getMdDocument, getLatestFlashcardSet, saveFlashcardSet } from "@/lib/firebase/store";
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
        const item = await getMdDocument(mdDocId);
        if (item) setDocData(item);

        if (user) {
          const setItem = await getLatestFlashcardSet(mdDocId, user.uid);
          if (setItem) setCardSet(setItem);
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
    if (!user) {
      setError("Authentication required: Please sign in to generate and save flashcard decks.");
      return;
    }
    setGenerating(true);
    setError(null);

    try {
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

      const isPaid = !selectedModel.includes("nano") && !selectedModel.includes("flash");
      const setId = await saveFlashcardSet({
        mdDocId,
        userId: user.uid,
        model: selectedModel,
        isPaidModel: isPaid,
        cards: newCards,
        ...(isRegen && cardSet ? { regenerationOf: cardSet.id } : {}),
      });

      setCardSet({
        id: setId,
        mdDocId,
        userId: user.uid,
        model: selectedModel,
        isPaidModel: isPaid,
        cards: newCards,
        ...(isRegen && cardSet ? { regenerationOf: cardSet.id } : {}),
        createdAt: null as unknown as FlashcardSet["createdAt"],
      });
      setActiveCardIndex(0);
      setIsFlipped(false);
    } catch (err: unknown) {
      console.error("Flashcard generation failed:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to generate flashcards via server endpoint.";
      setError(errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <div className="text-center py-16 text-slate-500 text-xs animate-pulse">Loading flashcards deck...</div>;
  }

  const currentCard = cardSet?.cards[activeCardIndex];

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 rounded-3xl">
        <div>
          <Link href={`/doc/${mdDocId}`} className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider hover:underline">
            ← Back to Guide
          </Link>
          <h1 className="text-2xl font-extrabold text-white mt-1">Interactive Flashcard Deck</h1>
          <p className="text-slate-400 text-xs mt-0.5">{docData?.userTitle}</p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:block">Model</label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 transition-all font-mono"
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
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-2xl text-xs flex items-center justify-between shadow-lg">
          <span>⚠️ {error}</span>
          <button onClick={() => handleGenerate(!!cardSet)} className="px-3 py-1.5 bg-rose-600 text-white text-xs rounded-xl font-semibold">
            Retry Task
          </button>
        </div>
      )}

      {generating && (
        <div className="p-4 glass-card border border-indigo-500/30 text-indigo-300 rounded-2xl text-xs flex items-center gap-3 font-semibold animate-pulse shadow-lg">
          <span className="animate-spin text-indigo-400 text-base">⚡</span>
          <span>Server AI Generating Interactive Flashcard Deck...</span>
        </div>
      )}

      {!cardSet ? (
        <div className="text-center py-20 glass-card rounded-3xl space-y-6 p-8 border border-dashed border-slate-800">
          <div className="text-5xl">🃏</div>
          <h2 className="text-2xl font-bold text-white">No Flashcard Deck Generated Yet</h2>
          <p className="text-slate-400 text-xs max-w-md mx-auto leading-relaxed">
            Click below to generate a quizzable flashcard set from your Markdown study guide using server AI.
          </p>
          <button
            onClick={() => handleGenerate(false)}
            disabled={generating}
            className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold rounded-2xl shadow-xl shadow-indigo-600/25 transition-all text-xs"
          >
            {generating ? "Generating Deck..." : "✨ Generate Flashcards Deck"}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Deck Progress Bar */}
          <div className="flex items-center gap-4 text-xs text-slate-400 font-bold uppercase tracking-wider">
            <span>Card {activeCardIndex + 1} / {cardSet.cards.length}</span>
            <div className="flex-1 bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full transition-all duration-300"
                style={{ width: `${((activeCardIndex + 1) / cardSet.cards.length) * 100}%` }}
              />
            </div>
          </div>

          {/* 3D Flip Card Scene */}
          <div className="perspective-1000 w-full min-h-[320px]">
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className={`w-full min-h-[320px] glass-card glass-card-hover rounded-3xl p-8 md:p-10 flex flex-col justify-between cursor-pointer transform-style-3d relative ${
                isFlipped ? "rotate-y-180" : ""
              }`}
            >
              {/* Front Side */}
              <div className={`flex flex-col justify-between h-full space-y-6 ${isFlipped ? "hidden" : "block"}`}>
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  <span>Question / Term</span>
                  <span className="text-indigo-400 font-mono">Click to Flip ↺</span>
                </div>

                <div className="my-auto text-center py-6">
                  <p className="text-xl md:text-2xl font-semibold text-slate-100 leading-relaxed">
                    {currentCard?.front}
                  </p>
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-500 pt-4 border-t border-slate-800/60">
                  <span className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 font-mono">
                    Model: {cardSet.model}
                  </span>
                  <span>Side A</span>
                </div>
              </div>

              {/* Back Side (Flipped) */}
              <div className={`flex flex-col justify-between h-full space-y-6 ${isFlipped ? "block" : "hidden"}`}>
                <div className="flex justify-between items-center text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                  <span>Answer / Explanation</span>
                  <span className="text-indigo-400 font-mono">Click to Flip ↺</span>
                </div>

                <div className="my-auto text-center py-6">
                  <p className="text-xl md:text-2xl font-semibold text-indigo-200 leading-relaxed">
                    {currentCard?.back}
                  </p>
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-500 pt-4 border-t border-slate-800/60">
                  <span className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 font-mono">
                    Model: {cardSet.model}
                  </span>
                  <span className="text-indigo-400 font-bold">Side B</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => {
                setActiveCardIndex((prev) => Math.max(0, prev - 1));
                setIsFlipped(false);
              }}
              disabled={activeCardIndex === 0}
              className="px-5 py-2.5 glass-card hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-2xl text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              ← Previous
            </button>

            <button
              onClick={() => handleGenerate(true)}
              disabled={generating}
              className="px-5 py-2.5 glass-card border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/15 rounded-2xl text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <span>{generating ? "Regenerating..." : "🔄 Generate Again"}</span>
            </button>

            <button
              onClick={() => {
                setActiveCardIndex((prev) => Math.min(cardSet.cards.length - 1, prev + 1));
                setIsFlipped(false);
              }}
              disabled={activeCardIndex === cardSet.cards.length - 1}
              className="px-5 py-2.5 glass-card hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-2xl text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
