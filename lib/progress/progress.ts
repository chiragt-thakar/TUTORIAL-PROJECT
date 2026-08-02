export const PROGRESS_KEY = "python-backend-learning-progress:v1";

export interface ProgressData {
  version: 1;
  completedLessons: string[];
  completedExercises: string[];
  completedAssignments: string[];
  lastVisitedLesson: string | null;
  lastActivityAt: string | null;
}

export const emptyProgress = (): ProgressData => ({ version: 1, completedLessons: [], completedExercises: [], completedAssignments: [], lastVisitedLesson: null, lastActivityAt: null });

export function parseProgress(value: string | null): ProgressData {
  if (!value) return emptyProgress();
  try {
    const data: unknown = JSON.parse(value);
    if (!data || typeof data !== "object" || (data as { version?: unknown }).version !== 1) return emptyProgress();
    const candidate = data as Partial<ProgressData>;
    const strings = (input: unknown) => Array.isArray(input) ? input.filter((item): item is string => typeof item === "string") : [];
    return { version: 1, completedLessons: strings(candidate.completedLessons), completedExercises: strings(candidate.completedExercises), completedAssignments: strings(candidate.completedAssignments), lastVisitedLesson: typeof candidate.lastVisitedLesson === "string" ? candidate.lastVisitedLesson : null, lastActivityAt: typeof candidate.lastActivityAt === "string" ? candidate.lastActivityAt : null };
  } catch { return emptyProgress(); }
}

export function percentage(completed: number, total: number): number {
  return total === 0 ? 0 : Math.round((completed / total) * 100);
}

export function nextIncompleteLesson(orderedIds: string[], completed: string[], lastVisited: string | null): string | null {
  const done = new Set(completed);
  if (lastVisited && orderedIds.includes(lastVisited) && !done.has(lastVisited)) return lastVisited;
  return orderedIds.find((id) => !done.has(id)) ?? orderedIds.at(-1) ?? null;
}
