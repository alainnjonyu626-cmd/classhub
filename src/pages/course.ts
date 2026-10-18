// One course / subject: everything about it in one place.
// Spec: README section 16.9. Mockup: design/mockups/course.html

import { mountPage } from "../app";
import { L } from "../config/labels";
import { fullMessage } from "../components/states";
import {
  avatar, categoryTag, chevron, deadlineTarget, deadlineTypeLabel, dueBadge, iconBox, list, row, section, sectionTitle,
} from "../components/ui";
import { DAY_CODES, formatDate, formatTime, relativeDay } from "../lib/dates";
import { el } from "../lib/dom";
import { hubLink, param, prettyCode } from "../lib/links";

mountPage({
  page: "course",
  title: () => {
    const c = param("code");
    return c ? prettyCode(c.toUpperCase()) : L("course");
  },
  back: "courses",
  tabs: ["courses", "timetable", "deadlines", "handouts", "past_questions", "announcements"],
  render: ({ data }) => {
    const code = param("code")?.toUpperCase().replace(/\s+/g, "") ?? "";
    const course = data.courses.find((c) => c.code === code);
    if (!course) {
      return fullMessage(`We couldn't find that ${L("course").toLowerCase()}`, "The link may be old or typed wrong.", {
        label: `See all ${L("courses").toLowerCase()}`, href: hubLink("courses"),
      });
    }

    const creditsWord = L("credits");
    const now = Date.now();
    const next = data.deadlines.find((d) => d.code === code && !d.done && deadlineTarget(d).getTime() > now);
    const slots = data.timetable.filter((s) => s.code === code && s.type !== "free")
      .sort((a, b) => DAY_CODES.indexOf(a.day) - DAY_CODES.indexOf(b.day) || a.start - b.start);
    const news = data.announcements.find((a) => a.code === code);
    const handouts = data.handouts.filter((h) => h.code === code);
    const papers = data.past_questions.filter((p) => p.code === code);

    return [
      // Title block
      el("section", { class: "mt-5" },
        el("span", { class: "text-xs font-semibold tracking-wide text-accent-ink" },
          [prettyCode(code), creditsWord && course.credits ? `${course.credits} ${creditsWord}` : null].filter(Boolean).join(" · ")),
        el("h2", { class: "mt-1 text-2xl leading-tight font-bold" }, course.title),
        course.description ? el("p", { class: "mt-1 text-muted" }, course.description) : null,
      ),

      // Teacher
      course.teacher
        ? el("section", { class: "mt-4" }, el("div", { class: "card flex flex-col gap-3" },
            el("div", { class: "flex items-center gap-3" },
              avatar(course.teacher, "soft"),
              el("div", {},
                el("p", { class: "font-semibold" }, course.teacher),
                el("p", { class: "text-[13px] text-muted" }, [L("teacher"), course.office ? `Office: ${course.office}` : null].filter(Boolean).join(" · ")))),
            course.officeHours ? el("p", { class: "text-[13px] text-muted" }, `Office hours: ${course.officeHours}`) : null,
          ))
        : null,

      // Next deadline
      next
        ? section(sectionTitle("Next deadline"),
            el("a", { href: hubLink("deadlines"), class: "card flex items-center gap-3" },
              el("div", { class: "min-w-0 flex-1" },
                el("p", { class: "font-semibold" }, next.title),
                el("p", { class: "text-[13px] text-muted" },
                  [next.title === deadlineTypeLabel(next.type) ? null : deadlineTypeLabel(next.type),
                   `${formatDate(next.date)}${next.time !== null ? `, ${formatTime(next.time)}` : ""}`, next.venue]
                    .filter(Boolean).join(" · "))),
              dueBadge(deadlineTarget(next))))
        : null,

      // Weekly classes
      slots.length
        ? section(sectionTitle("Weekly classes"), list(slots.map((s) => row({
            lead: iconBox(s.day.toUpperCase()),
            title: `${s.type === "lab" ? "Lab" : s.type === "tutorial" ? "Tutorial" : "Lecture"} · ${formatTime(s.start)} to ${formatTime(s.end)}`,
            meta: s.venue,
          }))))
        : null,

      // Latest announcement for this course
      news
        ? section(sectionTitle("Latest news"),
            el("a", { href: hubLink("announcement", { id: String(news.id) }), class: "card flex flex-col gap-1.5" },
              el("span", {}, categoryTag(news.category)),
              el("p", { class: "font-semibold" }, news.title),
              el("p", { class: "text-xs text-muted" }, relativeDay(news.date))))
        : null,

      // Handouts
      handouts.length
        ? section(
            sectionTitle("Handouts", { label: `See all ${handouts.length}`, href: hubLink("handouts", { code }) }),
            list(handouts.slice(0, 3).map((h) => row({
              href: h.link, external: true,
              lead: iconBox(h.type.toUpperCase(), h.type === "pdf" ? "pdf" : ""),
              title: h.title, meta: h.size,
            }))))
        : null,

      // Past questions
      papers.length
        ? section(el("a", { href: hubLink("past-questions", { code }), class: "card flex items-center gap-3" },
            iconBox("PQ", "exam"),
            el("div", { class: "min-w-0 flex-1" },
              el("p", { class: "font-semibold" }, L("pastQuestions")),
              el("p", { class: "text-[13px] text-muted" }, `${papers.length} paper${papers.length === 1 ? "" : "s"} for this ${L("course").toLowerCase()}`)),
            chevron()))
        : null,
    ];
  },
});
