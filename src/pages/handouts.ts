// Handouts & notes: find any note quickly.
// Spec: README section 16.10. Mockup: design/mockups/handouts.html

import { L } from "../config/labels";
import { mountPage } from "../app";
import { emptyState } from "../components/states";
import { icon } from "../components/icons";
import { chips, courseMap, iconBox, list, row, section } from "../components/ui";
import { relativeDay, today } from "../lib/dates";
import { el, mount } from "../lib/dom";
import { param, prettyCode } from "../lib/links";
import type { Course, Handout } from "../types/sheet";

/** Lowercase + remove accents, so "théorème" matches "theoreme". */
const normalise = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

mountPage({
  page: "handouts",
  title: "Handouts & notes",
  back: "more",
  tabs: ["handouts", "courses"],
  render: ({ data }) => {
    if (!data.handouts.length) return el("div", { class: "mt-5" }, emptyState(`No handouts yet. ${L("manager")} will add them here.`));

    const courses = courseMap(data.courses);
    const codes = [...new Set(data.handouts.map((h) => h.code))].sort();
    const fromUrl = param("code")?.toUpperCase();
    let code = fromUrl && codes.includes(fromUrl) ? fromUrl : "all";
    let query = "";

    const results = el("div", {});
    const draw = () => mount(results, groups(data.handouts, courses, code, query));

    const input = el("input", {
      type: "search", id: "search", placeholder: "Search notes, chapters...", autocomplete: "off",
      class: "min-w-0 flex-1 border-0 bg-transparent text-ink outline-none placeholder:text-muted",
    });
    input.addEventListener("input", () => {
      query = input.value;
      draw();
    });
    draw();

    return [
      el("label", { for: "search", class: "sr-only" }, "Search handouts"),
      el("div", { class: "mt-4 flex min-h-12 items-center gap-2.5 rounded-full border border-line bg-surface px-4 text-muted focus-within:outline-2 focus-within:outline-accent" },
        icon("search", 18), input),
      el("div", { class: "mt-3" }, chips(
        [{ value: "all", label: "All" }, ...codes.map((c) => ({ value: c, label: prettyCode(c) }))],
        code,
        (value) => { code = value; draw(); },
        "Filter by course",
        "code",
      )),
      results,
      el("p", { class: "mt-6 text-center text-xs text-muted" }, "Files open from Google Drive. Shared by the class."),
    ];
  },
});

function groups(all: Handout[], courses: Map<string, Course>, code: string, query: string): HTMLElement[] {
  const q = normalise(query.trim());
  const matches = all.filter((h) => {
    if (code !== "all" && h.code !== code) return false;
    if (!q) return true;
    const haystack = normalise([h.title, h.chapter ?? "", h.code, prettyCode(h.code), courses.get(h.code)?.title ?? ""].join(" "));
    return q.split(/\s+/).every((word) => haystack.includes(word));
  });
  if (!matches.length) {
    return [el("div", { class: "mt-5" }, emptyState(q ? `Nothing matches "${query.trim()}". Try another word.` : "No handouts for this course yet."))];
  }

  // Group by course, in course-code order
  const byCourse = new Map<string, Handout[]>();
  for (const h of matches) byCourse.set(h.code, [...(byCourse.get(h.code) ?? []), h]);

  const recent = today().getTime() - 3 * 86400000;
  return [...byCourse.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([c, items]) => {
    const course = courses.get(c);
    return section(
      el("div", { class: "sec-title" },
        el("h2", {}, course ? `${prettyCode(c)} · ${course.title}` : prettyCode(c)),
        el("span", { class: "text-xs text-muted" }, `${items.length} file${items.length === 1 ? "" : "s"}`)),
      list(items.map((h) => row({
        href: h.link,
        external: true,
        lead: iconBox(h.type.toUpperCase(), h.type === "pdf" ? "pdf" : ""),
        title: h.title,
        meta: [h.size, h.dateAdded ? relativeDay(h.dateAdded) : null].filter(Boolean).join(" · ") || null,
        trail: h.dateAdded && h.dateAdded.getTime() >= recent ? el("span", { class: "tag tag-ok" }, "New") : null,
      }))),
    );
  });
}

