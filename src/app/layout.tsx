import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import Link from "next/link";
import "./globals.css";
import { AuthProvider } from "@/lib/firebase/authContext";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Exam Teacher — Turn PDFs into Flashcards",
  description: "Extract text & OCR from PDFs and generate AI flashcards effortlessly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full dark">
      <head>
        <Script src="https://js.puter.com/v2/" strategy="beforeInteractive" />
      </head>
      <body className={`${jakarta.className} h-full bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white relative overflow-x-hidden`}>
        {/* Ambient background glow elements */}
        <div className="ambient-glow bg-indigo-600 w-[500px] h-[500px] -top-32 -left-32 animate-pulse-glow" />
        <div className="ambient-glow bg-cyan-600 w-[400px] h-[400px] top-1/2 -right-32 animate-pulse-glow" />

        <AuthProvider>
          <div className="min-h-full flex flex-col relative z-10">
            {/* Header / Navbar */}
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
                <nav className="flex items-center gap-2">
                  <Link
                    href="/upload"
                    className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900/80 rounded-xl transition-all border border-transparent hover:border-slate-800"
                  >
                    Upload PDF
                  </Link>
                  <Link
                    href="/library"
                    className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900/80 rounded-xl transition-all border border-transparent hover:border-slate-800"
                  >
                    Study Library
                  </Link>
                </nav>
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 md:py-12">
              {children}
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-900 bg-slate-950/40 py-6 text-center text-xs text-slate-600">
              AI Exam Teacher • Agent-Driven Study Deck Engine
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
