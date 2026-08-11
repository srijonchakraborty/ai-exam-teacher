"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { extractTextFromPdf } from "@/lib/pdf";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/firebase/authContext";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function UploadPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"idle" | "extracting" | "server-ai" | "saving">("idle");
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (!title) {
        setTitle(selected.name.replace(/\.pdf$/i, ""));
      }
    }
  };

  const handleProcess = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setStep("extracting");

    try {
      // Step 1: Local PDF text layer extraction
      const { pages, totalPages, hasOcrFallback } = await extractTextFromPdf(
        file,
        (current, total) => setProgress({ current, total })
      );

      const fullRawText = pages.map((p) => `--- Page ${p.pageNum} ---\n${p.nativeText}`).join("\n\n");

      // Step 2: Call Server-side API Route for Markdown Synthesis
      setStep("server-ai");
      const aiRes = await fetch("/api/ai/markdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: fullRawText, model: "gpt-4o-mini" }),
      });

      const aiData = await aiRes.json();
      if (!aiRes.ok) throw new Error(aiData.error || "Server AI processing failed");

      const markdown = aiData.markdown;

      // Step 3: Save to Firestore
      setStep("saving");
      const docRef = await addDoc(collection(db, "mdDocuments"), {
        userId: user ? user.uid : "anonymous",
        pdfName: file.name,
        userTitle: title || file.name,
        markdown: markdown.length > 900000 ? null : markdown,
        sourcePages: totalPages,
        ocrUsed: hasOcrFallback,
        modelUsed: aiData.modelUsed || "gpt-4o-mini",
        status: "ready",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      router.push(`/doc/${docRef.id}`);
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "An error occurred during backend PDF processing.");
    } finally {
      setLoading(false);
      setStep("idle");
      setProgress(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto glass-card p-8 md:p-10 rounded-3xl space-y-8 relative overflow-hidden">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-3">
          ⚡ Server Pipeline
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Upload Exam PDF</h1>
        <p className="text-slate-400 text-sm mt-1">
          Extract text layers, process OCR fallbacks, and generate structured study guides.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-2xl text-xs flex items-center justify-between shadow-lg">
          <span>⚠️ {error}</span>
          <button onClick={handleProcess} className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-semibold transition-all">
            Retry Task
          </button>
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            Document Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Organic Chemistry Chapter 4"
            className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 rounded-2xl px-4 py-3.5 focus:outline-none focus:border-indigo-500 text-sm transition-all shadow-inner"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            PDF File Selection
          </label>
          <div className="relative border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 text-center transition-all bg-slate-950/40">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="space-y-2 pointer-events-none">
              <div className="text-3xl">📥</div>
              <p className="text-xs font-semibold text-slate-200">
                {file ? file.name : "Click or drag PDF file here"}
              </p>
              <p className="text-[10px] text-slate-500">
                {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "Supports native text layer and scanned PDFs"}
              </p>
            </div>
          </div>
        </div>

        {/* Real-time Visual Step Progress Indicator */}
        {loading && (
          <div className="p-6 bg-slate-950/90 border border-indigo-500/30 rounded-2xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between text-xs font-bold text-slate-200">
              <span className="flex items-center gap-2">
                <span className="animate-spin text-indigo-400">⚡</span>
                <span>Active Step: {step === "extracting" ? "Page Text Layer Parsing" : step === "server-ai" ? "Server AI Synthesis" : "Database Persistence"}</span>
              </span>
              <span className="text-indigo-400 font-mono text-[10px]">IN_PROGRESS</span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center text-[10px] uppercase font-bold">
              <div className={`p-2.5 rounded-xl border transition-all ${step === "extracting" ? "bg-indigo-600/20 border-indigo-500 text-indigo-300 animate-pulse shadow-md" : "bg-slate-900/60 border-slate-800 text-slate-600"}`}>
                1. Text Layer
              </div>
              <div className={`p-2.5 rounded-xl border transition-all ${step === "server-ai" ? "bg-indigo-600/20 border-indigo-500 text-indigo-300 animate-pulse shadow-md" : "bg-slate-900/60 border-slate-800 text-slate-600"}`}>
                2. Server AI
              </div>
              <div className={`p-2.5 rounded-xl border transition-all ${step === "saving" ? "bg-indigo-600/20 border-indigo-500 text-indigo-300 animate-pulse shadow-md" : "bg-slate-900/60 border-slate-800 text-slate-600"}`}>
                3. Save Guide
              </div>
            </div>

            {progress && (
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-400 h-full transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleProcess}
          disabled={!file || loading}
          className="w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-2xl shadow-xl shadow-indigo-600/25 transition-all text-sm flex items-center justify-center gap-2"
        >
          {loading ? "Processing Document..." : "Start PDF Extraction"}
        </button>
      </div>
    </div>
  );
}
