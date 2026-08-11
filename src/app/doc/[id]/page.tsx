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
    return <div className="text-center py-12 text-slate-500 text-sm">Loading Markdown document...</div>;
  }

  if (!docData) {
    return (
      <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
        <p className="text-slate-300 font-medium">Document not found</p>
        <Link href="/library" className="text-xs text-indigo-400 underline">
          Back to Library
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h1 className="text-2xl font-bold text-white">{docData.userTitle}</h1>
          <p className="text-slate-400 text-xs mt-1">
            File: {docData.pdfName} • {docData.sourcePages} pages
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/doc/${id}/flashcards`}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-all shadow-md flex items-center gap-2"
          >
            <span>✨ Generate / View Flashcards</span>
          </Link>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 pb-2 border-b border-slate-800">
          Markdown Content
        </h2>
        <div className="prose prose-invert max-w-none text-slate-300 whitespace-pre-wrap font-mono text-sm leading-relaxed">
          {docData.markdown || "Markdown content is stored in external storage."}
        </div>
      </div>
    </div>
  );
}
