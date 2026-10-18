// Loading, empty, offline and error states. README section 15.

import { el } from "../lib/dom";
import { formatDate, formatTime } from "../lib/dates";
import { icon } from "./icons";

/** Grey placeholder blocks shown on a first visit while data loads. */
export function skeleton(): HTMLElement {
  return el(
    "div",
    { class: "flex flex-col gap-3 pt-5", "aria-busy": "true", "aria-label": "Loading" },
    el("div", { class: "skeleton h-24" }),
    el("div", { class: "skeleton h-36" }),
    el("div", { class: "skeleton h-16" }),
    el("div", { class: "skeleton h-16" }),
  );
}

export type BannerKind = "offline" | "stale" | "error" | "info";

export function banner(kind: BannerKind, message: string): HTMLElement {
  const colours: Record<BannerKind, string> = {
    offline: "bg-ink text-white",
    stale: "bg-urgent-soft text-urgent",
    error: "bg-urgent-soft text-urgent",
    info: "bg-accent-soft text-accent-ink",
  };
  return el(
    "div",
    { class: `mt-4 flex items-center gap-2.5 rounded-box px-3.5 py-2.5 text-[13px] font-medium ${colours[kind]}`, role: "status" },
    kind === "offline" ? icon("offline", 18) : null,
    message,
  );
}

/** "You're offline. Showing info from Mon 19 Oct, 9:14." */
export function offlineMessage(savedAt: string): string {
  const d = new Date(savedAt);
  if (Number.isNaN(d.getTime())) return "You're offline.";
  return `You're offline. Showing info from ${formatDate(d)}, ${formatTime(d.getHours() * 60 + d.getMinutes())}.`;
}

export function emptyState(message: string, action?: { label: string; href: string }): HTMLElement {
  return el(
    "div",
    { class: "card mt-2 text-center text-muted" },
    el("p", {}, message),
    action ? el("a", { href: action.href, class: "btn btn-light btn-sm mt-3" }, action.label) : null,
  );
}

/** Full-page message (offline with nothing saved, item not found...). */
export function fullMessage(title: string, message: string, action?: { label: string; href?: string; onClick?: () => void }): HTMLElement {
  const button = action
    ? action.href
      ? el("a", { href: action.href, class: "btn mt-6 w-full" }, action.label)
      : el("button", { type: "button", class: "btn mt-6 w-full" }, action.label)
    : null;
  if (button && action?.onClick) button.addEventListener("click", action.onClick);
  return el(
    "section",
    { class: "px-2 pt-16 pb-8 text-center" },
    el("h2", { class: "mb-2 text-[22px] font-bold" }, title),
    el("p", { class: "text-muted" }, message),
    button,
  );
}

/** Placeholder used by pages that aren't built yet. Remove as each page is built. */
export function comingSoon(pageName: string): HTMLElement {
  return el(
    "div",
    { class: "card mt-5 text-center" },
    el("p", { class: "font-semibold" }, `${pageName} page`),
    el("p", { class: "mt-1 text-[13px] text-muted" }, "Not built yet. See README section 16 and design/mockups."),
  );
}
