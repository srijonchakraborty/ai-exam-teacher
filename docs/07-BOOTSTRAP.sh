#!/usr/bin/env bash
# 07-BOOTSTRAP.sh
#
# One-shot setup for the AI Exam Teacher repo + GitHub Project (v2) board + all
# tickets from 05-TICKET-BACKLOG.md. Safe to re-run (uses --add-project /
# idempotent gh calls where possible; labels/issues that already exist will
# just error harmlessly and the script continues).
#
# Prereqs:
#   - `gh auth login` already run (see 04-GITHUB-PROJECT-SETUP.md §1)
#   - You are a member/owner able to create repos under the target account
#
# Usage:
#   chmod +x 07-BOOTSTRAP.sh
#   OWNER=your-github-username ./07-BOOTSTRAP.sh
#
set -euo pipefail

OWNER="${OWNER:?Set OWNER=<your-github-username-or-org> before running}"
REPO="ai-exam-teacher"
PROJECT_TITLE="AI Exam Teacher"

echo "== 1. Create public repo =="
gh repo create "$OWNER/$REPO" --public --description "Turn any PDF into AI-generated exam flashcards." --clone || echo "(repo may already exist, continuing)"
cd "$REPO"

echo "== 2. Labels =="
gh label create backend  --color 1D76DB --description "Backend / Firebase / data layer" --force
gh label create frontend --color 0E8A16 --description "UI / React / Next.js" --force
gh label create testing  --color FBCA04 --description "Unit / e2e test work" --force
gh label create review   --color 5319E7 --description "Needs Reviewer Agent pass" --force
gh label create bug      --color D73A4A --description "Something broke" --force
gh label create infra    --color C5DEF5 --description "Repo/CI/board scaffolding" --force
gh label create docs     --color BFDADC --description "Documentation" --force

echo "== 3. Issue template =="
mkdir -p .github/ISSUE_TEMPLATE
cat > .github/ISSUE_TEMPLATE/ticket.md << 'EOF'
---
name: Task ticket
about: A single unit of work for the agent team
labels: []
---

## Summary
<one paragraph>

## Owner agent
<backend | frontend | testing | reviewer>

## Acceptance criteria
- [ ]
- [ ]

## References
- Related doc(s) in /docs
- Depends on: #

## Notes for agents
<anything schema-specific, edge cases, links>
EOF
git add .github && git commit -m "chore: add issue template" --allow-empty -q && git push -q || true

echo "== 4. Project (v2) board =="
PROJECT_NUM=$(gh project create --owner "$OWNER" --title "$PROJECT_TITLE" --format json | jq -r '.number')
echo "Project number: $PROJECT_NUM"
gh project field-create "$PROJECT_NUM" --owner "$OWNER" --name "Status" --data-type SINGLE_SELECT \
  --single-select-options "Backlog,Ready,In Progress,In Review,Testing,Blocked,Done" || true

echo "== 5. Create all 28 tickets from 05-TICKET-BACKLOG.md =="
create_ticket () {
  local title="$1" label="$2" body="$3"
  local num
  num=$(gh issue create --title "$title" --label "$label" --body "$body" | grep -oE '[0-9]+$')
  gh project item-add "$PROJECT_NUM" --owner "$OWNER" --url "https://github.com/$OWNER/$REPO/issues/$num"
  echo "  #$num  [$label]  $title"
}

# Epic A — Project scaffolding
create_ticket "Init Next.js + TS + Tailwind app" infra "Set up repo structure per 01-TECH-STACK.md."
create_ticket "Firebase project setup (Auth + Firestore + Storage)" infra "Env config, firebase.json, per 01-TECH-STACK.md."
create_ticket "CI workflow (lint/typecheck/test)" infra ".github/workflows/ci.yml per 04-GITHUB-PROJECT-SETUP.md §7."
create_ticket "Add /docs planning package to repo" docs "Link from README.md."

# Epic B — Auth & shell
create_ticket "Firebase Auth wiring (email + Google)" backend "useAuth() hook."
create_ticket "App shell/layout, protected routes" frontend "Sign-in/out UI."

# Epic C — PDF extraction pipeline
create_ticket "lib/pdf: native text extraction via pdf.js" backend "Page-by-page extraction."
create_ticket "lib/puter: img2txt OCR wrapper with fallback" backend "aws-textract -> mistral, retry/backoff."
create_ticket "Merge native + OCR text per page" backend "Flag ocrUsed per 00-OVERVIEW.md."
create_ticket "Upload screen with per-page progress" frontend "Drag/drop PDF, progress indicator."

# Epic D — Markdown generation
create_ticket "lib/puter: chat wrapper for MD generation" backend "Chunking + section stitching for long PDFs."
create_ticket "Firestore write path for mdDocuments" backend "Overflow-to-Storage per 02-DATA-MODEL.md."
create_ticket "Name-this-document UI + retry-on-error" frontend "User title prompt, chunk retry state."

# Epic E — Library / document list
create_ticket "Firestore query/index for mdDocuments list" backend "userId + createdAt desc."
create_ticket "Library screen (list view)" frontend "Title, pdf name, created time."
create_ticket "Markdown viewer for a single document" frontend "Render mdDocuments entry."

# Epic F — Flashcards
create_ticket "lib/puter: flashcard-generation prompt + parsing" backend "Parse into {front,back,tags}[]."
create_ticket "Firestore write path for flashcardSets" backend "Existence-check query by mdDocId."
create_ticket "Model picker (free/paid) + Generate button" frontend "Sourced from puter.ai.listModels()."
create_ticket "Flashcard viewer + Generate Again button" frontend "Only actionable when a set exists."
create_ticket "Generate Again write path (versioned)" backend "New doc with regenerationOf, keep history."

# Epic G — Hardening
create_ticket "Unit tests: extraction merge, existence check, overflow" testing "Per 02-DATA-MODEL.md."
create_ticket "E2E: upload -> MD -> library -> flashcards -> regenerate" testing "Playwright."
create_ticket "firestore.rules + emulator rule tests" backend "Per 02-DATA-MODEL.md security rules sketch."
create_ticket "Security review pass" review "No committed secrets; all access scoped to request.auth.uid."

echo "== Done. Move tickets 1-3/26-28-equivalent infra items to Ready manually, or let Git Agent do it (06-ANTIGRAVITY-CLI-GUIDE.md). =="
