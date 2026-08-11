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

const futureTickets = [
  {
    num: 36,
    title: "[feature] Ticket #36: Talk with PDF — Direct Interactive PDF Chat & Question Answering",
    body: `## Summary
Allow users to ask natural language questions directly against any uploaded PDF document using chunk-based page retrieval and server AI synthesis.

## Acceptance Criteria
- [ ] Add "Talk with PDF" slide-out chat drawer in the document upload & extraction interface.
- [ ] Implement page chunking & context assembly for querying multi-page PDFs.
- [ ] Stream AI answers with page citations (e.g. "Sourced from Page 4 & 12").
- [ ] Store PDF conversation logs linked to \`mdDocId\` in Firestore.`,
    labels: ["backend", "frontend", "feature"]
  },
  {
    num: 37,
    title: "[feature] Ticket #37: Chat with Markdown Study Guide & AI Tutor Assistant",
    body: `## Summary
Interactive AI study assistant embedded directly inside the synthesized Markdown Document Reader page for follow-up Q&A and concept explanations.

## Acceptance Criteria
- [ ] Add floating "AI Study Assistant" button and context drawer on \`/doc/[id]\`.
- [ ] Context-aware prompt injection using current document markdown text.
- [ ] Quick action shortcuts: "Explain this section", "Simplify concept", "Generate 3 practice questions".
- [ ] Save chat conversation history per document in Firestore.`,
    labels: ["backend", "frontend", "feature"]
  },
  {
    num: 38,
    title: "[frontend] Ticket #38: UI/UX Enhancements — Study Analytics Dashboard & Theme Switcher",
    body: `## Summary
Enhance the user experience with an interactive study analytics dashboard on the library page and a customizable theme engine.

## Acceptance Criteria
- [ ] Analytics widgets on \`/library\` showing total documents processed, total flashcards mastered, and study streak count.
- [ ] Dark/Light theme toggle with persistent user preference saved in \`localStorage\`.
- [ ] Smooth micro-animations and fluid mobile responsive breakpoints.`,
    labels: ["frontend", "uiux"]
  },
  {
    num: 39,
    title: "[feature] Ticket #39: Spaced Repetition (SM-2 Algorithm) & Quizzing Mode",
    body: `## Summary
Implement an interactive quizzing mode for flashcard decks using the SuperMemo-2 (SM-2) algorithm to optimize long-term memory retention.

## Acceptance Criteria
- [ ] "Start Quizzing Session" mode on \`/doc/[id]/flashcards\`.
- [ ] Self-rating buttons ("Again", "Hard", "Good", "Easy") during card review.
- [ ] Store review intervals, ease factors, and due dates per card in Firestore.
- [ ] "Due for Review Today" badge & filter in the Study Library.`,
    labels: ["backend", "frontend", "feature"]
  }
];

async function main() {
  console.log("== Creating Future Roadmap Tickets in GitHub & Project Board 'Todo' ==");

  const results = [];

  for (const t of futureTickets) {
    console.log(`\n--- Creating Issue #${t.num}: ${t.title} ---`);
    const issueRes = await api(`/repos/${OWNER}/${REPO}/issues`, "POST", {
      title: t.title,
      body: t.body,
      labels: t.labels
    });

    const issueNum = issueRes.data?.number;
    const contentId = issueRes.data?.node_id;
    const issueUrl = issueRes.data?.html_url;
    console.log(`✅ GitHub Issue #${issueNum} created at ${issueUrl}`);

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

    if (itemId) {
      await graphql(`
        mutation {
          updateProjectV2ItemFieldValue(input: {
            projectId: "${PROJECT_ID}",
            itemId: "${itemId}",
            fieldId: "${STATUS_FIELD_ID}",
            value: { singleSelectOptionId: "${OPTION_TODO}" }
          }) {
            projectV2Item {
              id
            }
          }
        }
      `);

      await api(`/repos/${OWNER}/${REPO}/issues/${issueNum}/comments`, "POST", {
        body: `🤖 **[Git Agent]**: Ticket #${issueNum} created and placed in the **Todo** column on the Project Board. Ready for future execution.`
      });

      console.log(`📋 Item #${issueNum} set to TODO on Project Board!`);
    }

    results.push({ num: issueNum, title: t.title, url: issueUrl });
  }

  fs.writeFileSync("scripts/.future_tickets.json", JSON.stringify(results, null, 2));
  console.log("\n🎉 All 4 Future Roadmap Tickets successfully created and placed in TODO!");
}

main().catch(err => console.error("Error creating future roadmap tickets:", err));
