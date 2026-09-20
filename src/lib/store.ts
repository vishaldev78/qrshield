/**
 * QRShield — Application store (client state only).
 * Views are switched client-side because the entire product is a single
 * privacy-first page application: no server round-trips for navigation.
 */

"use client";

import { create } from "zustand";
import { analyzeInput } from "@/lib/security/analyzer";
import type { URLAnalysis } from "@/lib/security/types";
import type { NormalizeOutcome } from "@/lib/security/types";
import type { HistoryEntry, ScanSource } from "@/lib/storage/history";
import { addHistoryEntry, clearHistory, loadHistory } from "@/lib/storage/history";

export type View = "landing" | "scanner" | "result" | "how" | "privacy";

/** A resolved error-style result (non-web QR content, dangerous scheme, no parse). */
export interface ContentResult {
  kind: "non-web" | "dangerous" | "invalid";
  content: string;
  scheme?: string;
}

interface QRShieldState {
  view: View;
  analysis: URLAnalysis | null;
  contentResult: ContentResult | null;
  history: HistoryEntry[];
  historyLoaded: boolean;

  go: (view: View) => void;
  analyzeAndShow: (raw: string, source: ScanSource) => boolean;
  showAnalysis: (analysis: URLAnalysis, source: ScanSource) => void;
  showContentResult: (result: ContentResult) => void;
  clearResult: () => void;
  hydrateHistory: () => void;
  wipeHistory: () => void;
}

export const useQRShield = create<QRShieldState>((set, get) => ({
  view: "landing",
  analysis: null,
  contentResult: null,
  history: [],
  historyLoaded: false,

  go: (view) => {
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", view === "landing" ? "#" : `#${view}`);
    }
    set({ view });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  },

  /** Runs the deterministic engine client-side. Returns true if a result was produced. */
  analyzeAndShow: (raw, source) => {
    const outcome = analyzeInput(raw);
    if (outcome.kind === "url" && outcome.analysis) {
      get().showAnalysis(outcome.analysis, source);
      return true;
    }
    if (outcome.kind === "non-web" || outcome.kind === "dangerous") {
      set({
        contentResult: { kind: outcome.kind, content: outcome.content, scheme: outcome.scheme },
        analysis: null,
        view: "result",
      });
      if (typeof window !== "undefined") window.history.replaceState(null, "", "#result");
      window.scrollTo({ top: 0 });
      return true;
    }
    return false;
  },

  showAnalysis: (analysis, source) => {
    set((s) => ({
      analysis,
      contentResult: null,
      view: "result",
      history: addHistoryEntry({
        url: analysis.url,
        domain: analysis.details.registrableDomain,
        score: analysis.score,
        level: analysis.level,
        source,
      }),
    }));
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", "#result");
      window.scrollTo({ top: 0 });
    }
  },

  showContentResult: (result) => {
    set({ contentResult: result, analysis: null, view: "result" });
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", "#result");
      window.scrollTo({ top: 0 });
    }
  },

  clearResult: () => set({ analysis: null, contentResult: null }),

  hydrateHistory: () => {
    if (get().historyLoaded) return;
    set({ history: loadHistory(), historyLoaded: true });
  },

  wipeHistory: () => set({ history: clearHistory(), historyLoaded: true }),
}));
