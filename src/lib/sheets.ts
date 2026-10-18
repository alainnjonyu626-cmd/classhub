// Downloads one tab of a Google Sheet as CSV. README section 10.1.
//
// Lessons from testing the endpoint (handled here):
//  - headers=1 forces row 1 to be the header row
//  - Google adds empty columns at the end → we drop columns with no header
//  - a private sheet returns an HTML page instead of CSV
//  - a tab name that doesn't exist returns the FIRST tab (checked in data.ts)

import type { RawRow, TabName } from "../types/sheet";
import { parseCSV } from "./csv";

export type TabResult =
  | { ok: true; tab: TabName; headers: string[]; rows: RawRow[] }
  | { ok: false; tab: TabName; reason: "network" | "timeout" | "private" | "http" };

export function csvUrl(sheetId: string, tab: TabName): string {
  return (
    `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}` +
    `/gviz/tq?tqx=out:csv&headers=1&sheet=${encodeURIComponent(tab)}`
  );
}

/** sheetId "demo" = built-in sample class (src/lib/demo.ts), no internet needed. */
export const DEMO_SHEET = "demo";

export async function fetchTab(sheetId: string, tab: TabName, timeoutMs = 12000): Promise<TabResult> {
  if (sheetId === DEMO_SHEET) {
    const { demoRows } = await import("./demo"); // only downloaded by demo hubs
    return { ok: true, tab, ...demoRows(tab) };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(csvUrl(sheetId, tab), { signal: controller.signal });
    if (!res.ok) return { ok: false, tab, reason: "http" };
    const text = await res.text();
    if (text.trimStart().startsWith("<")) return { ok: false, tab, reason: "private" };
    return { ok: true, tab, ...toRows(text) };
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === "AbortError";
    return { ok: false, tab, reason: timedOut ? "timeout" : "network" };
  } finally {
    clearTimeout(timer);
  }
}

/** CSV text → header list + rows as { column: value } objects (empty rows removed). */
export function toRows(text: string): { headers: string[]; rows: RawRow[] } {
  const table = parseCSV(text);
  const rawHeaders = (table[0] ?? []).map((h) => h.trim().toLowerCase());
  const keep = rawHeaders.flatMap((h, i) => (h ? [i] : []));
  const headers = keep.map((i) => rawHeaders[i] ?? "");
  const rows = table
    .slice(1)
    .map((cells) => {
      const row: RawRow = {};
      keep.forEach((i, k) => {
        row[headers[k] ?? ""] = (cells[i] ?? "").trim();
      });
      return row;
    })
    .filter((row) => Object.values(row).some((v) => v !== ""));
  return { headers, rows };
}
