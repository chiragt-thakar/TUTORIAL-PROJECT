export const PROGRESS_KEY = "python-backend-learning-progress:v1";

/**
 * The four weekly lanes the roadmap's "HOW TO USE THIS DOCUMENT" section prescribes
 * (4h math / 6h main track / 3h build / 1h paper-review per week).
 */
export const STUDY_LANES = ["math", "main", "build", "paper"] as const;
export type StudyLane = (typeof STUDY_LANES)[number];

export const LANE_TARGET_HOURS: Record<StudyLane, number> = { math: 4, main: 6, build: 3, paper: 1 };
export const LANE_LABEL: Record<StudyLane, string> = {
  math: "Math track",
  main: "Main track",
  build: "Build",
  paper: "Paper / review",
};

export interface StudySession {
  /** Stable id so two devices can merge session logs without double-counting. */
  id: string;
  /** YYYY-MM-DD */
  date: string;
  minutes: number;
  lane: StudyLane;
}

export function newSessionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * The roadmap's 3-pass rule: 1 = read for intuition, 2 = derive on paper,
 * 3 = implement from scratch in NumPy. A topic is only "learned" at pass 3.
 */
export const MAX_PASS = 3;
export const PASS_LABEL: Record<number, string> = {
  1: "Intuition",
  2: "Derived on paper",
  3: "Implemented from scratch",
};

/** Best-of scoring for one quiz. Only the best attempt counts toward mastery. */
export interface QuizScore {
  /** Percentage, 0-100. */
  best: number;
  attempts: number;
  /** YYYY-MM-DD of the most recent attempt. */
  lastAt: string;
}

export interface ProgressData {
  version: 3;
  completedLessons: string[];
  completedExercises: string[];
  completedAssignments: string[];
  lastVisitedLesson: string | null;
  lastActivityAt: string | null;
  activityDates: string[];
  /** Roadmap topic id -> highest pass reached (1..3). */
  topicPasses: Record<string, number>;
  /** Roadmap topic id -> ISO date its pass last advanced, used by the review queue. */
  topicDates: Record<string, string>;
  /** Proof Gate ids the learner has cleared. */
  proofGates: string[];
  /** Logged focus time, newest last. */
  sessions: StudySession[];
  /** Quiz id -> best score. Feeds the "test" stage of mastery. See `lib/practice/mastery.ts`. */
  quizScores: Record<string, QuizScore>;
  /** Practice project ids the learner has built. Separate from module assignments. */
  completedProjects: string[];
  /** Interview question ids the learner has worked through and marked reviewed. */
  reviewedInterview: string[];
  /** Lesson id -> YYYY-MM-DD it was last practised. Drives spaced revision. */
  lessonDates: Record<string, string>;
}

export const emptyProgress = (): ProgressData => ({
  version: 3,
  completedLessons: [],
  completedExercises: [],
  completedAssignments: [],
  lastVisitedLesson: null,
  lastActivityAt: null,
  activityDates: [],
  topicPasses: {},
  topicDates: {},
  proofGates: [],
  sessions: [],
  quizScores: {},
  completedProjects: [],
  reviewedInterview: [],
  lessonDates: {},
});

function strings(input: unknown): string[] {
  return Array.isArray(input) ? input.filter((item): item is string => typeof item === "string") : [];
}

function passMap(input: unknown): Record<string, number> {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const result: Record<string, number> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (typeof value !== "number" || !Number.isFinite(value)) continue;
    const clamped = Math.min(MAX_PASS, Math.max(0, Math.round(value)));
    if (clamped > 0) result[key] = clamped;
  }
  return result;
}

function dateMap(input: unknown): Record<string, string> {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (typeof value === "string") result[key] = value;
  }
  return result;
}

function quizScoreMap(input: unknown): Record<string, QuizScore> {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const result: Record<string, QuizScore> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (!value || typeof value !== "object") continue;
    const candidate = value as Partial<QuizScore>;
    if (typeof candidate.best !== "number" || !Number.isFinite(candidate.best)) continue;
    result[key] = {
      best: Math.min(100, Math.max(0, Math.round(candidate.best))),
      attempts: typeof candidate.attempts === "number" && candidate.attempts > 0 ? Math.round(candidate.attempts) : 1,
      lastAt: typeof candidate.lastAt === "string" ? candidate.lastAt.slice(0, 10) : "",
    };
  }
  return result;
}

function sessionList(input: unknown): StudySession[] {
  if (!Array.isArray(input)) return [];
  const lanes = new Set<string>(STUDY_LANES);
  return input.flatMap((item, index) => {
    if (!item || typeof item !== "object") return [];
    const candidate = item as Partial<StudySession>;
    if (typeof candidate.date !== "string") return [];
    if (typeof candidate.minutes !== "number" || !Number.isFinite(candidate.minutes) || candidate.minutes <= 0) return [];
    if (typeof candidate.lane !== "string" || !lanes.has(candidate.lane)) return [];
    const minutes = Math.round(candidate.minutes);
    // Pre-id sessions get a deterministic id derived from their content and position, so the
    // same legacy log parsed on two devices produces identical ids and merges without duplicating.
    const id = typeof candidate.id === "string" && candidate.id.length > 0
      ? candidate.id
      : `legacy-${candidate.date}-${candidate.lane}-${minutes}-${index}`;
    return [{ id, date: candidate.date, minutes, lane: candidate.lane as StudyLane }];
  });
}

export function parseProgress(value: string | null): ProgressData {
  if (!value) return emptyProgress();
  try {
    const data: unknown = JSON.parse(value);
    if (!data || typeof data !== "object") return emptyProgress();
    const candidate = data as Omit<Partial<ProgressData>, "version"> & { version?: unknown };
    // v1 and v2 forward-migrate: every field added since is simply absent and defaults to empty,
    // so an older device's store loads without losing a single tick.
    if (candidate.version !== 1 && candidate.version !== 2 && candidate.version !== 3) return emptyProgress();

    const completedExercises = strings(candidate.completedExercises);
    const topicPasses = passMap(candidate.topicPasses);
    // v1 stored roadmap topic ticks as binary entries in completedExercises. Treat a legacy tick
    // as a completed pass 3 so no existing progress is lost on upgrade.
    for (const id of completedExercises) {
      if (id.startsWith("roadmap:") && topicPasses[id] === undefined) topicPasses[id] = MAX_PASS;
    }

    return {
      version: 3,
      completedLessons: strings(candidate.completedLessons),
      completedExercises,
      completedAssignments: strings(candidate.completedAssignments),
      lastVisitedLesson: typeof candidate.lastVisitedLesson === "string" ? candidate.lastVisitedLesson : null,
      lastActivityAt: typeof candidate.lastActivityAt === "string" ? candidate.lastActivityAt : null,
      activityDates: strings(candidate.activityDates),
      topicPasses,
      topicDates: dateMap(candidate.topicDates),
      proofGates: strings(candidate.proofGates),
      sessions: sessionList(candidate.sessions),
      quizScores: quizScoreMap(candidate.quizScores),
      completedProjects: strings(candidate.completedProjects),
      reviewedInterview: strings(candidate.reviewedInterview),
      lessonDates: dateMap(candidate.lessonDates),
    };
  } catch {
    return emptyProgress();
  }
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

/** Monday-anchored start of the week containing `today`, as YYYY-MM-DD. */
export function weekStart(today = new Date()): string {
  const date = new Date(`${toDayString(today)}T00:00:00.000Z`);
  const weekday = (date.getUTCDay() + 6) % 7; // Monday = 0
  date.setUTCDate(date.getUTCDate() - weekday);
  return toDayString(date);
}

export interface LaneTotals { lane: StudyLane; minutes: number; targetMinutes: number; percent: number }

/** Minutes logged per lane during the current (Monday-anchored) week, against the roadmap's targets. */
export function weeklyLaneTotals(sessions: StudySession[], today = new Date()): LaneTotals[] {
  const start = weekStart(today);
  const end = toDayString(today);
  const totals: Record<StudyLane, number> = { math: 0, main: 0, build: 0, paper: 0 };
  for (const session of sessions) {
    if (session.date < start || session.date > end) continue;
    totals[session.lane] += session.minutes;
  }
  return STUDY_LANES.map((lane) => {
    const targetMinutes = LANE_TARGET_HOURS[lane] * 60;
    return { lane, minutes: totals[lane], targetMinutes, percent: percentage(Math.min(totals[lane], targetMinutes), targetMinutes) };
  });
}

export function totalMinutes(sessions: StudySession[]): number {
  return sessions.reduce((sum, session) => sum + session.minutes, 0);
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

export interface ReviewItem { id: string; daysAgo: number }

/**
 * The roadmap's Sunday ritual: "re-derive something from three weeks ago, from memory, on paper."
 * Surfaces topics whose last pass is at least `minDays` old, oldest first.
 */
export function reviewQueue(topicDates: Record<string, string>, minDays = 21, today = new Date(), limit = 8): ReviewItem[] {
  const todayMs = Date.parse(`${toDayString(today)}T00:00:00.000Z`);
  const items: ReviewItem[] = [];
  for (const [id, date] of Object.entries(topicDates)) {
    const stamp = Date.parse(`${date.slice(0, 10)}T00:00:00.000Z`);
    if (Number.isNaN(stamp)) continue;
    const daysAgo = Math.floor((todayMs - stamp) / 86_400_000);
    if (daysAgo >= minDays) items.push({ id, daysAgo });
  }
  return items.sort((a, b) => b.daysAgo - a.daysAgo).slice(0, limit);
}

function unionStrings(a: string[], b: string[]): string[] {
  return [...new Set([...a, ...b])];
}

/**
 * Combines two copies of the same learner's progress — typically the local copy and whatever
 * the server last saw — without losing work from either side.
 *
 * Everything is additive on purpose. This is a personal learning log, so the cost of keeping a
 * tick you meant to clear is trivial next to the cost of silently discarding a device's work.
 * Un-ticking therefore only sticks once it has synced; that trade is deliberate.
 */
export function mergeProgress(a: ProgressData, b: ProgressData): ProgressData {
  const topicPasses: Record<string, number> = { ...a.topicPasses };
  for (const [id, pass] of Object.entries(b.topicPasses)) {
    topicPasses[id] = Math.max(topicPasses[id] ?? 0, pass);
  }

  // Keep the date belonging to whichever side reached the higher pass; on a tie keep the later
  // one, so the review queue counts from the most recent time the topic was actually touched.
  const topicDates: Record<string, string> = { ...a.topicDates };
  for (const [id, date] of Object.entries(b.topicDates)) {
    const mine = a.topicPasses[id] ?? 0;
    const theirs = b.topicPasses[id] ?? 0;
    const existing = topicDates[id];
    if (existing === undefined || theirs > mine || (theirs === mine && date > existing)) topicDates[id] = date;
  }

  const sessions = [...a.sessions];
  const seen = new Set(sessions.map((session) => session.id));
  for (const session of b.sessions) {
    if (seen.has(session.id)) continue;
    seen.add(session.id);
    sessions.push(session);
  }
  sessions.sort((x, y) => x.date.localeCompare(y.date));

  // Best-of, in both senses: keep the higher score, and keep the later attempt date and the
  // larger attempt count, so a second device's practice is never erased by a weaker attempt.
  const quizScores: Record<string, QuizScore> = { ...a.quizScores };
  for (const [id, score] of Object.entries(b.quizScores)) {
    const mine = quizScores[id];
    quizScores[id] = mine
      ? {
          best: Math.max(mine.best, score.best),
          attempts: Math.max(mine.attempts, score.attempts),
          lastAt: mine.lastAt > score.lastAt ? mine.lastAt : score.lastAt,
        }
      : score;
  }

  const lessonDates: Record<string, string> = { ...a.lessonDates };
  for (const [id, date] of Object.entries(b.lessonDates)) {
    if (lessonDates[id] === undefined || date > lessonDates[id]) lessonDates[id] = date;
  }

  const aNewer = (a.lastActivityAt ?? "") >= (b.lastActivityAt ?? "");
  return {
    version: 3,
    quizScores,
    lessonDates,
    completedProjects: unionStrings(a.completedProjects, b.completedProjects),
    reviewedInterview: unionStrings(a.reviewedInterview, b.reviewedInterview),
    completedLessons: unionStrings(a.completedLessons, b.completedLessons),
    completedExercises: unionStrings(a.completedExercises, b.completedExercises),
    completedAssignments: unionStrings(a.completedAssignments, b.completedAssignments),
    proofGates: unionStrings(a.proofGates, b.proofGates),
    activityDates: unionStrings(a.activityDates, b.activityDates).sort(),
    lastVisitedLesson: (aNewer ? a.lastVisitedLesson : b.lastVisitedLesson) ?? a.lastVisitedLesson ?? b.lastVisitedLesson,
    lastActivityAt: aNewer ? a.lastActivityAt : b.lastActivityAt,
    topicPasses,
    topicDates,
    sessions,
  };
}
