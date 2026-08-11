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
  console.log("== 1. Populating Project Board Items ==");
  
  for (let issueNum = 1; issueNum <= 28; issueNum++) {
    // Get issue Node ID
    const issueRes = await api(`/repos/${OWNER}/${REPO}/issues/${issueNum}`);
    if (issueRes.status === 200 && issueRes.data?.node_id) {
      const contentId = issueRes.data.node_id;
      const addRes = await graphql(`
        mutation {
          addProjectV2ItemByComponent(input: { projectId: "${PROJECT_ID}", contentId: "${contentId}" }) {
            item {
              id
            }
          }
        }
      `);
      console.log(`Added Issue #${issueNum} to Project Board: item id ${addRes.data?.addProjectV2ItemByComponent?.item?.id || 'done'}`);
    }
  }

  console.log("== All 28 Issues Linked to GitHub Project Board (v2) ==");
}

main().catch(err => console.error("Error populating project board:", err));
