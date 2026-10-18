// Timetable: the week's classes, today first.
// Spec: README section 16.6. Mockup: design/mockups/timetable.html

import { mountPage } from "../app";
import { emptyState } from "../components/states";
import { courseMap } from "../components/ui";
import { DAY_CODES, dayCode, formatDate, formatTime, isoWeek, minutesNow, today } from "../lib/dates";
import { el, mount } from "../lib/dom";
import { hubLink, param, prettyCode } from "../lib/links";
import type { Course, DayCode, Slot } from "../types/sheet";

const DAY_NAMES: Record<DayCode, string> = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday" };

mountPage({
  page: "timetable",
  title: "Timetable",
  tabs: ["timetable", "courses", "info"],
  render: ({ data }) => {
    const courses = courseMap(data.courses);
    const days: DayCode[] = data.timetable.some((s) => s.day === "Sat") ? [...DAY_CODES] : DAY_CODES.slice(0, 5);
    const dates = weekDates(days);

    // Which day opens first: ?day=, else today, else Monday
    const fromUrl = param("day");
    const todayCode = dayCode(today());
    let selected: DayCode =
      days.find((d) => d.toLowerCase() === fromUrl?.toLowerCase()) ??
      (todayCode && days.includes(todayCode) ? todayCode : "Mon");

    const panel = el("div", { class: "mt-4 flex flex-col gap-3", role: "tabpanel", id: "day-panel" });
    const tabButtons = days.map((d) => {
      const date = dates.get(d) ?? today();
      const b = el("button", {
        type: "button", role: "tab", id: `tab-${d}`, "aria-controls": "day-panel",
        class: "group flex min-h-[60px] flex-col items-center justify-center rounded-box border border-line bg-surface text-xs text-muted aria-selected:border-ink aria-selected:bg-ink aria-selected:text-white/75",
      }, d, el("b", { class: "text-[17px] font-semibold text-ink group-aria-selected:text-white" }, String(date.getDate())));
      b.addEventListener("click", () => select(d));
      return b;
    });

    const select = (d: DayCode, focus = false) => {
      selected = d;
      tabButtons.forEach((b, i) => {
        const on = days[i] === d;
        b.setAttribute("aria-selected", String(on));
        b.tabIndex = on ? 0 : -1;
        if (on && focus) b.focus();
      });
      panel.setAttribute("aria-labelledby", `tab-${d}`);
      const url = new URL(location.href);
      url.searchParams.set("day", d);
      history.replaceState(null, "", url);
      mount(panel, daySlots(data.timetable, d, dates.get(d) ?? today(), courses));
    };

    // Arrow keys move between days (accessibility)
    const tablist = el("div", {
      class: `grid gap-1.5 ${days.length === 6 ? "grid-cols-6" : "grid-cols-5"}`, role: "tablist", "aria-label": "Day of the week",
    }, tabButtons);
    tablist.addEventListener("keydown", (e) => {
      const i = days.indexOf(selected);
      if (e.key === "ArrowRight") select(days[(i + 1) % days.length] ?? "Mon", true);
      if (e.key === "ArrowLeft") select(days[(i - 1 + days.length) % days.length] ?? "Mon", true);
    });

    select(selected);

    const updatedBy = data.info.updated_by;
    const savedAt = data.savedAt ? new Date(data.savedAt) : null;
    return [
      el("div", { class: "mt-4" }, tablist),
      panel,
      el("p", { class: "mt-6 text-center text-xs text-muted" },
        [updatedBy ? `Kept up to date by ${updatedBy}` : null, savedAt ? `Loaded ${formatDate(savedAt)}, ${formatTime(savedAt.getHours() * 60 + savedAt.getMinutes())}` : null]
          .filter(Boolean).join(" · ")),
    ];
  },
});

/** The date of each weekday in the current week (on Sunday: next week). */
function weekDates(days: DayCode[]): Map<DayCode, Date> {
  const t = today();
  const monday = new Date(t);
  monday.setDate(t.getDate() + (t.getDay() === 0 ? 1 : 1 - t.getDay()));
  return new Map(days.map((d, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return [d, date] as const;
  }));
}

function daySlots(timetable: Slot[], day: DayCode, date: Date, courses: Map<string, Course>): HTMLElement[] {
  const week = isoWeek(date) % 2 === 0 ? "even" : "odd";
  const slots = timetable.filter((s) => s.day === day && (s.week === "all" || s.week === week));
  if (!slots.length) return [emptyState(`No classes on ${DAY_NAMES[day]}.`)];

  const isToday = date.getTime() === today().getTime();
  const now = minutesNow();
  const out: HTMLElement[] = [];
  slots.forEach((s, i) => {
    const prev = slots[i - 1];
    // Gap of an hour or more between classes → show it as a free period
    if (prev && s.start - prev.end >= 60) out.push(freeSlot(prev.end, s.start));
    const clash = prev !== undefined && s.start < prev.end;
    out.push(slotCard(s, courses.get(s.code), { isNow: isToday && s.start <= now && now < s.end, isPast: isToday && now >= s.end, clash }));
  });
  return out;
}

function timeColumn(start: number, end: number): HTMLElement {
  return el("p", { class: "pt-3.5 text-right text-[13px] leading-tight text-muted" },
    el("b", { class: "block text-sm font-semibold text-ink" }, formatTime(start)), formatTime(end));
}

function freeSlot(start: number, end: number): HTMLElement {
  return el("div", { class: "grid grid-cols-[58px_1fr] gap-3" },
    timeColumn(start, end),
    el("div", { class: "rounded-card border border-dashed border-line p-4 text-sm text-muted" }, "Free period"));
}

function slotCard(s: Slot, course: Course | undefined, state: { isNow: boolean; isPast: boolean; clash: boolean }): HTMLElement {
  const typeLabel = s.type === "lab" ? " · LAB" : s.type === "tutorial" ? " · TUTORIAL" : "";
  const border = s.type === "lab" ? "border-l-ok" : s.type === "tutorial" ? "border-l-exam" : "border-l-accent";
  const codeColour = s.type === "lab" ? "text-ok" : s.type === "tutorial" ? "text-exam" : "text-accent-ink";
  const teacher = s.teacher ?? course?.teacher;
  const body = [
    el("div", { class: "flex items-center justify-between gap-2" },
      el("span", { class: `text-xs font-semibold tracking-wide ${codeColour}` }, prettyCode(s.code) + typeLabel),
      state.isNow ? el("span", { class: "tag tag-ok" }, "Now") : state.clash ? el("span", { class: "tag tag-urgent" }, "Clash") : null,
    ),
    el("p", { class: "mt-0.5 font-semibold" }, s.title ?? course?.title ?? prettyCode(s.code)),
    el("p", { class: "text-[13px] text-muted" }, [s.venue, teacher].filter(Boolean).join(" · ")),
  ];
  const cls = `card block border-l-4 ${border} ${state.isNow ? "ring-2 ring-accent-soft" : ""} ${state.isPast ? "opacity-60" : ""}`;
  return el("div", { class: "grid grid-cols-[58px_1fr] gap-3" },
    timeColumn(s.start, s.end),
    course ? el("a", { class: cls, href: hubLink("course", { code: s.code }) }, body) : el("div", { class: cls }, body),
  );
}
