"use client";

import { useState } from "react";
import { FlaskConical, Loader2, ShieldQuestion, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useQRShield } from "@/lib/store";

export function URLInput() {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const analyzeAndShow = useQRShield((s) => s.analyzeAndShow);

  const submit = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    setBusy(true);
    // Small async seam so the button shows its busy state even though
    // the engine is fully synchronous and local.
    setTimeout(() => {
      const ok = analyzeAndShow(trimmed, "manual");
      if (!ok) {
        toast.error("We couldn't safely parse this destination.", {
          description: "Check the address and try again, or scan the QR again.",
        });
      }
      setBusy(false);
    }, 250);
  };

  return (
    <div className="flex flex-col gap-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(value);
        }}
        className="flex flex-col gap-3"
      >
        <Label htmlFor="manual-url" className="text-sm text-muted-foreground">
          Paste a suspicious destination to inspect it before you open it
        </Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="manual-url"
            type="text"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            placeholder="https://example.com/verify?…"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="h-11 flex-1 font-mono text-[13px]"
            aria-describedby="manual-url-hint"
          />
          <Button type="submit" disabled={busy || value.trim().length === 0} className="h-11 gap-2">
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <ShieldQuestion className="h-4 w-4" aria-hidden="true" />
            )}
            Analyze
          </Button>
        </div>
        <p id="manual-url-hint" className="text-xs text-muted-foreground">
          Analysis runs entirely on this device — the URL is not stored and not sent anywhere unless
          you explicitly request an AI explanation later.
        </p>
      </form>

      <div className="rounded-xl border border-border/50 bg-card/40 p-4">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <FlaskConical className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          Try synthetic demo URLs
          <span className="normal-case tracking-normal text-muted-foreground/70">
            (safe test strings — no real infrastructure)
          </span>
        </p>
        <div className="mt-3 flex flex-col gap-2">
          <DemoRow
            label="Legitimate-looking"
            url="https://www.example.com/help/getting-started"
            onPick={(u) => {
              setValue(u);
              submit(u);
            }}
          />
          <DemoRow
            label="Synthetic quishing attempt"
            url="http://paypa1-secure-login.xyz/verify/login?redirect=account"
            warn
            onPick={(u) => {
              setValue(u);
              submit(u);
            }}
          />
          <DemoRow
            label="Hidden behind shortener"
            url="https://bit.ly/3qrShieldDemo"
            onPick={(u) => {
              setValue(u);
              submit(u);
            }}
          />
        </div>
      </div>

      <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" aria-hidden="true" />
        For security reasons, live phishing infrastructure is never contacted — the engine evaluates
        URL structure only.
      </p>
    </div>
  );
}

function DemoRow({
  label,
  url,
  warn = false,
  onPick,
}: {
  label: string;
  url: string;
  warn?: boolean;
  onPick: (url: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onPick(url)}
      className="group flex items-center gap-3 rounded-lg border border-border/40 bg-background/40 px-3 py-2 text-left transition-colors hover:border-primary/40 hover:bg-background/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${warn ? "bg-red-400" : "bg-emerald-400"}`} aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium text-foreground">{label}</span>
        <span className="block truncate font-mono text-[11px] text-muted-foreground">{url}</span>
      </span>
      <span className="shrink-0 text-[11px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
        Analyze →
      </span>
    </button>
  );
}
