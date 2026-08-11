import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/lib/firebase/authContext";

const inter = Inter({ subsets: ["latin"] });

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
    <html lang="en" className="h-full">
      <head>
        <Script src="https://js.puter.com/v2/" strategy="beforeInteractive" />
      </head>
      <body className={`${inter.className} h-full bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white`}>
        <AuthProvider>
          <div className="min-h-full flex flex-col">
            <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
              <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                <a href="/" className="flex items-center gap-2 font-bold text-lg text-indigo-400 hover:text-indigo-300 transition-colors">
                  <span className="bg-indigo-600/20 p-2 rounded-lg border border-indigo-500/30">📚</span>
                  <span>AI Exam Teacher</span>
                </a>
                <nav className="flex items-center gap-6 text-sm font-medium">
                  <a href="/upload" className="text-slate-300 hover:text-white transition-colors">Upload PDF</a>
                  <a href="/library" className="text-slate-300 hover:text-white transition-colors">Library</a>
                </nav>
              </div>
            </header>
            <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
