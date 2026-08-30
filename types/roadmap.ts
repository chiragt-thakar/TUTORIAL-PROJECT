/**
 * Types for the AI/ML Mastery Roadmap.
 *
 * The roadmap is authored once, verbatim, in `content/roadmap/AI_ML_MASTERY_ROADMAP.md`
 * and parsed into these structures at request time. Nothing is transcribed by hand into a
 * second file, so a topic cannot be dropped, reordered, or paraphrased in transit — the
 * markdown is the single source of truth and `tests/roadmap.test.ts` asserts conservation.
 */

export type RoadmapBlockKind =
  | "paragraph"
  | "checklist"
  | "bullets"
  | "numbered"
  | "quote"
  | "label"
  | "table";

/** One `- [ ]` line: a trackable topic, with an ID stable enough to store progress against. */
export interface RoadmapTopic {
  /** Stable progress key: `roadmap:<group key>:<index within group>` — see CLAUDE.md. */
  id: string;
  text: string;
}

export interface RoadmapBlock {
  kind: RoadmapBlockKind;
  /** Raw markdown lines for the block, with list/quote markers stripped. */
  lines: string[];
  /** Present only when `kind === "checklist"`. */
  items?: RoadmapTopic[];
}

export interface RoadmapGroup {
  id: string;
  /** `"1.1"`, `"10.3"`, or `null` for an unnumbered heading. */
  number: string | null;
  title: string;
  blocks: RoadmapBlock[];
  topicCount: number;
}

export interface RoadmapSection {
  id: string;
  title: string;
  /** Blocks between the section heading and its first `###` group. */
  intro: RoadmapBlock[];
  groups: RoadmapGroup[];
  /** The section's Proof Gate, if it has one. */
  proofGate: RoadmapBlock[] | null;
  topicCount: number;
}

export interface RoadmapPhase extends RoadmapSection {
  number: number;
  /** `CORE`, `TOOL`, `CORE + TOOL`, ... exactly as tagged in the source. */
  tag: string;
  duration: string;
}

export interface Roadmap {
  title: string;
  /** The `**Built for:** ...` style lines under the title. */
  meta: string[];
  /** The provenance notice blockquote at the top of the source file. */
  notice: string[];
  /** False while the source document is still missing its truncated tail. */
  complete: boolean;
  /** Narrative sections before the first phase ("READ THIS BEFORE…", "HOW TO USE…"). */
  frontSections: RoadmapSection[];
  /**
   * Sections after the last phase: the cross-cutting tracks, review cadence, anti-patterns, and
   * closing summary. Kept separate so they render after the phases, in document order.
   */
  appendixSections: RoadmapSection[];
  phases: RoadmapPhase[];
  topicCount: number;
  sourcePath: string;
}
