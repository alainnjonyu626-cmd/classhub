// Words that change between university and secondary mode. README section 11.
// Pages never write "Courses" or "Lecturer" directly: they call L("courses").

import type { Mode } from "../types/hub";

export interface Labels {
  courses: string;
  course: string;
  teacher: string;
  leader: string;
  test: string;
  exam: string;
  pastQuestions: string;
  /** null = Parents' corner is hidden in this mode. */
  parents: string | null;
  /** null = credits are hidden in this mode. */
  credits: string | null;
  classInfo: string;
}

export const LABELS: Record<Mode, Labels> = {
  university: {
    courses: "Courses",
    course: "Course",
    teacher: "Lecturer",
    leader: "Class delegate",
    test: "CA test",
    exam: "Exam",
    pastQuestions: "Past questions",
    parents: null,
    credits: "credits",
    classInfo: "Class info",
  },
  secondary: {
    courses: "Subjects",
    course: "Subject",
    teacher: "Teacher",
    leader: "Class teacher",
    test: "Sequence test",
    exam: "Exam",
    pastQuestions: "Past papers",
    parents: "Parents' corner",
    credits: null,
    classInfo: "Class info",
  },
};

let currentMode: Mode = "university";

export function setMode(mode: Mode): void {
  currentMode = mode in LABELS ? mode : "university";
}

export function getMode(): Mode {
  return currentMode;
}

/** L("courses") → "Courses" or "Subjects" depending on the hub's mode. */
export function L<K extends keyof Labels>(key: K): Labels[K] {
  return LABELS[currentMode][key];
}
