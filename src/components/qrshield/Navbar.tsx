"use client";

import { QrCode, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQRShield } from "@/lib/store";
import type { View } from "@/lib/store";

const NAV_LINKS: { view: View; label: string }[] = [
  { view: "scanner", label: "Scanner" },
  { view: "how", label: "How it works" },
  { view: "privacy", label: "Privacy" },
];

export function Navbar() {
  const go = useQRShield((s) => s.go);
  const view = useQRShield((s) => s.view);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-[#0B1020]/85 backdrop-blur-md">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6"
      >
        <button
          type="button"
          onClick={() => go("landing")}
          className="flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1020]"
          aria-label="QRShield home"
        >
          <span className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/30">
            <QrCode className="h-5 w-5 text-primary" aria-hidden="true" />
            <ShieldCheck className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-[#0B1020] text-emerald-400" aria-hidden="true" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            QR<span className="text-primary">Shield</span>
          </span>
        </button>

        <ul className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((l) => (
            <li key={l.view}>
              <button
                type="button"
                onClick={() => go(l.view)}
                aria-current={view === l.view ? "page" : undefined}
                className={`rounded-md px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  view === l.view
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {l.label}
              </button>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => go("scanner")} className="gap-2">
            <QrCode className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Scan QR</span>
            <span className="sm:sr-only">Scan QR code</span>
          </Button>
        </div>
      </nav>
    </header>
  );
}
