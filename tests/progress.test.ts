import assert from "node:assert/strict";
import test from "node:test";
import { nextIncompleteLesson, parseProgress, percentage } from "../lib/progress/progress";

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
});
