// Built-in demo class, used when a hub's sheetId is "demo".
// All dates are calculated from TODAY, so the demo always looks alive:
// countdowns tick, "Today" has classes, announcements are recent.
// It's like a model house on a building site: same rooms as the real thing,
// so you can show clients before their own house (sheet) is ready.

import type { RawRow, TabName } from "../types/sheet";

const pad = (n: number) => String(n).padStart(2, "0");

/** Date `days` from today as YYYY-MM-DD. */
function day(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Time `hours` before now as HH:MM (clamped to today). */
function hoursAgo(hours: number): string {
  const d = new Date(Date.now() - hours * 3600000);
  return d.getDate() === new Date().getDate() ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : "00:05";
}

const DRIVE = "https://drive.google.com/";

const TABS: Record<TabName, RawRow[]> = {
  info: [
    { key: "class_name", value: "Computer Science · Level 200" },
    { key: "year", value: "2026/2027" },
    { key: "students", value: "84" },
    { key: "whatsapp_group", value: "" },
    { key: "contribution", value: "2,000 FCFA per student, for handouts and printing" },
    { key: "contribution_due", value: day(13) },
    { key: "welcome", value: "" },
    { key: "updated_by", value: "Brenda T." },
  ],
  announcements: [
    {
      id: "6", date: day(0), time: hoursAgo(2), category: "urgent", pinned: "yes", author: "Delegate", code: "CSC201",
      title: "CSC 201 CA moved to Thursday, 10am, Amphi 250",
      body: "The lecturer moved our CSC 201 continuous assessment because of the faculty meeting.\n\nIt covers chapters 1 to 4: arrays, linked lists, stacks and queues. Bring your student card. Nobody will be allowed in after 10:15.\n\nIf you have a clash with another course, message me before tomorrow evening.",
      when: "In 3 days, 10:00", where: "Amphi 250", attachment: DRIVE, attachment_name: "CSC 201 · CA revision sheet", expires: day(3),
    },
    { id: "5", date: day(-1), time: "18:10", category: "exam", pinned: "no", author: "Delegate", title: "First semester exam timetable is out", body: "Exams start in six weeks. Check your venues on the faculty notice board.", code: "", when: "", where: "", attachment: "", attachment_name: "", expires: "" },
    { id: "4", date: day(-2), time: "12:00", category: "general", pinned: "no", author: "Delegate", title: "CSC 203 lab moved from Lab 1 to Lab 2", body: "From this week, all Monday labs hold in Lab 2.", code: "CSC203", when: "", where: "Lab 2", attachment: "", attachment_name: "", expires: "" },
    { id: "3", date: day(-3), time: "09:30", category: "urgent", pinned: "no", author: "Delegate", title: "Submit project group names by Friday", body: "Groups of 4. Send names to the delegate.", code: "", when: "", where: "", attachment: "", attachment_name: "", expires: "" },
    { id: "2", date: day(-10), time: "15:00", category: "general", pinned: "no", author: "Delegate", title: "Handouts for MAT 201 now available", body: "Download them from the Handouts page.", code: "MAT201", when: "", where: "", attachment: "", attachment_name: "", expires: "" },
    { id: "1", date: day(-12), time: "17:45", category: "social", pinned: "no", author: "Delegate", title: "Class meeting after STA 201, Friday", body: "We're planning the end-of-semester party.", code: "", when: "", where: "", attachment: "", attachment_name: "", expires: "" },
  ],
  timetable: [
    { day: "Mon", start: "08:00", end: "10:00", code: "CSC201", title: "", venue: "Amphi 250", teacher: "", type: "lecture", week: "all" },
    { day: "Mon", start: "10:00", end: "12:00", code: "CSC203", title: "", venue: "Lab 2", teacher: "", type: "lab", week: "all" },
    { day: "Mon", start: "14:00", end: "16:00", code: "MAT201", title: "", venue: "Hall B", teacher: "", type: "lecture", week: "all" },
    { day: "Mon", start: "16:00", end: "17:00", code: "BIL201", title: "", venue: "Room 12", teacher: "", type: "lecture", week: "all" },
    { day: "Tue", start: "08:00", end: "10:00", code: "STA201", title: "", venue: "Hall B", teacher: "", type: "lecture", week: "all" },
    { day: "Tue", start: "10:00", end: "12:00", code: "CSC205", title: "", venue: "Amphi 250", teacher: "", type: "lecture", week: "all" },
    { day: "Tue", start: "13:00", end: "15:00", code: "MAT201", title: "", venue: "Room 8", teacher: "", type: "tutorial", week: "all" },
    { day: "Wed", start: "08:00", end: "10:00", code: "CSC203", title: "", venue: "Amphi 250", teacher: "", type: "lecture", week: "all" },
    { day: "Wed", start: "12:00", end: "14:00", code: "CSC201", title: "", venue: "Lab 1", teacher: "", type: "lab", week: "all" },
    { day: "Thu", start: "08:00", end: "10:00", code: "CSC205", title: "", venue: "Amphi 250", teacher: "", type: "lecture", week: "all" },
    { day: "Thu", start: "10:00", end: "12:00", code: "STA201", title: "", venue: "Room 8", teacher: "", type: "tutorial", week: "all" },
    { day: "Thu", start: "14:00", end: "16:00", code: "BIL201", title: "", venue: "Room 12", teacher: "", type: "lecture", week: "all" },
    { day: "Fri", start: "08:00", end: "10:00", code: "MAT201", title: "", venue: "Hall B", teacher: "", type: "lecture", week: "all" },
    { day: "Fri", start: "10:00", end: "12:00", code: "CSC201", title: "", venue: "Amphi 250", teacher: "", type: "lecture", week: "all" },
  ],
  deadlines: [
    { title: "Assignment 2", code: "CSC203", type: "assignment", date: day(2), time: "23:59", venue: "", details: "Build a responsive landing page with HTML and CSS. Submit the GitHub link.", done: "no", announcement_id: "" },
    { title: "CA test", code: "CSC201", type: "test", date: day(3), time: "10:00", venue: "Amphi 250", details: "Chapters 1 to 4", done: "no", announcement_id: "6" },
    { title: "Project group names", code: "", type: "admin", date: day(4), time: "", venue: "", details: "Groups of 4, send to the delegate.", done: "no", announcement_id: "3" },
    { title: "CA test", code: "MAT201", type: "test", date: day(15), time: "14:00", venue: "Hall B", details: "", done: "no", announcement_id: "" },
    { title: "Assignment 1", code: "STA201", type: "assignment", date: day(18), time: "", venue: "", details: "Exercises 1 to 12, chapter 2.", done: "no", announcement_id: "" },
    { title: "First semester exams begin", code: "", type: "exam", date: day(42), time: "08:00", venue: "", details: "", done: "no", announcement_id: "5" },
    { title: "Assignment 1", code: "CSC203", type: "assignment", date: day(-9), time: "23:59", venue: "", details: "", done: "yes", announcement_id: "" },
  ],
  courses: [
    { code: "CSC201", title: "Data Structures", credits: "4", teacher: "Dr. A. Mbah", office: "Block C, Room 2", office_hours: "Mondays, 2pm to 4pm", description: "" },
    { code: "CSC203", title: "Web Development", credits: "4", teacher: "Mr. P. Ndip", office: "Block C, Room 4", office_hours: "Tuesdays, 2pm to 4pm", description: "HTML, CSS and JavaScript" },
    { code: "CSC205", title: "Computer Architecture", credits: "3", teacher: "Dr. J. Tabi", office: "", office_hours: "", description: "" },
    { code: "MAT201", title: "Linear Algebra", credits: "3", teacher: "Dr. E. Fon", office: "", office_hours: "", description: "" },
    { code: "STA201", title: "Probability & Statistics", credits: "3", teacher: "Mrs. L. Ayuk", office: "", office_hours: "", description: "" },
    { code: "BIL201", title: "Bilingual Training", credits: "3", teacher: "Mme. C. Ebai", office: "", office_hours: "", description: "" },
  ],
  handouts: [
    { code: "CSC201", title: "CA revision sheet", link: DRIVE, type: "pdf", size: "410 KB", date_added: day(0), chapter: "" },
    { code: "CSC203", title: "Chapter 4: CSS Grid", link: DRIVE, type: "pdf", size: "2.1 MB", date_added: day(-1), chapter: "4" },
    { code: "MAT201", title: "Tutorial sheet 3", link: DRIVE, type: "pdf", size: "640 KB", date_added: day(-3), chapter: "" },
    { code: "CSC203", title: "Chapter 3: Flexbox", link: DRIVE, type: "pdf", size: "1.8 MB", date_added: day(-7), chapter: "3" },
    { code: "CSC203", title: "Lab 2 starter files", link: DRIVE, type: "zip", size: "320 KB", date_added: day(-7), chapter: "" },
    { code: "CSC201", title: "Chapter 4: Stacks & queues", link: DRIVE, type: "pdf", size: "1.2 MB", date_added: day(-5), chapter: "4" },
  ],
  past_questions: [
    { code: "CSC201", title: "First semester exam", year: "2024/2025", kind: "exam", link: DRIVE, answers_link: DRIVE, pages: "3" },
    { code: "CSC201", title: "CA test", year: "2024/2025", kind: "ca", link: DRIVE, answers_link: "", pages: "1" },
    { code: "CSC201", title: "First semester exam", year: "2023/2024", kind: "exam", link: DRIVE, answers_link: "", pages: "4" },
    { code: "MAT201", title: "CA test", year: "2024/2025", kind: "ca", link: DRIVE, answers_link: "", pages: "1" },
  ],
  leaders: [
    { name: "Brenda T.", role: "Class delegate", whatsapp: "", order: "1" },
    { name: "Kevin N.", role: "Assistant delegate", whatsapp: "", order: "2" },
    { name: "Audrey F.", role: "Class treasurer", whatsapp: "", order: "3" },
  ],
  places: [
    { name: "Amphi 250", directions: "Main block, ground floor", map_link: "" },
    { name: "Lab 2", directions: "Computer centre, 1st floor", map_link: "" },
    { name: "Hall B", directions: "Behind the library", map_link: "" },
  ],
  parents: [],
};

export function demoRows(tab: TabName): { headers: string[]; rows: RawRow[] } {
  const rows = TABS[tab];
  const headers = rows[0] ? Object.keys(rows[0]) : [];
  return { headers, rows };
}
