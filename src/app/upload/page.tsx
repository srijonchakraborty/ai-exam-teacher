"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { extractTextFromPdf } from "@/lib/pdf";
import { generateMarkdownFromText } from "@/lib/puter";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/firebase/authContext";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function UploadPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [statusText, setStatusText] = useState("");
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
    setStatusText("Extracting PDF text layer...");

    try {
      const { pages, totalPages, hasOcrFallback } = await extractTextFromPdf(
        file,
        (current, total) => setProgress({ current, total })
      );

      setStatusText("Synthesizing extracted content with Puter.js AI...");
      const fullRawText = pages.map((p) => `--- Page ${p.pageNum} ---\n${p.nativeText}`).join("\n\n");
      
      const markdown = await generateMarkdownFromText(fullRawText);

      setStatusText("Saving Markdown document to Firestore...");
      const docRef = await addDoc(collection(db, "mdDocuments"), {
        userId: user ? user.uid : "anonymous",
        pdfName: file.name,
        userTitle: title || file.name,
        markdown: markdown.length > 900000 ? null : markdown,
        sourcePages: totalPages,
        ocrUsed: hasOcrFallback,
        modelUsed: "gpt-5.4-nano",
        status: "ready",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      router.push(`/doc/${docRef.id}`);
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "An error occurred during PDF processing.");
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Upload Exam / Study PDF</h1>
        <p className="text-slate-400 text-sm mt-1">
          Select a PDF document to extract content and convert into clean Markdown.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={handleProcess} className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold">
            Retry
          </button>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Document Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Organic Chemistry Chapter 4"
            className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Select PDF File
          </label>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="w-full text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600/20 file:text-indigo-300 file:border-indigo-500/30 hover:file:bg-indigo-600/30 cursor-pointer bg-slate-950 border border-slate-800 rounded-xl p-2 text-sm"
          />
        </div>

        {loading && (
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <p className="text-xs text-indigo-400 font-medium">{statusText}</p>
            {progress && (
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-500 h-full transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleProcess}
          disabled={!file || loading}
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl shadow-lg transition-all text-sm"
        >
          {loading ? "Processing Document..." : "Start Extraction"}
        </button>
      </div>
    </div>
  );
}
