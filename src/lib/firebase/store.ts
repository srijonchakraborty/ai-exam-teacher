import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  setDoc,
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp 
} from "firebase/firestore";
import { ref, uploadString, getDownloadURL, getBytes } from "firebase/storage";
import { db, storage } from "./config";
import { MdDocument, FlashcardSet, Flashcard } from "./types";

export const OVERFLOW_THRESHOLD_CHARS = 900000; // ~900 KB

export interface CreateMdDocInput {
  userId: string;
  pdfName: string;
  userTitle: string;
  markdown: string;
  sourcePages: number;
  ocrUsed: boolean;
  modelUsed: string;
}

export interface CreateFlashcardSetInput {
  mdDocId: string;
  userId: string;
  model: string;
  isPaidModel: boolean;
  cards: Flashcard[];
  regenerationOf?: string;
}

/**
 * Validates that user is authenticated and not anonymous.
 */
function assertAuthenticatedUser(userId: string | undefined | null) {
  if (!userId || userId === "anonymous") {
    throw new Error("Authentication required. Please sign in to save or retrieve documents.");
  }
}

/**
 * Saves a generated Markdown study guide to Firestore (with Storage overflow if > 900KB).
 */
export async function saveMdDocument(input: CreateMdDocInput): Promise<string> {
  assertAuthenticatedUser(input.userId);

  const isOverflow = input.markdown.length > OVERFLOW_THRESHOLD_CHARS;
  let markdownStorageUrl: string | null = null;
  let storagePath: string | null = null;
  let storedMarkdown: string | null = input.markdown;

  if (isOverflow) {
    storedMarkdown = null;
    const tempDocRef = doc(collection(db, "mdDocuments"));
    const docId = tempDocRef.id;
    storagePath = `users/${input.userId}/mdDocuments/${docId}.md`;
    
    const storageRef = ref(storage, storagePath);
    await uploadString(storageRef, input.markdown, "raw", {
      contentType: "text/markdown",
    });
    markdownStorageUrl = await getDownloadURL(storageRef);

    const docPayload = {
      userId: input.userId,
      pdfName: input.pdfName,
      userTitle: input.userTitle,
      markdown: null,
      markdownStorageUrl,
      storagePath,
      sourcePages: input.sourcePages,
      ocrUsed: input.ocrUsed,
      modelUsed: input.modelUsed,
      status: "ready" as const,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(tempDocRef, docPayload);
    return tempDocRef.id;
  }

  const docPayload = {
    userId: input.userId,
    pdfName: input.pdfName,
    userTitle: input.userTitle,
    markdown: storedMarkdown,
    markdownStorageUrl: null,
    storagePath: null,
    sourcePages: input.sourcePages,
    ocrUsed: input.ocrUsed,
    modelUsed: input.modelUsed,
    status: "ready" as const,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, "mdDocuments"), docPayload);
  return docRef.id;
}

/**
 * Fetches a single MdDocument by ID, downloading from Storage if overflowed.
 */
export async function getMdDocument(docId: string): Promise<MdDocument | null> {
  const docRef = doc(db, "mdDocuments", docId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;

  const data = docSnap.data();
  let markdownContent = data.markdown;

  if (markdownContent === null && (data.storagePath || data.markdownStorageUrl)) {
    try {
      if (data.storagePath) {
        const storageRef = ref(storage, data.storagePath);
        const bytes = await getBytes(storageRef);
        markdownContent = new TextDecoder().decode(bytes);
      } else if (data.markdownStorageUrl) {
        const res = await fetch(data.markdownStorageUrl);
        if (res.ok) {
          markdownContent = await res.text();
        }
      }
    } catch (err) {
      console.error("Failed to load markdown from Firebase Storage:", err);
      markdownContent = "Error: Failed to fetch full markdown document content from storage.";
    }
  }

  return {
    id: docSnap.id,
    ...data,
    markdown: markdownContent,
  } as MdDocument;
}

/**
 * Queries mdDocuments for a specific user, sorted by newest first.
 */
export async function getMdDocumentsByUser(userId: string): Promise<MdDocument[]> {
  assertAuthenticatedUser(userId);

  const q = query(
    collection(db, "mdDocuments"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );

  const querySnapshot = await getDocs(q);
  const list: MdDocument[] = [];
  querySnapshot.forEach((docSnap) => {
    list.push({ id: docSnap.id, ...docSnap.data() } as MdDocument);
  });
  return list;
}

/**
 * Saves a flashcard set for a document after checking user authentication.
 */
export async function saveFlashcardSet(input: CreateFlashcardSetInput): Promise<string> {
  assertAuthenticatedUser(input.userId);

  const setPayload = {
    mdDocId: input.mdDocId,
    userId: input.userId,
    model: input.model,
    isPaidModel: input.isPaidModel,
    cards: input.cards,
    ...(input.regenerationOf ? { regenerationOf: input.regenerationOf } : {}),
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, "flashcardSets"), setPayload);
  return docRef.id;
}

/**
 * Gets the latest flashcard set for a document and user.
 */
export async function getLatestFlashcardSet(mdDocId: string, userId: string): Promise<FlashcardSet | null> {
  assertAuthenticatedUser(userId);

  const q = query(
    collection(db, "flashcardSets"),
    where("mdDocId", "==", mdDocId),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(1)
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  const firstDoc = snapshot.docs[0];
  return { id: firstDoc.id, ...firstDoc.data() } as FlashcardSet;
}
