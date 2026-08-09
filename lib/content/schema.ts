import { z } from "zod";

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
  title: z.string().min(1),
  description: z.string().min(1),
  order: z.number().int().positive(),
  estimatedMinutes: z.number().int().positive(),
  prerequisites: z.array(z.string()),
  learningObjectives: z.array(z.string().min(1)).min(1),
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
});
