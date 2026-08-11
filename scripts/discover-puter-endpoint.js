const fs = require('fs');

let PUTER_API_KEY = process.env.PUTER_API_KEY;
if (!PUTER_API_KEY && fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const match = envContent.match(/PUTER_API_KEY=["']?([^"'\r\n]+)["']?/);
  if (match) PUTER_API_KEY = match[1];
}

const endpoints = [
  { url: "https://api.puter.com/drivers/call", body: { interface: "puter-ai", method: "chat", args: { prompt: "Hello", model: "gpt-5.4-nano" } } },
  { url: "https://api.puter.com/v2/drivers/call", body: { interface: "puter-ai", method: "chat", args: { prompt: "Hello", model: "gpt-5.4-nano" } } },
  { url: "https://api.puter.com/v1/ai/chat", body: { prompt: "Hello", model: "gpt-5.4-nano" } },
  { url: "https://api.puter.com/v2/ai/chat", body: { prompt: "Hello", model: "gpt-5.4-nano" } },
];

async function testAll() {
  for (const ep of endpoints) {
    try {
      const res = await fetch(ep.url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${PUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(ep.body)
      });
      console.log(`URL: ${ep.url} -> Status: ${res.status}`);
      const text = await res.text();
      console.log(`Output: ${text.substring(0, 200)}`);
    } catch (e) {
      console.log(`URL: ${ep.url} -> Error: ${e.message}`);
    }
  }
}

testAll();
