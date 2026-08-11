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
  console.log("== Updating Project Board Items with Status Field Values ==");

  for (let issueNum = 1; issueNum <= 28; issueNum++) {
    const issueRes = await api(`/repos/${OWNER}/${REPO}/issues/${issueNum}`);
    if (issueRes.status === 200 && issueRes.data?.node_id) {
      const contentId = issueRes.data.node_id;
      
      // 1. Add item to Project V2
      const addRes = await graphql(`
        mutation {
          addProjectV2ItemByComponent(input: { projectId: "${PROJECT_ID}", contentId: "${contentId}" }) {
            item {
              id
            }
          }
        }
      `);

      const itemId = addRes.data?.addProjectV2ItemByComponent?.item?.id;

      if (itemId) {
        // 2. Set Status Field Value to Done
        const updateRes = await graphql(`
          mutation {
            updateProjectV2ItemFieldValue(input: {
              projectId: "${PROJECT_ID}",
              itemId: "${itemId}",
              fieldId: "${STATUS_FIELD_ID}",
              value: { singleSelectOptionId: "${OPTION_DONE}" }
            }) {
              projectV2Item {
                id
              }
            }
          }
        `);
        console.log(`Issue #${issueNum} -> Project Item ${itemId} set to 'Done': ${updateRes.data?.updateProjectV2ItemFieldValue ? 'OK' : 'Error'}`);
      } else {
        console.error(`Failed to get itemId for Issue #${issueNum}`, addRes);
      }
    }
  }

  console.log("== Finished Updating All 28 Project Items to 'Done' Column ==");
}

main().catch(err => console.error("Error setting project item status values:", err));
