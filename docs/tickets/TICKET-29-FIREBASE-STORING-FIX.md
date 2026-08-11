# Ticket #29 — Fix Firebase Storing, Storage Overflow, and Auth Rule Compliance

## Header Information
- **Ticket ID**: #29
- **Title**: `[backend/frontend]` Fix Firebase Storing, Storage Overflow (>900KB), and Firestore Security Rule Compliance
- **Labels**: `backend`, `frontend`, `testing`, `reviewer`, `bug`
- **Status**: `Done`
- **Assignee**: `git-agent` (Closed)

---

## 1. Issue Description
When uploading a PDF or generating study guides/flashcards, Firebase storing had critical deficiencies:
1. **Firestore Security Rule Violation**: `firestore.rules` enforces `request.auth != null && request.auth.uid == request.resource.data.userId`. However, client calls in `upload/page.tsx` and `flashcards/page.tsx` set `userId: user ? user.uid : "anonymous"`. When `user` was null or unauthenticated, writes passed `"anonymous"`, causing Firestore write failures with `FirebaseError: Missing or insufficient permissions`.
2. **Storage Overflow (>900KB) Unhandled**: `02-DATA-MODEL.md` requires that markdown text >900KB must store `markdown: null` in Firestore and upload the full string to Firebase Storage at `markdowns/{userId}/{docId}.md`. Currently, `upload/page.tsx` sets `markdown: null` without uploading to Storage or saving `storagePath`.
3. **Document Reader Fetch Failure**: `doc/[id]/page.tsx` did not fetch markdown from Firebase Storage when `markdown` is `null` and `storagePath` exists.
4. **Lack of Centralized Data Layer**: Firebase Firestore calls were directly embedded in React components without a modular service layer or unit testing.

---

## 2. Acceptance Criteria
- [x] Create `src/lib/firebase/store.ts` encapsulating all Firestore and Storage operations: `saveMdDocument`, `getMdDocument`, `getMdDocumentsByUser`, `saveFlashcardSet`, and `getFlashcardSetsForDoc`.
- [x] Strictly enforce user authentication in `saveMdDocument` and `saveFlashcardSet`. Reject anonymous writes that violate `firestore.rules`.
- [x] Implement Firebase Storage overflow logic in `saveMdDocument`: upload to `markdowns/{userId}/{docId}.md` when length > 900KB, set `storagePath`, set `markdown: null`.
- [x] Update `getMdDocument` to automatically download markdown string from Firebase Storage if `markdown` is null and `storagePath` is set.
- [x] Update `src/app/upload/page.tsx`, `src/app/library/page.tsx`, `src/app/doc/[id]/page.tsx`, and `src/app/doc/[id]/flashcards/page.tsx` to use the new store helpers and show clean auth / error states.
- [x] Write unit tests for `src/lib/firebase/store.ts` covering auth validation, schema shapes, and storage overflow handling.
- [x] Verify `npm run typecheck`, `npm run lint`, and `npm run test` run with 0 errors.

---

## 3. Activity & Ticket Status Audit Log

| Timestamp | Actor | Previous Status | New Status | Activity Comment |
|---|---|---|---|---|
| 2026-08-11 13:58:00 | Git Agent | None | Backlog | Created Ticket #29 based on user issue report. |
| 2026-08-11 13:58:05 | Git Agent | Backlog | Ready | Scope defined and accepted; ticket moved to Ready queue. |
| 2026-08-11 13:58:10 | Git Agent | Ready | In Progress (Backend) | Assigned ticket to backend-agent to implement centralized Firebase store service. |
| 2026-08-11 13:58:15 | Backend Agent | In Progress (Backend) | In Progress (Frontend) | Built `src/lib/firebase/store.ts` and updated `types.ts` for storage overflow & auth enforcement. Tagging Frontend Agent. |
| 2026-08-11 13:58:30 | Frontend Agent | In Progress (Frontend) | In Review | Connected `UploadPage`, `LibraryPage`, `DocumentPage`, and `FlashcardsPage` to `store.ts` with auth guards. Tagging Reviewer Agent. |
| 2026-08-11 14:01:30 | Reviewer Agent | In Review | Testing | Code review passed! Security rules, auth check enforcement, storage overflow logic (`setDoc` fix), and vitest/typecheck/lint checks verified (`ready-for-testing`). Tagging Testing Agent. |
| 2026-08-11 14:02:40 | Testing Agent | Testing | Done | `tests-pass` confirmed! `npm run typecheck` (0 errors), `npm run lint` (0 errors), `npx vitest run` (4/4 passed). Handing back to Git Agent to merge and push. |
| 2026-08-11 14:02:55 | Git Agent | Done | Done | Ticket #29 closed. Code committed and pushed to `origin main`. All acceptance criteria satisfied. |



