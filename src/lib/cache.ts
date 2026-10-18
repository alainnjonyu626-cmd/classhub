// Offline copy of each hub's data, saved in the phone's browser. README section 10.4.
// We save the RAW rows and clean them again on load, so dates survive JSON.
// Every read/write is wrapped in try/catch: storage can be full, blocked or missing.

import type { RawRow, TabName } from "../types/sheet";

export interface CachedHub {
  savedAt: string;
  tabs: Partial<Record<TabName, RawRow[]>>;
}

const key = (hubId: string) => `classhub:${hubId}`;

export function readCache(hubId: string): CachedHub | null {
  try {
    const raw = localStorage.getItem(key(hubId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedHub;
    return parsed && typeof parsed.savedAt === "string" && parsed.tabs ? parsed : null;
  } catch {
    return null;
  }
}

/** Merge fresh tabs into the saved copy (tabs this page didn't load are kept). */
export function writeCache(hubId: string, tabs: Partial<Record<TabName, RawRow[]>>): string {
  const savedAt = new Date().toISOString();
  try {
    const previous = readCache(hubId);
    const next: CachedHub = { savedAt, tabs: { ...(previous?.tabs ?? {}), ...tabs } };
    localStorage.setItem(key(hubId), JSON.stringify(next));
  } catch {
    // Storage full or blocked: the page still works, just without offline copy.
  }
  return savedAt;
}

export function clearCache(hubId: string): void {
  try {
    localStorage.removeItem(key(hubId));
  } catch {
    /* ignore */
  }
}

/** Small per-viewer preferences (last hub, dismissed hints, last seen news). */
export const prefs = {
  get(name: string): string | null {
    try {
      return localStorage.getItem(`classhub:pref:${name}`);
    } catch {
      return null;
    }
  },
  set(name: string, value: string): void {
    try {
      localStorage.setItem(`classhub:pref:${name}`, value);
    } catch {
      /* ignore */
    }
  },
};
