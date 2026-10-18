// THE CLIENT REGISTER. README section 7.
// Like the mall's list of shops: adding a client = adding one entry here.

import type { HubConfig, OwnerConfig, SchoolConfig } from "../types/hub";

export const OWNER: OwnerConfig = {
  name: "[YOUR NAME]",
  whatsapp: "2376XXXXXXXX", // digits only, no "+" or spaces
  city: "Douala",
};

export const HUBS: Record<string, HubConfig> = {
  // Demo hub for the landing page "See a live example" button.
  // sheetId "demo" = built-in sample data (src/lib/demo.ts), works without a sheet.
  // After the sheet test, make a second hub with your real sheet id to test it, e.g.:
  //   "my-test": { ...same fields..., sheetId: "1AbC...xyz" },
  demo: {
    name: "CS200 Hub",
    subtitle: "Computer Science · Level 200",
    school: "Faculty of Science",
    mode: "university",
    sheetId: "demo",
    active: true,
    plan: "semester",
  },
  // Secondary-school version of the demo (shows Parents' corner, Subjects, Teacher...)
  "demo-school": {
    name: "Form 5 Hub",
    subtitle: "Form 5 Science",
    school: "Demo College",
    schoolId: "demo-college",
    mode: "secondary",
    sheetId: "demo",
    active: true,
    plan: "year",
  },
  "demo-school-f1": {
    name: "Form 1 Hub",
    subtitle: "Form 1 A",
    school: "Demo College",
    schoolId: "demo-college",
    mode: "secondary",
    sheetId: "demo",
    active: true,
    plan: "year",
  },
  "demo-school-f10": {
    name: "Form 10 Hub",
    subtitle: "Form 10 Arts",
    school: "Demo College",
    schoolId: "demo-college",
    mode: "secondary",
    sheetId: "demo",
    active: true,
    plan: "year",
  },
  "demo-school-ls": {
    name: "Lower Sixth Hub",
    subtitle: "Lower Sixth Science",
    school: "Demo College",
    schoolId: "demo-college",
    mode: "secondary",
    sheetId: "demo",
    active: true,
    plan: "year",
  },
  // Inactive on purpose: must NOT appear on the school page
  "demo-school-us": {
    name: "Upper Sixth Hub",
    subtitle: "Upper Sixth Arts",
    school: "Demo College",
    schoolId: "demo-college",
    mode: "secondary",
    sheetId: "demo",
    active: false,
    plan: "year",
  },
};

export const SCHOOLS: Record<string, SchoolConfig> = {
  // "nhs": { name: "[SCHOOL NAME]", logo: "logos/nhs.png", color: "#7A1F2B", parentsHub: "nhs-parents" },
  "demo-college": { name: "Demo College", color: "#7A1F2B", parentsHub: "demo-school" },
};

/** Hub ids: lowercase letters, numbers and dashes only. */
export const HUB_ID_PATTERN = /^[a-z0-9-]{2,40}$/;
