// Turns raw sheet rows (all text) into typed data, skipping bad rows.
// README section 10.3. One cleaner per tab.

import type {
  Announcement,
  AnnouncementCategory,
  Course,
  DayCode,
  Deadline,
  DeadlineType,
  FileType,
  Handout,
  Info,
  Leader,
  PaperKind,
  ParentItem,
  ParentSection,
  PastQuestion,
  Place,
  RawRow,
  Slot,
  SlotType,
  TabName,
} from "../types/sheet";
import { DAY_CODES, parseDate, parseTime } from "./dates";
import { isSafeUrl } from "./links";

/** Columns that MUST exist in row 1 of each tab. Used to detect a missing/renamed tab. */
export const REQUIRED_COLUMNS: Record<TabName, string[]> = {
  info: ["key", "value"],
  announcements: ["id", "date", "title", "body", "category"],
  timetable: ["day", "start", "end", "code"],
  deadlines: ["title", "type", "date"],
  courses: ["code", "title"],
  handouts: ["code", "title", "link"],
  past_questions: ["code", "title", "year", "kind", "link"],
  leaders: ["name", "role"],
  places: ["name"],
  parents: ["section", "title"],
};

export interface Cleaned<T> {
  items: T[];
  skipped: number;
}

// ---------- small helpers ----------
const text = (v: string | undefined): string | null => {
  const t = (v ?? "").trim();
  return t === "" ? null : t;
};
const yes = (v: string | undefined): boolean => /^(yes|y|true|1)$/i.test((v ?? "").trim());
const code = (v: string | undefined): string | null => text(v)?.replace(/\s+/g, "").toUpperCase() ?? null;
const num = (v: string | undefined): number | null => {
  const n = Number((v ?? "").replace(/,/g, "").trim());
  return (v ?? "").trim() !== "" && Number.isFinite(n) ? n : null;
};
const link = (v: string | undefined): string | null => (isSafeUrl(text(v)) ? text(v) : null);
function oneOf<T extends string>(v: string | undefined, allowed: readonly T[]): T | null {
  const t = (v ?? "").trim().toLowerCase();
  return (allowed as readonly string[]).includes(t) ? (t as T) : null;
}

/** Runs `fn` on every row; rows where it returns null are counted as skipped. */
function cleanRows<T>(rows: RawRow[], fn: (row: RawRow) => T | null): Cleaned<T> {
  const items: T[] = [];
  let skipped = 0;
  for (const row of rows) {
    const item = fn(row);
    if (item === null) skipped++;
    else items.push(item);
  }
  return { items, skipped };
}

// ---------- one cleaner per tab ----------
export function cleanInfo(rows: RawRow[]): Info {
  const info: Info = {};
  for (const row of rows) {
    const k = text(row.key)?.toLowerCase();
    if (k) info[k] = text(row.value) ?? "";
  }
  return info;
}

const CATEGORIES: readonly AnnouncementCategory[] = ["urgent", "exam", "general", "social", "parents"];
export function cleanAnnouncements(rows: RawRow[]): Cleaned<Announcement> {
  const result = cleanRows(rows, (r) => {
    const id = num(r.id);
    const date = parseDate(r.date);
    const title = text(r.title);
    const body = text(r.body);
    const category = oneOf(r.category, CATEGORIES);
    if (id === null || !date || !title || !body || !category) return null;
    const expires = parseDate(r.expires);
    const expired = expires !== null && expires.getTime() < new Date().setHours(0, 0, 0, 0);
    return {
      id, date, title, body, category,
      time: parseTime(r.time),
      pinned: yes(r.pinned) && !expired,
      author: text(r.author),
      code: code(r.code),
      when: text(r.when),
      where: text(r.where),
      attachment: link(r.attachment),
      attachmentName: text(r.attachment_name),
      expires,
    };
  });
  // Newest first
  result.items.sort((a, b) => b.date.getTime() - a.date.getTime() || (b.time ?? 0) - (a.time ?? 0) || b.id - a.id);
  return result;
}

const SLOT_TYPES: readonly SlotType[] = ["lecture", "lab", "tutorial", "free"];
export function cleanTimetable(rows: RawRow[]): Cleaned<Slot> {
  const result = cleanRows(rows, (r) => {
    const day = DAY_CODES.find((d) => d.toLowerCase() === (r.day ?? "").trim().slice(0, 3).toLowerCase()) as DayCode | undefined;
    const start = parseTime(r.start);
    const end = parseTime(r.end);
    const c = code(r.code);
    if (!day || start === null || end === null || end <= start || !c) return null;
    return {
      day, start, end, code: c,
      title: text(r.title),
      venue: text(r.venue),
      teacher: text(r.teacher),
      type: oneOf(r.type, SLOT_TYPES) ?? "lecture",
      week: oneOf(r.week, ["all", "odd", "even"] as const) ?? "all",
    };
  });
  result.items.sort((a, b) => DAY_CODES.indexOf(a.day) - DAY_CODES.indexOf(b.day) || a.start - b.start);
  return result;
}

const DEADLINE_TYPES: readonly DeadlineType[] = ["test", "assignment", "exam", "admin", "sequence", "mock"];
export function cleanDeadlines(rows: RawRow[]): Cleaned<Deadline> {
  const result = cleanRows(rows, (r) => {
    const title = text(r.title);
    const type = oneOf(r.type, DEADLINE_TYPES);
    const date = parseDate(r.date);
    if (!title || !type || !date) return null;
    return {
      title, type, date,
      code: code(r.code),
      time: parseTime(r.time),
      venue: text(r.venue),
      details: text(r.details),
      done: yes(r.done),
      announcementId: num(r.announcement_id),
    };
  });
  result.items.sort((a, b) => a.date.getTime() - b.date.getTime() || (a.time ?? 1439) - (b.time ?? 1439));
  return result;
}

export function cleanCourses(rows: RawRow[]): Cleaned<Course> {
  return cleanRows(rows, (r) => {
    const c = code(r.code);
    const title = text(r.title);
    if (!c || !title) return null;
    return {
      code: c, title,
      credits: num(r.credits),
      teacher: text(r.teacher),
      office: text(r.office),
      officeHours: text(r.office_hours),
      description: text(r.description),
    };
  });
}

const FILE_TYPES: readonly FileType[] = ["pdf", "doc", "ppt", "zip", "image", "link"];
export function cleanHandouts(rows: RawRow[]): Cleaned<Handout> {
  const result = cleanRows(rows, (r) => {
    const c = code(r.code);
    const title = text(r.title);
    const url = link(r.link);
    if (!c || !title || !url) return null;
    return {
      code: c, title, link: url,
      type: oneOf(r.type, FILE_TYPES) ?? "pdf",
      size: text(r.size),
      dateAdded: parseDate(r.date_added),
      chapter: text(r.chapter),
    };
  });
  result.items.sort((a, b) => (b.dateAdded?.getTime() ?? 0) - (a.dateAdded?.getTime() ?? 0));
  return result;
}

const KINDS: readonly PaperKind[] = ["exam", "ca", "resit", "sequence", "mock", "gce_practice"];
export function cleanPastQuestions(rows: RawRow[]): Cleaned<PastQuestion> {
  const result = cleanRows(rows, (r) => {
    const c = code(r.code);
    const title = text(r.title);
    const year = text(r.year);
    const kind = oneOf(r.kind, KINDS);
    const url = link(r.link);
    if (!c || !title || !year || !kind || !url) return null;
    return { code: c, title, year, kind, link: url, answersLink: link(r.answers_link), pages: num(r.pages) };
  });
  result.items.sort((a, b) => b.year.localeCompare(a.year));
  return result;
}

export function cleanLeaders(rows: RawRow[]): Cleaned<Leader> {
  const result = cleanRows(rows, (r) => {
    const name = text(r.name);
    const role = text(r.role);
    if (!name || !role) return null;
    const digits = (r.whatsapp ?? "").replace(/\D/g, "");
    return { name, role, whatsapp: digits.length >= 8 ? digits : null, order: num(r.order) };
  });
  result.items.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  return result;
}

export function cleanPlaces(rows: RawRow[]): Cleaned<Place> {
  return cleanRows(rows, (r) => {
    const name = text(r.name);
    if (!name) return null;
    return { name, directions: text(r.directions), mapLink: link(r.map_link) };
  });
}

const SECTIONS: readonly ParentSection[] = ["dates", "fees", "meetings", "requirements", "contacts"];
export function cleanParents(rows: RawRow[]): Cleaned<ParentItem> {
  return cleanRows(rows, (r) => {
    const section = oneOf(r.section, SECTIONS);
    const title = text(r.title);
    if (!section || !title) return null;
    return { section, title, detail: text(r.detail), date: parseDate(r.date), link: link(r.link) };
  });
}
