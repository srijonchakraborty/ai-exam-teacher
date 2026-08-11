import { Timestamp } from "firebase/firestore";

export interface MdDocument {
  id: string;
  userId: string;
  pdfName: string;
  userTitle: string;
  markdown: string | null;
  markdownStorageUrl?: string;
  sourcePages: number;
  ocrUsed: boolean;
  modelUsed: string;
  status: "processing" | "ready" | "error";
  errorMessage?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  tags?: string[];
}

export interface FlashcardSet {
  id: string;
  mdDocId: string;
  userId: string;
  model: string;
  isPaidModel: boolean;
  cards: Flashcard[];
  regenerationOf?: string;
  createdAt: Timestamp;
}
