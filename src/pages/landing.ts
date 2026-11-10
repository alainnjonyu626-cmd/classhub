// Landing page (your selling page). README section 16.1.
// The page itself is plain HTML in /index.html so it works with JavaScript off.
// This file only fills in what comes from src/config/hubs.ts: WhatsApp links and your name.
import { OWNER } from "../config/hubs";
import { BASE, hubLink, waChat } from "../lib/links";
import { registerServiceWorker } from "../lib/pwa";

registerServiceWorker();

document.querySelectorAll<HTMLAnchorElement>("a[data-wa]").forEach((a) => {
  a.href = waChat(OWNER.whatsapp, a.dataset.wa ?? "");
  a.target = "_blank";
  a.rel = "noopener";
});

// Respect the deploy base path (GitHub Pages serves from /<repo>/)
document.querySelectorAll<HTMLAnchorElement>("a[data-demo]").forEach((a) => {
  a.href = hubLink("home", {}, "demo");
});

// Live examples: show the real demo pages in the hero panel and the big demo
// panel. Without JavaScript the chips are plain links to the real pages.
const withBase = (path: string) => BASE + path;
const frames = [...document.querySelectorAll<HTMLIFrameElement>("iframe.live-frame")];
const openLink = document.getElementById("live-open") as HTMLAnchorElement | null;
const chips = [...document.querySelectorAll<HTMLAnchorElement>("a[data-live]")];

function showLive(path: string): void {
  if (frames.length === 0) return;
  for (const frame of frames) frame.src = withBase(path);
  if (openLink) openLink.href = withBase(path);
  chips.forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.live === path)));
}

chips.forEach((chip) => {
  chip.href = withBase(chip.dataset.live ?? "");
  chip.addEventListener("click", (event) => {
    event.preventDefault();
    showLive(chip.dataset.live ?? "");
  });
});
document.querySelectorAll<HTMLAnchorElement>("a[data-live-jump]").forEach((a) =>
  a.addEventListener("click", () => showLive(a.dataset.liveJump ?? "")));
// Load the first example when the section scrolls into view (keeps the first visit light)
const liveSection = document.getElementById("live");
if (liveSection && "IntersectionObserver" in window) {
  new IntersectionObserver((entries, observer) => {
    if (entries.some((e) => e.isIntersecting)) {
      showLive(chips[0]?.dataset.live ?? "app/home.html?hub=demo");
      observer.disconnect();
    }
  }, { rootMargin: "200px" }).observe(liveSection);
}

const setText = (selector: string, text: string) =>
  document.querySelectorAll(selector).forEach((node) => { node.textContent = text; });
setText("[data-owner-name]", OWNER.name);
setText("[data-owner-city]", OWNER.city);

// Contact form: there is no backend, so "Send" composes a WhatsApp message
// with the visitor's name, email and message. Nothing is stored anywhere.
const form = document.getElementById("contact-form") as HTMLFormElement | null;
form?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const name = String(data.get("name") ?? "").trim();
  const email = String(data.get("email") ?? "").trim();
  const message = String(data.get("message") ?? "").trim();
  const error = document.getElementById("cf-error");
  const incomplete = !name || !email || !message;
  if (error) error.hidden = !incomplete;
  if (incomplete || !form.reportValidity()) return;
  const text = `Hello, I'm ${name} (${email}).\n\n${message}`;
  window.open(waChat(OWNER.whatsapp, text), "_blank", "noopener");
});
