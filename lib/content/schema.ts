import { z } from "zod";

export const groupSchema = z.object({
  slug: z.string().min(1),
  number: z.number().int().positive(),
  title: z.string().min(1),
  tagline: z.string().min(1),
  description: z.string().min(1),
  /**
   * "roadmap" groups mirror one section of the AI/ML Mastery Roadmap and take their title,
   * tag, and duration from it verbatim. "extra" groups hold everything else.
   */
  kind: z.enum(["roadmap", "extra"]).default("roadmap"),
  /** Phase number when this group mirrors a numbered phase (0-10). */
  roadmapPhase: z.number().int().min(0).max(10).optional(),
  /** The parsed roadmap section id this group mirrors, e.g. "phase-1" or "appendix-3". */
  roadmapSectionId: z.string().min(1).optional(),
  /** The `[CORE]` / `[TOOL]` tag exactly as the roadmap writes it, without brackets. */
  tag: z.string().min(1).optional(),
  /** The phase's duration exactly as the roadmap writes it, e.g. "3–4 weeks". */
  duration: z.string().min(1).optional(),
});

export const trackSchema = z.object({
  slug: z.string().min(1),
  number: z.number().int().positive(),
  title: z.string().min(1),
  tagline: z.string().min(1),
  description: z.string().min(1),
  status: z.enum(["available", "planned"]),
});

const lessonBaseSchema = z.object({
  id: z.string().min(1),
  /**
   * Per-lesson availability. Omitted means "inherit the module's status". Setting it to
   * "available" inside a still-planned module publishes just that lesson, which is what lets
   * content be authored one deep sub-topic at a time instead of a whole module at a time.
   */
  status: z.enum(["available", "planned"]).optional(),
  title: z.string().min(1),
  /**
   * Optional on purpose: a roadmap topic that has not been written yet has no honest
   * description, and inventing one would put words in the roadmap's mouth. Authored lessons
   * must always carry one — `tests/content.test.ts` enforces that for available content.
   */
  description: z.string().min(1).optional(),
  order: z.number().int().positive(),
  estimatedMinutes: z.number().int().positive(),
  prerequisites: z.array(z.string()),
  learningObjectives: z.array(z.string().min(1)).default([]),
});

export const frontmatterSchema = lessonBaseSchema.extend({ module: z.string().min(1) });

export const moduleSchema = z.object({
  slug: z.string().min(1),
  track: z.string().min(1),
  number: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().min(1),
  status: z.enum(["available", "planned"]),
  estimatedMinutes: z.number().int().positive(),
  prerequisites: z.array(z.string()),
  learningOutcomes: z.array(z.string().min(1)).min(1),
  lessons: z.array(lessonBaseSchema.extend({ slug: z.string().min(1) })),
  assignment: lessonBaseSchema.extend({ slug: z.string().min(1) }).optional(),
  /** Navigation group this module belongs to — see content/groups.json. */
  group: z.string().min(1),
  /** Which AI/ML Mastery Roadmap phase this module's content belongs to, if any (0-10). */
  roadmapPhase: z.number().int().min(0).max(10).optional(),
  /** The roadmap subsection this module mirrors, e.g. "2.3". */
  roadmapGroup: z.string().regex(/^\d{1,2}\.\d$/).optional(),
  /**
   * The parsed roadmap section this module mirrors one-to-one, e.g. "phase-2-2.3". Present on
   * every roadmap-derived module and on nothing else — it is what marks a module as being part
   * of the roadmap rather than optional extra reading, and it is the key the module page uses
   * to pull that section's resource list and topic text straight out of the source document.
   */
  roadmapSectionId: z.string().min(1).optional(),
  /** How the roadmap refers to this section in prose, e.g. "1.2" or "Track A". */
  roadmapRef: z.string().min(1).optional(),
  /** The `[CORE]` / `[TOOL]` tag the roadmap gives this section, without brackets. */
  tag: z.string().min(1).optional(),
  /**
   * For extra modules only: the roadmap subsection this material happens to overlap with.
   * A cross-reference, not membership — the roadmap's own module for that subsection lives
   * in the phase groups.
   */
  relatedRoadmapSection: z.string().min(1).optional(),
});
