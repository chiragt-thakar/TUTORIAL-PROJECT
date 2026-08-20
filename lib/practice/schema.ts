import { z } from "zod";

/**
 * Validation for `<lesson-slug>.practice.yaml`. Deliberately strict: a typo in a difficulty
 * tier or a missing hint would degrade the practice experience silently, and this content is
 * hand-authored one topic at a time, so a loud failure at build time is cheap.
 */

const text = z.string().min(1);
const idField = z.string().regex(/^[a-z0-9][a-z0-9-]*$/, "ids are lowercase kebab-case and stable forever");

export const exerciseSchema = z.object({
  id: idField,
  tier: z.enum(["normal", "intermediate", "tricky", "challenge"]),
  kind: z.enum(["write-code", "predict-output", "debug", "refactor", "code-reading", "explain", "design", "performance"]),
  title: text,
  prompt: text,
  code: text.optional(),
  hints: z.array(text).min(1).max(4),
  solution: text,
  solutionCode: text.optional(),
  explanation: text.optional(),
  concepts: z.array(text).min(1),
  minutes: z.number().int().positive(),
  requiredForMastery: z.boolean().default(false),
});

export const quizQuestionSchema = z
  .object({
    id: idField,
    kind: z.enum([
      "mcq", "multi", "true-false", "predict-output", "find-bug",
      "complete-code", "explain", "write-function", "refactor", "performance", "scenario",
    ]),
    prompt: text,
    code: text.optional(),
    options: z.array(z.object({ id: idField, text })).min(2).optional(),
    answer: z.array(idField).default([]),
    modelAnswer: text.optional(),
    explanation: text,
    concepts: z.array(text).min(1),
    points: z.number().int().positive().default(1),
  })
  .superRefine((question, ctx) => {
    const choice = question.options !== undefined;
    if (choice) {
      const ids = new Set(question.options?.map((option) => option.id));
      if (question.answer.length === 0) ctx.addIssue({ code: "custom", message: `${question.id}: a choice question needs at least one correct option` });
      for (const id of question.answer) {
        if (!ids.has(id)) ctx.addIssue({ code: "custom", message: `${question.id}: answer "${id}" is not one of its options` });
      }
      if (question.kind === "mcq" && question.answer.length !== 1) {
        ctx.addIssue({ code: "custom", message: `${question.id}: an "mcq" has exactly one answer — use "multi" for several` });
      }
    } else if (!question.modelAnswer) {
      ctx.addIssue({ code: "custom", message: `${question.id}: an open question needs a modelAnswer to grade against` });
    }
  });

export const quizSchema = z.object({
  id: idField,
  title: text,
  kind: z.enum(["checkpoint", "assessment"]),
  passScore: z.number().int().min(1).max(100).default(80),
  questions: z.array(quizQuestionSchema).min(1),
});

export const interviewSchema = z.object({
  id: idField,
  level: z.enum(["basic", "intermediate", "advanced", "tricky", "scenario", "debugging", "output", "internals", "comparison"]),
  question: text,
  code: text.optional(),
  shortAnswer: text,
  fullAnswer: text,
  commonWrongAnswer: text.optional(),
  followUps: z.array(text).default([]),
  concepts: z.array(text).min(1),
  requiredForMastery: z.boolean().default(false),
});

export const projectSchema = z.object({
  id: idField,
  kind: z.enum(["micro", "small", "major", "final-challenge"]),
  title: text,
  summary: text,
  problem: text,
  requirements: z.array(text).min(1),
  constraints: z.array(text).default([]),
  expectedBehaviour: z.array(text).default([]),
  structure: text.optional(),
  milestones: z.array(z.object({ title: text, detail: text })).default([]),
  testing: z.array(text).default([]),
  failureCases: z.array(text).default([]),
  bonus: z.array(text).default([]),
  architectureHints: z.array(text).default([]),
  referenceOutline: text.optional(),
  minutes: z.number().int().positive(),
});

export const resourceSchema = z.object({
  name: text,
  type: z.enum(["docs", "tutorial", "university", "article", "interactive", "video", "repo", "book", "talk"]),
  difficulty: z.enum(["intro", "core", "deep"]),
  url: z.string().url(),
  why: text,
  covers: text,
  usefulness: z.number().int().min(3).max(5),
});

export const masteryRulesSchema = z.object({
  minAssessmentScore: z.number().int().min(1).max(100).default(80),
  requireProject: z.boolean().default(true),
  requireInterview: z.boolean().default(true),
  requireDebug: z.boolean().default(true),
  revisitAfterDays: z.number().int().positive().default(21),
});

export const practiceSetSchema = z
  .object({
    lessonId: text,
    module: text,
    lesson: text,
    title: text,
    summary: text,
    exercises: z.array(exerciseSchema).default([]),
    quizzes: z.array(quizSchema).default([]),
    interview: z.array(interviewSchema).default([]),
    projects: z.array(projectSchema).default([]),
    resources: z.array(resourceSchema).default([]),
    mastery: masteryRulesSchema.prefault({}),
  })
  .superRefine((set, ctx) => {
    const ids = [
      ...set.exercises.map((item) => item.id),
      ...set.quizzes.map((item) => item.id),
      ...set.quizzes.flatMap((quiz) => quiz.questions.map((question) => question.id)),
      ...set.interview.map((item) => item.id),
      ...set.projects.map((item) => item.id),
    ];
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) ctx.addIssue({ code: "custom", message: `duplicate practice id "${id}" — ids are progress keys and must be unique` });
      seen.add(id);
    }
    if (set.mastery.minAssessmentScore > 0 && !set.quizzes.some((quiz) => quiz.kind === "assessment")) {
      ctx.addIssue({ code: "custom", message: "mastery requires an assessment score but this set has no assessment quiz" });
    }
    if (set.mastery.requireProject && set.projects.length === 0) {
      ctx.addIssue({ code: "custom", message: 'mastery requires a project but none is defined — set `mastery.requireProject: false` if the topic does not justify one' });
    }
  });
