"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/firebase/authContext";
import { getMdDocumentsByUser } from "@/lib/firebase/store";
import { MdDocument } from "@/lib/firebase/types";

export default function LibraryPage() {
  const { user } = useAuth();
  const [docs, setDocs] = useState<MdDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDocs() {
      if (!user) {
        setDocs([]);
        setLoading(false);
        return;
      }
      try {
        const list = await getMdDocumentsByUser(user.uid);
        setDocs(list);
      } catch (err) {
        console.error("Error fetching library:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDocs();
  }, [user]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
            📚 Study Collection
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Your Study Library</h1>
          <p className="text-slate-400 text-sm mt-1">
            Access your extracted Markdown study guides and flashcard decks.
          </p>
        </div>
        <Link
          href="/upload"
          className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-semibold rounded-2xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 self-start md:self-auto"
        >
          <span>+ Upload New PDF</span>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-16 glass-card rounded-3xl text-slate-500 text-xs animate-pulse">
          Loading library collection...
        </div>
      ) : docs.length === 0 ? (
        <div className="text-center py-20 glass-card rounded-3xl space-y-4 p-8 border border-dashed border-slate-800">
          <div className="text-5xl">📖</div>
          <h3 className="text-lg font-bold text-white">No Study Guides Found</h3>
          <p className="text-slate-400 text-xs max-w-sm mx-auto">
            Upload your first textbook chapter or PDF exam note to generate AI flashcards.
          </p>
          <Link
            href="/upload"
            className="inline-block mt-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-all"
          >
            Upload PDF Now
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {docs.map((item) => (
            <Link
              key={item.id}
              href={`/doc/${item.id}`}
              className="glass-card glass-card-hover p-6 rounded-3xl space-y-4 group flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-bold text-slate-100 text-lg group-hover:text-indigo-300 transition-colors line-clamp-1">
                    {item.userTitle}
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20 shrink-0">
                    {item.sourcePages} pages
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate">📄 {item.pdfName}</p>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-800/80">
                <span className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-[10px] font-mono">
                  {item.modelUsed || "gpt-4o-mini"}
                </span>
                <span className="text-indigo-400 font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-1 text-xs">
                  <span>Open Study Guide</span>
                  <span>→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
