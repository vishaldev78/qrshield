"use client";

import { motion, useReducedMotion } from "framer-motion";
import { LEVEL_META } from "@/lib/security/scoring";
import type { RiskLevel } from "@/lib/security/types";

interface RiskScoreProps {
  score: number;
  level: RiskLevel;
  size?: number;
}

const RADIUS = 56;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Circular risk gauge — only the status indicator communicates severity strongly. */
export function RiskScore({ score, level, size = 168 }: RiskScoreProps) {
  const meta = LEVEL_META[level];
  const reduceMotion = useReducedMotion();
  const clamped = Math.max(0, Math.min(100, score));
  const offset = CIRCUMFERENCE * (1 - clamped / 100);

  const srText =
    level === "high"
      ? `High risk. Risk score ${clamped} out of 100. ${meta.summary}`
      : level === "suspicious"
        ? `Suspicious. Risk score ${clamped} out of 100. ${meta.summary}`
        : `Low risk signals. Risk score ${clamped} out of 100. ${meta.summary}`;

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative"
        style={{ width: size, height: size }}
        role="img"
        aria-label={srText}
      >
        <svg
          viewBox="0 0 140 140"
          width={size}
          height={size}
          className="-rotate-90"
          aria-hidden="true"
        >
          <circle
            cx="70"
            cy="70"
            r={RADIUS}
            fill="none"
            stroke="rgba(148,163,184,0.15)"
            strokeWidth="10"
          />
          <motion.circle
            cx="70"
            cy="70"
            r={RADIUS}
            fill="none"
            stroke={meta.color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            initial={{ strokeDashoffset: CIRCUMFERENCE }}
            animate={{ strokeDashoffset: reduceMotion ? CIRCUMFERENCE : offset }}
            transition={{ duration: reduceMotion ? 0 : 0.9, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 8px ${meta.color}55)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <span
            className="font-mono text-4xl font-bold leading-none tracking-tight"
            style={{ color: meta.color }}
          >
            {clamped}
          </span>
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            / 100
          </span>
        </div>
      </div>

      <div className="text-center">
        <p
          className="flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-widest"
          style={{ color: meta.color }}
        >
          {level === "high" && (
            <span aria-hidden="true" className="text-base">
              🚨
            </span>
          )}
          {level === "suspicious" && (
            <span aria-hidden="true" className="text-base">
              ⚠️
            </span>
          )}
          {level === "low" && (
            <span aria-hidden="true" className="text-base">
              ✓
            </span>
          )}
          {meta.label}
        </p>
      </div>

      <div
        className="flex w-full max-w-[240px] items-center justify-between text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
        aria-hidden="true"
      >
        <span className={level === "low" ? "font-bold text-emerald-400" : ""}>0–25</span>
        <span className={level === "suspicious" ? "font-bold text-amber-400" : ""}>26–59</span>
        <span className={level === "high" ? "font-bold text-red-400" : ""}>60–100</span>
      </div>

      <span className="sr-only">{srText}</span>
    </div>
  );
}
