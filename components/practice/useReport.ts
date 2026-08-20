"use client";

import { useMemo } from "react";
import { useProgress } from "@/components/progress/ProgressProvider";
import { computeMastery, type MasteryInput, type MasteryReport } from "@/lib/practice/mastery";
import { buildEntries, type PracticeEntry } from "@/lib/practice/select";
import type { MasteryShape, RenderedPracticeSet } from "@/lib/practice/types";

/**
 * The adapter between the progress store and the mastery engine.
 *
 * `lib/practice/mastery.ts` deliberately knows nothing about `ProgressData` — it takes the six
 * fields it actually needs, which is what keeps it pure and directly testable. This is the one
 * place that maps one onto the other, so the lesson workbench and the practice hub can never
 * compute a status from different inputs.
 */
export function useMasteryInput(): { input: MasteryInput; hydrated: boolean } {
  const { progress, hydrated } = useProgress();
  const input = useMemo<MasteryInput>(
    () => ({
      completedLessons: progress.completedLessons,
      completedExercises: progress.completedExercises,
      completedProjects: progress.completedProjects,
      reviewedInterview: progress.reviewedInterview,
      quizScores: progress.quizScores,
      lessonDates: progress.lessonDates,
    }),
    [progress],
  );
  return { input, hydrated };
}

export function usePracticeReport(set: RenderedPracticeSet): { report: MasteryReport; hydrated: boolean } {
  const { input, hydrated } = useMasteryInput();
  const report = useMemo(() => computeMastery(set, input), [set, input]);
  return { report, hydrated };
}

export function usePracticeEntries<T extends MasteryShape>(sets: T[]): { entries: PracticeEntry<T>[]; hydrated: boolean } {
  const { input, hydrated } = useMasteryInput();
  const entries = useMemo(() => buildEntries(sets, input), [sets, input]);
  return { entries, hydrated };
}
