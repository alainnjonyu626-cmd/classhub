// Help: how to add the hub to the home screen like an app.
// Spec: README section 16.15.

import { mountPage } from "../app";
import { el, mount } from "../lib/dom";

type Phone = "android" | "iphone";

// Chrome/Edge on Android fire this event when the site can be installed (needs the
// manifest + service worker from Phase 4). We keep it so the Install button can use it.
let installPrompt: (Event & { prompt: () => Promise<void> }) | null = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  installPrompt = e as Event & { prompt: () => Promise<void> };
  document.getElementById("install-now")?.removeAttribute("hidden");
});

const STEPS: Record<Phone, { title: string; steps: string[] }> = {
  android: {
    title: "Android (Chrome)",
    steps: [
      "Open this hub in Chrome.",
      "Tap the ⋮ menu at the top right.",
      'Tap "Add to Home screen" or "Install app".',
      'Tap "Add". The hub icon appears on your home screen.',
    ],
  },
  iphone: {
    title: "iPhone (Safari)",
    steps: [
      "Open this hub in Safari.",
      "Tap the Share button (the square with an arrow pointing up).",
      'Scroll down and tap "Add to Home Screen".',
      'Tap "Add". The hub icon appears on your home screen.',
    ],
  },
};

mountPage({
  page: "help",
  title: "Add to home screen",
  back: "more",
  tabs: [],
  render: ({ hub }) => {
    const detected: Phone = /iphone|ipad|ipod/i.test(navigator.userAgent) ? "iphone" : "android";
    const panel = el("div", {});
    const show = (phone: Phone) => {
      buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.phone === phone)));
      mount(panel, el("ol", { class: "card mt-4 flex flex-col gap-4" },
        STEPS[phone].steps.map((step, i) =>
          el("li", { class: "flex gap-3" },
            el("span", { class: "grid size-8 shrink-0 place-items-center rounded-full bg-ink font-semibold text-white", "aria-hidden": "true" }, String(i + 1)),
            el("p", { class: "pt-1" }, step)))));
    };
    const buttons = (["android", "iphone"] as Phone[]).map((phone) => {
      const b = el("button", { type: "button", class: "chip flex-1 justify-center", "data-phone": phone }, STEPS[phone].title);
      b.addEventListener("click", () => show(phone));
      return b;
    });
    show(detected);

    const install = el("button", { type: "button", id: "install-now", class: "btn btn-accent mt-4 w-full", hidden: installPrompt === null }, `Install ${hub.name}`);
    install.addEventListener("click", () => void installPrompt?.prompt());

    const faq = (q: string, a: string) =>
      el("details", { class: "border-t border-line px-4 py-3.5 first:border-t-0" },
        el("summary", { class: "cursor-pointer font-medium" }, q),
        el("p", { class: "mt-2 text-sm text-muted" }, a));

    return [
      el("p", { class: "mt-5 text-muted" }, `Open ${hub.name} in one tap, like an app. It also keeps the last info you saw, so it works with no data.`),
      install,
      el("div", { class: "mt-4 flex gap-2", role: "group", "aria-label": "Choose your phone" }, buttons),
      panel,
      el("div", { class: "list mt-6" },
        faq("Does it use a lot of data?", "No. Pages are very small, and files (PDFs) only download when you tap Open."),
        faq("Will it update by itself?", "Yes. Every time you open it with data, it gets the latest info from your delegate."),
        faq("Do I need to download anything?", "No. Adding to the home screen just creates a shortcut. Nothing is installed from an app store."),
      ),
    ];
  },
});
