# 00 — Overview

## What the app does

1. User uploads a **PDF** (mixed text + images/scans).
2. App extracts:
   - **Native text** (selectable text layer) via `pdf.js`.
   - **OCR text** from pages/images that have no text layer, via **Puter.js OCR** (`puter.ai.img2txt`, provider `aws-textract` or `mistral`).
3. Extracted text + OCR text is sent to a **free Puter.js chat model** (e.g. `gpt-5.4-nano`, `google/gemini-3.6-flash`) with a "convert to clean Markdown" prompt. Images get their own OCR/description pass and are folded into the same Markdown.
4. The resulting **Markdown** is stored in **Firestore**, keyed by a generated **unique ID**, alongside:
   - original PDF filename
   - user-provided name/title
   - created timestamp
5. The library screen lists all stored MD documents (title, pdf name, created time).
6. User opens a document and clicks **Generate Flashcards**, choosing a **free or paid** Puter.js model.
7. Flashcards are generated from the MD content and stored in a **separate Firestore collection**, linked via `mdDocId`.
8. If flashcards already exist for that doc, the UI shows them + a **"Generate Again"** button instead of silently regenerating.
9. Project delivery itself is agent-driven: tickets on a GitHub Project board are picked up by an **agent team** (backend, frontend, testing, reviewer, git) running inside **Antigravity CLI**.

## Data flow diagram (text form)

```
                 ┌───────────────┐
   PDF upload →  │   Frontend    │
                 │ (Next.js/React)│
                 └──────┬────────┘
                        │
        ┌───────────────┼───────────────────┐
        ▼                                    ▼
 pdf.js: text layer               puter.ai.img2txt (OCR)
 per page                         for image-only / scanned pages
        │                                    │
        └───────────────┬────────────────────┘
                         ▼
             Merge into raw extraction object
             { pageNum, nativeText, ocrText, images[] }
                         │
                         ▼
        puter.ai.chat( free model, "convert to Markdown" )
                         │
                         ▼
                 Final Markdown string
                         │
                         ▼
      Firestore: mdDocuments/{uid} {
        id, userId, pdfName, userTitle, markdown,
        createdAt, sizeBytes, sourcePages
      }
                         │
             (library screen lists these)
                         │
              user clicks "Generate Flashcards"
                         │
                         ▼
     puter.ai.chat( chosen model, "make flashcards from MD" )
                         │
                         ▼
      Firestore: flashcardSets/{uid} {
        id, mdDocId, userId, model, cards[], createdAt, regenCount
      }
```

## Why this shape

- **No backend AI proxy needed.** Puter.js runs client-side and each user authenticates with their own free Puter account (User-Pays model), so you never hold API keys or pay for inference — this matches "free models" requirement directly.
- **Firebase** is used only for your own data (documents, flashcards, user profile), not for AI calls.
- **Idempotent flashcard generation**: existence check on `flashcardSets` by `mdDocId` before generating; "Generate Again" is an explicit, separate write path (bumps `regenCount`, can either overwrite or version).

## Non-functional requirements to bake into tickets

- Large PDFs (50+ pages): chunk pages before sending to the chat model (model context limits), then stitch Markdown sections together.
- OCR failures / rate limits from Puter.js: retry with backoff, surface a per-page error state, don't fail the whole document.
- Firestore security rules must scope every read/write to `request.auth.uid`.
- Markdown storage size: Firestore doc limit is 1 MiB — for very large extracted docs, split Markdown across multiple `mdChunks` sub-documents or store in Firebase Storage and keep a pointer in Firestore.
