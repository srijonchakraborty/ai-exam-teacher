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
  console.log("== 1. Creating Issue #29 on GitHub ==");
  const issueRes = await api(`/repos/${OWNER}/${REPO}/issues`, "POST", {
    title: "[bug] Ticket #29: Sourced model picker live from puter.ai.listModels() & robust JSON markdown block parser",
    body: "## Acceptance Criteria\n- Fetch live models from puter.ai.listModels() with fallback to free/paid defaults.\n- Robustly strip markdown ```json code blocks during AI flashcard response parsing.",
    labels: ["bug", "frontend", "backend"]
  });

  const issueNum = issueRes.data?.number;
  const contentId = issueRes.data?.node_id;
  console.log(`Issue #${issueNum} created with node_id ${contentId}`);

  console.log("\n== 2. Adding Issue #29 to Project Board (v2) ==");
  const addRes = await graphql(`
    mutation {
      addProjectV2ItemById(input: { projectId: "${PROJECT_ID}", contentId: "${contentId}" }) {
        item {
          id
        }
      }
    }
  `);

  const itemId = addRes.data?.addProjectV2ItemById?.item?.id;
  console.log(`Project Item ID: ${itemId}`);

  console.log("\n== 3. Moving Card to 'In Progress' ==");
  await graphql(`
    mutation {
      updateProjectV2ItemFieldValue(input: {
        projectId: "${PROJECT_ID}",
        itemId: "${itemId}",
        fieldId: "${STATUS_FIELD_ID}",
        value: { singleSelectOptionId: "${OPTION_IN_PROGRESS}" }
      }) {
        projectV2Item {
          id
        }
      }
    }
  `);

  await api(`/repos/${OWNER}/${REPO}/issues/${issueNum}/comments`, "POST", {
    body: "🤖 **[Git Agent]**: Ticket #29 picked up from GitHub backlog and moved to **In Progress** on the Project Board. Assigned to **Frontend Agent** and **Backend Agent**."
  });

  console.log("Card is now in IN PROGRESS status!");
  fs.writeFileSync("scripts/.current_issue.json", JSON.stringify({ issueNum, itemId }));
}

main().catch(err => console.error("Error creating and processing issue #29:", err));
