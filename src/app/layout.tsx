import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/lib/firebase/authContext";

import { Navbar } from "@/components/Navbar";

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
            <Navbar />

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
