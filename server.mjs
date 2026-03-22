import http from "http";
import fs from "fs";
import fetch from "node-fetch";

const API_KEY = "your-openrouter-api-key";
const BASE_URL = "https://openrouter.ai/api/v1";
const PORT = 3000;

async function getFreeModels() {
  const res = await fetch(`${BASE_URL}/models`);
  const data = await res.json();
  return data.data
    .filter((m) => m.pricing && m.pricing.prompt === "0" && m.pricing.completion === "0")
    .map((m) => ({ id: m.id, name: m.name }));
}

async function askModel(model, prompt) {
  const start = Date.now();
  try {
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "AI Chat Compare",
      },
      body: JSON.stringify({
        model: model.id,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2048,
        provider: {
          allow_fallbacks: true,
          data_collection: "allow",
          ignore_provider_rate_limits: true,
        },
      }),
    });
    const data = await res.json();
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`[${model.id}]`, data.error ? `ERROR: ${JSON.stringify(data.error)}` : "OK");
    if (data.error) {
      const msg = typeof data.error === "string" ? data.error : (data.error.message || JSON.stringify(data.error));
      const code = data.error.code ? ` (${data.error.code})` : "";
      const meta = data.error.metadata ? ` | ${JSON.stringify(data.error.metadata)}` : "";
      return { model, error: msg + code + meta, elapsed };
    }
    const text = data.choices?.[0]?.message?.content?.trim() || "(empty response)";
    return { model, text, elapsed };
  } catch (err) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.error(`[${model.id}] FETCH ERROR:`, err.message);
    return { model, error: err.message, elapsed };
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(fs.readFileSync("index.html", "utf-8"));
    return;
  }

  if (req.method === "GET" && req.url === "/models") {
    try {
      const models = await getFreeModels();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(models));
    } catch (e) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  if (req.method === "POST" && req.url === "/ask") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", async () => {
      try {
        const { prompt, models } = JSON.parse(body);

        // SSE stream — send each model result as it finishes
        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        });

        const promises = models.map(async (m) => {
          const result = await askModel(m, prompt);
          res.write(`data: ${JSON.stringify(result)}\n\n`);
        });

        await Promise.allSettled(promises);
        res.write("data: [DONE]\n\n");
        res.end();
      } catch (e) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
