// mountPage(): the shared starting point of every hub page in app/.
// It does the boring work once (find the hub, check it's active, draw the
// top bar + bottom menu, load the data, show loading/offline states) and
// then calls the page's own render() with the data.
//
// A page file then only describes its content:
//
//   mountPage({
//     page: "timetable",
//     title: "Timetable",
//     tabs: ["timetable", "courses"],
//     render: ({ data }) => [ ...elements built from data.timetable ... ],
//   });

import { registerServiceWorker } from "./lib/pwa";
import "./styles/main.css";
import { HUBS, HUB_ID_PATTERN } from "./config/hubs";
import { setMode } from "./config/labels";
import { applyBranding } from "./components/branding";
import { startLiveTimers } from "./components/live";
import { bottomNav, setNewsDot, topBar } from "./components/nav";
import { banner, fullMessage, offlineMessage, skeleton } from "./components/states";
import { hasUnreadNews, loadHub, type LoadStatus } from "./lib/data";
import { $, el, mount, type Child } from "./lib/dom";
import { hubLink, param, siteLink, type PageId } from "./lib/links";
import { prefs } from "./lib/cache";
import type { HubConfig } from "./types/hub";
import type { HubData, TabName } from "./types/sheet";

export interface PageContext {
  hubId: string;
  hub: HubConfig;
  data: HubData;
  status: LoadStatus;
}

export interface PageOptions {
  page: PageId;
  /** Title in the top bar. Leave out for Home, which draws its own header. */
  title?: string | (() => string);
  /** Page the back arrow goes to. */
  back?: PageId;
  /** Sheet tabs this page needs (only these are downloaded). */
  tabs: TabName[];
  /** Hide the bottom menu (Paused page). */
  noNav?: boolean;
  render: (ctx: PageContext) => Child;
}

const STALE_AFTER_DAYS = 7;

export function mountPage(options: PageOptions): void {
  registerServiceWorker();
  // 1. Which hub? Bad or missing → 404. Inactive → Paused.
  const hubId = param("hub") ?? prefs.get("lastHub");
  const hub = hubId && HUB_ID_PATTERN.test(hubId) ? HUBS[hubId] : undefined;
  if (!hubId || !hub) {
    location.replace(siteLink("404.html"));
    return;
  }
  if (!hub.active && options.page !== "paused") {
    location.replace(hubLink("paused", {}, hubId));
    return;
  }
  // Pages opened without ?hub= (e.g. from the installed app icon) get it added back
  if (!param("hub")) history.replaceState(null, "", hubLink(options.page, {}, hubId));
  prefs.set("lastHub", hubId);
  // School directory: "Continue to my class" next time
  if (hub.schoolId) prefs.set(`schoolHub:${hub.schoolId}`, hubId);

  // 2. Mode + branding
  setMode(hub.mode);
  const title = typeof options.title === "function" ? options.title() : options.title;
  applyBranding(hub, title);

  // 3. Page shell: top bar, main area, bottom menu
  const app = $("#app");
  const main = el("main", { class: `wrap ${options.noNav ? "pb-10" : "pb-28"}`, id: "main" });
  mount(app, title ? topBar(title, options.back) : null, main, options.noNav ? null : bottomNav(options.page));
  mount(main, skeleton());
  startLiveTimers();

  // 4. Load data and render (possibly twice: saved copy, then fresh).
  // queueMicrotask waits until the page file has fully loaded first, so every
  // helper it defines (even below the mountPage call) is ready when render() runs.
  queueMicrotask(() => void loadHub(hubId, hub, options.tabs, (data, status) => {
    if (status === "offline-empty") {
      mount(main, fullMessage(
        "Connect to the internet once",
        "Your class hub needs data the first time it opens. After that, it works offline too.",
        { label: "Try again", onClick: () => location.reload() },
      ));
      return;
    }
    const notices: Child[] = [];
    if (status === "offline") {
      const ageDays = (Date.now() - new Date(data.savedAt).getTime()) / 86400000;
      notices.push(banner(ageDays > STALE_AFTER_DAYS ? "stale" : "offline",
        ageDays > STALE_AFTER_DAYS ? `${offlineMessage(data.savedAt)} This info may be out of date.` : offlineMessage(data.savedAt)));
    }
    try {
      mount(main, notices, options.render({ hubId, hub, data, status }));
      // Red dot on News (render() of the News page updates "last seen" first)
      setNewsDot(hasUnreadNews(hubId, prefs.get(`lastSeenNews:${hubId}`)));
    } catch (error) {
      // A page bug should never leave a blank screen
      console.error(error);
      mount(main, notices, fullMessage("Something went wrong", "Please refresh the page. If it keeps happening, tell your delegate."));
    }
  }));
}
