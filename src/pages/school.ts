// School directory: one link a school shares with all students and parents.
// Spec: README section 16.2.
import "../styles/main.css";
import { applyBranding } from "../components/branding";
import { icon } from "../components/icons";
import { emptyState } from "../components/states";
import { chevron, groupLabel, list, row, sectionTitle } from "../components/ui";
import { HUBS, SCHOOLS } from "../config/hubs";
import { prefs } from "../lib/cache";
import { $, el, mount } from "../lib/dom";
import { BASE, hubLink, param, siteLink } from "../lib/links";
import { registerServiceWorker } from "../lib/pwa";
import type { HubConfig } from "../types/hub";

registerServiceWorker();

const schoolId = param("school");
const school = schoolId ? SCHOOLS[schoolId] : undefined;

if (!schoolId || !school) {
  location.replace(siteLink("404.html"));
} else {
  const classes = Object.entries(HUBS)
    .filter(([, h]) => h.schoolId === schoolId && h.active)
    .sort(([, a], [, b]) => compareClasses(a, b));
  const parentsHub = school.parentsHub && HUBS[school.parentsHub]?.active ? school.parentsHub : null;

  // Branding: school colour (with the contrast check) and page title
  applyBranding({ name: school.name, subtitle: "", school: school.name, mode: "secondary", sheetId: "", active: true, color: school.color }, "Find your class");

  const header = el("header", { class: "flex flex-col items-center gap-3 pt-10 text-center" },
    school.logo ? el("img", { src: BASE + school.logo, alt: "", class: "h-16 w-16 rounded-2xl object-contain", width: 64, height: 64 }) : null,
    el("h1", { class: "text-2xl font-bold tracking-tight" }, school.name),
    el("p", { class: "text-[13px] text-muted" }, "Class updates in one place"),
  );

  // "Continue to Form 5 Hub" (only if that class still exists and is active)
  const savedId = prefs.get(`schoolHub:${schoolId}`);
  const saved = classes.find(([id]) => id === savedId);
  const resume = saved
    ? el("a", { class: "btn mt-5 w-full", href: hubLink("home", {}, saved[0]) }, `Continue to ${saved[1].name}`)
    : null;

  const results = el("div", {});
  let query = "";
  const draw = () => mount(results, groups(classes, query));
  const input = el("input", {
    type: "search", id: "search", placeholder: "Search your class...", autocomplete: "off",
    class: "min-w-0 flex-1 border-0 bg-transparent text-ink outline-none placeholder:text-muted",
  });
  input.addEventListener("input", () => { query = input.value; draw(); });
  draw();

  mount($("#app"), el("main", { class: "wrap pb-10" },
    header,
    resume,
    classes.length
      ? [
          el("label", { for: "search", class: "sr-only" }, "Search classes"),
          el("div", { class: "mt-5 flex min-h-12 items-center gap-2.5 rounded-full border border-line bg-surface px-4 text-muted focus-within:outline-2 focus-within:outline-accent" },
            icon("search", 18), input),
          el("div", { class: "mt-6" }, sectionTitle("Find your class")),
          results,
        ]
      : el("div", { class: "mt-6" }, emptyState("Classes coming soon.")),
    parentsHub
      ? el("a", { href: hubLink("parents", {}, parentsHub), class: "card mt-6 flex items-center gap-3" },
          el("div", { class: "min-w-0 flex-1" },
            el("p", { class: "text-sm font-semibold" }, "For parents"),
            el("p", { class: "text-[13px] text-muted" }, "Dates, fees, meetings")),
          chevron())
      : null,
    el("p", { class: "mt-8 text-center text-xs text-muted" }, "Powered by ", el("a", { href: siteLink(""), class: "underline" }, "ClassHub")),
  ));
}

/** "Form 5 Science" → "Form 5", "Lower Sixth Arts" → "Lower Sixth", "Level 200 CS" → "Level 200". */
function levelOf(hub: HubConfig): string {
  const m = /^(form\s*\d+|level\s*\d+|lower sixth|upper sixth|year\s*\d+|class\s*\d+)/i.exec(hub.subtitle.trim());
  return m?.[1] ? m[1].replace(/\s+/g, " ") : "Classes";
}

/** Natural order: Form 2 before Form 10, Lower Sixth before Upper Sixth. `order` wins when set. */
function compareClasses(a: HubConfig, b: HubConfig): number {
  if (a.order !== undefined || b.order !== undefined) return (a.order ?? 1e9) - (b.order ?? 1e9);
  const rank = (h: HubConfig) => (/lower sixth/i.test(h.subtitle) ? 1e6 : /upper sixth/i.test(h.subtitle) ? 1e6 + 1 : 0);
  return rank(a) - rank(b) || a.subtitle.localeCompare(b.subtitle, undefined, { numeric: true, sensitivity: "base" });
}

function groups(classes: [string, HubConfig][], query: string): HTMLElement[] {
  const q = query.trim().toLowerCase();
  const found = q ? classes.filter(([, h]) => `${h.name} ${h.subtitle}`.toLowerCase().includes(q)) : classes;
  if (!found.length) return [el("div", { class: "mt-4" }, emptyState(`No class matches "${query.trim()}".`))];

  const byLevel = new Map<string, [string, HubConfig][]>();
  for (const entry of found) {
    const level = levelOf(entry[1]);
    byLevel.set(level, [...(byLevel.get(level) ?? []), entry]);
  }
  return [...byLevel].map(([level, items]) =>
    el("section", { class: "mt-4" }, groupLabel(level), list(items.map(([id, h]) =>
      row({ href: hubLink("home", {}, id), title: h.name, meta: h.subtitle, trail: chevron() })))));
}
