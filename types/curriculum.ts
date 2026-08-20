export type ContentStatus = "available" | "planned";

/**
 * A navigation group: the user-facing unit the sidebar and /paths pages are built from.
 *
 * Groups mirror the AI/ML Mastery Roadmap's own sections one-to-one — Phase 0 through Phase 10,
 * then the cross-cutting tracks — followed by a single "extra" group holding the material this
 * site had written before it was rebuilt around the roadmap. `Track` is storage only (which
 * directory a module lives in) and never appears in navigation.
 */
export interface CurriculumGroup {
  slug: string;
  number: number;
  title: string;
  tagline: string;
  description: string;
  kind: "roadmap" | "extra";
  roadmapPhase?: number;
  roadmapSectionId?: string;
  tag?: string;
  duration?: string;
}

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
  /** Per-lesson override; omitted means it inherits the module's status. */
  status?: ContentStatus;
  slug: string;
  title: string;
  /** Absent until the lesson is written — see the note in `lib/content/schema.ts`. */
  description?: string;
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
  /** Navigation group this module belongs to — see content/groups.json. */
  group: string;
  /** Which AI/ML Mastery Roadmap phase this module's content belongs to, if any (0-10). */
  roadmapPhase?: number;
  /** The roadmap subsection this module mirrors, e.g. "2.3". */
  roadmapGroup?: string;
  /** The parsed roadmap section this module mirrors one-to-one, e.g. "phase-2-2.3". */
  roadmapSectionId?: string;
  /** How the roadmap refers to this section in prose, e.g. "1.2" or "Track A". */
  roadmapRef?: string;
  /** The `[CORE]` / `[TOOL]` tag the roadmap gives this section, without brackets. */
  tag?: string;
  /** Extra modules only: a roadmap subsection this material overlaps with. A cross-reference. */
  relatedRoadmapSection?: string;
}
