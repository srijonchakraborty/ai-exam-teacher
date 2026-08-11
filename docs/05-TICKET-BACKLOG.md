# 05 — Ticket Backlog

Format per ticket: `[label] Title — one-line acceptance criteria summary (full criteria go in the issue body using the template from doc 04)`.

## Epic A — Project scaffolding
1. `[infra]` Init Next.js + TS + Tailwind app, repo structure per `01-TECH-STACK.md`.
2. `[infra]` Firebase project setup (Auth + Firestore + Storage), env config, `firebase.json`.
3. `[infra]` CI workflow (`.github/workflows/ci.yml`), lint/typecheck/test scripts.
4. `[docs]` Add this `/docs` package to the repo, link from `README.md`.

## Epic B — Auth & shell
5. `[backend]` Firebase Auth wiring (email + Google), `useAuth()` hook.
6. `[frontend]` App shell/layout, protected routes, sign-in/sign-out UI.

## Epic C — PDF extraction pipeline
7. `[backend]` `lib/pdf`: page-by-page native text extraction via `pdf.js`.
8. `[backend]` `lib/puter`: `img2txt` wrapper with provider fallback (`aws-textract` → `mistral`) + retry/backoff for pages with no native text.
9. `[backend]` Merge logic: combine native + OCR text per page into one extraction object; flag `ocrUsed`.
10. `[frontend]` Upload screen: drag/drop PDF, per-page progress indicator during extraction.

## Epic D — Markdown generation
11. `[backend]` `lib/puter`: `chat` wrapper for "raw extraction → clean Markdown" prompt, with page-chunking for long PDFs and section stitching.
12. `[backend]` Firestore write path: create `mdDocuments` doc (see `02-DATA-MODEL.md`), overflow-to-Storage logic for >900KB Markdown.
13. `[frontend]` "Name this document" prompt (user title) before/after generation; error state with retry if a chunk's model call fails.

## Epic E — Library / document list
14. `[backend]` Firestore query + index for `mdDocuments` by `userId`, `createdAt desc`.
15. `[frontend]` Library screen: list cards showing user title, pdf name, created time; open → doc viewer.
16. `[frontend]` Markdown viewer/renderer for a single `mdDocuments` entry.

## Epic F — Flashcards
17. `[backend]` `lib/puter`: flashcard-generation prompt + response parsing into `{front, back, tags}[]`.
18. `[backend]` Firestore write path for `flashcardSets`, existence-check query by `mdDocId`.
19. `[frontend]` Model picker (free/paid) sourced from `puter.ai.listModels()`, "Generate Flashcards" button.
20. `[frontend]` Flashcard viewer (flip/reveal UI) + "Generate Again" button, only visible/actionable when a set already exists.
21. `[backend]` "Generate Again" write path: new `flashcardSets` doc with `regenerationOf`, doesn't delete history.

## Epic G — Hardening
22. `[testing]` Unit tests: pdf extraction merge logic, flashcard-existence check, overflow-to-Storage branch.
23. `[testing]` E2E (Playwright): upload → MD generated → appears in library → generate flashcards → regenerate.
24. `[backend]` `firestore.rules` per `02-DATA-MODEL.md`, deploy + rule unit tests (Firebase emulator).
25. `[reviewer]` Security pass: confirm no Puter/Firebase secrets committed, confirm all Firestore access scoped to `request.auth.uid`.

## Epic I — Bug Fixes & Hotfixes
29. `[backend/frontend]` Fix Firebase storing, storage overflow (>900KB), and Firestore auth rules compliance (see `docs/tickets/TICKET-29-FIREBASE-STORING-FIX.md`).

---
### Suggested ticket → agent label mapping
- `backend`: 2,5,7,8,9,11,12,14,17,18,21,24,29
- `frontend`: 6,10,13,15,16,19,20,29
- `testing`: 22,23,29
- `infra`/`docs`: 1,3,4,26,27,28 (do these yourself or with Git Agent before turning the loop on)
- `reviewer`: 25,29 (also implicitly reviews every PR from B onward)

