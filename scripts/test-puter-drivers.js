const fs = require('fs');

let PUTER_API_KEY = process.env.PUTER_API_KEY;
if (!PUTER_API_KEY && fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const match = envContent.match(/PUTER_API_KEY=["']?([^"'\r\n]+)["']?/);
  if (match) PUTER_API_KEY = match[1];
}

const interfaces = [
  "openai-chat-completion",
  "puter-chat-completion",
  "ai-chat-completion",
  "puter-ai",
  "openai-chat",
];

async function testDrivers() {
  for (const interfaceName of interfaces) {
    try {
      const res = await fetch("https://api.puter.com/drivers/call", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${PUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          interface: interfaceName,
          method: "chat",
          args: { prompt: "Say hello", model: "gpt-5.4-nano" }
        })
      });
      console.log(`Interface '${interfaceName}' -> Status: ${res.status}`);
      const text = await res.text();
      console.log(`Output: ${text.substring(0, 200)}`);
    } catch (e) {
      console.log(`Interface '${interfaceName}' -> Error: ${e.message}`);
    }
  }
}

testDrivers();
