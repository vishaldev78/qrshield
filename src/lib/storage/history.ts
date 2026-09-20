/**
 * QRShield — Scan history, stored ONLY in the user's browser (localStorage).
 * Never transmitted anywhere. Cap: 20 most recent entries.
 */

import type { RiskLevel } from "@/lib/security/types";

export type ScanSource = "camera" | "upload" | "manual";

export interface HistoryEntry {
  id: string;
  url: string;
  domain: string;
  score: number;
  level: RiskLevel;
  source: ScanSource;
  analyzedAt: string;
}

const KEY = "qrshield_history_v1";
const MAX_ENTRIES = 20;

export function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isHistoryEntry).slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

export function saveHistory(entries: HistoryEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch {
    // Storage may be unavailable (private mode) — history is optional.
  }
}

export function addHistoryEntry(entry: Omit<HistoryEntry, "id" | "analyzedAt">): HistoryEntry[] {
  const full: HistoryEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    analyzedAt: new Date().toISOString(),
  };
  const next = [full, ...loadHistory().filter((e) => e.url !== entry.url)].slice(0, MAX_ENTRIES);
  saveHistory(next);
  return next;
}

export function clearHistory(): HistoryEntry[] {
  saveHistory([]);
  return [];
}

function isHistoryEntry(e: unknown): e is HistoryEntry {
  if (typeof e !== "object" || e === null) return false;
  const o = e as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.url === "string" &&
    typeof o.domain === "string" &&
    typeof o.score === "number" &&
    typeof o.level === "string" &&
    typeof o.analyzedAt === "string" &&
    (o.level === "low" || o.level === "suspicious" || o.level === "high")
  );
}
