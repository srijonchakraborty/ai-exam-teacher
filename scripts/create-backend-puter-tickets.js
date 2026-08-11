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

const OPTION_TODO = "f75ad846";
const OPTION_IN_PROGRESS = "47fc9ee4";
const OPTION_DONE = "98236657";

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
  console.log("== 1. Creating Ticket #30 (Backend API Routes) ==");
  const issue30 = await api(`/repos/${OWNER}/${REPO}/issues`, "POST", {
    title: "[backend] Ticket #30: Server-side Puter & AI API endpoints (/api/ai/markdown, /api/ai/flashcards)",
    body: "## Acceptance Criteria\n- Move Puter.js / AI processing from browser to Next.js server API routes.\n- Implement server authentication and API key handling in .env.local.\n- Expose /api/ai/markdown and /api/ai/flashcards backend endpoints.",
    labels: ["backend"]
  });

  console.log("== 2. Creating Ticket #31 (Frontend Progress UX) ==");
  const issue31 = await api(`/repos/${OWNER}/${REPO}/issues`, "POST", {
    title: "[frontend] Ticket #31: Real-time backend processing UI feedback & animated progress states",
    body: "## Acceptance Criteria\n- Connect upload & flashcard screens to server API routes.\n- Display explicit visual feedback (step progress, animated badges, state indicators).\n- Provide clear error handling and retry buttons.",
    labels: ["frontend"]
  });

  const num30 = issue30.data.number;
  const node30 = issue30.data.node_id;

  const num31 = issue31.data.number;
  const node31 = issue31.data.node_id;

  console.log(`Created Issue #${num30} and Issue #${num31}`);

  // Link to Project Board
  const add30 = await graphql(`
    mutation {
      addProjectV2ItemById(input: { projectId: "${PROJECT_ID}", contentId: "${node30}" }) {
        item { id }
      }
    }
  `);

  const add31 = await graphql(`
    mutation {
      addProjectV2ItemById(input: { projectId: "${PROJECT_ID}", contentId: "${node31}" }) {
        item { id }
      }
    }
  `);

  const item30Id = add30.data?.addProjectV2ItemById?.item?.id;
  const item31Id = add31.data?.addProjectV2ItemById?.item?.id;

  console.log(`Linked #30 (item: ${item30Id}) and #31 (item: ${item31Id}) to Project Board.`);

  // Move #30 to In Progress
  await graphql(`
    mutation {
      updateProjectV2ItemFieldValue(input: {
        projectId: "${PROJECT_ID}",
        itemId: "${item30Id}",
        fieldId: "${STATUS_FIELD_ID}",
        value: { singleSelectOptionId: "${OPTION_IN_PROGRESS}" }
      }) {
        projectV2Item { id }
      }
    }
  `);

  await api(`/repos/${OWNER}/${REPO}/issues/${num30}/comments`, "POST", {
    body: "🤖 **[Backend Agent]**: Ticket #30 moved to **In Progress**. Designing server-side API routes (`/api/ai/markdown` and `/api/ai/flashcards`) for Puter.js / AI processing."
  });

  // Set #31 to Todo
  await graphql(`
    mutation {
      updateProjectV2ItemFieldValue(input: {
        projectId: "${PROJECT_ID}",
        itemId: "${item31Id}",
        fieldId: "${STATUS_FIELD_ID}",
        value: { singleSelectOptionId: "${OPTION_TODO}" }
      }) {
        projectV2Item { id }
      }
    }
  `);

  fs.writeFileSync("scripts/.backend_tickets.json", JSON.stringify({ num30, item30Id, num31, item31Id }));
  console.log("== Tickets Created & #30 moved to IN PROGRESS! ==");
}

main().catch(err => console.error("Error creating backend tickets:", err));
