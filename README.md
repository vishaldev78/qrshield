# QRShield — Scan Before You Trust

> **Scan the QR. Know the risk before you trust the link.**
> A privacy-first quishing (QR phishing) defense platform. Decode first → Analyze second → Visit last.

QRShield is a **pre-click security layer for QR codes**. It decodes QR payloads entirely in your
browser, runs a deterministic, explainable rule engine over the destination, and shows you exactly
why a link is risky — **before** you open it. Nothing is uploaded, no account is needed, and the
destination is never opened automatically.

---

## ✨ Features

| | |
|---|---|
| 📷 **Camera scanning** | Live QR decoding via `getUserMedia` + jsQR, fully in-browser |
| 🖼️ **Image upload** | Drag & drop a QR screenshot — decoded locally, never uploaded |
| 🔗 **Manual URL check** | Paste any destination to inspect it before visiting |
| 🧪 **Built-in test QRs** | 6 synthetic attack cases (brand impersonation, punycode, raw IP, shortener…) rendered as scannable QR codes — no real infrastructure involved |
| 🛡️ **Deterministic risk engine** | 14 explainable rules, category caps, level floors — same input, same verdict, every time |
| 🧾 **Execution trace console** | Terminal-style trace shows every pipeline step and triggered rule ID |
| 🤖 **Optional AI explainer** | Off by default; AI only restates the engine's findings in plain language — it never scores |
| 🔒 **Privacy by architecture** | No uploads, no accounts, no tracking. History lives in `localStorage` only |

## 🧠 How the engine thinks

**Decode first → Analyze second → Visit last.**

- **Scoring**: each rule emits a weighted finding (e.g. IP host +25, punycode +35, brand
  impersonation +35, HTTP +10, credential path +15…), aggregated with per-category caps
  (domain 60 / transport 30 / content 35) so related signals don't pile up artificially.
- **Verdict bands**: `0–25` no major indicators · `26–59` suspicious · `60–100` high risk.
- **Honest language**: a shortener is a *signal*, not a verdict; HTTP means *unencrypted*, not *malicious*.

## 🚀 Run locally (VS Code)

**Prerequisites:** Node.js 18.18+ (or Bun 1.x), npm / bun.

```bash
# 1. install dependencies
npm install          # or: bun install

# 2. (optional) configure the AI explainer — skip it, the app works without it
cp .env.example .env

# 3. start the dev server
npm run dev          # or: bun run dev

# 4. open http://localhost:3000
```

Useful scripts:

```bash
npm run lint         # ESLint
npm run typecheck    # TypeScript, no emit
npm run build        # production build (Vercel-compatible)
npm run build:standalone  # build + assemble standalone server (self-hosting on Linux/macOS)
```

## ☁️ Deploy to Vercel

1. Push this repository to GitHub / GitLab / Bitbucket.
2. On [vercel.com](https://vercel.com) → **Add New… → Project** → import the repo.
3. Vercel auto-detects Next.js. Leave build settings as-is (`npm run build`).
4. **Deploy**. Done — every default feature works with zero configuration.

> The only optional environment variable is `ZAI_API_KEY`-style credentials for the
> opt-in AI explanation endpoint (`/api/explain`). Without it, the app runs perfectly —
> the AI button simply returns a friendly "service unavailable" message.

## 📁 Project structure

```
src/
├── app/                        # Next.js App Router (single-page app on /)
│   ├── icon.svg|icon.png|apple-icon.png   # favicons (auto-served)
│   ├── api/explain/route.ts    # optional AI explainer (backend-only SDK)
│   └── layout.tsx / globals.css / page.tsx
├── components/
│   ├── qrshield/               # product UI (scanner, result, trace console…)
│   └── ui/                     # shadcn/ui primitives
├── lib/
│   ├── security/               # deterministic rule engine (rules, scoring, domain, brands)
│   ├── qr/                     # camera + image decoding (100% client-side)
│   └── storage/                # localStorage history
└── types/
```

## 🔐 Security & privacy model

```
UNTRUSTED QR INPUT → SANITIZE → PARSE → RULE ENGINE → SAFE UI (escaped text, never HTML)
```

- Decoded URLs are **never rendered as links automatically** — "Open destination" is always a
  deliberate, user-initiated action behind a confirmation dialog (and absent entirely for
  high-risk verdicts).
- `javascript:` / `data:` payloads are blocked outright; `WIFI:` / `upi:` / `mailto:` content is
  shown as informational cards.
- The engine evaluates **URL structure only** — it never contacts the destination, so it can't
  leak your scan to anyone.

## ⚠️ Disclaimer

QRShield performs **static, heuristic analysis**. It is a pre-click awareness layer for everyday
users — not a replacement for security vendors, and it cannot guarantee any destination is safe.
Never enter sensitive data on unverified sites.
