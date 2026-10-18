// Loads a hub's data: cache first (fast), then fresh from the sheet. README section 10.2.
//
//   loadHub(hubId, hub, ["announcements", "deadlines"], (data, status) => render(...))
//
// onUpdate can be called twice: once with the saved copy, once with fresh data.

import type { HubConfig } from "../types/hub";
import type { HubData, RawRow, TabName } from "../types/sheet";
import { readCache, writeCache } from "./cache";
import {
  REQUIRED_COLUMNS,
  cleanAnnouncements,
  cleanCourses,
  cleanDeadlines,
  cleanHandouts,
  cleanInfo,
  cleanLeaders,
  cleanParents,
  cleanPastQuestions,
  cleanPlaces,
  cleanTimetable,
} from "./clean";
import { atTime } from "./dates";
import { fetchTab } from "./sheets";

export type LoadStatus =
  | "cached" //       showing the saved copy while fresh data loads
  | "fresh" //        fresh data from the sheet
  | "offline" //      network failed, showing the saved copy
  | "offline-empty"; // network failed and nothing saved yet

export function emptyData(): HubData {
  return {
    info: {}, announcements: [], timetable: [], deadlines: [], courses: [], handouts: [],
    past_questions: [], leaders: [], places: [], parents: [],
    skipped: {}, broken: [], savedAt: "", fromCache: false,
  };
}

/** Raw rows of several tabs → one typed HubData object. */
export function buildData(tabs: Partial<Record<TabName, RawRow[]>>, savedAt: string, fromCache: boolean): HubData {
  const data = emptyData();
  data.savedAt = savedAt;
  data.fromCache = fromCache;
  const apply = <K extends Exclude<TabName, "info">>(tab: K, cleaned: { items: HubData[K]; skipped: number }) => {
    data[tab] = cleaned.items;
    if (cleaned.skipped) data.skipped[tab] = cleaned.skipped;
  };
  if (tabs.info) data.info = cleanInfo(tabs.info);
  if (tabs.announcements) apply("announcements", cleanAnnouncements(tabs.announcements));
  if (tabs.timetable) apply("timetable", cleanTimetable(tabs.timetable));
  if (tabs.deadlines) apply("deadlines", cleanDeadlines(tabs.deadlines));
  if (tabs.courses) apply("courses", cleanCourses(tabs.courses));
  if (tabs.handouts) apply("handouts", cleanHandouts(tabs.handouts));
  if (tabs.past_questions) apply("past_questions", cleanPastQuestions(tabs.past_questions));
  if (tabs.leaders) apply("leaders", cleanLeaders(tabs.leaders));
  if (tabs.places) apply("places", cleanPlaces(tabs.places));
  if (tabs.parents) apply("parents", cleanParents(tabs.parents));
  return data;
}

export async function loadHub(
  hubId: string,
  hub: HubConfig,
  tabs: TabName[],
  onUpdate: (data: HubData, status: LoadStatus) => void,
): Promise<void> {
  // 1. Saved copy first, so the page appears instantly
  const cached = readCache(hubId);
  // The saved copy only counts if it has EVERY tab this page needs
  const cacheCovers = cached !== null && tabs.every((t) => cached.tabs[t]);
  if (cached && cacheCovers) {
    onUpdate(buildData(cached.tabs, cached.savedAt, true), "cached");
  }
  if (tabs.length === 0) {
    onUpdate(emptyData(), "fresh");
    return;
  }

  // 2. Fresh data, all tabs in parallel
  const results = await Promise.all(tabs.map((tab) => fetchTab(hub.sheetId, tab)));
  const fresh: Partial<Record<TabName, RawRow[]>> = {};
  const broken: TabName[] = [];
  let reachedGoogle = false;

  for (const result of results) {
    if (!result.ok) {
      if (result.reason === "private" || result.reason === "http") {
        reachedGoogle = true;
        broken.push(result.tab);
      }
      continue;
    }
    reachedGoogle = true;
    // A missing tab makes Google send the FIRST tab: check the columns match
    const required = REQUIRED_COLUMNS[result.tab];
    if (!required.some((col) => result.headers.includes(col))) {
      broken.push(result.tab);
      continue;
    }
    fresh[result.tab] = result.rows;
  }

  // 3. Network failed completely → fall back to the saved copy
  if (!reachedGoogle) {
    if (cached && cacheCovers) onUpdate(buildData(cached.tabs, cached.savedAt, true), "offline");
    else onUpdate(emptyData(), "offline-empty");
    return;
  }

  // 4. Save and show fresh data (broken tabs fall back to their saved copy if any)
  const savedAt = writeCache(hubId, fresh);
  const merged = { ...(cached?.tabs ?? {}), ...fresh };
  const data = buildData(merged, savedAt, false);
  data.broken = broken;
  onUpdate(data, "fresh");
}

/**
 * Is there an announcement newer than the student's last visit to News?
 * Uses the saved copy, so it works on every page (even ones that don't load announcements).
 */
export function hasUnreadNews(hubId: string, lastSeenIso: string | null): boolean {
  const rows = readCache(hubId)?.tabs.announcements;
  if (!rows?.length) return false;
  const newest = Math.max(...cleanAnnouncements(rows).items.map((a) => atTime(a.date, a.time ?? 0).getTime()));
  if (!Number.isFinite(newest)) return false;
  if (!lastSeenIso) return true; // never opened News on this phone
  return newest > new Date(lastSeenIso).getTime();
}
