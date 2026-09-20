/**
 * QRShield — Risk aggregation & verdict engine.
 *
 * Aggregation strategy (defensible by design):
 *  - Each finding carries a raw score.
 *  - Related signals are capped per category so five related indicators
 *    don't artificially inflate one weakness (dedup/caps).
 *  - A small amplifier applies when many *independent* signals co-occur.
 *  - Certain signal classes carry a minimum level floor: an IP destination
 *    or a hidden (shortened) destination always deserves at least "Suspicious",
 *    because the user fundamentally cannot attribute/inspect it.
 */

import type { RiskLevel, SecurityFinding, URLAnalysis, URLDetails } from "./types";

const CATEGORY_CAPS: Record<SecurityFinding["category"], number> = {
  domain: 60,
  transport: 30,
  content: 35,
};

export function aggregateScore(findings: SecurityFinding[]): number {
  if (findings.length === 0) return 0;

  const byCategory: Record<string, number> = { domain: 0, transport: 0, content: 0 };
  for (const f of findings) {
    byCategory[f.category] = Math.min(
      byCategory[f.category] + f.score,
      CATEGORY_CAPS[f.category]
    );
  }

  let score = byCategory.domain + byCategory.transport + byCategory.content;

  // Independent-signal amplifier: ≥4 distinct findings → +5.
  if (findings.length >= 4) score += 5;

  // Level floors for "uninspectable destination" signals.
  const ids = new Set(findings.map((f) => f.id));
  if (ids.has("ip-destination")) score = Math.max(score, 30);
  if (ids.has("url-shortener")) score = Math.max(score, 30);
  if (ids.has("punycode")) score = Math.max(score, 35);
  if (ids.has("brand-impersonation")) score = Math.max(score, 35);
  if (ids.has("embedded-credentials")) score = Math.max(score, 30);

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function levelForScore(score: number): RiskLevel {
  if (score <= 25) return "low";
  if (score <= 59) return "suspicious";
  return "high";
}

export const LEVEL_META: Record<
  RiskLevel,
  { label: string; headline: string; summary: string; color: string; softBg: string }
> = {
  low: {
    label: "No major indicators",
    headline: "No major risk indicators detected",
    summary:
      "This destination shows none of the common risk indicators we check. Static analysis cannot guarantee a site is safe — stay alert before entering sensitive data.",
    color: "#10B981",
    softBg: "rgba(16,185,129,0.10)",
  },
  suspicious: {
    label: "Proceed carefully",
    headline: "Suspicious destination",
    summary:
      "One or more risk indicators were detected. Verify the sender and the destination before entering any personal information.",
    color: "#F59E0B",
    softBg: "rgba(245,158,11,0.10)",
  },
  high: {
    label: "High risk",
    headline: "Do not open this destination",
    summary:
      "Multiple strong risk indicators co-occur — a pattern typical of phishing pages. Avoid entering passwords, OTPs, card details, UPI PINs or banking information.",
    color: "#EF4444",
    softBg: "rgba(239,68,68,0.10)",
  },
};

/** Convenience view-model combining score + level + meta. */
export function verdictOf(score: number) {
  const level = levelForScore(score);
  return { level, meta: LEVEL_META[level] };
}

export type { URLAnalysis, URLDetails };
