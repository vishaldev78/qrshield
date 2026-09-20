"use client";

/**
 * QRShield — ScanTrace: a terminal-style execution trace of the deterministic
 * analysis pipeline. Every line corresponds to a real step the engine ran,
 * so the "cyber" aesthetic is also the product's explainability story.
 */

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { LEVEL_META } from "@/lib/security/scoring";
import type { RiskLevel, URLDetails } from "@/lib/security/types";

interface ScanTraceProps {
  url: string;
  details: URLDetails;
  score: number;
  level: RiskLevel;
  triggeredIds: string[];
  ruleCount: number;
  analyzedAt: string;
}

interface TraceLine {
  prefix: string;
  text: string;
  status: "info" | "ok" | "warn" | "bad" | "cmd";
}

const STATUS_STYLE: Record<TraceLine["status"], string> = {
  cmd: "text-primary",
  info: "text-slate-400",
  ok: "text-emerald-400",
  warn: "text-amber-400",
  bad: "text-red-400",
};

function shortUrl(url: string, max = 42): string {
  return url.length > max ? `${url.slice(0, max - 1)}…` : url;
}

function buildLines(p: ScanTraceProps): TraceLine[] {
  const { details, score, level, triggeredIds, ruleCount, analyzedAt } = p;
  const time = new Date(analyzedAt).toISOString().replace("T", " ").slice(2, 19);
  const lines: TraceLine[] = [
    { prefix: "$", text: `qrshield analyze --url ${shortUrl(details.fullUrl)}`, status: "cmd" },
    { prefix: ">", text: `trace id ${analyzedAt.replace(/\D/g, "").slice(-8)} · local sandbox`, status: "info" },
    { prefix: ">", text: `payload decoded …………………… OK (in-browser)`, status: "ok" },
    { prefix: ">", text: `destination extracted …………… ${details.domain}`, status: "info" },
    {
      prefix: ">",
      text: `transport layer …………………… ${details.isHttps ? "TLS present" : "NO TLS — plaintext"}`,
      status: details.isHttps ? "ok" : "warn",
    },
    {
      prefix: ">",
      text: `domain intelligence …………… ${details.isIP ? "raw IP host" : details.isPunycode ? "punycode label found" : details.isShortened ? "redirector in chain" : "resolved locally"}`,
      status: details.isIP || details.isPunycode || details.isShortened ? "warn" : "info",
    },
    {
      prefix: ">",
      text: `rule engine ……………………… ${ruleCount} rules, ${triggeredIds.length} triggered`,
      status: triggeredIds.length > 0 ? "warn" : "ok",
    },
    {
      prefix: ">",
      text: `verdict ………………………………… ${score}/100 [${LEVEL_META[level].label.toUpperCase()}]`,
      status: level === "high" ? "bad" : level === "suspicious" ? "warn" : "ok",
    },
  ];
  if (triggeredIds.length > 0) {
    lines.push({
      prefix: "!",
      text: `signals: ${triggeredIds.join(" · ")}`,
      status: level === "high" ? "bad" : "warn",
    });
  }
  lines.push({ prefix: ">", text: `report generated ${time} — nothing left this device`, status: "ok" });
  return lines;
}

export function ScanTrace(props: ScanTraceProps) {
  const reduceMotion = useReducedMotion();
  const lines = buildLines(props);
  // Lazy init: reduced-motion users see the full trace instantly.
  // ResultView remounts this component (via key) for every new analysis,
  // so no synchronous setState-in-effect reset is needed.
  const [visible, setVisible] = useState(() => (reduceMotion ? lines.length : 0));

  useEffect(() => {
    if (reduceMotion) return;
    const timer = setInterval(() => {
      setVisible((v) => {
        if (v >= lines.length) {
          clearInterval(timer);
          return v;
        }
        return v + 1;
      });
    }, 130);
    return () => clearInterval(timer);
  }, [props.analyzedAt, props.url, reduceMotion]);

  const done = visible >= lines.length;

  return (
    <section
      aria-label="Analysis execution trace"
      className="overflow-hidden rounded-xl border border-primary/20 bg-[#070B18]"
    >
      {/* Terminal chrome */}
      <div className="flex items-center gap-2 border-b border-primary/15 bg-primary/[0.06] px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
        </span>
        <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          qrshield · execution trace
        </p>
        <span
          className="ml-auto rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-emerald-400"
        >
          on-device
        </span>
      </div>

      {/* Trace body */}
      <div
        className="scanlines-overlay relative px-4 py-3.5 font-mono text-[11px] leading-[1.9] sm:text-xs"
        aria-hidden={false}
      >
        {lines.slice(0, visible).map((line, i) => (
          <motion.p
            key={`${props.analyzedAt}-${i}`}
            initial={reduceMotion ? false : { opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.18 }}
            className={`flex gap-2 whitespace-pre-wrap break-all ${STATUS_STYLE[line.status]}`}
          >
            <span className="shrink-0 select-none opacity-70">{line.prefix}</span>
            <span>{line.text}</span>
          </motion.p>
        ))}
        <p className={`flex gap-2 ${done ? "text-slate-500" : "text-primary"}`}>
          <span className="shrink-0 select-none opacity-70">
            {done ? "$" : ">"}
          </span>
          <span className="inline-block h-[1.1em] w-[0.55em] animate-pulse bg-current" aria-hidden="true" />
          <span className="sr-only">{done ? "Trace complete" : "Analyzing"}</span>
        </p>
      </div>
    </section>
  );
}
