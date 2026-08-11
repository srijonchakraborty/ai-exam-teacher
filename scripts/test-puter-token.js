const fs = require('fs');

let PUTER_API_KEY = process.env.PUTER_API_KEY;
if (!PUTER_API_KEY && fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const match = envContent.match(/PUTER_API_KEY=["']?([^"'\r\n]+)["']?/);
  if (match) PUTER_API_KEY = match[1];
}

console.log("Found Puter API Key in env:", PUTER_API_KEY ? PUTER_API_KEY.substring(0, 25) + "..." : "NONE");

async function testPuter() {
  try {
    const res = await fetch("https://api.puter.com/v2/ai/chat", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt: "Say hello from Puter API!",
        model: "gpt-5.4-nano"
      })
    });

    console.log("Puter API Response Status:", res.status);
    const data = await res.json();
    console.log("Puter API Output:", data);
  } catch (err) {
    console.error("Puter test error:", err);
  }
}

testPuter();
