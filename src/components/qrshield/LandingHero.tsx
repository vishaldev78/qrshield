"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Banknote,
  Eye,
  Fingerprint,
  Globe,
  Laptop,
  Lock,
  MousePointerClick,
  QrCode,
  ShieldCheck,
  UserX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiveCheckpoint } from "./LiveCheckpoint";
import { useQRShield } from "@/lib/store";

export function LandingHero() {
  const go = useQRShield((s) => s.go);
  const reduce = useReducedMotion();

  return (
    <div className="relative overflow-hidden">
      {/* Ambient gradient backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(99,102,241,0.14),transparent_70%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.045)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(70%_60%_at_50%_20%,black,transparent)]"
      />

      <section className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)]">
          {/* Copy */}
          <div className="text-center lg:text-left">
            <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-medium text-primary lg:mx-0">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Pre-click security layer for QR codes
            </p>

            <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-[3.4rem]">
              SCAN BEFORE
              <br />
              <span className="bg-gradient-to-r from-primary via-violet-400 to-emerald-400 bg-clip-text text-transparent">
                YOU TRUST.
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg lg:mx-0">
              Detect suspicious QR destinations before they become phishing attacks. QRShield decodes
              the code, explains the risk in plain language, and lets <em>you</em> decide.
            </p>

            <p className="mt-3 font-mono text-sm text-muted-foreground/80">
              Decode. Analyze. Understand.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Button size="lg" onClick={() => go("scanner")} className="h-12 w-full gap-2 px-6 text-base sm:w-auto">
                <QrCode className="h-5 w-5" aria-hidden="true" />
                Scan a QR Code
              </Button>
              <Button size="lg" variant="outline" onClick={() => go("how")} className="h-12 w-full gap-2 px-6 sm:w-auto">
                How it works
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>

            <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground lg:justify-start">
              <li className="flex items-center gap-1.5">
                <UserX className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                No account required
              </li>
              <li className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                Privacy-first
              </li>
              <li className="flex items-center gap-1.5">
                <Laptop className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                Runs in your browser
              </li>
            </ul>
          </div>

          {/* Hero visual: looping live checkpoint demo */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mx-auto w-full max-w-sm"
            aria-hidden="true"
          >
            <LiveCheckpoint />
          </motion.div>
        </div>
      </section>

      {/* Why it matters */}
      <section aria-labelledby="why-heading" className="relative border-t border-border/50 bg-[#0D1326]/60">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <h2 id="why-heading" className="text-center text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            A QR code is a blind click.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-muted-foreground sm:text-base">
            Normal scanners answer <span className="text-foreground">&ldquo;what URL is inside?&rdquo;</span> and open it.
            QRShield answers <span className="text-foreground">&ldquo;what is inside, how risky is it, why, and what should I do?&rdquo;</span>
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Globe, title: "Fake banking & UPI pages", text: "Payment QRs that swap the payee or mimic bank portals." },
              { icon: Fingerprint, title: "Look-alike domains", text: "paypa1.xyz-style homographs engineered to fool your eyes." },
              { icon: Eye, title: "Hidden destinations", text: "Shorteners and redirects that conceal where you actually land." },
              { icon: Banknote, title: "Credential harvesting", text: "Login, OTP and KYC pages built to capture your data." },
            ].map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="rounded-2xl border border-border/60 bg-card/50 p-5 transition-colors hover:border-primary/40"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 ring-1 ring-red-500/20">
                  <Icon className="h-5 w-5 text-red-400" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-sm font-semibold text-foreground">{title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA strip */}
      <section className="relative border-t border-border/50">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-5 px-4 py-14 text-center sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Put a security checkpoint before every click.
          </h2>
          <Button size="lg" onClick={() => go("scanner")} className="h-12 gap-2 px-8 text-base">
            <QrCode className="h-5 w-5" aria-hidden="true" />
            Scan a QR Code
          </Button>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MousePointerClick className="h-3.5 w-3.5" aria-hidden="true" />
            QRShield never opens a destination automatically — you stay in control.
          </p>
        </div>
      </section>
    </div>
  );
}
