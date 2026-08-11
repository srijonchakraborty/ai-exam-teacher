# AI Exam Teacher — Planning Docs

PDF → Markdown → AI-generated flashcards, so you can turn any exam/study PDF into a quizzable deck.

**Naming convention used throughout this repo:**
| Context | Value |
|---|---|
| Product / display name | `AI Exam Teacher` |
| GitHub repo (kebab-case, lowercase) | `ai-exam-teacher` |
| npm package name | `ai-exam-teacher` |
| GitHub Project board title | `AI Exam Teacher` |
| Firebase project ID (lowercase, hyphenated, globally unique — add a suffix if taken) | `ai-exam-teacher` or `ai-exam-teacher-app` |

This folder is the full planning package for the project. Read in this order:

| # | File | What it's for |
|---|------|----------------|
| 1 | `00-OVERVIEW.md` | What the app does, end-to-end data flow, architecture diagram |
| 2 | `01-TECH-STACK.md` | Concrete stack choices and why, incl. Puter.js specifics |
| 3 | `02-DATA-MODEL.md` | Firestore collections/fields, security rules sketch |
| 4 | `03-AGENT-TEAM.md` | The 5 agents (backend/frontend/testing/reviewer/git), their tools, prompts, handoff protocol |
| 5 | `04-GITHUB-PROJECT-SETUP.md` | GitHub login, repo, Project board, labels, columns, ticket template |
| 6 | `05-TICKET-BACKLOG.md` | The actual epics/tickets to create on the board, ready to paste in |
| 7 | `06-ANTIGRAVITY-CLI-GUIDE.md` | How to wire all of the above into Antigravity CLI (`/agents`, `/skills`, `/mcp`, `/tasks`) so the agent team runs the board automatically |
| 8 | `07-BOOTSTRAP.sh` | One-shot script: creates the GitHub repo, labels, template, project board, and all 28 tickets |
| 9 | `08-CREDENTIALS.md` | Exactly where Firebase and GitHub credentials go (Puter.js needs none) — plus `.env.example` / `.gitignore` in this folder |

## Important — what I can and can't do here

I don't have write access to GitHub (no connected GitHub account/token), so I can't actually create the `ai-exam-teacher` repo, the project board, the tickets, or merge PRs myself. What I've done instead:

- Updated every doc to the final naming convention above.
- Written `07-BOOTSTRAP.sh` — a single script that creates the repo, labels, issue template, project board, and all 28 tickets from `05-TICKET-BACKLOG.md`, using the `gh` CLI. **You (or the Git Agent once it has its own PAT) run this once.**
- The ongoing "create tickets → open PRs → merge on green tests" loop is the **Git Agent's job**, fully specified in `03-AGENT-TEAM.md` and wired up in `06-ANTIGRAVITY-CLI-GUIDE.md` — once you give it a scoped PAT it does exactly what you asked (creates tickets, opens/reviews/tests PRs, merges to `main` only when Reviewer + Testing both sign off).

## TL;DR of the plan

1. **Set up** Firebase project + GitHub repo (docs 2 & 4).
2. **Create the board** and bulk-add the tickets from doc 5.
3. **Configure Antigravity CLI** per doc 6 — 5 subagent definitions + a GitHub MCP server so agents can read/comment/move tickets themselves.
4. **Kick off** with one command (`agy` prompt in doc 6, section "Orchestration Loop") and let the Git Agent pull tickets, hand them to Backend/Frontend/Testing/Reviewer, and cycle the board.
5. You review PRs; merged PRs auto-close tickets; failures spawn new bug tickets automatically (Git Agent).

Everything below assumes:
- **Frontend-only AI calls** via Puter.js (`puter.ai.chat`, `puter.ai.img2txt`) — no server-side API keys, users cover their own usage.
- **Firebase** (Firestore + Auth + optionally Storage) as the only backend you host.
- **GitHub Projects (v2)** as the board, driven through the `gh` CLI / GitHub MCP server, not the web UI.
