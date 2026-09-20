"use client";

import { Clock3, History, Trash2 } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import { Button } from "@/components/ui/button";
import { LEVEL_META } from "@/lib/security/scoring";
import type { HistoryEntry } from "@/lib/storage/history";
import { useQRShield } from "@/lib/store";

const LEVEL_DOT: Record<HistoryEntry["level"], string> = {
  low: "bg-emerald-400",
  suspicious: "bg-amber-400",
  high: "bg-red-400",
};

const LEVEL_TEXT: Record<HistoryEntry["level"], string> = {
  low: "text-emerald-400",
  suspicious: "text-amber-400",
  high: "text-red-400",
};

/** Recent scans — stored only in this browser, one tap to clear. */
export function ScanHistory() {
  const history = useQRShield((s) => s.history);
  const wipe = useQRShield((s) => s.wipeHistory);
  const analyzeAndShow = useQRShield((s) => s.analyzeAndShow);

  if (history.length === 0) return null;

  return (
    <section
      aria-labelledby="history-heading"
      className="rounded-2xl border border-border/60 bg-card/60 p-5 sm:p-6"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3
          id="history-heading"
          className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground"
        >
          <History className="h-4 w-4 text-primary" aria-hidden="true" />
          Recent scans
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={wipe}
          className="h-8 gap-1.5 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          Clear history
        </Button>
      </div>

      <ul className="max-h-96 space-y-2 overflow-y-auto pr-1 scrollbar-thin">
        {history.map((entry) => (
          <li key={entry.id}>
            <button
              type="button"
              onClick={() => analyzeAndShow(entry.url, entry.source)}
              className="group flex w-full items-center gap-3 rounded-xl border border-border/40 bg-background/40 px-3.5 py-3 text-left transition-colors hover:border-border hover:bg-background/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${LEVEL_DOT[entry.level]}`}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-mono text-[13px] text-foreground group-hover:text-primary">
                  {entry.domain}
                </span>
                <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Clock3 className="h-3 w-3" aria-hidden="true" />
                  {formatDistanceToNowStrict(new Date(entry.analyzedAt), { addSuffix: true })}
                  <span className="text-muted-foreground/60">·</span>
                  <span className="capitalize">{entry.source}</span>
                </span>
              </span>
              <span
                className={`shrink-0 text-[11px] font-semibold uppercase tracking-wide ${LEVEL_TEXT[entry.level]}`}
              >
                {LEVEL_META[entry.level].label} · {entry.score}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-[11px] text-muted-foreground/70">
        History lives only in this browser&apos;s local storage. Clearing it removes everything — there is
        no server copy.
      </p>
    </section>
  );
}
