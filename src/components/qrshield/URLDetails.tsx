"use client";

import { Fingerprint } from "lucide-react";
import type { URLAnalysis } from "@/lib/security/types";

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
      <dt className="shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd
        className={`min-w-0 break-words text-right text-[13px] text-foreground ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

/** Technical breakdown — gives the verdict engineering credibility. */
export function URLDetails({ analysis }: { analysis: URLAnalysis }) {
  const d = analysis.details;
  const domainType = d.isIP
    ? "IP address"
    : d.isShortened
      ? "Shortened link"
      : "Public domain";

  return (
    <section
      aria-labelledby="url-details-heading"
      className="rounded-2xl border border-border/60 bg-card/60 p-5 sm:p-6"
    >
      <h3
        id="url-details-heading"
        className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground"
      >
        <Fingerprint className="h-4 w-4 text-primary" aria-hidden="true" />
        Destination details
      </h3>
      <dl className="divide-y divide-border/40">
        <Row label="Domain" value={d.registrableDomain} mono />
        <Row label="Protocol" value={d.isHttps ? "HTTPS (encrypted)" : "HTTP (not encrypted)"} mono />
        <Row label="Domain type" value={domainType} />
        <Row label="Path" value={d.path || "/ (root)"} mono />
        <Row label="Subdomains" value={String(d.subdomainCount)} />
        <Row label="Shortened URL" value={d.isShortened ? "Yes" : "No"} />
        <Row label="Port" value={d.port || (d.isHttps ? "443 (default)" : "80 (default)")} mono />
        <Row label="URL length" value={`${d.urlLength} characters`} />
      </dl>
    </section>
  );
}
