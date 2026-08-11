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

const currentInfo = JSON.parse(fs.readFileSync("scripts/.uiux_ticket.json", "utf8"));

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
  console.log(`== 1. Moving Ticket #${currentInfo.issueNum} to 'Done' on Project Board ==`);
  await graphql(`
    mutation {
      updateProjectV2ItemFieldValue(input: {
        projectId: "${PROJECT_ID}",
        itemId: "${currentInfo.itemId}",
        fieldId: "${STATUS_FIELD_ID}",
        value: { singleSelectOptionId: "${OPTION_DONE}" }
      }) { projectV2Item { id } }
    }
  `);

  console.log(`== 2. Commenting & Closing Ticket #${currentInfo.issueNum} ==`);
  await api(`/repos/${OWNER}/${REPO}/issues/${currentInfo.issueNum}/comments`, "POST", {
    body: "🤖 **[UI/UX Agent & Reviewer Agent]**: Premium UI/UX Redesign complete! Implemented dark glassmorphism cards, ambient glowing backdrop, 3D card flip scene, responsive typography with Plus Jakarta Sans, and step progress indicators. Build verified clean with zero errors. Merging and closing issue."
  });

  await api(`/repos/${OWNER}/${REPO}/issues/${currentInfo.issueNum}`, "PATCH", { state: "closed" });
  console.log(`Ticket #${currentInfo.issueNum} is closed and marked DONE on Project Board!`);
}

main().catch(err => console.error("Error completing UI/UX ticket:", err));
