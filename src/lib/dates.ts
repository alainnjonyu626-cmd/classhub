// Dates and times. Everything uses the PHONE's local time. README section 12.

import type { DayCode, Minutes } from "../types/sheet";

const DAY_CODES: DayCode[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const LONG_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "2026-10-22" → local Date at midnight, or null if the format is wrong. */
export function parseDate(value: string | null | undefined): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((value ?? "").trim());
  if (!m) return null;
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  // Rejects impossible dates like 2026-02-31
  return date.getMonth() === Number(m[2]) - 1 ? date : null;
}

/** "08:30" → 510 minutes, or null. */
export function parseTime(value: string | null | undefined): Minutes | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec((value ?? "").trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h < 24 && min < 60 ? h * 60 + min : null;
}

/** 510 → "8:30" */
export function formatTime(minutes: Minutes): string {
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`;
}

export function today(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function minutesNow(): Minutes {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

/** A date + optional time → exact moment. No time = end of day (23:59). */
export function atTime(date: Date, time: Minutes | null): Date {
  const t = time ?? 23 * 60 + 59;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), Math.floor(t / 60), t % 60);
}

/** Date → "Mon" (Sunday → null: no classes) */
export function dayCode(date: Date): DayCode | null {
  const day = date.getDay();
  return day === 0 ? null : (DAY_CODES[day - 1] ?? null);
}

/** "Thu 22 Oct" */
export function formatDate(date: Date): string {
  return `${SHORT_DAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

/** "Monday, 19 October" */
export function formatLongDate(date: Date): string {
  return `${DAY_NAMES[date.getDay()]}, ${date.getDate()} ${LONG_MONTHS[date.getMonth()]}`;
}

/** "2 hours ago", "Yesterday", "9 Oct" */
export function relativeTime(when: Date, now = new Date()): string {
  const mins = Math.round((now.getTime() - when.getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24 && when.getDate() === now.getDate()) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.round((today().getTime() - new Date(when.getFullYear(), when.getMonth(), when.getDate()).getTime()) / 86400000);
  if (days === 1) return "Yesterday";
  if (days < 7) return SHORT_DAYS[when.getDay()] ?? "";
  return `${when.getDate()} ${MONTHS[when.getMonth()]}`;
}

/** For dates without a time: "Today", "Yesterday", "Mon", "9 Oct" */
export function relativeDay(date: Date): string {
  const days = Math.round((today().getTime() - new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days > 1 && days < 7) return SHORT_DAYS[date.getDay()] ?? "";
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

export interface Countdown {
  days: number;
  hours: number;
  mins: number;
  past: boolean;
  totalMinutes: number;
}

export function countdown(target: Date, now = new Date()): Countdown {
  const total = Math.floor((target.getTime() - now.getTime()) / 60000);
  const past = total < 0;
  const t = Math.abs(total);
  return { days: Math.floor(t / 1440), hours: Math.floor((t % 1440) / 60), mins: t % 60, past, totalMinutes: total };
}

/** Short label for due badges: "In 3 hours", "Today", "Tomorrow", "2d 5h", "Passed" */
export function countdownLabel(target: Date, now = new Date()): string {
  const c = countdown(target, now);
  if (c.past) return "Passed";
  if (c.totalMinutes < 60) return `${c.mins} min`;
  if (c.totalMinutes < 6 * 60) return `In ${c.hours + c.days * 24} hours`;
  const dayDiff = Math.round(
    (new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime() - today().getTime()) / 86400000,
  );
  if (dayDiff === 0) return "Today";
  if (dayDiff === 1) return "Tomorrow";
  return c.days > 0 ? `${c.days}d ${c.hours}h` : `${c.hours}h`;
}

/** ISO week number, for timetable rows with week = odd / even. */
export function isoWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export { DAY_CODES };
