"use client";

import {
  Camera,
  Gauge,
  ListChecks,
  Lock,
  QrCode,
  ScanSearch,
  Scale,
  Signal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SECURITY_RULES, SECURITY_RULE_COUNT } from "@/lib/security/rules";
import { useQRShield } from "@/lib/store";

const STEPS = [
  {
    n: "01",
    title: "SCAN",
    icon: ScanSearch,
    text: "Decode the QR code with your camera or an image — without opening it. Decoding happens entirely on your device.",
  },
  {
    n: "02",
    title: "ANALYZE",
    icon: Gauge,
    text: `Evaluate the destination against ${SECURITY_RULE_COUNT} deterministic security signals — domain, protocol, structure and intent.`,
  },
  {
    n: "03",
    title: "DECIDE",
    icon: Scale,
    text: "Understand the risk in plain language, see the recommended action, then choose. Nothing opens automatically.",
  },
];

const CATEGORIES = [
  {
    id: "domain",
    title: "Domain signals",
    icon: QrCode,
    description: "Who owns the destination — and do they look like someone else?",
    rules: SECURITY_RULES.filter((r) => r.category === "domain").map((r) => r.id),
  },
  {
    id: "transport",
    title: "Protocol signals",
    icon: Lock,
    description: "How your data would travel to the destination.",
    rules: SECURITY_RULES.filter((r) => r.category === "transport").map((r) => r.id),
  },
  {
    id: "content",
    title: "Structure signals",
    icon: ListChecks,
    description: "What the URL itself is trying to get you to do.",
    rules: SECURITY_RULES.filter((r) => r.category === "content").map((r) => r.id),
  },
];

const RULE_LABELS: Record<string, string> = {
  "no-https": "No encryption (HTTP)",
  "embedded-credentials": "Credentials embedded in URL",
  "unusual-port": "Unusual network port",
  "ip-destination": "Raw IP address destination",
  punycode: "Punycode / look-alike encoding",
  "brand-impersonation": "Brand impersonation",
  "suspicious-tld": "Commonly abused TLD",
  "excessive-subdomains": "Deep subdomain chains",
  "multi-hyphen": "Hyphen-heavy domain",
  "credential-intent": "Sensitive-account intent",
  "url-shortener": "Shortened destination",
  "long-url": "Unusually long URL",
  "encoded-characters": "Heavy URL encoding",
  "excessive-params": "Parameter-heavy query string",
};

const BUCKETS = [
  { range: "0 – 25", label: "No major indicators", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" },
  { range: "26 – 59", label: "Proceed carefully", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30" },
  { range: "60 – 100", label: "Do not open", color: "text-red-400", bg: "bg-red-500/10 border-red-500/30" },
];

export function HowItWorks() {
  const go = useQRShield((s) => s.go);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">How it works</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          QRShield inserts a checkpoint between the QR code and the website: decode first, analyze
          second, visit last.
        </p>
      </header>

      {/* Three steps */}
      <ol className="mt-12 grid gap-4 md:grid-cols-3">
        {STEPS.map((s) => (
          <li
            key={s.n}
            className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/50 p-6"
          >
            <span
              aria-hidden="true"
              className="absolute -right-2 -top-4 select-none font-mono text-7xl font-extrabold text-primary/10"
            >
              {s.n}
            </span>
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/30">
              <s.icon className="h-5 w-5 text-primary" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-lg font-bold tracking-wide text-foreground">{s.title}</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{s.text}</p>
          </li>
        ))}
      </ol>

      {/* Engine pipeline */}
      <section aria-labelledby="engine-heading" className="mt-14">
        <h2 id="engine-heading" className="text-center text-xl font-bold text-foreground sm:text-2xl">
          Inside the security engine
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-muted-foreground">
          Deterministic rules — not vibes, not a black box. Every point in the score is attributable
          to a specific, explainable signal.
        </p>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {CATEGORIES.map((c) => (
            <div key={c.id} className="rounded-2xl border border-border/60 bg-card/50 p-5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/25">
                  <c.icon className="h-4 w-4 text-primary" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{c.title}</h3>
                  <p className="text-[11px] text-muted-foreground">{c.description}</p>
                </div>
              </div>
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {c.rules.map((id) => (
                  <li
                    key={id}
                    className="rounded-full border border-border/50 bg-background/50 px-2.5 py-1 text-[11px] text-muted-foreground"
                  >
                    {RULE_LABELS[id] ?? id}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Score buckets */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {BUCKETS.map((b) => (
            <div key={b.range} className={`rounded-2xl border p-5 text-center ${b.bg}`}>
              <p className={`font-mono text-2xl font-bold ${b.color}`}>{b.range}</p>
              <p className={`mt-1 text-xs font-semibold uppercase tracking-wider ${b.color}`}>
                {b.label}
              </p>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-6 flex max-w-2xl items-start gap-2 text-center text-xs leading-relaxed text-muted-foreground">
          <Signal className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
          Related signals are capped per category so a single weakness cannot be counted five times,
          and the score can never exceed 100. The wording is deliberately careful: indicators inform
          a decision, they don&apos;t issue verdicts about intent.
        </p>
      </section>

      {/* Camera note */}
      <section className="mt-12 flex flex-col items-center gap-4 rounded-2xl border border-border/60 bg-card/40 p-6 text-center sm:flex-row sm:text-left">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 ring-1 ring-amber-500/25">
          <Camera className="h-5 w-5 text-amber-400" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">Camera permission</h3>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
            The camera stream is used to detect QR patterns in the frame and is immediately discarded —
            no frames are stored or transmitted. If camera permission is unavailable (common on
            desktops), upload an image or paste the URL instead: every analyzer feature works without
            a camera.
          </p>
        </div>
        <Button onClick={() => go("scanner")} className="shrink-0 gap-2 sm:ml-4">
          <ScanSearch className="h-4 w-4" aria-hidden="true" />
          Open scanner
        </Button>
      </section>
    </div>
  );
}
