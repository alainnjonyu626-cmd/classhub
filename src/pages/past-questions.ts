// Past questions / past papers: practice by course and year.
// Spec: README section 16.11. Mockup: design/mockups/past-questions.html

import { mountPage } from "../app";
import { L } from "../config/labels";
import { emptyState } from "../components/states";
import { icon } from "../components/icons";
import { chips, courseMap, deadlineTarget, deadlineTypeLabel, groupLabel, iconBox, list, section } from "../components/ui";
import { formatDate } from "../lib/dates";
import { el, mount } from "../lib/dom";
import { hubLink, param, prettyCode, waChat } from "../lib/links";
import type { Course, Deadline, Leader, PaperKind, PastQuestion } from "../types/sheet";

const KIND_LABEL: Record<PaperKind, string> = { exam: "EXAM", ca: "CA", resit: "RESIT", sequence: "SEQ", mock: "MOCK", gce_practice: "GCE" };

mountPage({
  page: "past-questions",
  title: () => L("pastQuestions"),
  back: "more",
  tabs: ["past_questions", "deadlines", "courses", "leaders"],
  render: ({ data }) => {
    const courses = courseMap(data.courses);
    const codes = [...new Set(data.past_questions.map((p) => p.code))].sort();
    const fromUrl = param("code")?.toUpperCase();
    let code = fromUrl && codes.includes(fromUrl) ? fromUrl : "all";

    const results = el("div", {});
    const draw = () => mount(results, view(data.past_questions, data.deadlines, courses, code));
    draw();

    return [
      codes.length > 1
        ? el("div", { class: "mt-4" }, chips(
            [{ value: "all", label: "All" }, ...codes.map((c) => ({ value: c, label: prettyCode(c) }))],
            code, (value) => { code = value; draw(); }, "Filter by course", "code"))
        : null,
      results,
      askForPapers(data.leaders),
    ];
  },
});

function view(all: PastQuestion[], deadlines: Deadline[], courses: Map<string, Course>, code: string): HTMLElement[] {
  const papers = code === "all" ? all : all.filter((p) => p.code === code);
  const out: HTMLElement[] = [];

  // Smart hint: a test for this course is coming up in the next 7 days
  const soon = deadlines.find((d) => {
    const t = deadlineTarget(d).getTime();
    return !d.done && d.code !== null && (code === "all" || d.code === code)
      && ["test", "sequence", "mock", "exam"].includes(d.type) && t > Date.now() && t < Date.now() + 7 * 86400000
      && all.some((p) => p.code === d.code);
  });
  if (soon && soon.code) {
    const count = all.filter((p) => p.code === soon.code).length;
    out.push(section(el("div", { class: "card flex items-center gap-3 border-[#d6e0fa] bg-accent-soft" },
      el("div", { class: "icon-box bg-white" }, icon("cap", 20)),
      el("p", { class: "text-sm" },
        el("b", {}, `${prettyCode(soon.code)} ${deadlineTypeLabel(soon.type)} is on ${formatDate(soon.date)}.`),
        ` Practise with ${count === 1 ? "this paper" : `these ${count} papers`}.`),
    )));
  }

  if (!papers.length) {
    out.push(el("div", { class: "mt-5" }, emptyState(code === "all" ? "No past papers yet." : "No past papers for this course yet.")));
    return out;
  }

  // Group by year, newest first (already sorted by clean.ts)
  const byYear = new Map<string, PastQuestion[]>();
  for (const p of papers) byYear.set(p.year, [...(byYear.get(p.year) ?? []), p]);
  for (const [year, items] of byYear) {
    out.push(section(groupLabel(year), list(items.map((p) => paperRow(p, courses)))));
  }
  return out;
}

function paperRow(p: PastQuestion, courses: Map<string, Course>): HTMLElement {
  const isExam = ["exam", "resit", "mock", "gce_practice"].includes(p.kind);
  const course = courses.get(p.code);
  const meta = [course?.title, p.pages ? `${p.pages} page${p.pages === 1 ? "" : "s"}` : null, p.answersLink ? "Answers by the class" : null]
    .filter(Boolean).join(" · ");
  // Two separate links (paper + answers) side by side: links can't be nested
  return el("div", { class: "row" },
    iconBox(KIND_LABEL[p.kind], isExam ? "exam" : ""),
    el("a", { href: p.link, target: "_blank", rel: "noopener", class: "min-w-0 flex-1" },
      el("p", { class: "row-title" }, `${prettyCode(p.code)} · ${p.title}`),
      meta ? el("p", { class: "row-meta" }, meta) : null),
    p.answersLink
      ? el("a", { href: p.answersLink, target: "_blank", rel: "noopener", class: "tag tag-ok min-h-9 px-3" }, "Answers")
      : null,
  );
}

function askForPapers(leaders: Leader[]): HTMLElement {
  const contact = leaders.find((l) => l.whatsapp);
  const href = contact?.whatsapp
    ? waChat(contact.whatsapp, "Hello, I have a past paper to add to the class hub:")
    : hubLink("class-info");
  return section(el("div", { class: "card flex flex-col gap-2.5 text-center" },
    el("p", { class: "font-semibold" }, "Have a past paper we don't?"),
    el("p", { class: "text-[13px] text-muted" }, `Send a clear photo to ${contact ? contact.name : "the delegate"} and it'll be added for everyone.`),
    el("a", { href, class: "btn btn-light w-full", ...(contact ? { target: "_blank", rel: "noopener" } : {}) },
      contact ? `Send to ${contact.name} on WhatsApp` : "Contact the delegate"),
  ));
}
