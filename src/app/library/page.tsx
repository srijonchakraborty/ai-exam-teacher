"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/firebase/authContext";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { MdDocument } from "@/lib/firebase/types";

export default function LibraryPage() {
  const { user } = useAuth();
  const [docs, setDocs] = useState<MdDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDocs() {
      try {
        const q = query(
          collection(db, "mdDocuments"),
          where("userId", "==", user ? user.uid : "anonymous"),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const list: MdDocument[] = [];
        querySnapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as MdDocument);
        });
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Your Study Library</h1>
          <p className="text-slate-400 text-sm mt-1">
            Access extracted Markdown study guides and flashcard sets.
          </p>
        </div>
        <Link
          href="/upload"
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-all"
        >
          + Upload New PDF
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500 text-sm">Loading library documents...</div>
      ) : docs.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-3">
          <p className="text-slate-400 font-medium">No study guides found</p>
          <p className="text-slate-500 text-sm">Upload your first PDF to generate Markdown and flashcards.</p>
          <Link href="/upload" className="inline-block mt-2 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg">
            Upload PDF
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {docs.map((item) => (
            <Link
              key={item.id}
              href={`/doc/${item.id}`}
              className="block p-5 bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl transition-all group"
            >
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-slate-100 group-hover:text-indigo-400 transition-colors">
                  {item.userTitle}
                </h3>
                <span className="text-xs px-2.5 py-1 bg-slate-800 text-slate-400 rounded-full">
                  {item.sourcePages} pages
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2 truncate">File: {item.pdfName}</p>
              <div className="flex items-center justify-between mt-4 text-xs text-slate-400 pt-3 border-t border-slate-800/60">
                <span>Model: {item.modelUsed}</span>
                <span className="text-indigo-400 font-medium group-hover:translate-x-0.5 transition-transform">
                  Open Guide →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
