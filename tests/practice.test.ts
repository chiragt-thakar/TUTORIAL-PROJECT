import assert from "node:assert/strict";
import test from "node:test";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { parse } from "yaml";
import { practiceSetSchema } from "../lib/practice/schema";
import { moduleSchema } from "../lib/content/schema";
import { computeMastery, isChoiceCorrect, scoreQuiz, type MasteryInput } from "../lib/practice/mastery";
import { buildEntries, randomChallenge, revisionDue, seedFrom, weakTopics } from "../lib/practice/select";
import type { PracticeSet } from "../lib/practice/types";

/**
 * The practice layer's contract.
 *
 * Two halves: the mastery engine must never hand out a status nobody earned, and every practice
 * file on disk must be valid, wired to a real lesson, and deep enough to be worth opening.
 */

const root = path.join(process.cwd(), "content", "modules");
const SUFFIX = ".practice.yaml";

interface Found {
  set: PracticeSet;
  file: string;
  track: string;
  directory: string;
  lessonSlug: string;
}

async function loadPracticeFiles(): Promise<Found[]> {
  const found: Found[] = [];
  for (const track of await readdir(root)) {
    for (const directory of await readdir(path.join(root, track))) {
      const moduleDir = path.join(root, track, directory);
      for (const file of await readdir(moduleDir)) {
        if (!file.endsWith(SUFFIX)) continue;
        const full = path.join(moduleDir, file);
        const set = practiceSetSchema.parse(parse(await readFile(full, "utf8"))) as PracticeSet;
        found.push({ set, file: full, track, directory, lessonSlug: file.slice(0, -SUFFIX.length) });
      }
    }
  }
  return found;
}

const emptyInput = (): MasteryInput => ({
  completedLessons: [],
  completedExercises: [],
  completedProjects: [],
  reviewedInterview: [],
  quizScores: {},
  lessonDates: {},
});

/** A minimal set shaped for the mastery engine, so these tests do not depend on real content. */
function fakeSet(overrides: Partial<PracticeSet> = {}): PracticeSet {
  return {
    lessonId: "topic-1",
    module: "m",
    lesson: "l",
    title: "T",
    summary: "S",
    exercises: [
      { id: "ex-easy", tier: "normal", kind: "write-code", title: "a", prompt: "p", hints: ["h"], solution: "s", concepts: ["c"], minutes: 5, requiredForMastery: true },
      { id: "ex-bug", tier: "tricky", kind: "debug", title: "b", prompt: "p", hints: ["h"], solution: "s", concepts: ["c"], minutes: 5, requiredForMastery: true },
      { id: "ex-extra", tier: "challenge", kind: "design", title: "c", prompt: "p", hints: ["h"], solution: "s", concepts: ["c"], minutes: 5, requiredForMastery: false },
    ],
    quizzes: [
      { id: "exam", title: "Assessment", kind: "assessment", passScore: 80, questions: [{ id: "q1", kind: "mcq", prompt: "p", options: [{ id: "a", text: "a" }, { id: "b", text: "b" }], answer: ["a"], explanation: "e", concepts: ["c"], points: 1 }] },
    ],
    interview: [{ id: "iv-1", level: "basic", question: "q", shortAnswer: "s", fullAnswer: "f", followUps: [], concepts: ["c"], requiredForMastery: true }],
    projects: [{ id: "pj-1", kind: "small", title: "p", summary: "s", problem: "p", requirements: ["r"], constraints: [], expectedBehaviour: [], milestones: [], testing: [], failureCases: [], bonus: [], architectureHints: [], minutes: 60 }],
    resources: [],
    mastery: { minAssessmentScore: 80, requireProject: true, requireInterview: true, requireDebug: true, revisitAfterDays: 21 },
    ...overrides,
  };
}

// ------------------------------------------------------------------ the mastery engine

test("a topic nobody has touched is not started, and opening the lesson only makes it learning", () => {
  const set = fakeSet();
  assert.equal(computeMastery(set, emptyInput()).status, "not-started");

  const opened = { ...emptyInput(), completedLessons: ["topic-1"] };
  const report = computeMastery(set, opened);
  assert.equal(report.status, "learning", "reading a page must never be worth more than 'learning'");
  assert.notEqual(report.status, "mastered");
});

test("mastery needs every applicable stage, not just the lesson and the exam", () => {
  const set = fakeSet();
  const core: MasteryInput = {
    ...emptyInput(),
    completedLessons: ["topic-1"],
    completedExercises: ["ex-easy"],
    quizScores: { exam: { best: 90, attempts: 1, lastAt: "2026-08-20" } },
  };
  assert.equal(computeMastery(set, core, new Date("2026-08-20T12:00:00Z")).status, "completed");

  const everything: MasteryInput = {
    ...core,
    completedExercises: ["ex-easy", "ex-bug"],
    completedProjects: ["pj-1"],
    reviewedInterview: ["iv-1"],
    lessonDates: { "topic-1": "2026-08-20" },
  };
  const report = computeMastery(set, everything, new Date("2026-08-20T12:00:00Z"));
  assert.equal(report.status, "mastered");
  assert.equal(report.percent, 100);
  assert.deepEqual(report.blocking, []);
});

test("a failing assessment score keeps a topic short of completed", () => {
  const set = fakeSet();
  const input: MasteryInput = {
    ...emptyInput(),
    completedLessons: ["topic-1"],
    completedExercises: ["ex-easy", "ex-bug"],
    quizScores: { exam: { best: 60, attempts: 3, lastAt: "2026-08-20" } },
  };
  const report = computeMastery(set, input);
  assert.notEqual(report.status, "completed");
  assert.notEqual(report.status, "mastered");
  assert.equal(report.assessmentScore, 60);
  assert.ok(report.blocking.some((item) => item.startsWith("Test")));
});

test("a mastered topic goes stale after its revisit window and returns to the review queue", () => {
  const set = fakeSet();
  const input: MasteryInput = {
    ...emptyInput(),
    completedLessons: ["topic-1"],
    completedExercises: ["ex-easy", "ex-bug"],
    completedProjects: ["pj-1"],
    reviewedInterview: ["iv-1"],
    quizScores: { exam: { best: 95, attempts: 1, lastAt: "2026-07-01" } },
    lessonDates: { "topic-1": "2026-07-01" },
  };
  assert.equal(computeMastery(set, input, new Date("2026-07-10T12:00:00Z")).status, "mastered");

  const stale = computeMastery(set, input, new Date("2026-08-20T12:00:00Z"));
  assert.equal(stale.status, "needs-review");
  assert.equal(stale.daysSinceActivity, 50);
});

test("a stage the topic has no work for is dropped, never counted as a free win", () => {
  const set = fakeSet({ interview: [], projects: [], mastery: { ...fakeSet().mastery, requireProject: false } });
  const report = computeMastery(set, emptyInput());
  assert.equal(report.stages.find((stage) => stage.stage === "interview")?.applicable, false);
  assert.equal(report.stages.find((stage) => stage.stage === "project")?.applicable, false);
  assert.equal(report.percent, 0, "inapplicable stages must not inflate the percentage");
});

test("choice grading is all-or-nothing and quiz scores round predictably", () => {
  assert.equal(isChoiceCorrect(["a", "b"], ["b", "a"]), true, "order must not matter");
  assert.equal(isChoiceCorrect(["a", "b"], ["a"]), false, "a partial multi-select is wrong");
  assert.equal(isChoiceCorrect(["a"], ["a", "b"]), false, "shotgunning every option is wrong");
  assert.equal(scoreQuiz(4, 5), 80);
  assert.equal(scoreQuiz(0, 0), 0);
});

// ------------------------------------------------------------------ selection

test("selection surfaces stale topics, failed topics, and an unsolved challenge", () => {
  const stale = fakeSet({ lessonId: "stale" });
  const failed = fakeSet({ lessonId: "failed" });
  const input: MasteryInput = {
    completedLessons: ["stale", "failed"],
    completedExercises: ["ex-easy", "ex-bug"],
    completedProjects: ["pj-1"],
    reviewedInterview: ["iv-1"],
    quizScores: { exam: { best: 40, attempts: 2, lastAt: "2026-07-01" } },
    lessonDates: { stale: "2026-07-01", failed: "2026-08-19" },
  };
  const today = new Date("2026-08-20T12:00:00Z");

  const entries = buildEntries([stale, failed], input, today);
  assert.deepEqual(weakTopics(entries).length, 2, "both are started and unfinished");
  assert.equal(revisionDue(entries).every((entry) => entry.report.status === "needs-review"), true);

  const challenge = randomChallenge(entries, ["ex-easy", "ex-bug"], "2026-08-20");
  assert.ok(challenge);
  assert.equal(challenge.exerciseId, "ex-extra", "the only unsolved exercise must be the one offered");
});

test("the daily seed is stable for a day and differs between days", () => {
  assert.equal(seedFrom("2026-08-20"), seedFrom("2026-08-20"));
  assert.notEqual(seedFrom("2026-08-20"), seedFrom("2026-08-21"));
});

// ------------------------------------------------------------------ authored content

test("every practice file is valid, and sits beside the lesson it claims", async () => {
  const files = await loadPracticeFiles();
  for (const found of files) {
    const moduleFile = path.join(root, found.track, found.directory, "module.json");
    const courseModule = moduleSchema.parse(JSON.parse(await readFile(moduleFile, "utf8")));
    assert.equal(found.set.module, courseModule.slug, `${found.file} declares the wrong module`);

    const lesson = courseModule.lessons.find((item) => item.slug === found.lessonSlug);
    assert.ok(lesson, `${found.file} has no matching lesson in ${moduleFile}`);
    assert.equal(found.set.lessonId, lesson.id, `${found.file} must use the lesson's own id — it is the progress key`);
    assert.equal(lesson.status, "available", `${found.lessonSlug} has practice content but is not published`);

    const files_ = await readdir(path.join(root, found.track, found.directory));
    assert.ok(files_.includes(`${found.lessonSlug}.mdx`), `${found.file} has no lesson prose beside it`);
  }
});

test("practice ids are unique across the whole site, because they are progress keys", async () => {
  const files = await loadPracticeFiles();
  const seen = new Map<string, string>();
  for (const found of files) {
    const ids = [
      ...found.set.exercises.map((item) => item.id),
      ...found.set.quizzes.map((item) => item.id),
      ...found.set.quizzes.flatMap((quiz) => quiz.questions.map((question) => question.id)),
      ...found.set.interview.map((item) => item.id),
      ...found.set.projects.map((item) => item.id),
    ];
    for (const id of ids) {
      const owner = seen.get(id);
      assert.equal(owner, undefined, `id "${id}" is used by both ${owner} and ${found.file}`);
      seen.set(id, found.file);
    }
  }
});

test("an authored topic carries real practice depth, not a token exercise", async () => {
  const files = await loadPracticeFiles();
  for (const { set, file } of files) {
    const tiers = new Set(set.exercises.map((exercise) => exercise.tier));
    for (const tier of ["normal", "intermediate", "tricky", "challenge"]) {
      assert.ok(tiers.has(tier as never), `${file} has no "${tier}"-tier exercise`);
    }
    assert.ok(set.exercises.length >= 12, `${file} has only ${set.exercises.length} exercises`);
    assert.ok(
      set.exercises.filter((exercise) => exercise.kind === "debug").length >= 3,
      `${file} needs at least three debugging exercises`,
    );
    assert.ok(
      set.exercises.some((exercise) => exercise.kind === "code-reading"),
      `${file} needs at least one code-reading exercise`,
    );
    assert.ok(set.interview.length >= 5, `${file} needs at least five interview questions`);
    assert.ok(set.quizzes.some((quiz) => quiz.kind === "assessment"), `${file} needs an assessment`);
    assert.ok(set.resources.length >= 3, `${file} needs at least three curated resources`);
    assert.ok(set.projects.length >= 1, `${file} needs a project or a final challenge`);
  }
});

test("hints are progressive and no solution is given away before it is asked for", async () => {
  const files = await loadPracticeFiles();
  for (const { set, file } of files) {
    for (const exercise of set.exercises) {
      assert.ok(exercise.hints.length >= 2, `${file}: "${exercise.id}" needs more than one hint level`);
      // A hint longer than the solution is the solution wearing a hat.
      const longest = Math.max(...exercise.hints.map((hint) => hint.length));
      assert.ok(longest < exercise.solution.length, `${file}: a hint for "${exercise.id}" is as long as its solution`);
    }
  }
});

test("every curated resource justifies itself and points somewhere fetchable", async () => {
  const files = await loadPracticeFiles();
  for (const { set, file } of files) {
    for (const resource of set.resources) {
      assert.match(resource.url, /^https:\/\//, `${file}: ${resource.name} must be an https URL`);
      assert.ok(resource.why.split(/\s+/).length >= 6, `${file}: ${resource.name} needs a real reason for being here`);
      assert.ok(resource.covers.length > 0, `${file}: ${resource.name} must say what it covers`);
    }
  }
});
