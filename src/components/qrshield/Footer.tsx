"use client";

import { QrCode, ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-[#0A0E1B] pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/30">
              <QrCode className="h-4 w-4 text-primary" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">
                QR<span className="text-primary">Shield</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Scan the QR. Know the risk before you trust the link.
              </p>
            </div>
          </div>

          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
            QR images are processed locally in your browser. No account, no tracking, no uploads.
          </p>
        </div>

        <div className="mt-6 border-t border-border/40 pt-5">
          <p className="text-xs leading-relaxed text-muted-foreground">
            QRShield performs static, heuristic analysis of decoded destinations. It is a pre-click
            awareness layer for everyday users — not a replacement for security vendors, and it cannot
            guarantee any destination is safe. Never enter sensitive data on unverified sites.
          </p>
          <p className="mt-2 text-[11px] text-muted-foreground/70">
            Decode → Analyze → Understand → Decide. You stay in control of every click.
          </p>
        </div>
      </div>
    </footer>
  );
}
