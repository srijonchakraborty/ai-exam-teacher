const fs = require('fs');

let GITHUB_TOKEN = process.env.GITHUB_TOKEN;
if (!GITHUB_TOKEN && fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const match = envContent.match(/GITHUB_TOKEN=["']?([^"'\r\n]+)["']?/);
  if (match) GITHUB_TOKEN = match[1];
}

const OWNER = "srijonchakraborty";
const REPO = "ai-exam-teacher";
const PROJECT_ID = "PVT_kwHOAJ4Jf84Bf_55";
const STATUS_FIELD_ID = "PVTSSF_lAHOAJ4Jf84Bf_55zhaOub8";
const OPTION_DONE = "98236657";

const currentInfo = JSON.parse(fs.readFileSync("scripts/.backend_tickets.json", "utf8"));

const headers = {
  "Authorization": `Bearer ${GITHUB_TOKEN}`,
  "User-Agent": "Antigravity-Agent",
  "Accept": "application/vnd.github+json",
  "Content-Type": "application/json"
};

async function graphql(query, variables = {}) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables })
  });
  return res.json();
}

async function api(endpoint, method = "GET", body = null) {
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`https://api.github.com${endpoint}`, options);
  const data = await res.json();
  return { status: res.status, data };
}

async function main() {
  console.log(`== 1. Completing Ticket #${currentInfo.num30} ==`);
  await graphql(`
    mutation {
      updateProjectV2ItemFieldValue(input: {
        projectId: "${PROJECT_ID}",
        itemId: "${currentInfo.item30Id}",
        fieldId: "${STATUS_FIELD_ID}",
        value: { singleSelectOptionId: "${OPTION_DONE}" }
      }) { projectV2Item { id } }
    }
  `);
  await api(`/repos/${OWNER}/${REPO}/issues/${currentInfo.num30}/comments`, "POST", {
    body: "🤖 **[Backend Agent]**: Implemented server-side API routes `/api/ai/markdown`, `/api/ai/flashcards`, and `/api/ai/models`. Puter.js and AI processing are executed under backend API routes with `.env.local` key support."
  });
  await api(`/repos/${OWNER}/${REPO}/issues/${currentInfo.num30}`, "PATCH", { state: "closed" });

  console.log(`== 2. Completing Ticket #${currentInfo.num31} ==`);
  await graphql(`
    mutation {
      updateProjectV2ItemFieldValue(input: {
        projectId: "${PROJECT_ID}",
        itemId: "${currentInfo.item31Id}",
        fieldId: "${STATUS_FIELD_ID}",
        value: { singleSelectOptionId: "${OPTION_DONE}" }
      }) { projectV2Item { id } }
    }
  `);
  await api(`/repos/${OWNER}/${REPO}/issues/${currentInfo.num31}/comments`, "POST", {
    body: "🤖 **[Frontend Agent & Reviewer Agent]**: Connected upload & flashcard interfaces to server API routes. Added real-time step progress indicators, animated status badges, and retry handlers."
  });
  await api(`/repos/${OWNER}/${REPO}/issues/${currentInfo.num31}`, "PATCH", { state: "closed" });

  console.log("== Tickets #30 and #31 are completed and marked DONE on Project Board! ==");
}

main().catch(err => console.error("Error completing backend tickets:", err));
