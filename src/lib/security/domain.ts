/**
 * QRShield — Domain utilities
 * Registrable-domain extraction (PSL-lite), IP detection, punycode detection,
 * leetspeak normalization and TLD inspection. All pure functions, no network.
 */

import type { URLDetails } from "./types";

/** Common two-part public suffixes (PSL-lite — covers the realistic cases). */
const TWO_PART_SUFFIXES = new Set([
  "co.uk", "org.uk", "ac.uk", "gov.uk", "co.in", "net.in", "org.in", "ac.in",
  "gov.in", "res.in", "firm.in", "co.jp", "or.jp", "ne.jp", "co.kr", "com.au",
  "net.au", "org.au", "co.nz", "co.za", "com.br", "com.mx", "com.ar", "com.tr",
  "com.cn", "com.tw", "com.hk", "com.sg", "co.id", "com.my", "com.ph", "com.vn",
  "co.il", "com.pl", "co.gr", "gov.au", "gov.cn", "gouv.fr", "co.de",
]);

/**
 * Extract the registrable domain (eTLD+1) using a PSL-lite heuristic.
 * e.g. "a.b.paypal.co.uk" → "paypal.co.uk", "paypa1-secure-login.xyz" → "paypa1-secure-login.xyz"
 */
export function getRegistrableDomain(hostname: string): string {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (isIPv4(host) || isIPv6Literal(host)) return host;
  const labels = host.split(".");
  if (labels.length <= 2) return host;
  const lastTwo = labels.slice(-2).join(".");
  if (TWO_PART_SUFFIXES.has(lastTwo) && labels.length >= 3) {
    return labels.slice(-3).join(".");
  }
  return lastTwo;
}

export function getPublicSuffix(hostname: string): string {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  const labels = host.split(".");
  if (labels.length < 2) return labels[0] ?? "";
  const lastTwo = labels.slice(-2).join(".");
  if (TWO_PART_SUFFIXES.has(lastTwo)) return lastTwo;
  return labels[labels.length - 1];
}

export function getSubdomainLabels(hostname: string): string[] {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  const registrable = getRegistrableDomain(host);
  if (host === registrable) return [];
  const suffixLen = getPublicSuffix(host).split(".").length;
  const base = host.split(".").slice(0, host.split(".").length - suffixLen - 1);
  return base;
}

const IPV4_RE = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
export function isIPv4(host: string): boolean {
  const m = IPV4_RE.exec(host);
  if (!m) return false;
  return m.slice(1).every((p) => {
    const n = Number(p);
    return Number.isInteger(n) && n >= 0 && n <= 255;
  });
}

export function isIPv6Literal(host: string): boolean {
  return host.startsWith("[") && host.endsWith("]") && host.includes(":");
}

export function isIPHost(host: string): boolean {
  const h = host.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
  return isIPv4(h) || h.includes(":");
}

/** Any punycode label (xn--) — the classic homograph vector. */
export function isPunycodeHost(hostname: string): boolean {
  return hostname.split(".").some((l) => l.toLowerCase().startsWith("xn--"));
}

/** Non-ASCII characters inside the host (mixed-script homograph attacks). */
export function hasNonASCIIHost(hostname: string): boolean {
  return /[^\u0000-\u007f]/.test(hostname);
}

const LEET_MAP: Record<string, string> = {
  "0": "o", "1": "l", "3": "e", "4": "a", "5": "s",
  "7": "t", "8": "b", "9": "g", "@": "a", "$": "s", "€": "e",
};

/**
 * Decode common leetspeak substitutions per label.
 * "paypa1-secure-login" → "paypal-secure-login"
 */
export function decodeLeet(input: string): string {
  return input
    .toLowerCase()
    .split("")
    .map((ch) => LEET_MAP[ch] ?? ch)
    .join("");
}

/** Split hostname into alphanumeric tokens for brand matching. */
export function hostTokens(decodedHost: string): string[] {
  return decodedHost
    .split(/[.\-_\s]/)
    .map((t) => t.replace(/[^a-z0-9]/g, ""))
    .filter((t) => t.length > 0);
}

export function countHyphens(hostname: string): number {
  return (hostname.match(/-/g) ?? []).length;
}

export function countEncodedSequences(raw: string): number {
  return (raw.match(/%[0-9a-fA-F]{2}/g) ?? []).length;
}

export function buildURLDetails(u: URL): URLDetails {
  const host = u.hostname.toLowerCase();
  const registrable = getRegistrableDomain(host);
  const subdomains = getSubdomainLabels(host);
  const shortened = URLDetails_isShortened(host, registrable);
  return {
    fullUrl: u.toString(),
    domain: host,
    registrableDomain: registrable,
    tld: getPublicSuffix(host),
    subdomainLabels: subdomains,
    subdomainCount: subdomains.length,
    path: u.pathname === "/" ? "" : u.pathname,
    query: u.search,
    port: u.port,
    protocol: u.protocol.replace(":", ""),
    isHttps: u.protocol === "https:",
    isIP: isIPHost(host),
    isPunycode: isPunycodeHost(host) || hasNonASCIIHost(host),
    isShortened: shortened,
    hasEmbeddedCredentials: u.username.length > 0,
    urlLength: u.toString().length,
  };
}

const SHORTENERS = new Set([
  "bit.ly", "tinyurl.com", "t.co", "cutt.ly", "is.gd", "goo.gl", "ow.ly",
  "buff.ly", "rebrand.ly", "shorturl.at", "rb.gy", "s.id", "tiny.cc",
  "shorte.st", "adf.ly", "lnkd.in", "db.tt", "qr.ae", "git.io", "v.gd",
  "tiny.ie", "snip.ly", "shrtco.de", "lo.to", "rb.lu", "t.ly", "trib.al",
  "urlz.fr", "x.gd", "zpr.io", "kutt.it", "url.geo",
]);

function URLDetails_isShortened(host: string, registrable: string): boolean {
  return SHORTENERS.has(host) || SHORTENERS.has(registrable);
}

export function isKnownShortener(host: string): boolean {
  const r = getRegistrableDomain(host);
  return SHORTENERS.has(host) || SHORTENERS.has(r);
}
