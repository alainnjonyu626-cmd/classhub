// Top bar + bottom menu, shared by every hub page. README section 14.

import { L } from "../config/labels";
import { el } from "../lib/dom";
import { hubLink, type PageId } from "../lib/links";
import { brandLogo } from "./branding";
import { icon, type IconName } from "./icons";

/** Sticky top bar with an optional back arrow. */
export function topBar(title: string, back?: PageId, backQuery: Record<string, string> = {}): HTMLElement {
  return el(
    "header",
    { class: "sticky top-0 z-10 border-b border-line bg-bg/95 backdrop-blur" },
    el(
      "div",
      { class: "wrap flex min-h-[58px] items-center gap-2.5" },
      back
        ? el("a", { href: hubLink(back, backQuery), class: "-ml-2 grid size-10 shrink-0 place-items-center rounded-full transition-colors duration-100 hover:bg-line active:bg-line", "aria-label": "Go back" }, icon("back"))
        : null,
      brandLogo() ? el("img", { src: brandLogo(), alt: "", width: 28, height: 28, class: "size-7 rounded-lg object-contain" }) : null,
      el("h1", { class: "min-w-0 truncate text-lg font-semibold" }, title),
    ),
  );
}

interface NavItem {
  id: "home" | "announcements" | "timetable" | "deadlines" | "more";
  label: string;
  icon: IconName;
}

const NAV: NavItem[] = [
  { id: "home", label: "Home", icon: "home" },
  { id: "announcements", label: "News", icon: "news" },
  { id: "timetable", label: "Timetable", icon: "calendar" },
  { id: "deadlines", label: "Deadlines", icon: "clock" },
  { id: "more", label: "More", icon: "more" },
];

/** Pages that live inside "More" keep the More tab highlighted. */
const UNDER_MORE: PageId[] = ["handouts", "past-questions", "courses", "course", "class-info", "parents", "help"];

export function bottomNav(current: PageId, hasNewNews = false): HTMLElement {
  const active = UNDER_MORE.includes(current) ? "more" : current === "announcement" ? "announcements" : current;
  return el(
    "nav",
    { class: "fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface", "aria-label": "Main" },
    el(
      "div",
      { class: "wrap grid grid-cols-5 pt-1.5 pb-2 shadow-nav" },
      NAV.map((item) => {
        const isActive = item.id === active;
        return el(
          "a",
          {
            href: hubLink(item.id),
            class: `relative flex min-h-[54px] min-w-0 flex-col items-center justify-center gap-0.5 overflow-hidden rounded-box px-0.5 text-[11px] font-medium transition-colors duration-100 hover:text-ink ${isActive ? "text-accent-ink" : "text-muted"}`,
            "aria-current": isActive ? "page" : null,
          },
          icon(item.icon),
          // Label wrapped so tiny widths (280–360px phones, the demo frame) truncate cleanly
          el("span", { class: "max-w-full truncate leading-none" }, item.label),
          item.id === "announcements"
            ? el("span", { id: "news-dot", class: "absolute top-2 ml-5 size-2 rounded-full bg-urgent", role: "img", "aria-label": "New announcements", hidden: !hasNewNews })
            : null,
        );
      }),
    ),
  );
}

/** Show or hide the red dot on the News tab. */
export function setNewsDot(show: boolean): void {
  const dot = document.getElementById("news-dot");
  if (dot) dot.hidden = !show;
}

/** Label for the Courses page in the current mode ("Courses" / "Subjects"). */
export const coursesLabel = () => L("courses");
