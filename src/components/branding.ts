// Applies a client's colour and name to the page. README sections 7 & 13.

import { SCHOOLS } from "../config/hubs";
import { BASE } from "../lib/links";
import type { HubConfig } from "../types/hub";

let logoUrl: string | null = null;

/** URL of the client logo (hub first, then its school), or null. Used by the top bar. */
export function brandLogo(): string | null {
  return logoUrl;
}

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
  // A hub's own colour/logo wins; otherwise it inherits its school's.
  const school = hub.schoolId ? SCHOOLS[hub.schoolId] : undefined;
  const color = hub.color ?? school?.color;
  const logo = hub.logo ?? school?.logo;
  logoUrl = logo ? BASE + logo : null;

  if (color && contrastWithWhite(color) >= 4.5) {
    document.documentElement.style.setProperty("--color-accent", color);
    setThemeColor(color);
  } else {
    setThemeColor("#2b59d9");
    if (color) console.warn(`ClassHub: colour ${color} is too light for white text; using the default accent.`);
  }
  document.title = pageTitle ? `${pageTitle} · ${hub.name}` : hub.name;
}
