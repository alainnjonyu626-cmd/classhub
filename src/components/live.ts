// Keeps countdowns fresh without reloading: every minute, any element with
// data-countdown="<ISO date>" gets its text recalculated. Pauses when the
// tab is hidden (saves battery), catches up as soon as it's visible again.

import { countdown, countdownLabel } from "../lib/dates";
import { splitDue } from "./ui";

function tick(): void {
  document.querySelectorAll<HTMLElement>("[data-countdown]").forEach((node) => {
    const target = new Date(node.dataset.countdown ?? "");
    if (Number.isNaN(target.getTime())) return;
    const part = node.dataset.part;
    if (part === "big" || part === "small") {
      const [big, small] = splitDue(countdownLabel(target));
      node.textContent = part === "big" ? big : small;
    } else if (part === "days" || part === "hours" || part === "mins") {
      const c = countdown(target);
      const value = c.past ? 0 : c[part];
      node.textContent = part === "days" ? String(value) : String(value).padStart(2, "0");
    } else {
      node.textContent = countdownLabel(target);
    }
  });
}

let started = false;

export function startLiveTimers(): void {
  if (started) return;
  started = true;
  setInterval(() => {
    if (document.visibilityState === "visible") tick();
  }, 60_000);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") tick();
  });
}
