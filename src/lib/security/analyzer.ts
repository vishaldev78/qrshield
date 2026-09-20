/**
 * QRShield — Analyzer entry point (100% client-side, deterministic).
 *
 * Flow: raw QR text / user input → normalization → URL parse →
 *       detail extraction → rule evaluation → aggregation → verdict.
 * No network requests, no storage — privacy by architecture.
 */

import {
  buildURLDetails,
  decodeLeet,
  isIPv4,
} from "./domain";
import { SECURITY_RULES } from "./rules";
import { aggregateScore, levelForScore } from "./scoring";
import type { NormalizeOutcome, URLAnalysis } from "./types";

/** Non-web schemes that QR codes commonly carry. */
const NON_WEB_SCHEME_RE =
  /^(wifi|tel|mailto|smsto|sms|mms|geo|bitcoin|ethereum|upi|weixin|wxp|webcal|market|youtube|viber|whatsapp|matrix|irc|magnet|ftp|file):/i;

/** Schemes that must never be opened by anyone, anywhere. */
const DANGEROUS_SCHEME_RE = /^(javascript|data|vbscript|file|blob):/i;

/** A "looks like a bare domain" pattern, e.g. example.com or example.com/pay. */
const BARE_DOMAIN_RE =
  /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+([/?#].*)?$/i;

const BARE_IPV4_RE =
  /^(\d{1,3}\.){3}\d{1,3}([/?#].*)?$/;

export function normalizeQrContent(rawInput: string): NormalizeOutcome {
  const raw = rawInput.trim();
  if (!raw) return { kind: "invalid", content: rawInput };

  // 1. Executable / embedded-content schemes — reject before anything else.
  if (DANGEROUS_SCHEME_RE.test(raw)) {
    const scheme = raw.split(":")[0].toLowerCase();
    return { kind: "dangerous", content: raw, scheme };
  }

  // 2. Absolute http(s) URLs.
  if (/^https?:\/\//i.test(raw)) {
    try {
       
      new URL(raw);
      return { kind: "url", url: raw };
    } catch {
      return { kind: "invalid", content: raw };
    }
  }

  // 3. Other known schemes (WIFI:, mailto:, upi:, …) — informative, not analyzable.
  if (NON_WEB_SCHEME_RE.test(raw)) {
    const scheme = raw.split(":")[0].toLowerCase();
    return { kind: "non-web", content: raw, scheme };
  }

  // 4. Scheme-relative or bare domain → assume https (browser-equivalent behavior).
  if (BARE_DOMAIN_RE.test(raw) && raw.includes(".")) {
    const url = `https://${raw}`;
    try {
       
      new URL(url);
      return { kind: "url", url };
    } catch {
      return { kind: "invalid", content: raw };
    }
  }

  // 5. Bare IPv4 → assume http.
  if (BARE_IPV4_RE.test(raw)) {
    const url = `http://${raw}`;
    try {
       
      new URL(url);
      return { kind: "url", url };
    } catch {
      return { kind: "invalid", content: raw };
    }
  }

  // 6. Anything else is plain content (text, vCard, …).
  return { kind: "non-web", content: raw, scheme: "text" };
}

/** Run the deterministic rule engine against a parsed URL. */
export function analyzeUrl(urlString: string): URLAnalysis {
  const u = new URL(urlString);
  const details = buildURLDetails(u);
  const decodedHost = decodeLeet(u.hostname.toLowerCase());

  const ctx = { url: u, raw: urlString, details, decodedHost };

  const seen = new Set<string>();
  const findings = SECURITY_RULES.map((r) => r.evaluate(ctx))
    .filter((f): f is NonNullable<typeof f> => f !== null)
    .filter((f) => {
      if (seen.has(f.id)) return false;
      seen.add(f.id);
      return true;
    });

  const score = aggregateScore(findings);
  const level = levelForScore(score);

  return {
    url: details.fullUrl,
    domain: details.domain,
    protocol: details.protocol,
    score,
    level,
    findings,
    analyzedAt: new Date().toISOString(),
    details,
  };
}

/** One-call pipeline used by the UI for both QR results and manual input. */
export function analyzeInput(rawInput: string): NormalizeOutcome & { analysis?: URLAnalysis } {
  const outcome = normalizeQrContent(rawInput);
  if (outcome.kind === "url") {
    try {
      return { ...outcome, analysis: analyzeUrl(outcome.url) };
    } catch {
      return { kind: "invalid", content: rawInput };
    }
  }
  return outcome;
}

export { isIPv4 };
