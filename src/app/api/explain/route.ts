/**
 * QRShield — Optional AI explanation endpoint (opt-in, off by default).
 *
 * Architecture rule: the deterministic security engine decides the score;
 * AI only translates existing findings into natural language. The AI is
 * never asked "is this dangerous?" and its answer never changes the verdict.
 *
 * Privacy: receives ONLY the URL + findings summary. No QR image, no history,
 * no identity. Findings are trimmed to short summaries before prompting.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

const ExplainSchema = z.object({
  url: z.string().min(1).max(2048),
  score: z.number().int().min(0).max(100),
  level: z.enum(["low", "suspicious", "high"]),
  findings: z
    .array(
      z.object({
        title: z.string().max(120),
        severity: z.enum(["low", "medium", "high"]),
        description: z.string().max(400),
      })
    )
    .max(14),
});

const SYSTEM_PROMPT = `You are the plain-language explainer for QRShield, a QR-code (quishing) safety tool.

STRICT RULES:
1. The security engine has ALREADY decided the risk level. Never contradict it, never re-score, never say "this is actually safe" or upgrade the severity.
2. Explain in 2-4 short sentences why the detected signals matter for an everyday user.
3. Use calm, non-technical language. No jargon without a quick explanation.
4. Never tell the user the link is definitely malicious — say "appears", "is consistent with", "is a common pattern in".
5. End with one concrete, safe next step (e.g. "type the bank's address yourself instead of using this link").
6. Never include URLs, never ask for information, never output lists or markdown headers — one short paragraph only.`;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = ExplainSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { url, score, level, findings } = parsed.data;

  const findingsSummary = findings
    .map((f) => `- [${f.severity}] ${f.title}: ${f.description}`)
    .join("\n");

  const userPrompt = `Security engine result (authoritative):
- Destination: ${url}
- Risk score: ${score}/100
- Level: ${level}
- Findings:
${findingsSummary || "- No risk indicators detected"}

Write the plain-language explanation for the user following the rules.`;

  try {
    const configPath = path.join(process.cwd(), ".z-ai-config");
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    
    const client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    });

    const completion = await client.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 300,
    });

    const explanation = completion.choices[0]?.message?.content?.trim();
    if (!explanation) {
      return NextResponse.json(
        { error: "The explanation service returned an empty response." },
        { status: 502 }
      );
    }

    return NextResponse.json({ explanation });
  } catch (err) {
    console.error("[/api/explain] AI request failed:", err);
    return NextResponse.json(
      { error: "Explanation service is temporarily unavailable." },
      { status: 502 }
    );
  }
}
