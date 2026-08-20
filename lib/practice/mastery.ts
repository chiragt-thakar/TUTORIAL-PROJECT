import type { MasteryRules, MasteryShape } from "./types";

/**
 * Mastery is *earned*, never granted for opening a page.
 *
 * The learner asked for a gym, not a reading list, so the only inputs here are things that
 * required work: exercises ticked off after being attempted, an assessment actually scored,
 * interview questions reviewed, debugging solved, a project shipped. Visiting the lesson
 * moves the status to "learning" and no further.
 *
 * Pure on purpose — `tests/practice.test.ts` covers it, and both the lesson page and the
 * practice hub compute status from the same function so the two can never disagree.
 */

/**
 * The seven stages a topic is worked through. "Review" is deliberately not one of them: it is
 * not a box to tick but a state a finished topic falls back into once `revisitAfterDays` have
 * passed, which is what `MasteryStatus` "needs-review" and the revision queue express.
 */
export const STAGES = ["learn", "examples", "practice", "debug", "interview", "test", "project"] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_LABEL: Record<Stage, string> = {
  learn: "Learn",
  examples: "Examples",
  practice: "Practice",
  debug: "Debug",
  interview: "Interview",
  test: "Test",
  project: "Project",
};

export type MasteryStatus = "not-started" | "learning" | "practicing" | "needs-review" | "completed" | "mastered";

export const STATUS_LABEL: Record<MasteryStatus, string> = {
  "not-started": "Not started",
  learning: "Learning",
  practicing: "Practicing",
  "needs-review": "Needs review",
  completed: "Completed",
  mastered: "Mastered",
};

export const DEFAULT_MASTERY_RULES: MasteryRules = {
  minAssessmentScore: 80,
  requireProject: true,
  requireInterview: true,
  requireDebug: true,
  revisitAfterDays: 21,
};

/** The slice of learner progress mastery depends on. Keeps this file free of the store's shape. */
export interface MasteryInput {
  completedLessons: string[];
  completedExercises: string[];
  completedProjects: string[];
  reviewedInterview: string[];
  quizScores: Record<string, { best: number; attempts: number; lastAt: string }>;
  lessonDates: Record<string, string>;
}

export interface StageState {
  stage: Stage;
  done: number;
  total: number;
  /** False when the topic has no work of this kind at all — the stage is then skipped. */
  applicable: boolean;
  complete: boolean;
}

export interface MasteryReport {
  lessonId: string;
  status: MasteryStatus;
  stages: StageState[];
  /** 0-100 across every applicable stage. */
  percent: number;
  /** Best assessment score so far, or null if never attempted. */
  assessmentScore: number | null;
  /** Days since the last recorded activity on this topic, or null if never touched. */
  daysSinceActivity: number | null;
  /** What is still standing between the learner and "mastered". */
  blocking: string[];
}

function stage(name: Stage, done: number, total: number): StageState {
  return { stage: name, done, total, applicable: total > 0, complete: total > 0 && done >= total };
}

function daysBetween(from: string, today: Date): number | null {
  const stamp = Date.parse(`${from.slice(0, 10)}T00:00:00.000Z`);
  if (Number.isNaN(stamp)) return null;
  const now = Date.parse(`${today.toISOString().slice(0, 10)}T00:00:00.000Z`);
  return Math.floor((now - stamp) / 86_400_000);
}

/**
 * `total = 0` means "this topic has no debugging work", not "the debugging is done", so an
 * inapplicable stage is dropped from the percentage rather than counted as a free win.
 */
export function computeMastery(set: MasteryShape, progress: MasteryInput, today = new Date()): MasteryReport {
  const rules = { ...DEFAULT_MASTERY_RULES, ...set.mastery };
  const exerciseDone = new Set(progress.completedExercises);
  const projectDone = new Set(progress.completedProjects);
  const interviewDone = new Set(progress.reviewedInterview);

  const required = set.exercises.filter((exercise) => exercise.requiredForMastery);
  const debugKinds = new Set(["debug", "code-reading"]);
  const debugRequired = required.filter((exercise) => debugKinds.has(exercise.kind));
  const codingRequired = required.filter((exercise) => !debugKinds.has(exercise.kind));
  const requiredInterview = set.interview.filter((question) => question.requiredForMastery);
  const buildProjects = set.projects.filter((project) => project.kind !== "final-challenge");
  const assessment = set.quizzes.find((quiz) => quiz.kind === "assessment");
  const checkpoints = set.quizzes.filter((quiz) => quiz.kind === "checkpoint");

  const assessmentScore = assessment ? (progress.quizScores[assessment.id]?.best ?? null) : null;
  const learnDone = progress.completedLessons.includes(set.lessonId) ? 1 : 0;

  const stages: StageState[] = [
    stage("learn", learnDone, 1),
    stage(
      "examples",
      checkpoints.filter((quiz) => (progress.quizScores[quiz.id]?.best ?? 0) >= quiz.passScore).length,
      checkpoints.length,
    ),
    stage("practice", codingRequired.filter((exercise) => exerciseDone.has(exercise.id)).length, codingRequired.length),
    stage("debug", debugRequired.filter((exercise) => exerciseDone.has(exercise.id)).length, rules.requireDebug ? debugRequired.length : 0),
    stage("interview", requiredInterview.filter((question) => interviewDone.has(question.id)).length, rules.requireInterview ? requiredInterview.length : 0),
    stage("test", assessment && assessmentScore !== null && assessmentScore >= rules.minAssessmentScore ? 1 : 0, assessment ? 1 : 0),
    stage("project", buildProjects.filter((project) => projectDone.has(project.id)).length, rules.requireProject ? buildProjects.length : 0),
  ];

  const applicable = stages.filter((item) => item.applicable);
  const percent = applicable.length === 0 ? 0 : Math.round((applicable.reduce((sum, item) => sum + item.done / item.total, 0) / applicable.length) * 100);

  const lastActive = progress.lessonDates[set.lessonId];
  const daysSinceActivity = lastActive ? daysBetween(lastActive, today) : null;

  const blocking = applicable.filter((item) => !item.complete).map((item) => `${STAGE_LABEL[item.stage]} (${item.done}/${item.total})`);

  const core = ["learn", "practice", "test"] as const;
  const coreComplete = core.every((name) => {
    const found = stages.find((item) => item.stage === name);
    return !found?.applicable || found.complete;
  });
  const allComplete = applicable.every((item) => item.complete);

  let status: MasteryStatus;
  if (percent === 0 && learnDone === 0) status = "not-started";
  else if (allComplete) status = "mastered";
  else if (coreComplete) status = "completed";
  else if (percent > Math.round(100 / Math.max(applicable.length, 1))) status = "practicing";
  else status = "learning";

  // A stale topic outranks a finished one: the roadmap's whole point is that unrevised
  // knowledge decays, so it goes back in the queue rather than sitting on a trophy shelf.
  if ((status === "mastered" || status === "completed") && daysSinceActivity !== null && daysSinceActivity >= rules.revisitAfterDays) {
    status = "needs-review";
  }

  return { lessonId: set.lessonId, status, stages, percent, assessmentScore, daysSinceActivity, blocking };
}

/** Percentage score for a completed quiz attempt. */
export function scoreQuiz(earned: number, possible: number): number {
  return possible === 0 ? 0 : Math.round((earned / possible) * 100);
}

/**
 * Grades one choice question. Multi-select is all-or-nothing on purpose: partial credit lets a
 * learner shotgun every option and still feel they passed.
 */
export function isChoiceCorrect(answer: string[], selected: string[]): boolean {
  if (answer.length !== selected.length) return false;
  const wanted = new Set(answer);
  return selected.every((id) => wanted.has(id));
}
