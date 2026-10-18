// Home page: "What do I need to know today?" in 5 seconds.
// Spec: README section 16.3. Mockup: design/mockups/index.html

import { mountPage } from "../app";
import { L } from "../config/labels";
import {
  CATEGORY_CARD, categoryTag, courseMap, deadlineTarget, deadlineTypeLabel, iconBox, list, row, section, sectionTitle,
} from "../components/ui";
import { atTime, countdown, dayCode, formatDate, formatLongDate, formatTime, isoWeek, minutesNow, relativeDay, relativeTime, today } from "../lib/dates";
import { el } from "../lib/dom";
import { hubLink, prettyCode } from "../lib/links";
import type { Course, Deadline, HubData, Slot } from "../types/sheet";

mountPage({
  page: "home",
  tabs: ["info", "announcements", "deadlines", "timetable", "courses", "handouts", "past_questions"],
  render: ({ hub, data }) => {
    const courses = courseMap(data.courses);
    return [
      // 1. Header
      el("header", { class: "pt-6 pb-1" },
        el("p", { class: "text-[13px] text-muted" }, hub.subtitle),
        el("h1", { class: "text-[26px] font-bold tracking-tight" }, hub.name),
        el("p", { class: "text-[13px] text-muted" }, formatLongDate(new Date())),
      ),
      pinnedCard(data),
      data.info.welcome ? el("p", { class: "card mt-4 text-sm text-muted" }, data.info.welcome) : null,
      nextDeadline(data.deadlines, courses),
      todaySection(data.timetable, courses),
      quickLinks(data),
      newHandouts(data),
    ];
  },
});

// 2. Pinned announcement (newest pinned, not expired)
function pinnedCard(data: HubData): HTMLElement | null {
  const pinned = data.announcements.find((a) => a.pinned);
  if (!pinned) return null;
  const posted = atTime(pinned.date, pinned.time ?? 0);
  return section(
    el("a", { href: hubLink("announcement", { id: String(pinned.id) }), class: `card ${CATEGORY_CARD[pinned.category]} flex flex-col gap-2` },
      el("span", {}, categoryTag(pinned.category, "Pinned · ")),
      el("h2", { class: "text-[17px] leading-snug font-semibold" }, pinned.title),
      el("p", { class: "text-[13px] text-muted" }, `${pinned.author ?? L("manager")} · ${relativeTime(posted)}`),
    ),
  );
}

// 3. Next deadline with a live countdown
function nextDeadline(deadlines: Deadline[], courses: Map<string, Course>): HTMLElement {
  const now = Date.now();
  const next = deadlines.find((d) => !d.done && deadlineTarget(d).getTime() > now);
  if (!next) {
    return section(el("a", { href: hubLink("deadlines"), class: "card block text-muted" }, "No upcoming deadlines. Enjoy it while it lasts 😄"));
  }
  const target = deadlineTarget(next);
  const c = countdown(target);
  const iso = target.toISOString();
  const course = next.code ? courses.get(next.code) : undefined;
  const heading = next.code ? `${prettyCode(next.code)} ${next.title}` : next.title;
  const details = [deadlineTypeLabel(next.type), course?.title, `${formatDate(next.date)}${next.time !== null ? `, ${formatTime(next.time)}` : ""}`]
    .filter(Boolean).join(" · ");
  const box = (value: string, unit: "days" | "hours" | "mins") =>
    el("div", { class: "flex-1 rounded-[10px] bg-white/15 py-2 text-center" },
      el("b", { class: "block text-[22px] leading-tight font-bold", "data-countdown": iso, "data-part": unit }, value),
      el("span", { class: "text-[11px] opacity-85" }, unit),
    );
  return section(
    el("a", { href: hubLink("deadlines"), class: "card card-accent block" },
      el("p", { class: "text-[13px] text-white/80" }, "Next deadline"),
      el("h2", { class: "mt-0.5 text-lg font-semibold" }, heading),
      el("p", { class: "text-[13px] text-white/80" }, details),
      el("div", { class: "mt-3 flex gap-2", "aria-label": `${c.days} days ${c.hours} hours ${c.mins} minutes left` },
        box(String(c.days), "days"), box(String(c.hours).padStart(2, "0"), "hours"), box(String(c.mins).padStart(2, "0"), "mins"),
      ),
    ),
  );
}

// 4. Today's classes
function slotsFor(timetable: Slot[], date: Date): Slot[] {
  const code = dayCode(date);
  const week = isoWeek(date) % 2 === 0 ? "even" : "odd";
  return timetable.filter((s) => s.day === code && (s.week === "all" || s.week === week) && s.type !== "free");
}

function todaySection(timetable: Slot[], courses: Map<string, Course>): HTMLElement {
  const slots = slotsFor(timetable, today());
  const now = minutesNow();
  const content = slots.length
    ? list(slots.map((s) => {
        const course = courses.get(s.code);
        const isNow = s.start <= now && now < s.end;
        return row({
          href: course ? hubLink("course", { code: s.code }) : undefined,
          lead: iconBox(formatTime(s.start)),
          title: (s.title ?? course?.title ?? prettyCode(s.code)) + (s.type === "lab" ? " · Lab" : s.type === "tutorial" ? " · Tutorial" : ""),
          meta: [prettyCode(s.code), s.venue].filter(Boolean).join(" · "),
          trail: isNow ? el("span", { class: "tag tag-ok" }, "Now") : now >= s.end ? el("span", { class: "tag tag-plain" }, "Done") : null,
        });
      }))
    : el("a", { href: hubLink("timetable"), class: "card block text-muted" }, "No classes today. Rest well 😴");
  return section(sectionTitle("Today", { label: "Full timetable", href: hubLink("timetable") }), content);
}

// 5. Quick links with live counts
function quickLinks(data: HubData): HTMLElement {
  const tile = (title: string, sub: string, href: string) =>
    el("a", { href, class: "card flex min-h-[92px] flex-col justify-between p-3.5" },
      el("b", { class: "font-semibold" }, title), el("span", { class: "text-xs text-muted" }, sub));
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
  const parents = L("parents");
  return section(
    sectionTitle("Quick links"),
    el("div", { class: "grid grid-cols-2 gap-2.5" },
      tile("Handouts", plural(data.handouts.length, "file"), hubLink("handouts")),
      tile(L("pastQuestions"), plural(data.past_questions.length, "paper"), hubLink("past-questions")),
      tile(L("courses"), `${data.courses.length} this ${hubLabelPeriod()}`, hubLink("courses")),
      parents
        ? tile(parents, "Dates, fees, meetings", hubLink("parents"))
        : tile(L("classInfo"), L("classInfoHint"), hubLink("class-info")),
    ),
  );
}
function hubLabelPeriod(): string {
  return L("parents") ? "year" : "semester";
}

// 6. Newest handouts
function newHandouts(data: HubData): HTMLElement | null {
  if (!data.handouts.length) return null;
  const courses = courseMap(data.courses);
  return section(
    sectionTitle("New handouts", { label: "See all", href: hubLink("handouts") }),
    list(data.handouts.slice(0, 3).map((h) =>
      row({
        href: h.link,
        external: true,
        lead: iconBox(h.type.toUpperCase(), "pdf"),
        title: `${prettyCode(h.code)} · ${h.title}`,
        meta: [h.size, h.dateAdded ? relativeDay(h.dateAdded) : null].filter(Boolean).join(" · ") || courses.get(h.code)?.title,
      }),
    )),
  );
}
