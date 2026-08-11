"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { MdDocument } from "@/lib/firebase/types";

export default function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [docData, setDocData] = useState<MdDocument | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDoc() {
      try {
        const docRef = doc(db, "mdDocuments", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setDocData({ id: docSnap.id, ...docSnap.data() } as MdDocument);
        }
      } catch (err) {
        console.error("Error fetching document:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDoc();
  }, [id]);

  if (loading) {
    return <div className="text-center py-16 text-slate-500 text-xs animate-pulse">Loading Markdown document...</div>;
  }

  if (!docData) {
    return (
      <div className="text-center py-20 glass-card rounded-3xl space-y-4">
        <p className="text-slate-300 font-semibold">Document not found</p>
        <Link href="/library" className="text-xs text-indigo-400 hover:underline">
          ← Back to Library
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 md:p-8 rounded-3xl border border-slate-800">
        <div className="space-y-1">
          <Link href="/library" className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider hover:underline">
            ← Library
          </Link>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">{docData.userTitle}</h1>
          <p className="text-slate-400 text-xs">
            📄 {docData.pdfName} • {docData.sourcePages} pages • Model: {docData.modelUsed || "gpt-4o-mini"}
          </p>
        </div>
        <div>
          <Link
            href={`/doc/${id}/flashcards`}
            className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-semibold rounded-2xl shadow-xl shadow-indigo-600/25 transition-all flex items-center justify-center gap-2"
          >
            <span>✨ Practice Flashcards</span>
            <span>→</span>
          </Link>
        </div>
      </div>

      {/* Markdown Reader Body */}
      <div className="glass-card p-8 md:p-12 rounded-3xl space-y-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Synthesized Markdown Study Guide
          </span>
          <span className="text-[10px] px-3 py-1 bg-slate-950 text-indigo-400 rounded-full border border-slate-800 font-mono">
            {docData.ocrUsed ? "Native + OCR Fallback" : "Native Text Layer"}
          </span>
        </div>

        <div className="prose prose-invert max-w-none text-slate-200 font-mono text-sm leading-relaxed whitespace-pre-wrap selection:bg-indigo-500 selection:text-white">
          {docData.markdown || "Markdown content is stored in external storage pointer."}
        </div>
      </div>
    </div>
  );
}
