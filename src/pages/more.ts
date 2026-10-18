// More: menu for everything not in the bottom nav, plus tools.
// Spec: README section 16.14. Mockup: design/mockups/more.html

import { mountPage } from "../app";
import { OWNER } from "../config/hubs";
import { L } from "../config/labels";
import { icon, type IconName } from "../components/icons";
import { chevron, iconBox, list, row, section } from "../components/ui";
import { clearCache } from "../lib/cache";
import { formatDate, formatTime } from "../lib/dates";
import { el } from "../lib/dom";
import { hubLink, siteLink, waChat, waShare } from "../lib/links";
import type { TabName } from "../types/sheet";

mountPage({
  page: "more",
  title: "More",
  tabs: ["info", "handouts", "past_questions", "courses", "leaders"],
  render: ({ hubId, hub, data }) => {
    const n = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;
    const menuRow = (iconName: IconName | string, variant: "" | "pdf" | "exam" | "ok", title: string, meta: string, href: string) =>
      row({ href, lead: iconBox(iconName, variant), title, meta, trail: chevron() });

    const parents = L("parents");
    const standalone = matchMedia("(display-mode: standalone)").matches;
    const hubUrl = location.origin + hubLink("home", {}, hubId);
    const reportTo = hub.contact ?? data.leaders.find((l) => l.whatsapp)?.whatsapp ?? null;

    // Share: phone share sheet when available, otherwise WhatsApp
    const shareButton = toolRow("share", "Share the hub link", "Send it to a classmate");
    shareButton.addEventListener("click", async () => {
      const text = `${hub.name}: announcements, timetable and deadlines for our class`;
      if (navigator.share) {
        try { await navigator.share({ title: hub.name, text, url: hubUrl }); } catch { /* cancelled */ }
      } else {
        window.open(waShare(`${text}\n${hubUrl}`), "_blank", "noopener");
      }
    });

    // Refresh: forget the saved copy and download again
    const refreshButton = toolRow("refresh", "Refresh data now", "Download the latest from the delegate");
    refreshButton.addEventListener("click", () => {
      clearCache(hubId);
      location.reload();
    });

    return [
      section(list(
        menuRow("PDF", "pdf", "Handouts & notes", n(data.handouts.length, "file"), hubLink("handouts")),
        menuRow("PQ", "exam", L("pastQuestions"), n(data.past_questions.length, "paper"), hubLink("past-questions")),
        menuRow("book", "", L("courses"), `${data.courses.length} this ${parents ? "year" : "semester"}`, hubLink("courses")),
        parents ? menuRow("calendar", "ok", parents, "Dates, fees, meetings", hubLink("parents")) : null,
        menuRow("people", "ok", L("classInfo"), "Leaders, groups, places", hubLink("class-info")),
      )),

      standalone
        ? null
        : section(el("div", { class: "card flex flex-col gap-2.5" },
            el("p", { class: "font-semibold" }, `Add ${hub.name} to your home screen`),
            el("p", { class: "text-[13px] text-muted" }, "Open it like an app, in one tap, even with no data."),
            el("a", { class: "btn btn-accent w-full", href: hubLink("help") }, "Show me how"))),

      section(list(
        shareButton,
        reportTo
          ? el("a", { class: "row", href: waChat(reportTo, `Hello, I found a mistake on ${hub.name}: `), target: "_blank", rel: "noopener" },
              iconBox("news"), el("div", { class: "min-w-0 flex-1" },
                el("p", { class: "row-title" }, "Report a mistake"),
                el("p", { class: "row-meta" }, "Wrong date or venue? Tell the delegate")))
          : null,
        refreshButton,
      )),

      sheetHealth(data.savedAt, data.skipped, data.broken, data.fromCache),

      // Your credit line: every student who opens the hub sees who built it
      el("p", { class: "mt-8 text-center text-xs text-muted" },
        "Built by ", el("b", {}, OWNER.name), " · Want a hub for your class? ",
        el("a", { href: siteLink(""), class: "font-semibold text-accent-ink" }, "Get one")),
    ];
  },
});

function toolRow(name: IconName, title: string, meta: string): HTMLButtonElement {
  return el("button", { type: "button", class: "row w-full cursor-pointer text-left" },
    iconBox(name),
    el("div", { class: "min-w-0 flex-1" }, el("p", { class: "row-title" }, title), el("p", { class: "row-meta" }, meta)));
}

/** Small note for the delegate: when data loaded, rows skipped, tabs broken. */
function sheetHealth(savedAt: string, skipped: Partial<Record<TabName, number>>, broken: TabName[], fromCache: boolean): HTMLElement {
  const d = savedAt ? new Date(savedAt) : null;
  const skippedTotal = Object.values(skipped).reduce((a, b) => a + (b ?? 0), 0);
  const problems = [
    skippedTotal ? `${skippedTotal} row${skippedTotal === 1 ? "" : "s"} skipped (${Object.entries(skipped).map(([t, c]) => `${t}: ${c}`).join(", ")})` : null,
    broken.length ? `Sheet problem: tab${broken.length === 1 ? "" : "s"} ${broken.map((t) => `"${t}"`).join(", ")} not found` : null,
  ].filter(Boolean);
  return el("details", { class: "mt-6 text-center text-xs text-muted" },
    el("summary", { class: "inline-flex cursor-pointer items-center gap-1.5" },
      problems.length ? icon("offline", 14) : null,
      d ? `${fromCache ? "Saved" : "Updated"} ${formatDate(d)}, ${formatTime(d.getHours() * 60 + d.getMinutes())}` : "Not loaded yet",
      problems.length ? ` · ${problems.length} issue${problems.length === 1 ? "" : "s"}` : " · All good"),
    el("div", { class: "mt-2" },
      problems.length
        ? problems.map((p) => el("p", { class: "text-urgent" }, p))
        : el("p", {}, "Every row in the sheet was read correctly."),
      el("p", { class: "mt-1" }, "Rows with a missing title, date or wrong format are skipped. The delegate can fix them in the sheet.")),
  );
}
