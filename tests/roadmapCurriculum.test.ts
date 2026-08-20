import assert from "node:assert/strict";
import test from "node:test";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { allTopics, parseRoadmap } from "../lib/content/roadmapParser";
import { groupSchema, moduleSchema } from "../lib/content/schema";
import { findRoadmapSection, resourceBlocks } from "../lib/curriculum/roadmapSections";
import { isRoadmapModule } from "../lib/curriculum/groups";
import type { CurriculumGroup, Module } from "../types/curriculum";

/**
 * The curriculum is generated from `content/roadmap/AI_ML_MASTERY_ROADMAP.md` by
 * `scripts/generateRoadmapCurriculum.ts`. These tests are the contract between the two: if the
 * roadmap gains, loses or reworks a topic and nobody re-runs the generator, they fail.
 *
 * The strongest guarantee here is the first one — every checkbox in the document is one lesson,
 * and every roadmap-derived lesson is one checkbox, matched by id. Nothing can silently
 * disappear from navigation, and no lesson can invent a topic the roadmap never asked for.
 */

const root = path.join(process.cwd(), "content", "modules");
const roadmapFile = path.join(process.cwd(), "content", "roadmap", "AI_ML_MASTERY_ROADMAP.md");
const groupsFile = path.join(process.cwd(), "content", "groups.json");

/** Mirrors the generator's own inline-markdown stripping. */
function plain(text: string): string {
  return text.replace(/`([^`]*)`/g, "$1").replace(/\*\*/g, "").replace(/\*/g, "").trim();
}

async function load() {
  const roadmap = parseRoadmap(await readFile(roadmapFile, "utf8"));
  const groups: CurriculumGroup[] = groupSchema.array().parse(JSON.parse(await readFile(groupsFile, "utf8")));
  const modules: Module[] = [];
  for (const track of await readdir(root)) {
    for (const entry of await readdir(path.join(root, track))) {
      modules.push(moduleSchema.parse(JSON.parse(await readFile(path.join(root, track, entry, "module.json"), "utf8"))) as Module);
    }
  }
  return { roadmap, groups, modules };
}

test("the roadmap source is complete before anything is generated from it", async () => {
  const { roadmap } = await load();
  assert.equal(roadmap.complete, true, "a truncated roadmap would silently generate a truncated curriculum");
  assert.ok(roadmap.topicCount >= 434, `expected at least 434 topics, found ${roadmap.topicCount}`);
});

test("every roadmap topic is exactly one lesson, and every roadmap lesson is exactly one topic", async () => {
  const { roadmap, modules } = await load();
  const topicIds = allTopics(roadmap).map((topic) => topic.id);
  const lessonIds = modules
    .filter(isRoadmapModule)
    .flatMap((courseModule) => courseModule.lessons.map((lesson) => lesson.id))
    .filter((id) => id.startsWith("roadmap:"));

  assert.equal(new Set(lessonIds).size, lessonIds.length, "a topic must not become two lessons");
  const missing = topicIds.filter((id) => !lessonIds.includes(id));
  assert.deepEqual(missing, [], "these roadmap topics have no lesson — re-run scripts/generateRoadmapCurriculum.ts");
  const invented = lessonIds.filter((id) => !topicIds.includes(id));
  assert.deepEqual(invented, [], "these lessons claim a roadmap topic that no longer exists in the document");
});

test("every roadmap lesson carries the document's own wording as its title", async () => {
  const { roadmap, modules } = await load();
  const textById = new Map(allTopics(roadmap).map((topic) => [topic.id, plain(topic.text)]));
  for (const courseModule of modules.filter(isRoadmapModule)) {
    for (const lesson of courseModule.lessons) {
      const expected = textById.get(lesson.id);
      if (expected === undefined) continue; // Track B's portfolio targets are not checkboxes.
      assert.equal(lesson.title, expected, `${courseModule.slug}/${lesson.slug} was paraphrased`);
    }
  }
});

test("every roadmap module points at a section that still exists in the document", async () => {
  const { roadmap, modules } = await load();
  for (const courseModule of modules.filter(isRoadmapModule)) {
    const view = findRoadmapSection(roadmap, courseModule.roadmapSectionId as string);
    assert.ok(view, `${courseModule.slug} references missing roadmap section "${courseModule.roadmapSectionId}"`);
    const heading = view.group ? view.group.title : view.section.title;
    if (view.group?.number) {
      assert.ok(
        courseModule.title.startsWith(`${view.group.number} `),
        `${courseModule.slug} dropped its roadmap section number`,
      );
      assert.equal(
        courseModule.title,
        `${view.group.number} ${plain(heading).replace(/\s*\[[^\]]+\]\s*$/, "").trim()}`,
        `${courseModule.slug} does not match its roadmap heading verbatim`,
      );
    }
  }
});

test("every roadmap subsection is reachable as exactly one module", async () => {
  const { roadmap, modules } = await load();
  const sectionIds = modules.filter(isRoadmapModule).map((courseModule) => courseModule.roadmapSectionId);
  assert.equal(new Set(sectionIds).size, sectionIds.length - 1, "only Phase 0's two label modules share a section id");
  for (const phase of roadmap.phases) {
    for (const group of phase.groups) {
      assert.ok(sectionIds.includes(group.id), `roadmap ${group.number ?? group.title} has no module`);
    }
  }
});

test("navigation groups mirror the roadmap's phases, then the cross-cutting tracks, then extras", async () => {
  const { roadmap, groups } = await load();
  const ordered = [...groups].sort((a, b) => a.number - b.number);
  const phaseGroups = ordered.filter((group) => group.roadmapPhase !== undefined);
  assert.deepEqual(
    phaseGroups.map((group) => group.roadmapPhase),
    roadmap.phases.map((phase) => phase.number),
    "phase groups must follow the document's own phase order",
  );
  for (const group of phaseGroups) {
    const phase = roadmap.phases.find((entry) => entry.number === group.roadmapPhase);
    assert.ok(phase);
    assert.equal(group.title, `Phase ${phase.number} — ${plain(phase.title)}`);
    assert.equal(group.tag, phase.tag, `${group.slug} lost the roadmap's [CORE]/[TOOL] tag`);
    assert.equal(group.duration, phase.duration, `${group.slug} lost the roadmap's duration`);
  }
  assert.equal(ordered.at(-1)?.slug, "extra-learning");
  assert.equal(ordered.at(-2)?.slug, "cross-cutting-tracks");
});

/**
 * Roadmap lessons are now being authored in place (see `PRACTICE_SYSTEM.md`), so prose inside
 * `content/modules/mastery/` is expected rather than forbidden. What still has to hold is that
 * the generated outline and the written work agree: a written lesson is published, a published
 * lesson is written, and a module only calls itself available once every one of its lessons is.
 */
test("a roadmap module's written lessons and its published lessons are the same set", async () => {
  const { modules } = await load();
  const filesByDirectory = new Map<string, string[]>();
  for (const track of await readdir(root)) {
    for (const entry of await readdir(path.join(root, track))) {
      filesByDirectory.set(entry, await readdir(path.join(root, track, entry)));
    }
  }

  for (const courseModule of modules.filter(isRoadmapModule)) {
    const directory = `${String(courseModule.number).padStart(2, "0")}-${courseModule.slug}`;
    const files = new Set(filesByDirectory.get(directory) ?? []);
    const written = courseModule.lessons.filter((lesson) => files.has(`${lesson.slug}.mdx`));
    const published = courseModule.lessons.filter((lesson) => lesson.status === "available");

    assert.deepEqual(
      published.map((lesson) => lesson.slug).sort(),
      written.map((lesson) => lesson.slug).sort(),
      `${courseModule.slug}: every written lesson must be published and every published lesson must be written`,
    );
    if (courseModule.status === "available") {
      assert.equal(written.length, courseModule.lessons.length, `${courseModule.slug} is available but not every lesson is written`);
    }
    assert.equal(courseModule.assignment, undefined, `${courseModule.slug}: the phase's Proof Gate is the assignment, not a module assignment`);
  }
});

test("the previously authored curriculum still lives in Extra Learning", async () => {
  const { modules } = await load();
  const withProse = new Set<string>();
  for (const track of await readdir(root)) {
    if (track === "mastery") continue; // authored in place — covered by the test above
    for (const entry of await readdir(path.join(root, track))) {
      const files = await readdir(path.join(root, track, entry));
      if (files.some((file) => file.endsWith(".mdx"))) withProse.add(entry);
    }
  }
  for (const courseModule of modules) {
    const directory = `${String(courseModule.number).padStart(2, "0")}-${courseModule.slug}`;
    if (!withProse.has(directory)) continue;
    assert.equal(courseModule.group, "extra-learning", `${courseModule.slug} has written lessons but is not in Extra Learning`);
    assert.equal(isRoadmapModule(courseModule), false, `${courseModule.slug} is authored material, not a generated roadmap module`);
  }
});

test("every resource the roadmap prescribes reaches the module that needs it", async () => {
  const { roadmap, modules } = await load();
  const source = await readFile(roadmapFile, "utf8");
  const expected = source.split(/\r?\n/).filter((line) => /^> \*\*Resource/.test(line.trim())).length;

  const shown = modules
    .filter(isRoadmapModule)
    .map((courseModule) => findRoadmapSection(roadmap, courseModule.roadmapSectionId as string))
    .flatMap((view) => (view ? resourceBlocks(view.blocks) : []));
  assert.equal(shown.length, expected, "a section's resource is not reachable from its module page");
  assert.ok(expected >= 16, `expected at least 16 resource blocks, found ${expected}`);
  for (const block of shown) {
    assert.ok(block.lines.length > 0 && block.lines[0].startsWith("**Resource"), "a non-resource quote leaked in");
  }
});
