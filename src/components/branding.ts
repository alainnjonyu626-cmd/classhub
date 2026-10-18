// Applies a client's colour and name to the page. README sections 7 & 13.

import type { HubConfig } from "../types/hub";

/** WCAG contrast of white text on a hex colour. Client colours need >= 4.5. */
export function contrastWithWhite(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m || !m[1]) return 0;
  const n = parseInt(m[1], 16);
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const lum = 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
  return 1.05 / (lum + 0.05);
}

/** Colour of the phone's browser bar. Added from code so the HTML shells stay empty. */
function setThemeColor(color: string): void {
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  meta.content = color;
}

export function applyBranding(hub: HubConfig, pageTitle?: string): void {
  setThemeColor(hub.color && contrastWithWhite(hub.color) >= 4.5 ? hub.color : "#2b59d9");
  if (hub.color && contrastWithWhite(hub.color) >= 4.5) {
    document.documentElement.style.setProperty("--color-accent", hub.color);
    setThemeColor(hub.color);
  } else if (hub.color) {
    console.warn(`ClassHub: colour ${hub.color} is too light for white text; using the default accent.`);
  }
  document.title = pageTitle ? `${pageTitle} · ${hub.name}` : hub.name;
}
