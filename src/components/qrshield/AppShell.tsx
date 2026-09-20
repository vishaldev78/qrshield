"use client";

import { useEffect } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { LandingHero } from "./LandingHero";
import { ScannerPanel } from "./ScannerPanel";
import { ResultView } from "./ResultView";
import { HowItWorks } from "./HowItWorks";
import { PrivacyView } from "./PrivacyView";
import { useQRShield, type View } from "@/lib/store";

const VALID_VIEWS: View[] = ["landing", "scanner", "result", "how", "privacy"];

/**
 * Single-route application shell.
 * All views render client-side on `/` — hash fragments (#scanner, #result…)
 * provide shareable, back-button-friendly navigation without any server calls.
 */
export function AppShell() {
  const view = useQRShield((s) => s.view);
  const go = useQRShield((s) => s.go);
  const hydrateHistory = useQRShield((s) => s.hydrateHistory);

  // Restore view from hash on first load (deep-link support).
  useEffect(() => {
    const hash = window.location.hash.replace("#", "") as View;
    if (VALID_VIEWS.includes(hash)) {
      go(hash);
    }
    hydrateHistory();
     
  }, []);

  // Browser back/forward support for hash changes.
  useEffect(() => {
    const onHash = () => {
      const hash = window.location.hash.replace("#", "") as View;
      const next = VALID_VIEWS.includes(hash) ? hash : "landing";
      if (next !== useQRShield.getState().view) {
        useQRShield.setState({ view: next });
      }
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-[#0B1020] text-foreground">
      <Navbar />
      <main id="main" className="flex-1">
        {view === "landing" && <LandingHero />}
        {view === "scanner" && <ScannerPanel />}
        {view === "result" && <ResultView />}
        {view === "how" && <HowItWorks />}
        {view === "privacy" && <PrivacyView />}
      </main>
      <Footer />
    </div>
  );
}
