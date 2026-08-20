import assert from "node:assert/strict";
import test from "node:test";
import { buildActivityWeeks, computeLongestStreak, computeStreak, mergeProgress, nextIncompleteLesson, parseProgress, percentage, withTodayMarked } from "../lib/progress/progress";

test("progress percentages handle normal and empty curricula", () => {
  assert.equal(percentage(3, 4), 75);
  assert.equal(percentage(0, 0), 0);
});

test("next incomplete prefers an incomplete last visit", () => {
  assert.equal(nextIncompleteLesson(["a", "b", "c"], ["a"], "c"), "c");
  assert.equal(nextIncompleteLesson(["a", "b", "c"], ["a"], "a"), "b");
  assert.equal(nextIncompleteLesson(["a", "b"], ["a", "b"], null), "b");
});

test("malformed and partially invalid stored progress recovers safely", () => {
  assert.deepEqual(parseProgress("not-json").completedLessons, []);
  assert.deepEqual(parseProgress('{"version":2}').completedLessons, []);
  const parsed = parseProgress('{"version":1,"completedLessons":["a",4],"completedExercises":null}');
  assert.deepEqual(parsed.completedLessons, ["a"]);
  assert.deepEqual(parsed.completedExercises, []);
  assert.deepEqual(parsed.activityDates, []);
});

test("withTodayMarked adds today once and is idempotent", () => {
  const today = new Date("2026-08-09T12:00:00.000Z");
  assert.deepEqual(withTodayMarked([], today), ["2026-08-09"]);
  assert.deepEqual(withTodayMarked(["2026-08-09"], today), ["2026-08-09"]);
  assert.deepEqual(withTodayMarked(["2026-08-07"], today), ["2026-08-07", "2026-08-09"]);
});

test("computeStreak counts consecutive days ending today or yesterday, and resets on a gap", () => {
  const today = new Date("2026-08-09T12:00:00.000Z");
  assert.equal(computeStreak([], today), 0);
  assert.equal(computeStreak(["2026-08-01"], today), 0, "a lone day over a week ago is not an active streak");
  assert.equal(computeStreak(["2026-08-07", "2026-08-08", "2026-08-09"], today), 3);
  assert.equal(computeStreak(["2026-08-06", "2026-08-08", "2026-08-09"], today), 2, "a gap should stop the count");
  assert.equal(computeStreak(["2026-08-06", "2026-08-07", "2026-08-08"], today), 3, "activity through yesterday still counts as a live streak");
});

test("computeLongestStreak finds the best run even if it isn't the current one", () => {
  assert.equal(computeLongestStreak([]), 0);
  assert.equal(computeLongestStreak(["2026-08-01"]), 1);
  assert.equal(computeLongestStreak(["2026-07-01", "2026-07-02", "2026-07-03", "2026-07-04", "2026-08-09"]), 4);
  assert.equal(computeLongestStreak(["2026-08-09", "2026-08-08", "2026-08-07"]), 3, "order in the input shouldn't matter");
});

test("buildActivityWeeks returns the requested number of 7-day columns ending today", () => {
  const today = new Date("2026-08-09T12:00:00.000Z");
  const weeks = buildActivityWeeks(["2026-08-09", "2026-08-08", "2026-07-01"], 3, today);
  assert.equal(weeks.length, 3);
  for (const column of weeks) assert.equal(column.length, 7);
  const lastDay = weeks.at(-1)!.at(-1)!;
  assert.equal(lastDay.date, "2026-08-09");
  assert.equal(lastDay.active, true);
  const flat = weeks.flat();
  assert.equal(flat.filter((day) => day.active).length, 2, "only dates within the visible window should be marked active");
});

test("mergeProgress keeps work from both devices instead of letting one overwrite the other", () => {
  const base = parseProgress(null);
  const deviceA: typeof base = {
    ...base,
    completedLessons: ["l1", "l2"],
    proofGates: ["proof-gate:phase-1"],
    activityDates: ["2026-08-01"],
    topicPasses: { "roadmap:phase-1-1.1:0": 3, "roadmap:phase-1-1.1:1": 1 },
    topicDates: { "roadmap:phase-1-1.1:0": "2026-08-01", "roadmap:phase-1-1.1:1": "2026-08-01" },
    sessions: [{ id: "s1", date: "2026-08-01", minutes: 30, lane: "math" }],
    lastActivityAt: "2026-08-01T10:00:00.000Z",
    lastVisitedLesson: "l2",
  };
  const deviceB: typeof base = {
    ...base,
    completedLessons: ["l2", "l3"],
    activityDates: ["2026-08-02"],
    topicPasses: { "roadmap:phase-1-1.1:1": 3 },
    topicDates: { "roadmap:phase-1-1.1:1": "2026-08-05" },
    sessions: [{ id: "s2", date: "2026-08-02", minutes: 45, lane: "build" }],
    lastActivityAt: "2026-08-02T10:00:00.000Z",
    lastVisitedLesson: "l3",
  };

  const merged = mergeProgress(deviceA, deviceB);
  assert.deepEqual([...merged.completedLessons].sort(), ["l1", "l2", "l3"]);
  assert.deepEqual(merged.proofGates, ["proof-gate:phase-1"]);
  assert.deepEqual(merged.activityDates, ["2026-08-01", "2026-08-02"]);
  assert.equal(merged.topicPasses["roadmap:phase-1-1.1:0"], 3);
  assert.equal(merged.topicPasses["roadmap:phase-1-1.1:1"], 3, "the higher pass wins");
  assert.equal(merged.topicDates["roadmap:phase-1-1.1:1"], "2026-08-05", "date follows the higher pass");
  assert.equal(merged.sessions.length, 2, "sessions from both devices survive");
  assert.equal(merged.lastVisitedLesson, "l3", "the more recently active device wins the cursor");
});

test("mergeProgress is idempotent and never double-counts sessions", () => {
  const base = parseProgress(null);
  const one: typeof base = { ...base, sessions: [{ id: "s1", date: "2026-08-01", minutes: 30, lane: "math" }] };
  const merged = mergeProgress(one, one);
  assert.equal(merged.sessions.length, 1);
  assert.deepEqual(mergeProgress(merged, one).sessions.length, 1);
});

test("legacy sessions without ids get deterministic ids so two devices agree", () => {
  const raw = '{"version":2,"sessions":[{"date":"2026-08-01","minutes":30,"lane":"math"}]}';
  const first = parseProgress(raw);
  const second = parseProgress(raw);
  assert.equal(first.sessions[0].id, second.sessions[0].id);
  assert.equal(mergeProgress(first, second).sessions.length, 1, "identical legacy logs must not duplicate");
});

test("a v2 store loads into v3 with the practice fields empty rather than lost", () => {
  const parsed = parseProgress('{"version":2,"completedLessons":["l1"],"topicPasses":{"roadmap:phase-1-1.1:0":2}}');
  assert.equal(parsed.version, 3);
  assert.deepEqual(parsed.completedLessons, ["l1"], "existing progress must survive the upgrade");
  assert.equal(parsed.topicPasses["roadmap:phase-1-1.1:0"], 2);
  assert.deepEqual(parsed.quizScores, {});
  assert.deepEqual(parsed.completedProjects, []);
  assert.deepEqual(parsed.reviewedInterview, []);
  assert.deepEqual(parsed.lessonDates, {});
});

test("malformed quiz scores are dropped, and valid ones are clamped to 0-100", () => {
  const parsed = parseProgress(JSON.stringify({
    version: 3,
    quizScores: {
      good: { best: 82, attempts: 2, lastAt: "2026-08-20T10:00:00.000Z" },
      over: { best: 140, attempts: 1, lastAt: "2026-08-20" },
      broken: { attempts: 3 },
      alsoBroken: "nope",
    },
  }));
  assert.equal(parsed.quizScores.good.best, 82);
  assert.equal(parsed.quizScores.good.lastAt, "2026-08-20", "an ISO timestamp is stored as a day");
  assert.equal(parsed.quizScores.over.best, 100);
  assert.equal(parsed.quizScores.broken, undefined);
  assert.equal(parsed.quizScores.alsoBroken, undefined);
});

test("merging practice progress keeps the best score and the most recent practice date", () => {
  const base = parseProgress(null);
  const laptop: typeof base = {
    ...base,
    quizScores: { exam: { best: 70, attempts: 3, lastAt: "2026-08-18" } },
    completedProjects: ["pj-1"],
    reviewedInterview: ["iv-1"],
    lessonDates: { "topic-1": "2026-08-18" },
  };
  const phone: typeof base = {
    ...base,
    quizScores: { exam: { best: 90, attempts: 1, lastAt: "2026-08-20" } },
    completedProjects: ["pj-2"],
    reviewedInterview: ["iv-2"],
    lessonDates: { "topic-1": "2026-08-20", "topic-2": "2026-08-20" },
  };

  const merged = mergeProgress(laptop, phone);
  assert.equal(merged.quizScores.exam.best, 90, "the better score wins whichever device set it");
  assert.equal(merged.quizScores.exam.attempts, 3, "attempts never go backwards");
  assert.equal(merged.quizScores.exam.lastAt, "2026-08-20");
  assert.deepEqual(merged.completedProjects.sort(), ["pj-1", "pj-2"]);
  assert.deepEqual(merged.reviewedInterview.sort(), ["iv-1", "iv-2"]);
  assert.equal(merged.lessonDates["topic-1"], "2026-08-20", "the later practice date wins, so revision counts from it");
  assert.equal(merged.lessonDates["topic-2"], "2026-08-20");
  assert.deepEqual(mergeProgress(merged, laptop).quizScores.exam.best, 90, "merging back an older copy cannot lower it");
});
