/**
 * QRShield — Core security engine types
 * Deterministic, explainable, client-side URL risk analysis.
 */

export type RiskLevel = "low" | "suspicious" | "high";
export type Severity = "low" | "medium" | "high";

/** Rule buckets used for score de-duplication / category caps. */
export type FindingCategory = "domain" | "transport" | "content";

export interface SecurityFinding {
  id: string;
  severity: Severity;
  title: string;
  description: string;
  score: number;
  category: FindingCategory;
}

export interface URLDetails {
  fullUrl: string;
  domain: string;
  registrableDomain: string;
  tld: string;
  subdomainLabels: string[];
  subdomainCount: number;
  path: string;
  query: string;
  port: string;
  protocol: string;
  isHttps: boolean;
  isIP: boolean;
  isPunycode: boolean;
  isShortened: boolean;
  hasEmbeddedCredentials: boolean;
  urlLength: number;
}

export interface URLAnalysis {
  url: string;
  domain: string;
  protocol: string;
  score: number;
  level: RiskLevel;
  findings: SecurityFinding[];
  analyzedAt: string;
  details: URLDetails;
}

export interface RuleContext {
  url: URL;
  raw: string;
  details: URLDetails;
  /** hostname with leetspeak decoded (paypa1 → paypal), lowercase */
  decodedHost: string;
}

export interface SecurityRule {
  id: string;
  category: FindingCategory;
  evaluate(ctx: RuleContext): SecurityFinding | null;
}

/** Result of normalizing raw QR content / user input. */
export type NormalizeOutcome =
  | { kind: "url"; url: string }
  /** WIFI:, mailto:, tel:, upi:, plain text … */
  | { kind: "non-web"; content: string; scheme: string }
  /** javascript:, data:, vbscript: — must never be opened */
  | { kind: "dangerous"; content: string; scheme: string }
  | { kind: "invalid"; content: string };
