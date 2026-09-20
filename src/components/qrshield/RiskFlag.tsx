"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Info, ShieldAlert } from "lucide-react";
import type { SecurityFinding, Severity } from "@/lib/security/types";

const SEVERITY_STYLE: Record<
  Severity,
  { icon: typeof ShieldAlert; color: string; bg: string; ring: string; label: string }
> = {
  high: {
    icon: ShieldAlert,
    color: "text-red-400",
    bg: "bg-red-500/10",
    ring: "ring-red-500/25",
    label: "Strong indicator",
  },
  medium: {
    icon: AlertTriangle,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    ring: "ring-amber-500/25",
    label: "Notable indicator",
  },
  low: {
    icon: Info,
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    ring: "ring-sky-500/20",
    label: "Contextual indicator",
  },
};

export function RiskFlag({ finding, index }: { finding: SecurityFinding; index: number }) {
  const style = SEVERITY_STYLE[finding.severity];
  const Icon = style.icon;

  return (
    <motion.li
      initial={false}
      className="flex gap-3 rounded-xl border border-border/60 bg-card/60 p-4 transition-colors hover:border-border"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <span
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ${style.bg} ${style.ring}`}
        aria-hidden="true"
      >
        <Icon className={`h-4 w-4 ${style.color}`} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h4 className="text-sm font-semibold text-foreground">{finding.title}</h4>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${style.bg} ${style.color} ${style.ring}`}
          >
            {style.label}
          </span>
          <span className="ml-auto font-mono text-xs font-medium text-muted-foreground">
            +{finding.score}
          </span>
        </div>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
          {finding.description}
        </p>
      </div>
    </motion.li>
  );
}
