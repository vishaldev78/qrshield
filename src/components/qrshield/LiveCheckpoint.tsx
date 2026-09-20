"use client";

/**
 * QRShield — LiveCheckpoint: the hero's looping demo widget.
 *
 * Continuously "scans" a synthetic QR payload, extracts the destination and
 * cycles the analyzing-signal list with animation across four scripted
 * scenarios (phishing → shortener → raw IP → safe control). Scores mirror the
 * real engine's output for these URLs, so the demo stays honest.
 */

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ScanLine,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  Sparkles,
} from "lucide-react";
import { SECURITY_RULE_COUNT } from "@/lib/security/rules";

type Tone = "bad" | "warn" | "ok" | "info";

interface DemoSignal {
  label: string;
  tone: Tone;
}

interface DemoScenario {
  url: string;
  highlight: string;
  verdict: { score: number; label: string; tone: "bad" | "warn" | "ok" };
  signals: DemoSignal[];
}

const SCENARIOS: DemoScenario[] = [
  {
    url: "http://paypa1-secure-login.xyz/verify",
    highlight: ".xyz",
    verdict: { score: 80, label: "High risk — do not open", tone: "bad" },
    signals: [
      { label: "Brand impersonation", tone: "bad" },
      { label: "Suspicious TLD", tone: "warn" },
      { label: "No HTTPS", tone: "warn" },
      { label: "Credential intent", tone: "bad" },
    ],
  },
  {
    url: "https://bit.ly/3qrShieldDemo",
    highlight: "bit.ly",
    verdict: { score: 30, label: "Suspicious — verify first", tone: "warn" },
    signals: [
      { label: "Hidden redirector", tone: "warn" },
      { label: "Destination masked", tone: "warn" },
      { label: "Reputation unknown", tone: "info" },
    ],
  },
  {
    url: "http://192.168.18.22/reset-password",
    highlight: "192.168.18.22",
    verdict: { score: 50, label: "Suspicious — proceed carefully", tone: "warn" },
    signals: [
      { label: "Raw IP host", tone: "bad" },
      { label: "No TLS — plaintext", tone: "warn" },
      { label: "Credential intent", tone: "bad" },
    ],
  },
  {
    url: "https://www.example.com/help",
    highlight: "example.com",
    verdict: { score: 0, label: "No major indicators", tone: "ok" },
    signals: [
      { label: "TLS present", tone: "ok" },
      { label: "Clean domain", tone: "ok" },
      { label: "No lure paths", tone: "ok" },
    ],
  },
];

const DOT: Record<Tone, string> = {
  bad: "bg-red-400",
  warn: "bg-amber-400",
  ok: "bg-emerald-400",
  info: "bg-sky-400",
};

const VERDICT_PANEL: Record<"bad" | "warn" | "ok", { border: string; bg: string; text: string; Icon: typeof ShieldCheck }> = {
  bad: {
    border: "border-red-500/40",
    bg: "bg-red-500/[0.08]",
    text: "text-red-400",
    Icon: ShieldAlert,
  },
  warn: {
    border: "border-amber-500/40",
    bg: "bg-amber-500/[0.08]",
    text: "text-amber-400",
    Icon: ShieldQuestion,
  },
  ok: {
    border: "border-emerald-500/40",
    bg: "bg-emerald-500/[0.08]",
    text: "text-emerald-400",
    Icon: ShieldCheck,
  },
};

/** Timeline (seconds, per scenario). Reduced motion collapses all to 0. */
const T_DETECT = 1.5;
const T_URL = 2.0;
const T_ANALYZE = 2.7;
const T_FIRST_SIGNAL = 3.1;
const SIGNAL_STAGGER = 0.3;
const SCENARIO_MS = 7000;

/** Deterministic 7×7 pseudo-QR pattern (no hydration mismatch). */
const QR_CELLS = (() => {
  const size = 7;
  const cells: boolean[] = new Array(size * size).fill(false);
  let x = 1337;
  for (let i = 0; i < cells.length; i++) {
    x = (x * 1103515245 + 12345) % 2147483648;
    cells[i] = x % 100 < 46;
  }
  // Solid 3×3 finder blocks in three corners, like a real QR.
  const corners: Array<[number, number]> = [
    [0, 0],
    [0, size - 3],
    [size - 3, 0],
  ];
  for (const [r, c] of corners) {
    for (let dr = 0; dr < 3; dr++) {
      for (let dc = 0; dc < 3; dc++) {
        cells[(r + dr) * size + (c + dc)] = true;
      }
    }
  }
  // Clear the opposite corner for balance.
  for (let dr = 0; dr < 3; dr++) {
    for (let dc = 0; dc < 3; dc++) {
      cells[(size - 3 + dr) * size + (size - 3 + dc)] = false;
    }
  }
  return cells;
})();

export function LiveCheckpoint() {
  const reduce = useReducedMotion();
  const [scenario, setScenario] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(
      () => setScenario((s) => (s + 1) % SCENARIOS.length),
      SCENARIO_MS
    );
    return () => clearInterval(id);
  }, [reduce]);

  const s = SCENARIOS[scenario];
  const t = (seconds: number) => (reduce ? 0 : seconds);
  const urlChars = s.url.split("");
  const hiStart = s.url.indexOf(s.highlight);
  const hiEnd = hiStart + s.highlight.length;
  const verdict = VERDICT_PANEL[s.verdict.tone];
  const tVerdict = t(T_FIRST_SIGNAL + (s.signals.length - 1) * SIGNAL_STAGGER + 0.35);

  return (
    <div className="rounded-3xl border border-border/70 bg-card/70 p-5 shadow-2xl shadow-primary/5 backdrop-blur">
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
        </div>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          live checkpoint
        </span>
      </div>

      {/* Step 1 — QR scanning + detection */}
      <div
        key={`scan-${scenario}`}
        className="mt-4 rounded-2xl border border-border/50 bg-background/60 p-4"
      >
        <div className="flex items-center gap-4">
          <div className="relative grid h-24 w-24 shrink-0 grid-cols-7 grid-rows-7 gap-[3px] overflow-hidden rounded-lg border border-border/50 bg-background p-2">
            {QR_CELLS.map((on, i) => (
              <span
                key={i}
                className={`rounded-[2px] ${on ? "animate-pulse bg-foreground/90" : "bg-foreground/10"}`}
                style={on ? { animationDelay: `${(i * 137) % 1900}ms` } : undefined}
              />
            ))}
            {!reduce && (
              <motion.span
                className="absolute inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-primary/90 to-transparent"
                animate={{ top: ["4%", "88%", "4%"] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
          </div>

          <div className="relative min-h-[64px] flex-1">
            {/* Scanning state */}
            <motion.p
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ delay: t(T_DETECT), duration: 0.2 }}
              className="absolute inset-0 flex items-start gap-1.5 text-xs font-semibold text-amber-400"
            >
              <ScanLine className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-pulse" aria-hidden="true" />
              Scanning QR payload…
            </motion.p>

            {/* Detected state */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: t(T_DETECT), duration: 0.25 }}
              className="absolute inset-0"
            >
              <motion.p
                className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400"
                initial={reduce ? false : { scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ delay: t(T_DETECT), duration: 0.25 }}
              >
                <ScanLine className="h-3.5 w-3.5" aria-hidden="true" />
                QR detected
              </motion.p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                Decoded locally.
                <br />
                Destination extracted — not opened.
              </p>
            </motion.div>
          </div>
        </div>

        {/* URL — types out per character, risky part highlighted */}
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: t(T_URL), duration: 0.25 }}
          className="mt-3 min-h-[34px] break-all rounded-lg border border-border/40 bg-background px-3 py-2 font-mono text-[11px]"
        >
          {urlChars.map((ch, i) => (
            <motion.span
              key={`${scenario}-${i}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: t(T_URL + 0.15 + i * 0.02), duration: 0.05 }}
              className={
                i >= hiStart && i < hiEnd
                  ? "font-semibold text-foreground"
                  : "text-slate-400"
              }
            >
              {ch}
            </motion.span>
          ))}
        </motion.div>
      </div>

      <div className="flex justify-center py-1.5" aria-hidden="true">
        <motion.span
          animate={reduce ? {} : { y: [0, 3, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <ArrowRight className="h-4 w-4 rotate-90 text-muted-foreground/60" />
        </motion.span>
      </div>

      {/* Step 2 — signal analysis, cycling */}
      <div
        key={`analyze-${scenario}`}
        className="rounded-2xl border border-border/50 bg-background/60 p-4"
      >
        <p className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 animate-pulse text-primary" aria-hidden="true" />
          Analyzing {SECURITY_RULE_COUNT} signals…
        </p>
        <ul className="mt-3 min-h-[96px] space-y-2">
          {s.signals.map((signal, i) => (
            <motion.li
              key={signal.label}
              className="flex items-center gap-2 text-[11px] text-foreground/90"
              initial={reduce ? false : { opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: t(T_FIRST_SIGNAL + i * SIGNAL_STAGGER),
                duration: 0.28,
                ease: "easeOut",
              }}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${DOT[signal.tone]}`} aria-hidden="true" />
              {signal.label}
            </motion.li>
          ))}
        </ul>
      </div>

      <div className="flex justify-center py-1.5" aria-hidden="true">
        <ArrowRight className="h-4 w-4 rotate-90 text-muted-foreground/60" />
      </div>

      {/* Step 3 — verdict */}
      <div
        key={`verdict-${scenario}`}
        className={`rounded-2xl border p-4 text-center ${verdict.border} ${verdict.bg}`}
      >
        <motion.p
          className={`flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-widest ${verdict.text}`}
          initial={reduce ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: tVerdict, duration: 0.3 }}
        >
          <verdict.Icon className="h-3.5 w-3.5" aria-hidden="true" />
          {s.verdict.label}
        </motion.p>
        <motion.p
          className={`mt-1 font-mono text-3xl font-bold ${verdict.text}`}
          initial={reduce ? false : { opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: tVerdict + 0.15, duration: 0.35, ease: "easeOut" }}
        >
          {s.verdict.score}/100
        </motion.p>
        <motion.p
          className="mt-1 text-[11px] text-muted-foreground"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: tVerdict + 0.35, duration: 0.3 }}
        >
          {s.verdict.tone === "bad"
            ? "Do not open this link"
            : s.verdict.tone === "warn"
              ? "Check before you trust it"
              : "Stay alert after you open it"}
        </motion.p>
      </div>
    </div>
  );
}
