# Global Agent Rules

- Always read `docs/00-OVERVIEW.md`, `docs/01-TECH-STACK.md` and `docs/02-DATA-MODEL.md` before writing code that touches data.
- Never commit secrets (.env, .env.local, API keys, service account JSON).
- Every code change must reference a GitHub issue number in its commit/PR (e.g. "Closes #12").
- Secrets in .env files are local dev configurations and not a security issue for testing, but must NEVER be committed to git.
- Stay inside your agent lane (see `docs/03-AGENT-TEAM.md`) — don't move tickets or merge PRs unless you are the Git agent.
- Keep agents in sync so their work does not collide or overwrite each other.
- Any Task you perform it should under github ticket.
- Create new branch necessary in github.
- Mention the git branch in commit message also pr link and also the merge information
