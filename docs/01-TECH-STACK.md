# 01 — Tech Stack

## Frontend
- **Next.js (App Router) + React + TypeScript** — one codebase, easy to deploy to Vercel/Firebase Hosting.
- **Tailwind CSS** for styling.
- **pdf.js** (`pdfjs-dist`) — render PDF pages to canvas + extract native text layer per page, client-side.
- **Puter.js** (`<script src="https://js.puter.com/v2/">` or `npm i @heyputer/puter.js`) — all AI calls:
  - `puter.ai.img2txt(source, { provider: 'aws-textract' | 'mistral', pages: [...] })` — OCR for scanned pages/images. Can be pointed straight at a PDF file with a `pages` option, so it can double as a fallback whole-PDF OCR path if `pdf.js` extraction comes back empty for a page.
  - `puter.ai.chat(prompt, { model })` — Markdown generation and flashcard generation. Free models to default to: `gpt-5.4-nano`, `google/gemini-3.6-flash`. Paid/flagship options exposed as a picker: `anthropic/claude-sonnet-5`, `google/gemini-3.1-pro-preview`, etc. Model list should be fetched live via `puter.ai.listModels()` rather than hardcoded, since Puter adds/removes models.
  - `puter.auth.signIn()` — Puter's own auth, only needed to attribute AI usage to the visiting user; separate from your app's user accounts.

## Backend / data
- **Firebase**
  - **Firestore** — `mdDocuments`, `flashcardSets` collections (see `02-DATA-MODEL.md`).
  - **Firebase Auth** — app login (Email/Google). This is your app's user identity, distinct from Puter auth.
  - **Firebase Storage** (optional) — only if you choose to keep original PDFs or overflow Markdown that exceeds Firestore's 1 MiB doc limit.
  - **Cloud Functions** (optional, thin) — only for things that must not run client-side: e.g. a scheduled cleanup job, or server-side validation before writes. Not required for the AI pipeline itself since Puter.js is client-side.

## Why no custom backend server
Puter.js's User-Pays model removes the usual reason for a backend (hiding API keys / metering usage), so a Node/Express API layer is optional. Keep it thin (Cloud Functions) or skip it entirely and talk to Firestore directly from the client with security rules doing the enforcement.

## Dev tooling
- **GitHub** — repo + Projects (v2) board.
- **GitHub CLI (`gh`)** — ticket automation from agents/scripts.
- **Antigravity CLI** — agent orchestration (see `06-ANTIGRAVITY-CLI-GUIDE.md`).
- **Vitest / Playwright** — unit + e2e tests (Testing Agent owns these).
- **ESLint + Prettier** — enforced by Reviewer Agent + CI.

## Suggested repo layout
```
/app                # Next.js App Router pages
  /upload
  /library
  /doc/[id]
  /doc/[id]/flashcards
/components
/lib
  /pdf              # pdf.js wrapper, page extraction
  /puter             # puter.ai.chat / img2txt wrappers, model list, retry logic
  /firebase          # firestore client, converters, security-rule-aligned types
/docs                # this planning package + ADRs
/tests
  /unit
  /e2e
.env.example         # documents required vars, committed, no real values
.env.local           # your real values, gitignored — see docs/08-CREDENTIALS.md
.gitignore
firestore.rules
firestore.indexes.json
```
