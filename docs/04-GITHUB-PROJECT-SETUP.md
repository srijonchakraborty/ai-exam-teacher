# 04 — GitHub Setup (Repo, Login, Project Board)

## 1. Login (once, on your machine)
```bash
# Install GitHub CLI if you don't have it
# macOS: brew install gh   |  Windows: winget install GitHub.cli  |  Linux: see cli.github.com

gh auth login
# Choose: GitHub.com → HTTPS → "Login with a web browser" → follow the one-time code
gh auth status   # confirm
```
This same `gh` auth is what both you and the agents (via GitHub MCP, see doc 06) will use — the MCP server can either reuse your `gh` OAuth token or use a dedicated **fine-grained Personal Access Token**. For an agent team that writes to the board and merges PRs, create a **dedicated PAT** scoped narrowly, so you can revoke it independently of your personal login:

```
GitHub → Settings → Developer settings → Fine-grained tokens → Generate new token
Repository access: only this repo
Permissions: Contents (RW), Pull requests (RW), Issues (RW), Projects (RW)
```
Store it as an env var, never commit it: `GITHUB_TOKEN=ghp_xxx` (Antigravity CLI's MCP config reads from env).

## 2. Create the repo

**Public repo, using the naming convention from `README.md`:** display name `AI Exam Teacher`, repo slug `ai-exam-teacher`.

```bash
gh repo create ai-exam-teacher --public --description "Turn any PDF into AI-generated exam flashcards." --clone
cd ai-exam-teacher
```

Everything below (repo, labels, template, board, and all 28 tickets) is also scripted end-to-end in **`07-BOOTSTRAP.sh`** — run that instead of doing steps 2–5 by hand:
```bash
OWNER=<your-github-username> ./07-BOOTSTRAP.sh
```

## 3. Create the Project (v2) board
```bash
gh project create --owner @me --title "AI Exam Teacher"
```
Note the project number it returns (e.g. `1`) — you'll need `gh project view 1 --owner @me`.

### Columns (statuses)
Set up a single-select "Status" field with these options (Project → Settings → Fields → Status):
`Backlog, Ready, In Progress, In Review, Testing, Blocked, Done`

### Labels
```bash
gh label create backend    --color 1D76DB
gh label create frontend   --color 0E8A16
gh label create testing    --color FBCA04
gh label create review     --color 5319E7
gh label create bug        --color D73A4A
gh label create infra      --color C5DEF5
gh label create docs       --color BFDADC
```

## 4. Ticket template
Save as `.github/ISSUE_TEMPLATE/ticket.md`:
```markdown
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
```

## 5. Bulk-creating tickets
Doc `05-TICKET-BACKLOG.md` has the full list, ready to script:
```bash
gh issue create --title "..." --body-file ticket-body.md --label backend
gh issue edit <number> --add-project "AI Exam Teacher"
```
Or use `gh project item-add` after creation. The Git Agent can also do this bulk step itself if you hand it doc 05 directly (see doc 06, "Bootstrap run").

## 6. Merge-on-green policy (this is what makes "merge with main when tests pass" real)

Two layers enforce it:
1. **Server-side**: branch protection (below) requires the CI check (`ci.yml`) to pass and 1 approving review before `main` accepts a merge — this holds even if an agent tries to bypass it.
2. **Agent-side**: the Git Agent (`03-AGENT-TEAM.md`) only calls `gh pr merge --squash` after it sees *both* a Reviewer Agent approval comment and a Testing Agent `tests-pass` comment on the PR — see `06-ANTIGRAVITY-CLI-GUIDE.md` §6 for the exact loop prompt.

## 7. Branch protection (recommended before turning agents loose)
```bash
gh api repos/:owner/:repo/branches/main/protection -X PUT -f required_pull_request_reviews[required_approving_review_count]=1 ...
```
Require at least the Reviewer Agent's approval + passing CI checks before merge, so the Git Agent's `gh pr merge` calls are enforced server-side too, not just by agent discipline.

## 8. CI (GitHub Actions) — gives Testing Agent a server-side signal too
`.github/workflows/ci.yml`:
```yaml
name: CI
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test
```
