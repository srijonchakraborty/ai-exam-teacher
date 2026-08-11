# 06 — Antigravity CLI Guide

Antigravity CLI is Google's terminal agent harness (successor to Gemini CLI), sharing its engine with the Antigravity 2.0 desktop app. It supports named subagents, skills, and MCP servers configured per-workspace — which is exactly what this project needs: 5 named agents, a shared skill set (this `/docs` folder), and a GitHub MCP server for board control.

## 1. Install & auth
```bash
# see https://antigravity.google/docs/cli/overview for the current install command
antigravity-cli --version   # or the `agy` binary name shown in your install
agy auth login               # sign in with your Google account
```

## 2. Workspace files
From your repo root:
```
.antigravity/
  agents/
    backend.md
    frontend.md
    testing.md
    reviewer.md
    git.md
  mcp_config.json
  rules.md
  skills/            # symlink or copy of /docs — agents load these as context
```

### `.antigravity/rules.md` (global rules every agent inherits)
```markdown
- Always read /docs/00-OVERVIEW.md, /docs/01-TECH-STACK.md and /docs/02-DATA-MODEL.md
  before writing code that touches data.
- Never commit secrets (.env, API keys, service account JSON).
- Every code change must reference a GitHub issue number in its commit/PR.
- Stay inside your lane (see /docs/03-AGENT-TEAM.md) — don't move tickets
  or merge PRs unless you are the Git agent.
```

### Example subagent file — `.antigravity/agents/backend.md`
```markdown
---
name: backend
description: Owns Firebase/Firestore, PDF extraction pipeline, Puter.js data-layer wrappers.
tools: [filesystem, bash, mcp:github]
---
You are the Backend Agent for the AI Exam Teacher project.
Read /docs/03-AGENT-TEAM.md section "1. Backend Agent" for your full brief.
Read /docs/02-DATA-MODEL.md before touching Firestore schema — do not deviate.
```
Repeat the same pattern for `frontend.md`, `testing.md`, `reviewer.md`, `git.md`, pulling their briefs from the matching sections of `03-AGENT-TEAM.md`. Give `git.md` broader `mcp:github` write scopes (issues, PRs, projects) than the others, which should mostly need read + comment.

### `.antigravity/mcp_config.json` — GitHub MCP server
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```
`GITHUB_TOKEN` is the fine-grained PAT from `04-GITHUB-PROJECT-SETUP.md` §1, exported in your shell — never hardcode it in the JSON.

## 3. Registering skills
Inside Antigravity CLI:
```
/skills add ./docs
```
This makes the whole planning package (`00`–`05`) retrievable context for every agent, so "read the data model doc" in a prompt actually resolves to real file content instead of the agent guessing.

## 4. Verifying agents & MCP
```
/agents        # should list backend, frontend, testing, reviewer, git
/mcp           # should show github: connected
```

## 5. Bootstrap run (Epic H — do this once)

The repo, labels, issue template, board, and all 28 tickets are fully scripted in `07-BOOTSTRAP.sh` (uses `gh`, not the agent, so it doesn't depend on MCP being configured yet):
```bash
OWNER=<your-github-username> ./docs/07-BOOTSTRAP.sh
```
Once that's run and you've confirmed the board looks right, you can hand the *ongoing* loop to the Git Agent — it never needs to re-create the board, only operate on it:
```
agy --agent git -p "The board and tickets already exist (created by 07-BOOTSTRAP.sh).
Move ticket #1-4 (infra/docs) to Ready and pick them up yourself first, since they
unblock everything else. Then begin the orchestration loop described in
/docs/03-AGENT-TEAM.md 'Git Agent' section."
```

## 6. Orchestration loop (the actual multi-agent run)
Two viable modes:

**A. Manual dispatch (simplest to start with, most control):**
```
/agent backend "Pick up ticket #7 and follow your brief."
/agent frontend "Pick up ticket #10 and follow your brief."
```
Antigravity CLI's async subagents let these run in parallel in the background while you keep working in the foreground TUI, reporting progress in the status bar and posting diffs back when done.

**B. Autonomous loop (once you trust the flow):**
```
agy --agent git -p "Enter the orchestration loop described in
/docs/03-AGENT-TEAM.md 'Git Agent' section. Poll the board every 5 minutes.
Dispatch subagents (/agent backend, /agent frontend, /agent testing,
/agent reviewer) as tickets become Ready. Never merge without both a
Reviewer approval and a Testing 'tests-pass' comment. Never touch
firestore.rules or auth code without pausing and asking a human first."
```
Keep the human-checkpoint clause for anything security-sensitive — it's the cheapest safety valve and costs nothing when the agents are right anyway.

## 7. Recommended guardrails
- Turn on `/permissions` to require confirmation for `git push --force`, `gh pr merge`, and any `firestore.rules` deploy, even for the Git agent, until you've watched a few cycles succeed.
- Use `/rewind` to roll back a subagent's change set if a cycle goes sideways instead of hand-fixing — keeps the repo history clean for the next agent to reason about.
- `/resume` lets you reattach to a long-running orchestration loop from a new terminal/session.

## 8. First real command to type
Once bootstrap (Epic H) is done and you've spot-checked one manual backend + frontend ticket end-to-end:
```
/agent git "Start the orchestration loop for the AI Exam Teacher board."
```
