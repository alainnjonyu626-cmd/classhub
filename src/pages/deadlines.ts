// Deadlines & tests: never miss one.
// Spec: README section 16.7. Mockup: design/mockups/deadlines.html

import { mountPage } from "../app";
import { emptyState } from "../components/states";
import { chips, deadlineIcon, deadlineTarget, deadlineTypeLabel, dueBadge, groupLabel, iconBox, list, row, section } from "../components/ui";
import { formatDate, formatTime } from "../lib/dates";
import { el, mount } from "../lib/dom";
import { hubLink, param, prettyCode } from "../lib/links";
import type { Deadline } from "../types/sheet";

type Filter = "upcoming" | "tests" | "assignments" | "exams" | "done";

const OPTIONS: { value: Filter; label: string }[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "tests", label: "Tests" },
  { value: "assignments", label: "Assignments" },
  { value: "exams", label: "Exams" },
  { value: "done", label: "Done" },
];

const MATCH: Record<Exclude<Filter, "upcoming" | "done">, (d: Deadline) => boolean> = {
  tests: (d) => d.type === "test" || d.type === "sequence" || d.type === "mock",
  assignments: (d) => d.type === "assignment",
  exams: (d) => d.type === "exam",
};

const EMPTY: Record<Filter, string> = {
  upcoming: "No upcoming deadlines. Enjoy it while it lasts 😄",
  tests: "No tests coming up.",
  assignments: "No assignments due.",
  exams: "No exams scheduled yet.",
  done: "Nothing finished yet.",
};

mountPage({
  page: "deadlines",
  title: "Deadlines & tests",
  tabs: ["deadlines", "courses", "announcements"],
  render: ({ data }) => {
    const announcementIds = new Set(data.announcements.map((a) => a.id));
    const fromUrl = param("filter") as Filter | null;
    const initial: Filter = OPTIONS.some((o) => o.value === fromUrl) ? (fromUrl as Filter) : "upcoming";
    const results = el("div", {});
    const draw = (filter: Filter) => mount(results, view(data.deadlines, filter, announcementIds));
    draw(initial);
    return [el("div", { class: "mt-4" }, chips(OPTIONS, initial, draw, "Filter deadlines")), results];
  },
});

function isFinished(d: Deadline): boolean {
  return d.done || deadlineTarget(d).getTime() <= Date.now();
}

function view(all: Deadline[], filter: Filter, announcementIds: Set<number>): HTMLElement[] {
  const finished = all.filter(isFinished).reverse(); // most recent first
  if (filter === "done") {
    return finished.length ? [section(list(finished.map((d) => doneRow(d))))] : [el("div", { class: "mt-4" }, emptyState(EMPTY.done))];
  }

  const open = all.filter((d) => !isFinished(d) && (filter === "upcoming" || MATCH[filter](d)));
  const weekFromNow = Date.now() + 7 * 86400000;
  const thisWeek = open.filter((d) => deadlineTarget(d).getTime() <= weekFromNow);
  const later = open.filter((d) => deadlineTarget(d).getTime() > weekFromNow);

  const out: HTMLElement[] = [];
  if (!open.length) out.push(el("div", { class: "mt-4" }, emptyState(EMPTY[filter])));
  if (thisWeek.length) out.push(section(groupLabel("This week"), list(thisWeek.map((d) => openRow(d, announcementIds)))));
  if (later.length) out.push(section(groupLabel("Later"), list(later.map((d) => openRow(d, announcementIds)))));
  if (filter === "upcoming" && finished.length) out.push(doneGroup(finished));
  return out;
}

/** "CSC 203 · Assignment 2" (course code first, so the meta line doesn't repeat it) */
function title(d: Deadline): string {
  return d.code ? `${prettyCode(d.code)} · ${d.title}` : d.title;
}

function meta(d: Deadline): string {
  return [
    deadlineTypeLabel(d.type),
    `${formatDate(d.date)}${d.time !== null ? `, ${formatTime(d.time)}` : ""}`,
    d.venue,
  ].filter(Boolean).join(" · ");
}

function openRow(d: Deadline, announcementIds: Set<number>): HTMLElement {
  const base = { lead: deadlineIcon(d.type), title: title(d), meta: meta(d), trail: dueBadge(deadlineTarget(d)) };
  // Linked to an announcement → open it
  if (d.announcementId !== null && announcementIds.has(d.announcementId)) {
    return row({ ...base, href: hubLink("announcement", { id: String(d.announcementId) }) });
  }
  // Has details → tap to expand them in place
  if (d.details) {
    return el("details", { class: "group border-t border-line first:border-t-0" },
      el("summary", { class: "cursor-pointer list-none [&::-webkit-details-marker]:hidden" }, row({ ...base, class: "border-t-0" })),
      el("p", { class: "-mt-1 px-4 pb-3.5 pl-[70px] text-sm text-muted" }, d.details),
    );
  }
  return row(base);
}

function doneRow(d: Deadline): HTMLElement {
  return row({
    lead: iconBox("check", "ok"),
    title: title(d),
    meta: `${d.done ? "Done" : "Passed"} · ${formatDate(d.date)}`,
    class: "[&_.row-title]:text-muted [&_.row-title]:line-through",
  });
}

/** Done items, collapsed after 5 with a "Show more" button. */
function doneGroup(finished: Deadline[]): HTMLElement {
  const shown = finished.slice(0, 5);
  const box = list(shown.map(doneRow));
  const wrapper = section(groupLabel("Done"), box);
  if (finished.length > 5) {
    const more = el("button", { type: "button", class: "btn btn-light btn-sm mt-3" }, `Show ${finished.length - 5} more`);
    more.addEventListener("click", () => {
      mount(box, finished.map(doneRow));
      more.remove();
    });
    wrapper.append(more);
  }
  return wrapper;
}
