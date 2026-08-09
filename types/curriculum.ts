export type ContentStatus = "available" | "planned";

export interface Track {
  slug: string;
  number: number;
  title: string;
  tagline: string;
  description: string;
  status: ContentStatus;
}

export interface LessonSummary {
  id: string;
  slug: string;
  title: string;
  description: string;
  order: number;
  estimatedMinutes: number;
  learningObjectives: string[];
  prerequisites: string[];
}

export interface Lesson extends LessonSummary {
  module: string;
  source: string;
  status: ContentStatus;
}

export interface Module {
  slug: string;
  track: string;
  number: number;
  title: string;
  description: string;
  status: ContentStatus;
  estimatedMinutes: number;
  prerequisites: string[];
  learningOutcomes: string[];
  lessons: LessonSummary[];
  assignment?: LessonSummary;
}
