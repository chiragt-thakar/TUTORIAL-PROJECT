import assert from "node:assert/strict";
import test from "node:test";
import { buildActivityWeeks, computeLongestStreak, computeStreak, nextIncompleteLesson, parseProgress, percentage, withTodayMarked } from "../lib/progress/progress";

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
