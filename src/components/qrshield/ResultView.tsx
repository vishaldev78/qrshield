"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  Copy,
  FileQuestion,
  RotateCcw,
  TerminalSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RiskScore } from "./RiskScore";
import { RiskFlag } from "./RiskFlag";
import { URLDetails } from "./URLDetails";
import { SafeActionCard } from "./SafeActionCard";
import { AIExplain } from "./AIExplain";
import { ScanTrace } from "./ScanTrace";
import { LEVEL_META } from "@/lib/security/scoring";
import { SECURITY_RULE_COUNT } from "@/lib/security/rules";
import type { URLAnalysis } from "@/lib/security/types";
import type { ContentResult } from "@/lib/store";
import { useQRShield } from "@/lib/store";

function severityRank(s: "low" | "medium" | "high"): number {
  return s === "high" ? 3 : s === "medium" ? 2 : 1;
}

async function copyText(text: string, onSuccess: () => void) {
  try {
    await navigator.clipboard.writeText(text);
    onSuccess();
  } catch {
    toast.error("Copy blocked by your browser");
  }
}

export function ResultView() {
  const analysis = useQRShield((s) => s.analysis);
  const contentResult = useQRShield((s) => s.contentResult);
  const go = useQRShield((s) => s.go);
  const clearResult = useQRShield((s) => s.clearResult);

  const back = () => {
    clearResult();
    go("scanner");
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <Button
        variant="ghost"
        onClick={back}
        className="mb-6 gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Scan another
      </Button>

      {analysis ? (
        <URLResult analysis={analysis} />
      ) : contentResult ? (
        <ContentResultCard result={contentResult} onBack={back} />
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border/60 bg-card/60 p-12 text-center">
          <FileQuestion className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">No analysis yet. Scan a QR or paste a URL.</p>
          <Button onClick={back}>Go to scanner</Button>
        </div>
      )}
    </div>
  );
}

function URLResult({ analysis }: { analysis: URLAnalysis }) {
  const meta = LEVEL_META[analysis.level];
  const sorted = [...analysis.findings].sort(
    (a, b) => severityRank(b.severity) - severityRank(a.severity)
  );
  const reportTime = new Date(analysis.analyzedAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {/* Console-style report header */}
      <div
        aria-hidden="true"
        className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-primary/20 bg-primary/[0.05] px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-slate-400 sm:text-[11px]"
      >
        <span className="text-primary">▍analysis report</span>
        <span className="hidden text-slate-600 sm:inline">{"//"}</span>
        <span>{reportTime}</span>
        <span className="hidden text-slate-600 sm:inline">{"//"}</span>
        <span className="hidden sm:inline">engine qs-dre 1.0 · {SECURITY_RULE_COUNT} rules</span>
        <span className="ml-auto flex items-center gap-1.5 text-emerald-400">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          local execution
        </span>
      </div>

      {/* Desktop: two-column result. Mobile: stacked. */}
      <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        {/* Left column — verdict + action */}
        <div className="flex flex-col gap-6">
          <section
            aria-label="Security verdict"
            className="relative overflow-hidden rounded-2xl border p-6 text-center sm:p-8"
            style={{ borderColor: `${meta.color}45`, backgroundColor: meta.softBg }}
          >
            {/* Corner brackets — console frame */}
            <span aria-hidden="true" className="pointer-events-none absolute left-2 top-2 h-5 w-5 border-l-2 border-t-2" style={{ borderColor: `${meta.color}80` }} />
            <span aria-hidden="true" className="pointer-events-none absolute right-2 top-2 h-5 w-5 border-r-2 border-t-2" style={{ borderColor: `${meta.color}80` }} />
            <span aria-hidden="true" className="pointer-events-none absolute bottom-2 left-2 h-5 w-5 border-b-2 border-l-2" style={{ borderColor: `${meta.color}80` }} />
            <span aria-hidden="true" className="pointer-events-none absolute bottom-2 right-2 h-5 w-5 border-b-2 border-r-2" style={{ borderColor: `${meta.color}80` }} />

            <RiskScore score={analysis.score} level={analysis.level} />
            <p className="mt-5 text-sm font-semibold text-foreground">{meta.headline}</p>
            <p aria-live="polite" className="sr-only">
              {`Security analysis complete. Risk level: ${meta.label}. Score ${analysis.score} out of 100.`}
            </p>
          </section>

          <SafeActionCard level={analysis.level} url={analysis.url} />
        </div>

        {/* Right column — destination + trace + findings + details */}
        <div className="flex min-w-0 flex-col gap-6">
          <DestinationCard url={analysis.url} displayDomain={analysis.details.registrableDomain} />

          <ScanTrace
            key={analysis.analyzedAt}
            url={analysis.url}
            details={analysis.details}
            score={analysis.score}
            level={analysis.level}
            triggeredIds={analysis.findings.map((f) => f.id)}
            ruleCount={SECURITY_RULE_COUNT}
            analyzedAt={analysis.analyzedAt}
          />

          <section aria-labelledby="findings-heading">
            <h3
              id="findings-heading"
              className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground"
            >
              {analysis.findings.length > 0
                ? `Why this was flagged — ${analysis.findings.length} indicator${analysis.findings.length > 1 ? "s" : ""}`
                : "Why this looks fine"}
            </h3>
            {analysis.findings.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {sorted.map((f, i) => (
                  <RiskFlag key={f.id} finding={f} index={i} />
                ))}
              </ul>
            ) : (
              <div className="flex items-start gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    No major risk indicators detected
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                    The domain structure, protocol and content of this destination did not match any
                    of the {SECURITY_RULE_COUNT} risk rules we check. That is a good signal — but
                    static analysis can never visit or verify the site itself, so stay attentive
                    after you open it.
                  </p>
                </div>
              </div>
            )}
          </section>

          <URLDetails analysis={analysis} />
          <AIExplain analysis={analysis} />
        </div>
      </div>
    </motion.div>
  );
}

function DestinationCard({ url, displayDomain }: { url: string; displayDomain: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <section
      aria-labelledby="destination-heading"
      className="rounded-2xl border border-border/60 bg-card/60 p-5 sm:p-6"
    >
      <h3
        id="destination-heading"
        className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground"
      >
        <TerminalSquare className="h-4 w-4 text-primary" aria-hidden="true" />
        Destination found
      </h3>
      <p className="break-all rounded-xl border border-border/50 bg-background/60 px-4 py-3 font-mono text-[13px] leading-relaxed text-foreground sm:text-sm">
        {url}
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Registrable domain:{" "}
          <span className="font-mono text-foreground">{displayDomain}</span>
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            copyText(url, () => {
              setCopied(true);
              toast.success("URL copied to clipboard");
              setTimeout(() => setCopied(false), 2000);
            })
          }
          className="gap-1.5"
        >
          {copied ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
          ) : (
            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          Copy URL
        </Button>
      </div>
    </section>
  );
}

function ContentResultCard({ result, onBack }: { result: ContentResult; onBack: () => void }) {
  const isDangerous = result.kind === "dangerous";
  const isNonWeb = result.kind === "non-web";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <section
        aria-label="QR content result"
        className={`mx-auto flex max-w-2xl flex-col items-center gap-4 rounded-2xl border p-8 text-center sm:p-10 ${
          isDangerous ? "border-red-500/40 bg-red-500/[0.07]" : "border-border/60 bg-card/60"
        }`}
      >
        {isDangerous ? (
          <Ban className="h-10 w-10 text-red-400" aria-hidden="true" />
        ) : (
          <FileQuestion className="h-10 w-10 text-amber-400" aria-hidden="true" />
        )}

        <h1 className="text-xl font-bold text-foreground sm:text-2xl">
          {isDangerous
            ? "Unsafe QR content blocked"
            : isNonWeb
              ? "This QR doesn't contain a web URL"
              : "We couldn't safely parse this destination"}
        </h1>

        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          {isDangerous
            ? `The QR contains executable "${result.scheme}:" content. Opening this in a browser could run code on your device. QRShield will never open it.`
            : isNonWeb && result.scheme !== "text"
              ? `The QR contains "${result.scheme}:" data. It does not point to a website, so there is nothing to analyze as a link.`
              : isNonWeb
                ? "The QR contains plain text or contact data instead of a web address."
                : "The QR content could not be interpreted as a safe web destination."}
        </p>

        <div className="w-full">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Raw content
          </p>
          <p className="break-all rounded-xl border border-border/50 bg-background/60 px-4 py-3 font-mono text-[13px] text-foreground">
            {result.content.slice(0, 300)}
            {result.content.length > 300 ? "…" : ""}
          </p>
        </div>

        <div className="mt-2 flex flex-wrap justify-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => copyText(result.content, () => toast.success("Content copied"))}
            className="gap-1.5"
          >
            <Copy className="h-4 w-4" aria-hidden="true" />
            Copy content
          </Button>
          <Button onClick={onBack} className="gap-1.5">
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Scan another
          </Button>
        </div>
      </section>
    </motion.div>
  );
}
