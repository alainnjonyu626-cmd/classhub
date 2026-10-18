// URLs: reading ?params, building links that keep ?hub=, WhatsApp links. README sections 6 & 12.

/** Base path of the site ("/" locally, "/classhub/" on GitHub Pages). */
export const BASE = import.meta.env.BASE_URL;

export function param(name: string): string | null {
  const value = new URLSearchParams(location.search).get(name);
  return value && value.trim() !== "" ? value.trim() : null;
}

export type PageId =
  | "home"
  | "announcements"
  | "announcement"
  | "timetable"
  | "deadlines"
  | "courses"
  | "course"
  | "handouts"
  | "past-questions"
  | "parents"
  | "class-info"
  | "more"
  | "help"
  | "paused";

/** Link to a hub page that keeps the current ?hub=. hubLink("course", { code: "CSC203" }) */
export function hubLink(page: PageId, extra: Record<string, string> = {}, hubId = param("hub")): string {
  const query = new URLSearchParams({ ...(hubId ? { hub: hubId } : {}), ...extra });
  return `${BASE}app/${page}.html?${query.toString()}`;
}

export function siteLink(path: "" | "school.html" | "404.html", query: Record<string, string> = {}): string {
  const q = new URLSearchParams(query).toString();
  return `${BASE}${path}${q ? `?${q}` : ""}`;
}

/** Only https:// links are ever shown (blocks javascript: and other tricks). */
export function isSafeUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

/** WhatsApp "share to anyone" link. */
export function waShare(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/** WhatsApp chat with one number (digits only). */
export function waChat(number: string, text = ""): string {
  const digits = number.replace(/\D/g, "");
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

/** "CSC203" → "CSC 203" */
export function prettyCode(code: string): string {
  return code.replace(/^([A-Z]+)(\d+)/, "$1 $2");
}
