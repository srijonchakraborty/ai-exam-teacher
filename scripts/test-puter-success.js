const fs = require('fs');

let PUTER_API_KEY = process.env.PUTER_API_KEY;
if (!PUTER_API_KEY && fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const match = envContent.match(/PUTER_API_KEY=["']?([^"'\r\n]+)["']?/);
  if (match) PUTER_API_KEY = match[1];
}

async function testSuccess() {
  const res = await fetch("https://api.puter.com/drivers/call", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${PUTER_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      interface: "puter-chat-completion",
      method: "complete",
      args: {
        messages: [{ role: "user", content: "Say hello from Puter API server authentication!" }],
        model: "gpt-4o-mini"
      }
    })
  });

  console.log("Status:", res.status);
  const data = await res.json();
  console.log("Result:", JSON.stringify(data, null, 2));
}

testSuccess();
