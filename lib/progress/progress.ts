export const PROGRESS_KEY = "python-backend-learning-progress:v1";

export interface ProgressData {
  version: 1;
  completedLessons: string[];
  completedExercises: string[];
  completedAssignments: string[];
  lastVisitedLesson: string | null;
  lastActivityAt: string | null;
  activityDates: string[];
}

export const emptyProgress = (): ProgressData => ({ version: 1, completedLessons: [], completedExercises: [], completedAssignments: [], lastVisitedLesson: null, lastActivityAt: null, activityDates: [] });

export function parseProgress(value: string | null): ProgressData {
  if (!value) return emptyProgress();
  try {
    const data: unknown = JSON.parse(value);
    if (!data || typeof data !== "object" || (data as { version?: unknown }).version !== 1) return emptyProgress();
    const candidate = data as Partial<ProgressData>;
    const strings = (input: unknown) => Array.isArray(input) ? input.filter((item): item is string => typeof item === "string") : [];
    return { version: 1, completedLessons: strings(candidate.completedLessons), completedExercises: strings(candidate.completedExercises), completedAssignments: strings(candidate.completedAssignments), lastVisitedLesson: typeof candidate.lastVisitedLesson === "string" ? candidate.lastVisitedLesson : null, lastActivityAt: typeof candidate.lastActivityAt === "string" ? candidate.lastActivityAt : null, activityDates: strings(candidate.activityDates) };
  } catch { return emptyProgress(); }
}

export function toDayString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function withTodayMarked(dates: string[], today = new Date()): string[] {
  const todayStr = toDayString(today);
  return dates.includes(todayStr) ? dates : [...dates, todayStr];
}

export function computeStreak(dates: string[], today = new Date()): number {
  const unique = [...new Set(dates)].sort();
  if (unique.length === 0) return 0;
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const mostRecent = unique[unique.length - 1];
  if (mostRecent !== toDayString(today) && mostRecent !== toDayString(yesterday)) return 0;
  let streak = 1;
  const cursor = new Date(`${mostRecent}T00:00:00.000Z`);
  for (let index = unique.length - 2; index >= 0; index -= 1) {
    cursor.setDate(cursor.getDate() - 1);
    if (unique[index] === toDayString(cursor)) streak += 1;
    else break;
  }
  return streak;
}

export function computeLongestStreak(dates: string[]): number {
  const unique = [...new Set(dates)].sort();
  if (unique.length === 0) return 0;
  let longest = 1;
  let current = 1;
  for (let index = 1; index < unique.length; index += 1) {
    const expected = new Date(`${unique[index - 1]}T00:00:00.000Z`);
    expected.setDate(expected.getDate() + 1);
    if (toDayString(expected) === unique[index]) { current += 1; longest = Math.max(longest, current); }
    else current = 1;
  }
  return longest;
}

export interface HeatmapDay { date: string; active: boolean }

export function buildActivityWeeks(dates: string[], weeks = 14, today = new Date()): HeatmapDay[][] {
  const active = new Set(dates);
  const days: HeatmapDay[] = [];
  for (let offset = weeks * 7 - 1; offset >= 0; offset -= 1) {
    const day = new Date(today);
    day.setDate(day.getDate() - offset);
    const key = toDayString(day);
    days.push({ date: key, active: active.has(key) });
  }
  const columns: HeatmapDay[][] = [];
  for (let index = 0; index < days.length; index += 7) columns.push(days.slice(index, index + 7));
  return columns;
}

export function percentage(completed: number, total: number): number {
  return total === 0 ? 0 : Math.round((completed / total) * 100);
}

export function nextIncompleteLesson(orderedIds: string[], completed: string[], lastVisited: string | null): string | null {
  const done = new Set(completed);
  if (lastVisited && orderedIds.includes(lastVisited) && !done.has(lastVisited)) return lastVisited;
  return orderedIds.find((id) => !done.has(id)) ?? orderedIds.at(-1) ?? null;
}
