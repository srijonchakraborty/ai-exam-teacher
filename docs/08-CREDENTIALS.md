# 08 — Where Credentials Go

## Puter.js — nothing to store
There is no Puter API key. Each visitor calls `puter.auth.signIn()` client-side,
signs into their own free Puter account, and their AI usage is billed to them
(the "User-Pays" model). If you ever find yourself about to paste a "Puter
secret" into `.env`, stop — it doesn't need one, and adding one is a sign
something upstream in the design has drifted from this plan.

## Firebase — two different things, two different rules

### 1. Web app config — not secret, still goes in env vars
`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`,
`appId` (from Firebase Console → Project settings → General → Your apps).
These identify *which* Firebase project to talk to; they don't grant access
by themselves — your `firestore.rules` (02-DATA-MODEL.md) do that. Still keep
them in env vars rather than hardcoded, so staging/prod can differ.

**Where:** `.env.local` at the repo root, using the `NEXT_PUBLIC_FIREBASE_*`
names in `.env.example`. `NEXT_PUBLIC_` is required for Next.js to inline
them into client-side bundles — without that prefix they won't reach the
browser code that needs them.

```bash
cp .env.example .env.local
# then fill in the NEXT_PUBLIC_FIREBASE_* values from the Firebase console
```

`.env.local` is in `.gitignore` (see repo root) — never commit it. Commit
`.env.example` with empty values so the Backend Agent / any new clone knows
what's required.

### 2. Service account JSON (Admin SDK) — genuinely secret, only if needed
Only required if a ticket adds server-side code (a Cloud Function, an Admin
SDK script) that must bypass Firestore rules — the base app described in
these docs doesn't need this at all, since all reads/writes go through the
client SDK under your security rules.

If a later ticket does need it:
- **Never** commit the JSON file or paste its contents into `.env.local`.
- Store it in your deploy host's secret manager:
  - Vercel: Project → Settings → Environment Variables (marked "Sensitive")
  - Firebase/GCP: `gcloud secrets create` + Secret Manager, referenced by
    Cloud Functions config, not by a checked-in file.
- Reference it by name in code (`process.env.FIREBASE_SERVICE_ACCOUNT_JSON`
  or the secret manager's SDK), never by committing the value anywhere.

## GitHub PAT — for agents/CI, not for the running app
The fine-grained PAT from `04-GITHUB-PROJECT-SETUP.md` §1 is used by the
GitHub MCP server (`06-ANTIGRAVITY-CLI-GUIDE.md`) and by CI if it needs to
comment/label. Export it as `GITHUB_TOKEN` in your shell or store it as a
**GitHub Actions secret** (Repo → Settings → Secrets and variables → Actions)
for use in `ci.yml` — never in `.env.local`, since it has nothing to do with
the running app.

## Quick reference

| Credential | Secret? | Lives in |
|---|---|---|
| Firebase web config | No | `.env.local` (gitignored), template in `.env.example` |
| Firebase service account JSON | Yes | Host secret manager only — never in repo or `.env.local` |
| Puter.js | N/A — doesn't exist | Nowhere, by design |
| GitHub PAT | Yes | Shell env var for local `gh`/MCP use; GitHub Actions secret for CI |
