"use client";

import { useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  Copy,
  ExternalLink,
  QrCode,
  RotateCcw,
  ShieldAlert,
  ShieldX,
  TriangleAlert,
} from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LEVEL_META } from "@/lib/security/scoring";
import type { RiskLevel } from "@/lib/security/types";
import { useQRShield } from "@/lib/store";

interface SafeActionCardProps {
  level: RiskLevel;
  url: string;
}

/** Deliberate secondary action — never automatic, never the primary flow. */
export function SafeActionCard({ level, url }: SafeActionCardProps) {
  const meta = LEVEL_META[level];
  const go = useQRShield((s) => s.go);
  const [copied, setCopied] = useState(false);

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("URL copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy — your browser blocked clipboard access");
    }
  };

  const Icon =
    level === "high" ? ShieldX : level === "suspicious" ? TriangleAlert : CheckCircle2;

  const srVerdict =
    level === "high"
      ? "Recommended action: do not open this destination."
      : level === "suspicious"
        ? "Recommended action: proceed carefully after verifying the sender and destination."
        : "Recommended action: you may continue, but verify the site before entering sensitive data.";

  return (
    <section
      aria-label="Recommended action"
      className="rounded-2xl border p-5 sm:p-6"
      style={{ borderColor: `${meta.color}40`, backgroundColor: meta.softBg }}
    >
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-6 w-6 shrink-0" style={{ color: meta.color }} aria-hidden="true" />
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-foreground">
            {level === "high"
              ? "Do not enter anything here"
              : level === "suspicious"
                ? "Proceed carefully"
                : "You can continue — stay alert"}
          </h3>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{meta.summary}</p>
          <span className="sr-only">{srVerdict}</span>

          {level === "high" && (
            <ul className="mt-3 grid grid-cols-1 gap-1.5 text-[13px] text-muted-foreground sm:grid-cols-2">
              {["Passwords", "OTPs", "Card details", "UPI PIN", "Banking information", "KYC documents"].map(
                (item) => (
                  <li key={item} className="flex items-center gap-2">
                    <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-red-400" aria-hidden="true" />
                    {item}
                  </li>
                )
              )}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        {level === "low" && (
          <OpenDestinationButton url={url} />
        )}
        {level === "suspicious" && (
          <OpenDestinationButton url={url} cautious />
        )}

        <Button variant="outline" onClick={copyUrl} className="gap-2">
          {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
          Copy URL
        </Button>
        <Button variant="secondary" onClick={() => go("scanner")} className="gap-2">
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Scan another
        </Button>
      </div>

      {level !== "high" && (
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground/80">
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
          Opening is always a manual, deliberate choice — QRShield never navigates for you.
        </p>
      )}
    </section>
  );
}

function OpenDestinationButton({ url, cautious = false }: { url: string; cautious?: boolean }) {
  const [host, setHost] = useState("");
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant={cautious ? "secondary" : "default"}
          className={`gap-2 ${cautious ? "border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 hover:text-amber-200" : ""}`}
          onClick={() => {
            try {
              setHost(new URL(url).hostname);
            } catch {
              setHost(url.slice(0, 40));
            }
          }}
        >
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          Open destination
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="border-border bg-[#111827]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {cautious && <TriangleAlert className="h-5 w-5 text-amber-400" aria-hidden="true" />}
            {cautious ? "Open this destination with caution?" : "Leave QRShield and open this site?"}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2.5">
              <p>
                You are about to visit{" "}
                <span className="break-all font-mono text-[13px] text-foreground">{host}</span>
              </p>
              <p>
                Verify the address character by character before entering any personal data,
                passwords, OTPs or payment details.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="gap-2">
            <QrCode className="h-4 w-4" aria-hidden="true" />
            Stay safe
          </AlertDialogCancel>
          <AlertDialogAction
            className={cautious ? "bg-amber-500 text-black hover:bg-amber-400" : ""}
            onClick={() => {
              window.open(url, "_blank", "noopener,noreferrer");
            }}
          >
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            Open anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
