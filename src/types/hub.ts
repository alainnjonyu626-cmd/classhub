// Types for the client register (src/config/hubs.ts). README section 7.

export type Mode = "university" | "secondary";

export interface HubConfig {
  /** Shown in the header. Keep it short (~20 characters). */
  name: string;
  /** Level / programme / form, e.g. "Computer Science · Level 200". */
  subtitle: string;
  school: string;
  /** Sort position on the school page (smaller first). Without it, classes sort naturally by subtitle. */
  order?: number;
  /** Groups the hub under school.html?school=<id>. */
  schoolId?: string;
  mode: Mode;
  /** The long id between /d/ and /edit in the Google Sheet link. */
  sheetId: string;
  /** Brand colour, overrides --color-accent. Must pass contrast with white text. */
  color?: string;
  logo?: string;
  /** WhatsApp number of the hub owner (digits only, with their consent). */
  contact?: string;
  /** false = the hub shows the Paused page. Your on/off switch. */
  active: boolean;
  startDate?: string;
  plan?: "semester" | "term" | "year";
}

export interface SchoolConfig {
  name: string;
  logo?: string;
  color?: string;
  /** Optional hub used only for parents' info. */
  parentsHub?: string;
}

export interface OwnerConfig {
  name: string;
  whatsapp: string;
  city: string;
}
