"use client";

import {
  Camera,
  CheckCircle2,
  Database,
  EyeOff,
  FileImage,
  Lock,
  Server,
  Sparkles,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQRShield } from "@/lib/store";

const NEVER_LEAVES = [
  { icon: FileImage, text: "Your QR image — decoded and discarded in the browser tab" },
  { icon: Camera, text: "Camera frames — analyzed in memory, never stored or transmitted" },
  { icon: Database, text: "Scan history — kept in your browser's local storage only" },
  { icon: EyeOff, text: "Browsing behavior — no analytics, no cookies, no tracking pixels" },
];

const OPTIONAL_SHARE = [
  { icon: Sparkles, text: "URL + findings summary — only when you explicitly click \"Explain with AI\"" },
];

const NEVER_SENT = [
  "The QR image or any camera frame",
  "Your history or past scans",
  "Any account identity — there are no accounts",
  "Anything at all, unless you opt into the AI explanation",
];

export function PrivacyView() {
  const go = useQRShield((s) => s.go);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/30">
          <Lock className="h-7 w-7 text-emerald-400" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Privacy by architecture
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Privacy is not a policy page here — it is where the code runs. The entire security engine
          lives in your browser, which is why we can make promises a server-side scanner cannot.
        </p>
      </header>

      {/* Local pipeline */}
      <section aria-labelledby="local-heading" className="mt-12">
        <h2 id="local-heading" className="text-lg font-bold text-foreground">
          The default pipeline never touches a server
        </h2>
        <div className="mt-5 overflow-x-auto rounded-2xl border border-border/60 bg-card/50 p-5">
          <div className="flex min-w-max items-center gap-2 font-mono text-xs sm:gap-3 sm:text-[13px]">
            {["QR image / camera", "Browser decoder", "URL extraction", "Security engine", "Result"].map(
              (step, i, arr) => (
                <div key={step} className="flex items-center gap-2 sm:gap-3">
                  <span
                    className={`rounded-lg border px-3 py-2 ${
                      i === arr.length - 1
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                        : "border-border/50 bg-background/60 text-foreground"
                    }`}
                  >
                    {step}
                  </span>
                  {i < arr.length - 1 && <span className="text-muted-foreground">→</span>}
                </div>
              )
            )}
          </div>
        </div>
        <p className="mt-3 flex items-center gap-2 text-[13px] text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
          Every arrow above happens inside your tab. There is no &ldquo;upload step&rdquo; to trust.
        </p>
      </section>

      {/* What never leaves */}
      <section aria-labelledby="never-heading" className="mt-10 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.05] p-6">
          <h2 id="never-heading" className="text-sm font-bold uppercase tracking-wider text-emerald-400">
            Never leaves your device
          </h2>
          <ul className="mt-4 space-y-3">
            {NEVER_LEAVES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-foreground/90">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
                {text}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/50 p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400">
            The only exception (opt-in)
          </h2>
          <ul className="mt-4 space-y-3">
            {OPTIONAL_SHARE.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-foreground/90">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
                {text}
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded-xl border border-border/50 bg-background/50 p-3 text-[12px] leading-relaxed text-muted-foreground">
            The AI layer is <span className="text-foreground">off by default</span> and never
            influences the risk score. The deterministic engine decides; AI only restates the
            findings in plain language.
          </p>
        </div>
      </section>

      {/* Never sent list */}
      <section aria-labelledby="sent-heading" className="mt-10 rounded-2xl border border-border/60 bg-card/50 p-6">
        <h2 id="sent-heading" className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          <Server className="h-4 w-4" aria-hidden="true" />
          If a server is involved (AI only), it still never receives…
        </h2>
        <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
          {NEVER_SENT.map((item) => (
            <li key={item} className="flex items-start gap-2 text-[13px] text-muted-foreground">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400/80" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* Threat model */}
      <section className="mt-10 rounded-2xl border border-border/60 bg-card/50 p-6">
        <h2 className="text-lg font-bold text-foreground">What QRShield is — and isn&apos;t</h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">It is</h3>
            <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-muted-foreground">
              <li>A pre-click checkpoint between a QR and its destination</li>
              <li>An explainable static analyzer with human-readable findings</li>
              <li>A reminder engine: pause, verify, then decide</li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-red-400">It is not</h3>
            <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-muted-foreground">
              <li>A guarantee that any site is safe — static analysis cannot promise that</li>
              <li>A malware sandbox, exploit tool or penetration tester</li>
              <li>A replacement for security vendors or your own judgment</li>
            </ul>
          </div>
        </div>
      </section>

      <div className="mt-10 text-center">
        <Button size="lg" onClick={() => go("scanner")} className="h-12 px-8">
          Scan a QR Code
        </Button>
      </div>
    </div>
  );
}
