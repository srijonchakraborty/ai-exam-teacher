const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Read GITHUB_TOKEN from .env.local
let GITHUB_TOKEN = process.env.GITHUB_TOKEN;
if (!GITHUB_TOKEN && fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const match = envContent.match(/GITHUB_TOKEN=["']?([^"'\r\n]+)["']?/);
  if (match) GITHUB_TOKEN = match[1];
}

if (!GITHUB_TOKEN) {
  console.error("No GITHUB_TOKEN found in environment or .env.local");
  process.exit(1);
}

const OWNER = "srijonchakraborty";
const REPO = "ai-exam-teacher";

const headers = {
  "Authorization": `Bearer ${GITHUB_TOKEN}`,
  "User-Agent": "Antigravity-Agent",
  "Accept": "application/vnd.github+json",
  "Content-Type": "application/json"
};

async function api(endpoint, method = "GET", body = null) {
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`https://api.github.com${endpoint}`, options);
  const data = await res.json();
  return { status: res.status, data };
}

async function main() {
  console.log("== 1. Verifying Repo ==");
  const repoCheck = await api(`/repos/${OWNER}/${REPO}`);
  console.log(`Repo ${OWNER}/${REPO} check status: ${repoCheck.status}`);

  console.log("\n== 2. Creating Labels ==");
  const labels = [
    { name: "backend", color: "1D76DB", description: "Backend / Firebase / data layer" },
    { name: "frontend", color: "0E8A16", description: "UI / React / Next.js" },
    { name: "testing", color: "FBCA04", description: "Unit / e2e test work" },
    { name: "review", color: "5319E7", description: "Needs Reviewer Agent pass" },
    { name: "bug", color: "D73A4A", description: "Something broke" },
    { name: "infra", color: "C5DEF5", description: "Repo/CI/board scaffolding" },
    { name: "docs", color: "BFDADC", description: "Documentation" },
  ];

  for (const l of labels) {
    const res = await api(`/repos/${OWNER}/${REPO}/labels`, "POST", l);
    console.log(`Label '${l.name}': status ${res.status}`);
  }

  console.log("\n== 3. Step-by-Step Creating Backlog Tickets (1 to 28) ==");
  const tickets = [
    // Epic A
    { title: "Init Next.js + TS + Tailwind app", label: "infra", body: "Set up repo structure per docs/01-TECH-STACK.md." },
    { title: "Firebase project setup (Auth + Firestore + Storage)", label: "infra", body: "Env config, firebase.json, firestore.rules per docs/01-TECH-STACK.md." },
    { title: "CI workflow (lint/typecheck/test)", label: "infra", body: ".github/workflows/ci.yml per docs/04-GITHUB-PROJECT-SETUP.md §7." },
    { title: "Add /docs planning package to repo", label: "docs", body: "Link planning package from README.md." },

    // Epic B
    { title: "Firebase Auth wiring (email + Google)", label: "backend", body: "Implement useAuth() hook and AuthProvider in src/lib/firebase/authContext.tsx." },
    { title: "App shell/layout, protected routes", label: "frontend", body: "Sign-in/out UI, sticky navigation bar, layout wrapper in src/app/layout.tsx." },

    // Epic C
    { title: "lib/pdf: native text extraction via pdf.js", label: "backend", body: "Page-by-page text extraction in src/lib/pdf/index.ts with dynamic client import." },
    { title: "lib/puter: img2txt OCR wrapper with fallback", label: "backend", body: "aws-textract -> mistral OCR fallback in src/lib/puter/index.ts." },
    { title: "Merge native + OCR text per page", label: "backend", body: "Flag ocrUsed and merge page extractions per docs/00-OVERVIEW.md." },
    { title: "Upload screen with per-page progress", label: "frontend", body: "Drag/drop PDF, per-page extraction progress indicator in src/app/upload/page.tsx." },

    // Epic D
    { title: "lib/puter: chat wrapper for MD generation", label: "backend", body: "Chunking + section stitching for long PDFs in src/lib/puter/index.ts." },
    { title: "Firestore write path for mdDocuments", label: "backend", body: "Overflow-to-Storage per docs/02-DATA-MODEL.md." },
    { title: "Name-this-document UI + retry-on-error", label: "frontend", body: "User title prompt, chunk retry state in src/app/upload/page.tsx." },

    // Epic E
    { title: "Firestore query/index for mdDocuments list", label: "backend", body: "userId + createdAt desc composite index in firestore.indexes.json." },
    { title: "Library screen (list view)", label: "frontend", body: "List cards showing title, pdf name, created time in src/app/library/page.tsx." },
    { title: "Markdown viewer for a single document", label: "frontend", body: "Render mdDocuments entry in src/app/doc/[id]/page.tsx." },

    // Epic F
    { title: "lib/puter: flashcard-generation prompt + parsing", label: "backend", body: "Parse into {front, back, tags}[] array." },
    { title: "Firestore write path for flashcardSets", label: "backend", body: "Existence-check query by mdDocId." },
    { title: "Model picker (free/paid) + Generate button", label: "frontend", body: "Sourced from puter.ai.listModels()." },
    { title: "Flashcard viewer + Generate Again button", label: "frontend", body: "Flip UI, actionable when a set exists in src/app/doc/[id]/flashcards/page.tsx." },
    { title: "Generate Again write path (versioned)", label: "backend", body: "New doc with regenerationOf, keeping history." },

    // Epic G
    { title: "Unit tests: extraction merge, existence check, overflow", label: "testing", body: "Unit test suite in tests/unit." },
    { title: "E2E: upload -> MD -> library -> flashcards -> regenerate", label: "testing", body: "Playwright E2E suite in tests/e2e." },
    { title: "firestore.rules + emulator rule tests", label: "backend", body: "Security rules verification in firestore.rules." },
    { title: "Security review pass", label: "review", body: "Verify no committed secrets; all access scoped to request.auth.uid." },

    // Epic H
    { title: "Create GitHub Project board + labels + issue template", label: "infra", body: "GitHub board and labels setup." },
    { title: "Configure Antigravity CLI subagents + GitHub MCP server", label: "infra", body: ".antigravity agents definitions." },
    { title: "Bulk-create tickets 1–25 on the board", label: "infra", body: "Create all backlog issues." }
  ];

  for (let i = 0; i < tickets.length; i++) {
    const t = tickets[i];
    const issueRes = await api(`/repos/${OWNER}/${REPO}/issues`, "POST", {
      title: `[${t.label}] Ticket #${i + 1}: ${t.title}`,
      body: t.body,
      labels: [t.label]
    });
    console.log(`Ticket #${i + 1} [${t.label}] created: issue #${issueRes.data?.number || 'err'}`);
  }

  console.log("\n== Done creating labels and backlog tickets! ==");
}

main().catch(err => console.error("Error in bootstrap script:", err));
