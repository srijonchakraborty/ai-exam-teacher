"use client";

import Link from "next/link";
import { useAuth } from "@/lib/firebase/authContext";

export default function Home() {
  const { user, signInWithGoogle, signOut, loading } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-8">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
        AI-Powered Study Assistant
      </div>

      <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight max-w-3xl leading-tight">
        Turn your exam PDFs into <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">quizzable flashcards</span> in seconds.
      </h1>

      <p className="text-slate-400 text-base md:text-lg max-w-2xl">
        Upload textbook chapters, lecture slides, or scanned notes. Our engine extracts native text, runs OCR fallback, formats clean Markdown, and builds interactive study decks.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
        <Link
          href="/upload"
          className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
        >
          <span>Upload PDF & Generate</span>
          <span>→</span>
        </Link>
        <Link
          href="/library"
          className="px-6 py-3.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 font-medium rounded-xl transition-all"
        >
          View Library
        </Link>
      </div>

      <div className="pt-8 border-t border-slate-800/80 w-full max-w-md">
        {loading ? (
          <p className="text-slate-500 text-sm">Checking authentication...</p>
        ) : user ? (
          <div className="flex items-center justify-between bg-slate-900/40 p-4 rounded-xl border border-slate-800">
            <div className="text-left">
              <p className="text-xs text-slate-400">Signed in as</p>
              <p className="text-sm font-medium text-slate-200">{user.email || user.displayName}</p>
            </div>
            <button
              onClick={signOut}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium transition-colors px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <button
            onClick={signInWithGoogle}
            className="w-full px-4 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
          >
            <span>Sign in with Google</span>
          </button>
        )}
      </div>
    </div>
  );
}
