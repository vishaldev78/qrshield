# QRShield — Scan Before You Trust

**Privacy-first quishing defense platform. Decode first. Analyze second. Visit last.**

QR codes are everywhere — payments, menus, posters, events, authentication, and advertisements. But scanning a QR code can hide an important security question:

**Where will this QR code actually take me?**

QRShield is a privacy-first QR security scanner designed to analyze QR destinations **before users visit them**.

Instead of immediately opening an unknown link, QRShield follows a simple security workflow:

> **Decode → Analyze → Explain → Decide**

---

## The Problem

Traditional QR scanners are optimized for convenience. Scan a code and open the destination.

That creates an opportunity for **quishing — QR-based phishing attacks**.

A malicious QR code can redirect users to:

* Fake login pages
* Brand impersonation websites
* Credential-harvesting pages
* Suspicious shortened URLs
* Look-alike or typosquatted domains
* Unusual IP-based destinations
* Other suspicious web destinations

The user often has no opportunity to understand the destination before opening it.

QRShield adds a security checkpoint between **scanning** and **visiting**.

---

## Our Solution

QRShield extracts the destination from a QR code and analyzes it using a deterministic security engine.

Users can:

### 📷 Scan with Camera

Scan a QR code directly using the device camera.

### 🖼️ Upload a QR Image

Upload a QR code image and extract its destination without manually opening it.

### 🔗 Analyze a URL

Paste a URL directly when a QR code is not available.

### 🛡️ Get a Risk Assessment

QRShield evaluates multiple security signals and produces a **0–100 risk score** with a clear risk level.

### 🔎 Understand Why

Instead of only displaying a score, QRShield shows the individual security findings that contributed to the assessment.

### 🚦 Decide Before Visiting

The user remains in control of whether to proceed.

---

## Security Analysis

QRShield uses multiple heuristic signals rather than relying on a single indicator.

Depending on the available destination data, the engine can evaluate signals such as:

| Detection                    | Purpose                                         |
| ---------------------------- | ----------------------------------------------- |
| Brand impersonation          | Detect suspicious use of known brand names      |
| Typosquatting                | Identify domains resembling legitimate websites |
| URL shorteners               | Highlight destinations hiding the final URL     |
| Suspicious TLDs              | Flag potentially higher-risk domain extensions  |
| IP destinations              | Identify URLs using raw IP addresses            |
| Unicode / homograph patterns | Detect look-alike domain techniques             |
| Credential patterns          | Identify login or credential-related paths      |
| HTTPS                        | Highlight unencrypted HTTP destinations         |
| Suspicious paths             | Detect unusual authentication/payment patterns  |
| Subdomain abuse              | Identify unusually deep domain structures       |
| Query anomalies              | Flag suspicious or obfuscated parameters        |
| URL structure                | Detect unusually complex destinations           |

These signals are treated as **indicators of risk, not proof of maliciousness**.

---

## Risk Model

QRShield converts detected indicators into a normalized risk score.

|      Score | Assessment | Recommended Action                                   |
| ---------: | ---------- | ---------------------------------------------------- |
|   **0–29** | Low        | Proceed with normal caution                          |
|  **30–69** | Suspicious | Verify the destination independently                 |
| **70–100** | High       | Avoid visiting and verify through an official source |

The purpose of the score is not to claim absolute safety.

It is to give users **useful security context before they make a decision**.

---

## Privacy by Design

Privacy is a core part of QRShield rather than an additional feature.

The intended architecture keeps QR analysis on the client whenever possible:

**QR Image → Decoder → URL Normalization → Security Engine → Risk Score → Findings → Explanation**

No account is required for the core scanning experience.

QRShield is designed to avoid unnecessary collection of QR content and destination data.

---

## AI-Assisted, Not AI-Dependent

QRShield separates its core security analysis from its explanation layer.

The **deterministic security engine** generates the underlying findings and risk assessment.

An optional AI layer can make those findings easier to understand in natural language.

This means an AI service failure does not have to stop the core security analysis.

The architecture is intentionally:

**Security Engine → Evidence → Optional AI Explanation**

rather than:

**AI → Security Decision**

This makes the system more predictable and easier to audit.

---

## How QRShield Works

```text
              QR CODE / URL
                    │
                    ▼
             QR DECODER
                    │
                    ▼
          DESTINATION EXTRACTION
                    │
                    ▼
           URL NORMALIZATION
                    │
                    ▼
        SECURITY ANALYSIS ENGINE
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
    Security Signals      URL Structure
          │                   │
          └─────────┬─────────┘
                    ▼
              RISK SCORING
                    │
                    ▼
          SECURITY FINDINGS
                    │
                    ▼
          HUMAN-READABLE RESULT
                    │
                    ▼
             USER DECISION
```

The key principle is simple:

> **The scanner should not blindly trust what it scans.**

---

## Technology

### Frontend

* Next.js 16
* React
* TypeScript
* Tailwind CSS
* shadcn/ui

### QR Processing

* jsQR
* Camera API
* File-based QR decoding

### Application Architecture

* Next.js App Router
* Zustand
* TanStack Query
* React Hook Form
* Zod
* Prisma
* SQLite

### Security Layer

* Deterministic heuristic engine
* URL normalization
* Risk scoring
* Explainable security findings
* Local explanation templates
* Optional AI explanation

---

## Why We Built It

QR codes were created to make digital interactions faster.

That convenience also means users can interact with a destination **without first seeing or understanding it**.

We wanted to build a simple security layer that changes the interaction from:

> **Scan → Open**

to:

> **Scan → Understand → Decide**

QRShield is our exploration of what a safer QR experience could look like.

---

## Challenges

One of our biggest challenges was designing security rules that provide useful signals without treating every unusual URL as malicious.

For example:

* An HTTP website is not automatically malicious.
* A URL shortener is not automatically malicious.
* An unfamiliar domain is not automatically malicious.
* A suspicious-looking TLD alone is not enough to prove an attack.

Therefore, QRShield combines multiple signals and presents them as evidence for the user to evaluate.

Another challenge was **explainability**.

A risk score without context does not help most users. QRShield therefore exposes the findings behind the score instead of hiding the reasoning behind a single number.

We also designed the architecture so that optional AI assistance does not become a dependency for the core security analysis.

---

## What We Learned

Building QRShield taught us that cybersecurity products need more than detection.

They need:

**Detection + Explainability + User Control**

A technically sophisticated security engine is less useful if users cannot understand its output.

We also learned that AI is most useful when it complements deterministic security logic rather than replacing it.

---

## Future Roadmap

QRShield can be extended with additional security intelligence, including:

* Domain reputation services
* Threat-intelligence feeds
* Domain registration intelligence
* Advanced homograph detection
* Controlled redirect-chain analysis
* Browser isolation for suspicious destinations
* On-device ML classification
* Offline PWA support
* Batch QR scanning
* Browser extension
* Enterprise security policies
* Community threat intelligence

---

## The Core Idea

QRShield does not promise that a URL is **100% safe**.

Instead, it gives users something they usually don't have when scanning a QR code:

**context before they click.**

### Decode first.

### Analyze second.

### Visit last.

**QRShield — Scan Before You Trust.**
