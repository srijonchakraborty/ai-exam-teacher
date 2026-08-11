# 02 — Data Model (Firestore)

## Collection: `mdDocuments`
One doc per uploaded PDF that has been converted to Markdown.

```ts
mdDocuments/{docId} = {
  id: string,              // == docId, also stored inline for easy client use
  userId: string,          // Firebase Auth uid, owner
  pdfName: string,         // original filename, e.g. "chapter-4.pdf"
  userTitle: string,       // user-provided display name
  markdown: string,        // generated MD (or pointer, see "overflow" below)
  sourcePages: number,     // page count of original PDF
  ocrUsed: boolean,        // whether any page needed OCR fallback
  modelUsed: string,       // e.g. "gpt-5.4-nano"
  status: "processing" | "ready" | "error",
  errorMessage?: string,
  createdAt: Timestamp,
  updatedAt: Timestamp,
}
```

**Overflow rule:** if `markdown.length` would push the document over ~900 KB, store the Markdown in Firebase Storage at `users/{userId}/mdDocuments/{docId}.md` instead, and set `markdown: null`, `markdownStorageUrl: string`.

## Collection: `flashcardSets`
One doc per flashcard generation (a document can have at most one "current" set, but history is kept for the "Generate Again" button).

```ts
flashcardSets/{setId} = {
  id: string,
  mdDocId: string,         // FK -> mdDocuments/{docId}
  userId: string,
  model: string,           // model used to generate, e.g. "anthropic/claude-sonnet-5"
  isPaidModel: boolean,
  cards: [
    { id: string, front: string, back: string, tags?: string[] }
  ],
  regenerationOf?: string, // setId of the previous set, if this is a "Generate Again" run
  createdAt: Timestamp,
}
```

**Existence check before generating:** query
`flashcardSets.where('mdDocId','==',docId).where('userId','==',uid).orderBy('createdAt','desc').limit(1)`.
If a result exists, the UI shows the cards + "Generate Again"; it only calls the model when the user explicitly clicks that button, which writes a **new** `flashcardSets` doc with `regenerationOf` set (keeps history rather than overwriting).

## Indexes needed (`firestore.indexes.json`)
- `mdDocuments`: composite index on (`userId` asc, `createdAt` desc) — for the library list.
- `flashcardSets`: composite index on (`mdDocId` asc, `createdAt` desc) — for the "does a set already exist" check and history view.

## Security rules sketch (`firestore.rules`)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /mdDocuments/{docId} {
      allow read, update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    match /flashcardSets/{setId} {
      allow read, delete: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId
                    && exists(/databases/$(database)/documents/mdDocuments/$(request.resource.data.mdDocId));
    }
  }
}
```
