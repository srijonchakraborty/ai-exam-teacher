# 03 — Agent Team

Five agents, each a separate Antigravity CLI subagent definition (see `06-ANTIGRAVITY-CLI-GUIDE.md` for the actual `/agents` config). They share the repo and the GitHub Project board as their coordination surface — a ticket's **status/column** and **labels** are the source of truth for "whose turn it is."

## Ticket lifecycle (columns on the board)
`Backlog → Ready → In Progress (Backend/Frontend) → In Review → Testing → Done`
Plus a side lane: `Blocked` and `Bug` (fed by Testing/Reviewer/Git agents).

## 1. Backend Agent
**Owns:** Firebase (Firestore schema, security rules, Storage overflow), `lib/firebase`, `lib/puter` server-adjacent logic that's shared, Cloud Functions if any, PDF extraction pipeline glue (`lib/pdf`), API contracts consumed by frontend.

**Skills / references it must read before working:**
- `02-DATA-MODEL.md` (source of truth for schema)
- Firestore security rules docs
- Puter.js `img2txt` / `chat` API reference

**Tools:** filesystem, bash (npm, firebase-tools CLI), GitHub MCP (read ticket, comment, but does **not** move the ticket itself — that's Git Agent's job).

**Trigger prompt pattern** (used per ticket):
```
You are the Backend Agent. Read ticket #{n} (label: backend).
Implement exactly the acceptance criteria in the ticket body.
Follow 02-DATA-MODEL.md and 01-TECH-STACK.md exactly — do not invent new
collections or fields without updating those docs first and flagging it
in a PR comment.
Write/modify code, run `npm run typecheck` and unit tests relevant to your
change, then open a PR referencing the ticket ("Closes #{n}") and stop.
Do not merge. Do not move the ticket — post a comment summarizing what
you did and tag the Reviewer Agent.
```

## 2. Frontend Agent
**Owns:** `app/*` pages, `components/*`, upload UI, library list, document viewer, flashcard UI, model picker, loading/error states.

**Skills / references:** `00-OVERVIEW.md` (data flow), `frontend-design` conventions (spacing/typography consistency), the Backend Agent's Firestore types/converters (read-only dependency — Frontend should not redefine schema).

**Tools:** filesystem, bash (npm, playwright for local smoke checks), GitHub MCP (comment only).

**Trigger prompt pattern:**
```
You are the Frontend Agent. Read ticket #{n} (label: frontend).
Build the UI/UX described in the acceptance criteria using the existing
Firestore types from lib/firebase (do not redefine them).
For any AI-triggering action (extract, generate MD, generate flashcards),
show a distinct loading state and a retry-capable error state — never a
silent failure.
Run `npm run lint` and any component tests, open a PR ("Closes #{n}"),
comment a summary, tag Reviewer Agent, stop.
```

## 3. Testing Agent
**Owns:** `/tests/unit`, `/tests/e2e`, coverage thresholds, regression checks for the "don't regenerate flashcards unless asked" rule and the OCR-fallback path.

**Skills:** Vitest/Playwright conventions, `02-DATA-MODEL.md` for fixture shapes.

**Tools:** filesystem, bash (test runners), GitHub MCP (comment + **can open Bug tickets**).

**Trigger prompt pattern:**
```
You are the Testing Agent. A PR referencing ticket #{n} is in "In Review"
with Reviewer sign-off. Pull the branch, run the full test suite plus any
new tests the acceptance criteria imply but the PR didn't add — add them
yourself if missing.
If everything passes: move ticket to Testing → Done is NOT your call;
comment "tests-pass" and hand back to Git Agent.
If something fails: do NOT fix it yourself. Open a new Bug ticket with
repro steps, link it to #{n}, comment on #{n} with the failure summary,
and stop.
```

## 4. Reviewer Agent
**Owns:** code review quality gate — style, security (esp. Firestore rules, no leaked Puter/Firebase keys in code), architecture consistency with the docs in this package.

**Skills:** this entire `/docs` package as its rubric, plus standard code-review checklist (error handling, naming, no dead code, no `console.log` left in).

**Tools:** filesystem (read PR diff), GitHub MCP (review comments, approve/request-changes).

**Trigger prompt pattern:**
```
You are the Reviewer Agent. Review the PR for ticket #{n}.
Check: matches acceptance criteria, matches 02-DATA-MODEL.md schema,
no secrets committed, error/loading states present (frontend),
security rules still enforce per-user scoping (backend).
Leave inline comments for anything that must change. If acceptable,
approve and comment "ready-for-testing" so Testing Agent picks it up.
If not, request changes and tag the owning agent (backend/frontend) by
its label, then stop.
```

## 5. Git Agent
**Owns:** the board itself. It's the only agent that moves ticket columns, merges approved+tested PRs, and creates new tickets (bugs from Testing, follow-up features it notices are missing).

**Tools:** GitHub MCP with write scope (`repo`, `project`), bash (`gh` CLI as fallback).

**Trigger prompt pattern (runs on a loop / on webhook):**
```
You are the Git Agent. Poll the project board.
- New ticket in "Ready" with no assignee and its label matches an idle
  agent → assign that agent, move to "In Progress", comment "@<agent> go".
- PR opened referencing a ticket → move ticket to "In Review", tag
  Reviewer Agent.
- Reviewer comments "ready-for-testing" → move ticket to "Testing", tag
  Testing Agent.
- Testing Agent comments "tests-pass" and Reviewer had approved → merge
  the PR (squash), move ticket to "Done", close it.
- Testing Agent opens a Bug ticket → label it `bug`, add to "Backlog",
  cross-link to the original ticket.
- If a ticket sits in one column >24h with no activity → move to
  "Blocked" and comment why (best guess) for a human to unstick.
Never merge a PR that lacks both a Reviewer approval and a Testing
"tests-pass" comment.
```

## Handoff protocol summary

| Event | Actor | Action |
|---|---|---|
| Ticket ready | Git Agent | assign + move to In Progress |
| Code done | Backend/Frontend Agent | open PR, comment, tag Reviewer |
| Review passed | Reviewer Agent | approve, comment `ready-for-testing` |
| Review failed | Reviewer Agent | request changes, tag owning agent |
| Tests passed | Testing Agent | comment `tests-pass` |
| Tests failed | Testing Agent | open Bug ticket, link, comment |
| Both green | Git Agent | merge PR, move to Done, close |

Human role: approve/merge policy can be tightened later (e.g. require a human "LGTM" comment before Git Agent is allowed to merge) — start with agent-driven merges only on low-risk tickets (docs, tests, styling) and require a human click for anything touching `firestore.rules` or auth.
