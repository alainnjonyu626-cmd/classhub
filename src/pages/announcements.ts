// Announcements: every message, filterable, pinned on top.
// Spec: README section 16.4. Mockup: design/mockups/announcements.html

import { mountPage } from "../app";
import { L } from "../config/labels";
import { emptyState } from "../components/states";
import { CATEGORY_CARD, categoryTag, chips, groupLabel, list, section } from "../components/ui";
import { prefs } from "../lib/cache";
import { atTime, relativeDay, relativeTime, today } from "../lib/dates";
import { el, mount } from "../lib/dom";
import { hubLink, param } from "../lib/links";
import type { Announcement, AnnouncementCategory } from "../types/sheet";

type Filter = "all" | AnnouncementCategory;

const EMPTY: Record<Filter, string> = {
  all: "No announcements yet.",
  urgent: "No urgent announcements. All calm 😌",
  exam: "No test or exam news right now.",
  general: "No general announcements.",
  social: "No social announcements.",
  parents: "No announcements for parents.",
};

mountPage({
  page: "announcements",
  title: "Announcements",
  tabs: ["announcements"],
  render: ({ hubId, data }) => {
    // Opening this page clears the red dot on the News tab
    prefs.set(`lastSeenNews:${hubId}`, new Date().toISOString());

    const options: { value: Filter; label: string }[] = [
      { value: "all", label: "All" },
      { value: "urgent", label: "Urgent" },
      { value: "exam", label: "Tests & exams" },
      { value: "general", label: "General" },
      { value: "social", label: "Social" },
    ];
    if (L("parents")) options.push({ value: "parents", label: "Parents" });

    const fromUrl = param("filter") as Filter | null;
    const initial: Filter = options.some((o) => o.value === fromUrl) ? (fromUrl as Filter) : "all";
    const results = el("div", {});
    const draw = (filter: Filter) => mount(results, groups(data.announcements, filter));
    draw(initial);

    return [
      el("div", { class: "mt-4" }, chips(options, initial, draw, "Filter announcements")),
      results,
    ];
  },
});

function groups(all: Announcement[], filter: Filter): HTMLElement[] {
  const items = filter === "all" ? all : all.filter((a) => a.category === filter);
  if (!items.length) return [el("div", { class: "mt-4" }, emptyState(EMPTY[filter]))];

  const weekAgo = today().getTime() - 6 * 86400000;
  const pinned = items.filter((a) => a.pinned);
  const rest = items.filter((a) => !a.pinned);
  const thisWeek = rest.filter((a) => a.date.getTime() >= weekAgo);
  const earlier = rest.filter((a) => a.date.getTime() < weekAgo);

  const out: HTMLElement[] = [];
  if (pinned.length) {
    out.push(section(groupLabel("Pinned"), el("div", { class: "flex flex-col gap-2.5" }, pinned.map(pinnedCard))));
  }
  if (thisWeek.length) out.push(section(groupLabel("This week"), list(thisWeek.map(item))));
  if (earlier.length) out.push(section(groupLabel("Earlier"), list(earlier.map(item))));
  return out;
}

function when(a: Announcement): string {
  return a.time !== null ? relativeTime(atTime(a.date, a.time)) : relativeDay(a.date);
}

/** First line of the body only. */
function preview(body: string): string {
  return body.split("\n").find((line) => line.trim() !== "") ?? "";
}

function pinnedCard(a: Announcement): HTMLElement {
  return el("a", { href: hubLink("announcement", { id: String(a.id) }), class: `card ${CATEGORY_CARD[a.category]} flex flex-col gap-1.5` },
    el("span", {}, categoryTag(a.category)),
    el("h2", { class: "text-base leading-snug font-semibold" }, a.title),
    el("p", { class: "truncate text-[13px] text-muted" }, preview(a.body)),
    el("p", { class: "text-xs text-muted" }, `${a.author ?? "Delegate"} · ${when(a)}`),
  );
}

function item(a: Announcement): HTMLElement {
  return el("a", { href: hubLink("announcement", { id: String(a.id) }), class: "row items-start" },
    el("div", { class: "flex min-w-0 flex-1 flex-col gap-1" },
      el("span", {}, categoryTag(a.category)),
      el("p", { class: "row-title line-clamp-2" }, a.title),
      el("p", { class: "row-meta truncate" }, `${preview(a.body)} · ${when(a)}`),
    ),
  );
}
