import { computeMastery, type MasteryInput, type MasteryReport, type MasteryStatus } from "./mastery";
import type { MasteryShape } from "./types";

/**
 * Picking *what to practise next*.
 *
 * Everything here is pure and deterministic given a seed, so the same suggestion renders on the
 * server and the client without a hydration mismatch, and `tests/practice.test.ts` can assert on
 * it directly.
 */

/** A lesson plus how the learner is doing on it — the unit every selector works over. */
export interface PracticeEntry<T extends MasteryShape> {
  set: T;
  report: MasteryReport;
}

export function buildEntries<T extends MasteryShape>(sets: T[], progress: MasteryInput, today = new Date()): PracticeEntry<T>[] {
  return sets.map((set) => ({ set, report: computeMastery(set, progress, today) }));
}

/**
 * Topics that were learned and have now gone stale, oldest first. This is the spaced-revision
 * queue — the answer to "learn once, forget everything". `computeMastery` has already demoted a
 * finished-but-stale topic to `needs-review`, so this only has to read the status.
 */
export function revisionDue<T extends MasteryShape>(entries: PracticeEntry<T>[], limit = 6): PracticeEntry<T>[] {
  return entries
    .filter((entry) => entry.report.status === "needs-review")
    .sort((a, b) => (b.report.daysSinceActivity ?? 0) - (a.report.daysSinceActivity ?? 0))
    .slice(0, limit);
}

const UNTOUCHED: MasteryStatus[] = ["not-started"];

/**
 * Topics the learner has started and is doing badly at. A failed assessment weighs far more than
 * an unticked exercise, because a wrong answer is evidence of a misunderstanding and a blank is
 * only evidence of not having got there yet.
 */
export function weakTopics<T extends MasteryShape>(entries: PracticeEntry<T>[], limit = 6): PracticeEntry<T>[] {
  return entries
    .filter((entry) => !UNTOUCHED.includes(entry.report.status) && entry.report.percent < 100)
    .map((entry) => {
      const failed =
        entry.report.assessmentScore !== null && entry.report.assessmentScore < entry.set.mastery.minAssessmentScore;
      return { entry, weight: (failed ? 200 : 0) + (100 - entry.report.percent) };
    })
    .sort((a, b) => b.weight - a.weight)
    .slice(0, limit)
    .map((item) => item.entry);
}

/** Deterministic 32-bit FNV-1a hash, so "today's challenge" is stable for the whole day. */
export function seedFrom(value: string): number {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}

export interface RandomChallenge<T extends MasteryShape> {
  set: T;
  exerciseId: string;
  title: string;
  tier: string;
}

/**
 * One unsolved exercise drawn from everything published, weighted toward the harder tiers — the
 * point of a random challenge is to be caught out, not to re-tick an easy win.
 */
export function randomChallenge<T extends MasteryShape>(
  entries: PracticeEntry<T>[],
  completedExercises: string[],
  seed: string,
): RandomChallenge<T> | null {
  const done = new Set(completedExercises);
  const weight: Record<string, number> = { challenge: 4, tricky: 4, intermediate: 2, normal: 1 };
  const pool = entries.flatMap((entry) =>
    entry.set.exercises
      .filter((exercise) => !done.has(exercise.id))
      .flatMap((exercise) =>
        Array.from({ length: weight[exercise.tier] ?? 1 }, () => ({
          set: entry.set,
          exerciseId: exercise.id,
          title: exercise.title,
          tier: exercise.tier as string,
        })),
      ),
  );
  if (pool.length === 0) return null;
  return pool[seedFrom(seed) % pool.length];
}
