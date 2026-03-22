import fetch from "node-fetch";
import readline from "readline";

const API_KEY = "your-openrouter-api-key";
const BASE_URL = "https://openrouter.ai/api/v1";

// Fetch all free models from OpenRouter
async function getFreeModels() {
  const res = await fetch(`${BASE_URL}/models`);
  const data = await res.json();
  return data.data
    .filter((m) => m.pricing && m.pricing.prompt === "0" && m.pricing.completion === "0")
    .map((m) => ({ id: m.id, name: m.name }));
}

// Send prompt to a single model (no context, just the prompt)
async function askModel(model, prompt) {
  const start = Date.now();
  try {
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model.id,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1024,
      }),
    });
    const data = await res.json();
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    if (data.error) return { model, error: data.error.message, elapsed };
    const text = data.choices?.[0]?.message?.content?.trim() || "(empty response)";
    return { model, text, elapsed };
  } catch (err) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    return { model, error: err.message, elapsed };
  }
}

// Main
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((r) => rl.question(q, r));

console.log("Fetching free models from OpenRouter...\n");
const models = await getFreeModels();
console.log(`Found ${models.length} free models:\n`);
models.forEach((m, i) => console.log(`  ${i + 1}. ${m.id}`));
console.log("\nType your prompt and all models will answer. Type 'quit' to exit.\n");

while (true) {
  const prompt = await ask("\n>> Your prompt: ");
  if (prompt.trim().toLowerCase() === "quit") break;
  if (!prompt.trim()) continue;

  console.log(`\nSending to ${models.length} models in parallel...\n`);

  const results = await Promise.allSettled(models.map((m) => askModel(m, prompt)));

  let idx = 0;
  for (const r of results) {
    idx++;
    const val = r.status === "fulfilled" ? r.value : { model: models[idx - 1], error: r.reason };
    const sep = "─".repeat(70);
    console.log(sep);
    console.log(`[${idx}/${models.length}] ${val.model.name || val.model.id}  (${val.elapsed || "?"}s)`);
    console.log(sep);
    if (val.error) {
      console.log(`  ❌ Error: ${val.error}`);
    } else {
      console.log(val.text);
    }
    console.log();
  }
}

rl.close();
console.log("Bye!");
