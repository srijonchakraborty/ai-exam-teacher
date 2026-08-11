"use client";

import Link from "next/link";
import { useAuth } from "@/lib/firebase/authContext";

export function Navbar() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-50 transition-all">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 font-extrabold text-lg tracking-tight group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            📚
          </div>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-indigo-200 to-slate-300">
            AI Exam Teacher
          </span>
        </Link>
        <nav className="flex items-center gap-3">
          <Link
            href="/upload"
            className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900/80 rounded-xl transition-all border border-transparent hover:border-slate-800"
          >
            Upload PDF
          </Link>
          <Link
            href="/library"
            className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900/80 rounded-xl transition-all border border-transparent hover:border-slate-800"
          >
            Study Library
          </Link>

          <div className="h-4 w-px bg-slate-800 my-auto hidden sm:block" />

          {loading ? (
            <div className="w-20 h-8 rounded-xl bg-slate-900 animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium hidden md:inline max-w-[120px] truncate">
                {user.email || user.displayName}
              </span>
              <button
                onClick={signOut}
                className="px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 font-semibold rounded-xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-all"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
            >
              <span>🔐 Sign In</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
