// Types for the Google Sheet tabs. README section 8.
// Raw rows come in as text; src/lib/clean.ts turns them into these shapes.

export const TAB_NAMES = [
  "info",
  "announcements",
  "timetable",
  "deadlines",
  "courses",
  "handouts",
  "past_questions",
  "leaders",
  "places",
  "parents",
] as const;

export type TabName = (typeof TAB_NAMES)[number];

/** One row exactly as it comes from the CSV: column name → text. */
export type RawRow = Record<string, string>;

export type DayCode = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat";
export type AnnouncementCategory = "urgent" | "exam" | "general" | "social" | "parents";
export type SlotType = "lecture" | "lab" | "tutorial" | "free";
export type DeadlineType = "test" | "assignment" | "exam" | "admin" | "sequence" | "mock" | "practical";
export type FileType = "pdf" | "doc" | "ppt" | "zip" | "image" | "link";
export type PaperKind = "exam" | "ca" | "resit" | "sequence" | "mock" | "gce_practice";
export type ParentSection = "dates" | "fees" | "meetings" | "requirements" | "contacts";

/** Minutes since midnight, e.g. 08:30 → 510. */
export type Minutes = number;

/** Tab "info": key/value pairs. */
export type Info = Record<string, string>;

export interface Announcement {
  id: number;
  date: Date;
  time: Minutes | null;
  title: string;
  body: string;
  category: AnnouncementCategory;
  pinned: boolean;
  author: string | null;
  code: string | null;
  when: string | null;
  where: string | null;
  attachment: string | null;
  attachmentName: string | null;
  expires: Date | null;
}

export interface Slot {
  day: DayCode;
  start: Minutes;
  end: Minutes;
  code: string;
  title: string | null;
  venue: string | null;
  teacher: string | null;
  type: SlotType;
  week: "all" | "odd" | "even";
}

export interface Deadline {
  title: string;
  code: string | null;
  type: DeadlineType;
  date: Date;
  time: Minutes | null;
  venue: string | null;
  details: string | null;
  done: boolean;
  announcementId: number | null;
}

export interface Course {
  code: string;
  title: string;
  credits: number | null;
  teacher: string | null;
  office: string | null;
  officeHours: string | null;
  description: string | null;
}

export interface Handout {
  code: string;
  title: string;
  link: string;
  type: FileType;
  size: string | null;
  dateAdded: Date | null;
  chapter: string | null;
}

export interface PastQuestion {
  code: string;
  title: string;
  year: string;
  kind: PaperKind;
  link: string;
  answersLink: string | null;
  pages: number | null;
}

export interface Leader {
  name: string;
  role: string;
  whatsapp: string | null;
  order: number | null;
}

export interface Place {
  name: string;
  directions: string | null;
  mapLink: string | null;
}

export interface ParentItem {
  section: ParentSection;
  title: string;
  detail: string | null;
  date: Date | null;
  link: string | null;
}

/** Everything a hub can hold. Pages only receive the tabs they asked for. */
export interface HubData {
  info: Info;
  announcements: Announcement[];
  timetable: Slot[];
  deadlines: Deadline[];
  courses: Course[];
  handouts: Handout[];
  past_questions: PastQuestion[];
  leaders: Leader[];
  places: Place[];
  parents: ParentItem[];
  /** Rows dropped per tab because a required value was missing or invalid. */
  skipped: Partial<Record<TabName, number>>;
  /** Tabs that couldn't be read (missing, renamed, private). */
  broken: TabName[];
  /** When this data was downloaded (ISO string). */
  savedAt: string;
  /** true when the page is showing the saved copy because the network failed. */
  fromCache: boolean;
}
