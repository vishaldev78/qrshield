/**
 * QRShield — Security rule set.
 *
 * Every rule is independent, explainable and returns a human-readable finding.
 * Wording deliberately avoids "this is malicious" claims — static signals are
 * indicators, not verdicts. Aggregation (scoring + caps) lives in scoring.ts.
 */

import { countEncodedSequences, countHyphens, hostTokens } from "./domain";
import { detectBrandImpersonation } from "./brands";
import type { RuleContext, SecurityFinding, SecurityRule } from "./types";

/* ------------------------------------------------------------------ */
/* Transport signals                                                   */
/* ------------------------------------------------------------------ */

/** HTTP instead of HTTPS — an encryption signal, not proof of malice. */
export const httpsRule: SecurityRule = {
  id: "no-https",
  category: "transport",
  evaluate(ctx: RuleContext): SecurityFinding | null {
    if (ctx.details.isHttps) return null;
    return {
      id: "no-https",
      severity: "medium",
      title: "No encryption (HTTP)",
      description:
        "The connection is not encrypted. Anything you enter could be visible to others on the network. Many legitimate sites still use HTTP, but sensitive pages almost never should.",
      score: 10,
      category: "transport",
    };
  },
};

/** Credentials embedded in the authority (http://user:pass@host). */
export const userInfoRule: SecurityRule = {
  id: "embedded-credentials",
  category: "transport",
  evaluate(ctx: RuleContext): SecurityFinding | null {
    if (!ctx.url.username) return null;
    return {
      id: "embedded-credentials",
      severity: "high",
      title: "Credentials embedded in the URL",
      description:
        "The address contains a username (and possibly password) before the domain. Browsers visually hide this part, which attackers use to disguise the real destination.",
      score: 20,
      category: "transport",
    };
  },
};

/** Non-standard port (anything except 80/443). */
export const unusualPortRule: SecurityRule = {
  id: "unusual-port",
  category: "transport",
  evaluate(ctx: RuleContext): SecurityFinding | null {
    const p = ctx.url.port;
    if (!p || p === "80" || p === "443") return null;
    return {
      id: "unusual-port",
      severity: "medium",
      title: "Unusual network port",
      description: `The destination uses port ${p} instead of the standard web ports (80/443). This is sometimes used to bypass security tooling.`,
      score: 10,
      category: "transport",
    };
  },
};

/* ------------------------------------------------------------------ */
/* Domain signals                                                      */
/* ------------------------------------------------------------------ */

/** Raw IP address instead of a domain name. */
export const ipRule: SecurityRule = {
  id: "ip-destination",
  category: "domain",
  evaluate(ctx: RuleContext): SecurityFinding | null {
    if (!ctx.details.isIP) return null;
    return {
      id: "ip-destination",
      severity: "high",
      title: "IP address destination",
      description:
        "The destination uses an IP address instead of a conventional domain name. There is no ownership information to verify, which is uncommon for legitimate public websites.",
      score: 25,
      category: "domain",
    };
  },
};

/** Punycode / non-ASCII host — homograph attack vector. */
export const punycodeRule: SecurityRule = {
  id: "punycode",
  category: "domain",
  evaluate(ctx: RuleContext): SecurityFinding | null {
    if (!ctx.details.isPunycode) return null;
    return {
      id: "punycode",
      severity: "high",
      title: "Look-alike domain encoding",
      description:
        "The domain uses internationalized (punycode / non-ASCII) encoding. This technique can make a domain visually imitate a well-known site, e.g. pаypal.com with a Cyrillic 'а'.",
      score: 35,
      category: "domain",
    };
  },
};

/** Brand token present but registrable domain is not official. */
export const brandImpersonationRule: SecurityRule = {
  id: "brand-impersonation",
  category: "domain",
  evaluate(ctx: RuleContext): SecurityFinding | null {
    if (ctx.details.isIP) return null;
    const tokens = hostTokens(ctx.decodedHost);
    const brand = detectBrandImpersonation(ctx.decodedHost, tokens, ctx.details.registrableDomain);
    if (!brand) return null;
    return {
      id: "brand-impersonation",
      severity: "high",
      title: `Possible ${brand.name} impersonation`,
      description: `The address references "${brand.name}" (${brand.token}), but the actual domain is ${ctx.details.registrableDomain}, which is not an official ${brand.name} domain. This is a classic phishing pattern.`,
      score: 35,
      category: "domain",
    };
  },
};

const SUSPICIOUS_TLDS = new Set([
  "xyz", "top", "click", "zip", "mov", "loan", "work", "rest", "country",
  "gq", "tk", "ml", "cf", "biz", "info", "live", "icu", "cam", "quest",
  "cfd", "monster", "sbs", "lol", "bar", "rest", "fit", "cyou", "buzz",
]);

/** TLDs statistically over-represented in abuse — one signal among many. */
export const suspiciousTldRule: SecurityRule = {
  id: "suspicious-tld",
  category: "domain",
  evaluate(ctx: RuleContext): SecurityFinding | null {
    const tld = ctx.details.tld;
    if (!tld || !SUSPICIOUS_TLDS.has(tld)) return null;
    return {
      id: "suspicious-tld",
      severity: "low",
      title: "Commonly abused domain ending",
      description: `The domain ends in .${tld}. This ending itself is not malicious, but it is statistically over-represented in phishing campaigns, so it adds context to the other signals.`,
      score: 10,
      category: "domain",
    };
  },
};

/** Very deep subdomain chains (a.b.c.d.example.com). */
export const excessiveSubdomainRule: SecurityRule = {
  id: "excessive-subdomains",
  category: "domain",
  evaluate(ctx: RuleContext): SecurityFinding | null {
    if (ctx.details.subdomainCount < 4) return null;
    return {
      id: "excessive-subdomains",
      severity: "low",
      title: "Deep subdomain chain",
      description: `The address has ${ctx.details.subdomainCount} subdomain levels. Long subdomain chains are often used to bury the real domain far to the left where users stop reading.`,
      score: 10,
      category: "domain",
    };
  },
};

/** Multiple hyphens in the registrable domain — common in phishing kits. */
export const hyphenRule: SecurityRule = {
  id: "multi-hyphen",
  category: "domain",
  evaluate(ctx: RuleContext): SecurityFinding | null {
    const sld = ctx.details.registrableDomain.split(".")[0] ?? "";
    if (countHyphens(sld) < 2) return null;
    return {
      id: "multi-hyphen",
      severity: "low",
      title: "Hyphen-heavy domain name",
      description:
        "The domain name contains multiple hyphens. Attackers use hyphenated word combinations (secure-login-verify…) because trusted names are taken; legitimate brands rarely do this.",
      score: 5,
      category: "domain",
    };
  },
};

/* ------------------------------------------------------------------ */
/* Content / URL-structure signals                                     */
/* ------------------------------------------------------------------ */

const CREDENTIAL_KEYWORDS = [
  "login", "signin", "sign-in", "logon", "verify", "verification", "password",
  "passwd", "wallet", "payment", "pay", "upi", "kyc", "bank", "otp", "account",
  "auth", "secure", "security", "update", "confirm", "billing", "invoice",
  "2fa", "recovery", "unlock", "suspend", "limited", "credential",
];

/** Sensitive-action intent in path or query params. */
export const credentialPathRule: SecurityRule = {
  id: "credential-intent",
  category: "content",
  evaluate(ctx: RuleContext): SecurityFinding | null {
    const haystack = `${ctx.details.path} ${ctx.details.query}`.toLowerCase();
    if (!haystack || haystack === " ") return null;
    const hits = CREDENTIAL_KEYWORDS.filter((k) => haystack.includes(k));
    if (hits.length === 0) return null;
    const shown = [...new Set(hits.map((h) => `/${h}`))].slice(0, 4).join(", ");
    return {
      id: "credential-intent",
      severity: "medium",
      title: "Sensitive-account intent",
      description: `The URL appears to request access to a sensitive account or payment-related action (found: ${shown}). Combined with other signals this often indicates credential harvesting.`,
      score: 15,
      category: "content",
    };
  },
};

/** Destination hidden behind a URL shortener. */
export const shortenerRule: SecurityRule = {
  id: "url-shortener",
  category: "content",
  evaluate(ctx: RuleContext): SecurityFinding | null {
    if (!ctx.details.isShortened) return null;
    return {
      id: "url-shortener",
      severity: "medium",
      title: "Shortened destination",
      description:
        "The true destination is hidden behind a URL-shortening service. Shortened links are not automatically dangerous, but you cannot see where they lead until you open them.",
      score: 15,
      category: "content",
    };
  },
};

/** Very long URL (>100 chars). */
export const longUrlRule: SecurityRule = {
  id: "long-url",
  category: "content",
  evaluate(ctx: RuleContext): SecurityFinding | null {
    if (ctx.details.urlLength <= 100) return null;
    return {
      id: "long-url",
      severity: "low",
      title: "Unusually long URL",
      description: `The address is ${ctx.details.urlLength} characters long. Very long URLs are often used to hide the real destination among padding text.`,
      score: 5,
      category: "content",
    };
  },
};

/** Heavy percent-encoding. */
export const encodedCharsRule: SecurityRule = {
  id: "encoded-characters",
  category: "content",
  evaluate(ctx: RuleContext): SecurityFinding | null {
    const n = countEncodedSequences(ctx.raw);
    if (n < 3) return null;
    return {
      id: "encoded-characters",
      severity: "low",
      title: "Heavy URL encoding",
      description: `The address contains ${n} encoded character sequences. Encoding can hide redirects or obfuscate the real destination from casual inspection.`,
      score: 5,
      category: "content",
    };
  },
};

/** Too many query parameters. */
export const excessiveQueryRule: SecurityRule = {
  id: "excessive-params",
  category: "content",
  evaluate(ctx: RuleContext): SecurityFinding | null {
    const n = [...ctx.url.searchParams.keys()].length;
    if (n < 8) return null;
    return {
      id: "excessive-params",
      severity: "low",
      title: "Parameter-heavy query string",
      description: `The URL carries ${n} query parameters. Excessive parameters are sometimes used for tracking — or to slip filters past security tools.`,
      score: 5,
      category: "content",
    };
  },
};

/* ------------------------------------------------------------------ */

export const SECURITY_RULES: SecurityRule[] = [
  httpsRule,
  userInfoRule,
  unusualPortRule,
  ipRule,
  punycodeRule,
  brandImpersonationRule,
  suspiciousTldRule,
  excessiveSubdomainRule,
  hyphenRule,
  credentialPathRule,
  shortenerRule,
  longUrlRule,
  encodedCharsRule,
  excessiveQueryRule,
];

export const SECURITY_RULE_COUNT = SECURITY_RULES.length;
