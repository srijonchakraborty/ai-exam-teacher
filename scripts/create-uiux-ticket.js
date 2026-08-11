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
const OPTION_IN_PROGRESS = "47fc9ee4";

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
  console.log("== 1. Creating Issue #33 (UI/UX Redesign) ==");
  const issueRes = await api(`/repos/${OWNER}/${REPO}/issues`, "POST", {
    title: "[frontend] Ticket #33: Premium UI/UX Redesign - Dark glassmorphism, fluid micro-interactions & 3D card deck",
    body: "## Acceptance Criteria\n- Upgrade CSS design system with glassmorphism, glowing accents, and keyframe animations in globals.css.\n- Redesign app layout navigation header with active link highlights and dynamic gradients.\n- Transform Home, Upload, Library, Reader, and 3D Flashcard flip deck interfaces into a state-of-the-art visual experience.",
    labels: ["frontend", "review"]
  });

  const issueNum = issueRes.data.number;
  const contentId = issueRes.data.node_id;
  console.log(`Issue #${issueNum} created on GitHub`);

  console.log("== 2. Linking Issue #33 to Project V2 Board & Moving to IN PROGRESS ==");
  const addRes = await graphql(`
    mutation {
      addProjectV2ItemById(input: { projectId: "${PROJECT_ID}", contentId: "${contentId}" }) {
        item { id }
      }
    }
  `);

  const itemId = addRes.data?.addProjectV2ItemById?.item?.id;

  await graphql(`
    mutation {
      updateProjectV2ItemFieldValue(input: {
        projectId: "${PROJECT_ID}",
        itemId: "${itemId}",
        fieldId: "${STATUS_FIELD_ID}",
        value: { singleSelectOptionId: "${OPTION_IN_PROGRESS}" }
      }) { projectV2Item { id } }
    }
  `);

  await api(`/repos/${OWNER}/${REPO}/issues/${issueNum}/comments`, "POST", {
    body: "🤖 **[UI/UX Agent]**: Ticket #33 moved to **In Progress** on Project Board. Pulled ticket and starting complete design system overhaul (glassmorphism cards, 3D flip animation, glowing indicators, responsive layouts)."
  });

  fs.writeFileSync("scripts/.uiux_ticket.json", JSON.stringify({ issueNum, itemId }));
  console.log(`Ticket #${issueNum} created, linked, and set to IN PROGRESS!`);
}

main().catch(err => console.error("Error creating UI/UX ticket:", err));
