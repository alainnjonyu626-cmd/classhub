// Landing page (your selling page). README section 16.1.
// The page itself is plain HTML in /index.html so it works with JavaScript off.
// This file only fills in what comes from src/config/hubs.ts: WhatsApp links and your name.
import { OWNER } from "../config/hubs";
import { hubLink, waChat } from "../lib/links";
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

const setText = (selector: string, text: string) =>
  document.querySelectorAll(selector).forEach((node) => { node.textContent = text; });
setText("[data-owner-name]", OWNER.name);
setText("[data-owner-city]", OWNER.city);
