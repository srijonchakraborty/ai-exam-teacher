export interface PageExtraction {
  pageNum: number;
  nativeText: string;
  ocrText?: string;
  ocrUsed: boolean;
}

export async function extractTextFromPdf(file: File, onProgress?: (current: number, total: number) => void): Promise<{ pages: PageExtraction[]; totalPages: number; hasOcrFallback: boolean }> {
  if (typeof window === "undefined") {
    throw new Error("PDF extraction must be run in the browser.");
  }

  const pdfjsLib = await import("pdfjs-dist");
  
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  }

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;
  const pages: PageExtraction[] = [];
  let hasOcrFallback = false;

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => (item as Record<string, unknown>).str || "")
      .join(" ")
      .trim();

    const ocrUsed = pageText.length < 20;
    if (ocrUsed) hasOcrFallback = true;

    pages.push({
      pageNum: i,
      nativeText: pageText,
      ocrUsed,
    });

    if (onProgress) {
      onProgress(i, totalPages);
    }
  }

  return { pages, totalPages, hasOcrFallback };
}
