// Small reusable UI pieces built from the classes in main.css.
// Pages combine these like LEGO bricks instead of repeating markup.

import { L, getMode } from "../config/labels";
import { atTime, countdown, countdownLabel } from "../lib/dates";
import { el, type Child } from "../lib/dom";
import type { AnnouncementCategory, Course, Deadline, DeadlineType } from "../types/sheet";
import { icon, isIconName, type IconName } from "./icons";

/** "Today" + optional "Full timetable" link on the right. */
export function sectionTitle(title: string, link?: { label: string; href: string }): HTMLElement {
  return el("div", { class: "sec-title" }, el("h2", {}, title), link ? el("a", { href: link.href }, link.label) : null);
}

export function section(...children: Child[]): HTMLElement {
  return el("section", { class: "mt-6" }, children);
}

/** Small grey uppercase label above a group: "THIS WEEK". */
export function groupLabel(text: string): HTMLElement {
  return el("p", { class: "group-label" }, text);
}

export function list(...rows: Child[]): HTMLElement {
  return el("div", { class: "list" }, rows);
}

/** One list row. Becomes a link when href is given. */
export function row(options: {
  href?: string;
  lead?: Child;
  title: string;
  meta?: string | null;
  trail?: Child;
  external?: boolean;
  class?: string;
}): HTMLElement {
  const body = [
    options.lead ?? null,
    el("div", { class: "min-w-0 flex-1" },
      el("p", { class: "row-title" }, options.title),
      options.meta ? el("p", { class: "row-meta" }, options.meta) : null,
    ),
    options.trail ?? null,
  ];
  const cls = `row ${options.class ?? ""}`;
  return options.href
    ? el("a", { class: cls, href: options.href, ...(options.external ? { target: "_blank", rel: "noopener" } : {}) }, body)
    : el("div", { class: cls }, body);
}

export function iconBox(content: IconName | string, variant: "" | "pdf" | "exam" | "ok" = ""): HTMLElement {
  const variants = { "": "", pdf: "bg-urgent-soft text-urgent text-[11px] font-bold", exam: "bg-exam-soft text-exam", ok: "bg-ok-soft text-ok" };
  return el("div", { class: `icon-box ${variants[variant]}` },
    isIconName(content) ? icon(content, 20) : el("b", { class: "text-xs" }, content));
}

/** Tag for an announcement category. */
export function categoryTag(category: AnnouncementCategory, prefix = ""): HTMLElement {
  const map: Record<AnnouncementCategory, [string, string]> = {
    urgent: ["tag-urgent", "Urgent"],
    exam: ["tag-exam", "Exam"],
    general: ["", "General"],
    social: ["tag-plain", "Social"],
    parents: ["tag-ok", "Parents"],
  };
  const [cls, label] = map[category];
  return el("span", { class: `tag ${cls}` }, prefix + label);
}

export const CATEGORY_CARD: Record<AnnouncementCategory, string> = {
  urgent: "card-urgent", exam: "", general: "", social: "", parents: "",
};

/** Words for deadline types, mode-aware ("CA test" / "Sequence test"). */
export function deadlineTypeLabel(type: DeadlineType): string {
  const labels: Record<DeadlineType, string> = {
    test: L("test"), assignment: "Assignment", exam: L("exam"), admin: "Admin",
    // sequence and mock only exist in secondary mode; a university sheet using them gets the local words
    sequence: getMode() === "secondary" ? "Sequence test" : L("test"),
    mock: getMode() === "secondary" ? "Mock exam" : L("exam"),
    practical: "Practical exam",
  };
  return labels[type];
}

export function deadlineIcon(type: DeadlineType): HTMLElement {
  if (type === "test" || type === "sequence" || type === "mock" || type === "practical") return iconBox("test", "exam");
  if (type === "exam") return iconBox("calendar", "exam");
  if (type === "admin") return iconBox("people");
  return iconBox("file");
}

export function deadlineTarget(d: Deadline): Date {
  return atTime(d.date, d.time);
}

/**
 * Right-side "2d / 5h left" badge. data-countdown makes live.ts refresh it every minute.
 * Turns orange when less than 3 days are left.
 */
export function dueBadge(target: Date): HTMLElement {
  const c = countdown(target);
  const urgent = !c.past && c.totalMinutes < 3 * 1440;
  const label = countdownLabel(target);
  const [big, small] = splitDue(label);
  return el("div", { class: "shrink-0 text-right", "aria-label": c.past ? "Passed" : `${label} left` },
    el("b", { class: `block text-xl leading-tight font-bold ${urgent ? "text-urgent" : ""}`, "data-countdown": target.toISOString(), "data-part": "big" }, big),
    el("span", { class: "text-xs text-muted", "data-countdown": target.toISOString(), "data-part": "small" }, small),
  );
}

/** "2d 5h" → ["2d", "5h left"], "Today" → ["Today", ""], "In 3 hours" → ["3h", "left"] */
export function splitDue(label: string): [string, string] {
  const parts = label.split(" ");
  if (/^\d+d$/.test(parts[0] ?? "")) return [parts[0] ?? "", `${parts[1] ?? ""} left`.trim()];
  const inHours = /^In (\d+) hours$/.exec(label);
  if (inHours) return [`${inHours[1]}h`, "left"];
  if (/^\d+ min$/.test(label)) return [label.replace(" min", "m"), "left"];
  return [label, ""];
}

/** "Brenda T." → "BT" */
export function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

export function avatar(name: string, tone: "dark" | "accent" | "soft" = "dark"): HTMLElement {
  const tones = { dark: "bg-ink text-white", accent: "bg-accent text-white", soft: "bg-accent-soft text-accent-ink" };
  return el("div", { class: `grid size-[46px] shrink-0 place-items-center rounded-full font-semibold ${tones[tone]}`, "aria-hidden": "true" }, initials(name));
}

/**
 * Filter chips. Clicking one calls onChange and updates aria-pressed.
 * The chosen value is also written to the URL (?filter=) so it can be shared.
 */
export function chips<T extends string>(
  options: { value: T; label: string }[],
  active: T,
  onChange: (value: T) => void,
  ariaLabel: string,
  paramName = "filter",
): HTMLElement {
  const buttons = options.map((o) => {
    const b = el("button", { type: "button", class: "chip", "aria-pressed": String(o.value === active) }, o.label);
    b.addEventListener("click", () => {
      buttons.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      const url = new URL(location.href);
      url.searchParams.set(paramName, o.value);
      history.replaceState(null, "", url);
      onChange(o.value);
    });
    return b;
  });
  return el("div", { class: "-mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none]", role: "group", "aria-label": ariaLabel }, buttons);
}

/** Course title lookup: "CSC203" → "Web Development" (or null). */
export function courseMap(courses: Course[]): Map<string, Course> {
  return new Map(courses.map((c) => [c.code, c]));
}

export function chevron(): SVGSVGElement {
  const svg = icon("chevron", 18);
  svg.classList.add("shrink-0", "text-[#a3a7b0]");
  return svg;
}
