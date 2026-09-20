"use client";

/**
 * QRShield — Built-in test QR generator.
 *
 * Generates synthetic QR codes on-device so the scanner can be tested end-to-end
 * without ever touching real phishing infrastructure. Every URL below is a
 * harmless synthetic string — it is never contacted, only structurally analyzed.
 */

import { useState } from "react";
import {
  Camera,
  Check,
  Copy,
  Download,
  FlaskConical,
  ImageUp,
  Loader2,
  QrCode,
  ScanLine,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useQRShield } from "@/lib/store";
import type { RiskLevel } from "@/lib/security/types";

interface TestCase {
  id: string;
  label: string;
  url: string;
  expect: RiskLevel;
  expectNote: string;
}

const TEST_CASES: TestCase[] = [
  {
    id: "brand-impersonation",
    label: "Brand impersonation + credential trap",
    url: "http://paypa1-secure-login.xyz/verify/login?redirect=account",
    expect: "high",
    expectNote: "Look-alike brand token, unencrypted HTTP, credential path, suspicious TLD (~80/100)",
  },
  {
    id: "raw-ip",
    label: "Raw IP address over HTTP",
    url: "http://192.168.18.22/reset-password",
    expect: "suspicious",
    expectNote: "No domain name, no TLS, password-reset lure path — lands mid-band (~50/100)",
  },
  {
    id: "punycode",
    label: "Punycode look-alike domain",
    url: "https://xn--pypal-4ve.com/signin",
    expect: "suspicious",
    expectNote: "xn-- label can render as a spoofed character domain (~55/100)",
  },
  {
    id: "subdomain-brand",
    label: "Brand hidden in a subdomain",
    url: "https://secure-paypa1.com.login-verify.xyz/auth",
    expect: "high",
    expectNote: "The real domain is login-verify.xyz — the brand name is decoration (~60/100)",
  },
  {
    id: "shortener",
    label: "Shortened link (destination hidden)",
    url: "https://bit.ly/3qrShieldDemo",
    expect: "suspicious",
    expectNote: "The real destination is invisible until the redirect resolves (~30/100)",
  },
  {
    id: "legit",
    label: "Legitimate destination (control)",
    url: "https://www.example.com/help/getting-started",
    expect: "low",
    expectNote: "HTTPS, clean domain, no lures — this one should stay green (0/100)",
  },
];

const EXPECT_META: Record<
  RiskLevel,
  { label: string; className: string; Icon: typeof ShieldCheck }
> = {
  high: {
    label: "HIGH RISK expected",
    className:
      "border-red-500/40 bg-red-500/10 text-red-300",
    Icon: ShieldAlert,
  },
  suspicious: {
    label: "SUSPICIOUS expected",
    className:
      "border-amber-500/40 bg-amber-500/10 text-amber-300",
    Icon: ShieldQuestion,
  },
  low: {
    label: "SAFE-LOOKING expected",
    className:
      "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    Icon: ShieldCheck,
  },
};

export function TestQRPanel() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const analyzeAndShow = useQRShield((s) => s.analyzeAndShow);

  const active = TEST_CASES.find((t) => t.id === activeId) ?? null;

  const generate = async (tc: TestCase) => {
    setActiveId(tc.id);
    setCopied(false);
    setBusyId(tc.id);
    try {
      // Dynamic import keeps the ~40KB generator out of the initial bundle.
      const QR = (await import("qrcode")).default;
      const url = await QR.toDataURL(tc.url, {
        width: 512,
        margin: 2,
        errorCorrectionLevel: "M",
        color: { dark: "#0B1020", light: "#FFFFFF" },
      });
      setDataUrl(url);
    } catch {
      toast.error("Could not render the test QR.", {
        description: "Try another test case — analysis itself always works.",
      });
      setDataUrl(null);
    } finally {
      setBusyId(null);
    }
  };

  const download = () => {
    if (!dataUrl || !active) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `qrshield-test-${active.id}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success("QR image downloaded.", {
      description: 'Now drop it into the "Upload image" tab to scan it.',
    });
  };

  const copyUrl = async () => {
    if (!active) return;
    try {
      await navigator.clipboard.writeText(active.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Clipboard is unavailable in this browser context.");
    }
  };

  const analyzeNow = (tc: TestCase) => {
    const ok = analyzeAndShow(tc.url, "manual");
    if (!ok) {
      toast.error("We couldn't safely parse this destination.");
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* How-to strip */}
      <div className="rounded-xl border border-border/50 bg-card/40 p-4">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <FlaskConical className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          How to test the scanner
        </p>
        <ol className="mt-3 grid gap-2 text-xs leading-relaxed text-muted-foreground sm:grid-cols-3">
          <li className="flex items-start gap-2 rounded-lg border border-border/40 bg-background/40 px-3 py-2">
            <QrCode className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
            <span>
              <span className="font-medium text-foreground">1. Generate</span> — pick a test case
              below; its QR renders on this screen.
            </span>
          </li>
          <li className="flex items-start gap-2 rounded-lg border border-border/40 bg-background/40 px-3 py-2">
            <Camera className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
            <span>
              <span className="font-medium text-foreground">2. Scan</span> — two devices: aim the
              app&apos;s Camera tab at this screen. One device: download the PNG and use the
              &quot;Upload image&quot; tab.
            </span>
          </li>
          <li className="flex items-start gap-2 rounded-lg border border-border/40 bg-background/40 px-3 py-2">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
            <span>
              <span className="font-medium text-foreground">3. Compare</span> — check the verdict
              against the expected badge on each test case.
            </span>
          </li>
        </ol>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        {/* Test case list */}
        <div className="flex flex-col gap-2" role="list" aria-label="Synthetic QR test cases">
          {TEST_CASES.map((tc) => {
            const meta = EXPECT_META[tc.expect];
            const isActive = activeId === tc.id;
            return (
              <div
                key={tc.id}
                role="listitem"
                className={`rounded-xl border px-4 py-3 transition-colors ${
                  isActive
                    ? "border-primary/60 bg-primary/[0.07]"
                    : "border-border/40 bg-background/40 hover:border-primary/30 hover:bg-background/70"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{tc.label}</p>
                    <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
                      {tc.url}
                    </p>
                    <Badge
                      variant="outline"
                      className={`mt-2 gap-1 text-[10px] ${meta.className}`}
                    >
                      <meta.Icon className="h-3 w-3" aria-hidden="true" />
                      {meta.label}
                    </Badge>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1.5">
                    <Button
                      size="sm"
                      variant={isActive ? "secondary" : "outline"}
                      className="h-8 gap-1.5 text-xs"
                      onClick={() => generate(tc)}
                      disabled={busyId !== null}
                      aria-label={`Generate test QR for ${tc.label}`}
                    >
                      {busyId === tc.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                      ) : (
                        <QrCode className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      Show QR
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 gap-1.5 text-xs text-muted-foreground"
                      onClick={() => analyzeNow(tc)}
                      aria-label={`Analyze ${tc.label} directly without scanning`}
                    >
                      <Zap className="h-3.5 w-3.5" aria-hidden="true" />
                      Analyze now
                    </Button>
                  </div>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground/80">
                  {tc.expectNote}
                </p>
              </div>
            );
          })}
        </div>

        {/* QR preview */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-xl border border-border/50 bg-card/60 p-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <ScanLine className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              Test QR preview
            </p>

            {active && dataUrl ? (
              <div className="mt-3 flex flex-col items-center gap-3">
                {/* QR needs high contrast to scan, hence the white plate. */}
                <div className="rounded-2xl bg-white p-3 shadow-[0_0_40px_-12px_rgba(99,102,241,0.45)]">
                  <img
                    src={dataUrl}
                    alt={`Test QR code encoding ${active.url}`}
                    className="h-48 w-48 sm:h-56 sm:w-56"
                    aria-hidden="false"
                  />
                </div>
                <p className="max-w-[260px] break-all text-center font-mono text-[10px] text-muted-foreground">
                  {active.url}
                </p>
                <div className="grid w-full grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 gap-1.5 text-xs"
                    onClick={download}
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    Download PNG
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 gap-1.5 text-xs"
                    onClick={copyUrl}
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    {copied ? "Copied" : "Copy URL"}
                  </Button>
                </div>
                <Button
                  size="sm"
                  className="h-9 w-full gap-1.5 text-xs"
                  onClick={() => analyzeNow(active)}
                >
                  <Zap className="h-3.5 w-3.5" aria-hidden="true" />
                  Analyze directly (skip scanning)
                </Button>
                <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
                  <ImageUp className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  Single-device loop: download this PNG, open the &quot;Upload image&quot; tab, and
                  drop the file in — decoding runs locally.
                </p>
              </div>
            ) : (
              <div className="mt-3 flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/60 px-4 py-10 text-center">
                <QrCode className="h-10 w-10 text-muted-foreground/40" aria-hidden="true" />
                <p className="max-w-[220px] text-xs leading-relaxed text-muted-foreground">
                  Pick a test case and press <span className="font-medium text-foreground">Show QR</span> to
                  render a scannable test code here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        All test URLs are synthetic strings — nothing is contacted, resolved, or opened. They exist
        so every rule in the engine can be demonstrated safely, on demand.
      </p>
    </div>
  );
}
