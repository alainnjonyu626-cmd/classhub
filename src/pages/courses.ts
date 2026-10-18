// Courses / Subjects: all courses this semester (or subjects this year).
// Spec: README section 16.8. Mockup: design/mockups/courses.html

import { mountPage } from "../app";
import { L } from "../config/labels";
import { emptyState } from "../components/states";
import { chevron } from "../components/ui";
import { el } from "../lib/dom";
import { hubLink, prettyCode } from "../lib/links";
import type { Slot } from "../types/sheet";

mountPage({
  page: "courses",
  title: () => L("courses"),
  back: "more",
  tabs: ["courses", "timetable"],
  render: ({ data }) => {
    if (!data.courses.length) return el("div", { class: "mt-5" }, emptyState(`${L("courses")} haven't been added yet.`));

    const creditsWord = L("credits"); // null in secondary mode
    const totalCredits = data.courses.reduce((sum, c) => sum + (c.credits ?? 0), 0);
    const hours = weeklyHours(data.timetable, new Set(data.courses.map((c) => c.code)));

    const stat = (value: string | number, label: string) =>
      el("div", { class: "text-center" }, el("b", { class: "text-[22px]" }, String(value)), el("p", { class: "text-xs text-muted" }, label));

    return [
      el("div", { class: "card mt-4 flex justify-around" },
        stat(data.courses.length, L("courses")),
        creditsWord && totalCredits ? stat(totalCredits, "Credits") : null,
        hours ? stat(hours, "Hours / week") : null,
      ),
      el("div", { class: "mt-4 flex flex-col gap-2.5" },
        data.courses.map((c) =>
          el("a", { href: hubLink("course", { code: c.code }), class: "card flex items-center gap-3" },
            el("div", { class: "min-w-0 flex-1" },
              el("span", { class: "text-xs font-semibold tracking-wide text-accent-ink" },
                prettyCode(c.code) + (creditsWord && c.credits ? ` · ${c.credits} ${creditsWord}` : "")),
              el("p", { class: "font-semibold" }, c.title),
              c.teacher ? el("p", { class: "text-sm text-muted" }, c.teacher) : null,
            ),
            chevron(),
          )),
      ),
    ];
  },
});

/** Hours per week from the timetable (only slots whose code is a known course). */
function weeklyHours(timetable: Slot[], codes: Set<string>): number {
  const minutes = timetable
    .filter((s) => codes.has(s.code) && s.type !== "free" && s.week === "all")
    .reduce((sum, s) => sum + (s.end - s.start), 0);
  return Math.round(minutes / 60);
}
