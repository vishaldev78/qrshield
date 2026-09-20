"use client";

import { useState } from "react";
import { Loader2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { URLAnalysis } from "@/lib/security/types";

/**
 * Optional AI layer — OFF by default.
 * The deterministic engine decides the score; AI only translates the findings
 * into natural language. Only the URL + findings summary are sent (never the
 * QR image, never browsing history).
 */
export function AIExplain({ analysis }: { analysis: URLAnalysis }) {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const explain = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: analysis.url,
          score: analysis.score,
          level: analysis.level,
          findings: analysis.findings.map((f) => ({
            title: f.title,
            severity: f.severity,
            description: f.description,
          })),
        }),
      });
      if (!res.ok) {
        throw new Error(`The explanation service returned an error (${res.status}).`);
      }
      const data = (await res.json()) as { explanation?: string };
      if (!data.explanation) throw new Error("Empty explanation.");
      setExplanation(data.explanation);
    } catch (e) {
      setError(
        e instanceof Error
          ? `${e.message} You can still rely on the engine findings above.`
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      aria-labelledby="ai-explain-heading"
      className="rounded-2xl border border-primary/25 bg-primary/[0.06] p-5 sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3
            id="ai-explain-heading"
            className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-foreground"
          >
            <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
            Plain-language explanation
          </h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
            Optional &amp; off by default. The security engine decides the score — AI only restates its
            findings in everyday language. Only the URL and the findings list are sent; your QR image
            never leaves this device.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss AI explanation section"
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {explanation ? (
        <div className="mt-4 rounded-xl border border-border/60 bg-card/70 p-4">
          <p className="text-[13px] leading-relaxed text-foreground" aria-live="polite">
            {explanation}
          </p>
          <button
            type="button"
            onClick={explain}
            disabled={loading}
            className="mt-3 text-xs font-medium text-primary underline-offset-2 hover:underline disabled:opacity-50"
          >
            Regenerate
          </button>
        </div>
      ) : (
        <div className="mt-4">
          <Button onClick={explain} disabled={loading} className="gap-2">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Explaining…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Explain with AI
              </>
            )}
          </Button>
          {error && (
            <p className="mt-3 text-[13px] text-amber-400" role="alert">
              {error}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
