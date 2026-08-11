"use client";

import Link from "next/link";
import { useAuth } from "@/lib/firebase/authContext";

export default function Home() {
  const { user, signInWithGoogle, signOut, loading } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] text-center space-y-10 py-6">
      {/* Badge Pill */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold tracking-wide shadow-sm shadow-indigo-500/10 animate-bounce-slow">
        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
        <span>Next-Gen AI Flashcard Studio</span>
      </div>

      {/* Hero Headline */}
      <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight max-w-4xl leading-tight">
        Master any exam topic from your{" "}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-300 to-indigo-300">
          PDF study guides
        </span>
      </h1>

      {/* Subtitle */}
      <p className="text-slate-400 text-base md:text-lg max-w-2xl leading-relaxed">
        Extract text layer & OCR scans, synthesize clean structured Markdown, and auto-generate quizzable 3D flashcard decks powered by server AI.
      </p>

      {/* Primary Actions */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
        <Link
          href="/upload"
          className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold rounded-2xl shadow-xl shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-3 text-sm"
        >
          <span>⚡ Upload PDF & Start</span>
          <span>→</span>
        </Link>
        <Link
          href="/library"
          className="px-8 py-4 glass-card hover:bg-slate-800/80 text-slate-200 font-semibold rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] text-sm"
        >
          📖 Open Library
        </Link>
      </div>

      {/* Feature Highlight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full pt-8 text-left">
        <div className="glass-card p-6 rounded-2xl space-y-2">
          <div className="text-2xl">📄</div>
          <h3 className="font-bold text-white text-base">PDF & OCR Extraction</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Extract native text layer via pdf.js with fallback OCR for scanned pages.
          </p>
        </div>

        <div className="glass-card p-6 rounded-2xl space-y-2">
          <div className="text-2xl">✍️</div>
          <h3 className="font-bold text-white text-base">Markdown Synthesis</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Server AI organizes extracted text into clean, structured study guides.
          </p>
        </div>

        <div className="glass-card p-6 rounded-2xl space-y-2">
          <div className="text-2xl">🃏</div>
          <h3 className="font-bold text-white text-base">Interactive 3D Decks</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Practice with flip card animations, model options, and versioned regeneration.
          </p>
        </div>
      </div>

      {/* Auth Card */}
      <div className="pt-4 w-full max-w-md">
        {loading ? (
          <p className="text-slate-500 text-xs animate-pulse">Checking authentication status...</p>
        ) : user ? (
          <div className="glass-card p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div className="text-left">
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Signed in as</p>
              <p className="text-xs font-semibold text-slate-200">{user.email || user.displayName}</p>
            </div>
            <button
              onClick={signOut}
              className="text-xs text-rose-400 hover:text-rose-300 font-semibold px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-all"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <button
            onClick={signInWithGoogle}
            className="w-full px-5 py-3.5 glass-card hover:bg-slate-800/80 border border-slate-800 text-slate-200 rounded-2xl text-xs font-semibold transition-all flex items-center justify-center gap-2"
          >
            <span>🔐 Sign in with Google</span>
          </button>
        )}
      </div>
    </div>
  );
}
