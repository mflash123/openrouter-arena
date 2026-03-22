# AI Chat — Compare Free Models from OpenRouter

A simple web app that sends your prompt to **all free models** on [OpenRouter](https://openrouter.ai) at the same time, so you can compare their answers side by side and pick the best one.

## Features

- Automatically fetches all currently available free models from OpenRouter
- Sends your prompt to every model **in parallel** — no context, just your raw prompt
- Results stream in as each model responds, with response time shown
- Copy any response with one click
- Clean dark UI, works in any browser

## Requirements

- [Node.js](https://nodejs.org) v18+
- An [OpenRouter](https://openrouter.ai) account and API key

## Setup

```bash
git clone <repo>
cd aichat
npm install
```

Open `server.mjs` and set your API key:

```js
const API_KEY = "your-openrouter-api-key";
```

## Run

```bash
node server.mjs
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

## ⚠️ Rate Limit

OpenRouter free tier allows **50 requests per day**. Since each prompt is sent to every free model, one prompt can use 20–30 requests. Think carefully before sending.

---

## Support

If you find this useful, I'd really appreciate your support! ❤️

- 𝕏 Twitter: [@mflash123](https://x.com/mflash123)
- 🔥 Boosty: [boosty.to/mflash123](https://boosty.to/mflash123)
