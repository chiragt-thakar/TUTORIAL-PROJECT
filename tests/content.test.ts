import assert from "node:assert/strict";
import test from "node:test";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { frontmatterSchema, moduleSchema, trackSchema } from "../lib/content/schema";
import { parseMdxFrontmatter } from "../lib/content/frontmatter";
import { assertUniqueOrder, sortByOrder } from "../lib/curriculum/ordering";

const root = path.join(process.cwd(), "content", "modules");
const tracksFile = path.join(process.cwd(), "content", "tracks.json");

async function loadTracks() {
  return trackSchema.array().parse(JSON.parse(await readFile(tracksFile, "utf8")));
}

async function loadModulesByTrack(trackSlug: string) {
  const trackDir = path.join(root, trackSlug);
  const directories = (await readdir(trackDir, { withFileTypes: true })).filter((entry) => entry.isDirectory());
  return Promise.all(directories.map(async (entry) => moduleSchema.parse(JSON.parse(await readFile(path.join(trackDir, entry.name, "module.json"), "utf8")))));
}

test("every track directory has a matching entry in tracks.json and unique track numbers", async () => {
  const tracks = await loadTracks();
  assertUniqueOrder(tracks.map((track) => ({ order: track.number })), "tracks");
  const trackSlugs = new Set(tracks.map((track) => track.slug));
  const directories = (await readdir(root, { withFileTypes: true })).filter((entry) => entry.isDirectory());
  for (const entry of directories) assert.ok(trackSlugs.has(entry.name), `content/modules/${entry.name} has no matching track in tracks.json`);
});

test("every module belongs to its own directory's track and has unique numbering within that track", async () => {
  const tracks = await loadTracks();
  for (const track of tracks) {
    const trackDir = path.join(root, track.slug);
    let directories: Array<{ isDirectory(): boolean }>;
    try { directories = (await readdir(trackDir, { withFileTypes: true })).filter((entry) => entry.isDirectory()); } catch { continue; }
    const modules = await loadModulesByTrack(track.slug);
    for (const courseModule of modules) assert.equal(courseModule.track, track.slug, `${courseModule.slug} declares track "${courseModule.track}" but lives under content/modules/${track.slug}`);
    assertUniqueOrder(modules.map((courseModule) => ({ order: courseModule.number })), `track ${track.slug}`);
    assert.equal(modules.length, directories.length, `track ${track.slug} has a directory without a valid module.json`);
  }
});

test("the python-backend track keeps its authored core and planned advanced modules", async () => {
  const modules = await loadModulesByTrack("python-backend");
  assert.equal(modules.length, 18);
  assert.deepEqual(sortByOrder(modules.map((courseModule) => ({ order: courseModule.number }))).map((item) => item.order), [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18]);
  assert.deepEqual(modules.filter((courseModule) => courseModule.status === "available").map((courseModule) => courseModule.number).sort((a, b) => a - b), [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]);
});

test("every available lesson across every track has valid, matching frontmatter", async () => {
  const tracks = await loadTracks();
  let count = 0;
  for (const track of tracks) {
    let modules: Awaited<ReturnType<typeof loadModulesByTrack>>;
    try { modules = await loadModulesByTrack(track.slug); } catch { continue; }
    for (const courseModule of modules) {
      if (courseModule.status !== "available") continue;
      for (const lesson of [...courseModule.lessons, ...(courseModule.assignment ? [courseModule.assignment] : [])]) {
        const directory = `${String(courseModule.number).padStart(2, "0")}-${courseModule.slug}`;
        const file = path.join(root, track.slug, directory, `${lesson.slug}.mdx`);
        const parsed = parseMdxFrontmatter(await readFile(file, "utf8"));
        const metadata = frontmatterSchema.parse(parsed.data);
        assert.equal(metadata.id, lesson.id);
        assert.equal(metadata.module, courseModule.slug);
        assert.ok(parsed.content.includes("<Solution>"), `${file} needs at least one solution`);
        count += 1;
      }
    }
  }
  assert.ok(count >= 94, `expected at least the 94 python-backend lessons/assignments to be available, found ${count}`);
});

test("fully authored normal lessons contain three focused exercises", async () => {
  const files = (await readdir(root, { recursive: true })).filter((file) => /^\d{2}-.*\.mdx$/.test(path.basename(file)));
  assert.ok(files.length >= 79, `expected at least the 79 python-backend lesson files, found ${files.length}`);
  for (const file of files) {
    const source = await readFile(path.join(root, file), "utf8");
    const exerciseCount = (source.match(/<Exercise id=/g) ?? []).length;
    const solutionCount = (source.match(/<Solution>/g) ?? []).length;
    const wordCount = source.split(/\s+/).filter(Boolean).length;
    assert.ok(exerciseCount >= 3, `${file} needs at least three exercises`);
    assert.ok(solutionCount >= exerciseCount, `${file} needs a solution for every exercise`);
    assert.ok(source.includes("```"), `${file} needs a worked code example`);
    assert.match(source, /(^## Checkpoint|<Checkpoint>)/im, `${file} needs a checkpoint`);
    assert.match(source, /(^## Summary|<Summary>)/im, `${file} needs a summary`);
    assert.ok(wordCount >= 250, `${file} is too shallow (${wordCount} words)`);
  }
});

test("modules built under the content depth standard have five-tier exercises and a gotchas section", async () => {
  // The python-backend track predates the current standard (see CLAUDE.md) and is exempt.
  // Every other track's lessons must have all five exercise difficulty tiers and a gotchas section.
  const files = (await readdir(root, { recursive: true }))
    .filter((file) => /^\d{2}-.*\.mdx$/.test(path.basename(file)))
    .filter((file) => file.split(path.sep)[0] !== "python-backend");
  const tiers = ["easy", "medium", "hard", "interview", "real-world"];
  for (const file of files) {
    const source = await readFile(path.join(root, file), "utf8");
    for (const tier of tiers) {
      assert.ok(source.includes(`difficulty="${tier}"`), `${file} is missing a "${tier}"-tier exercise`);
    }
    assert.ok(source.includes("<Gotchas>"), `${file} needs a <Gotchas> section`);
    assert.ok((source.match(/<Gotcha question=/g) ?? []).length >= 1, `${file} needs at least one <Gotcha>`);
  }
});

test("every assignment has a scenario, requirements, acceptance evidence, and solution guidance", async () => {
  const files = (await readdir(root, { recursive: true })).filter((file) => path.basename(file) === "assignment.mdx");
  assert.ok(files.length >= 15, `expected at least the 15 python-backend assignments, found ${files.length}`);
  for (const file of files) {
    const source = await readFile(path.join(root, file), "utf8");
    assert.ok(source.includes("<Assignment id="), `${file} needs an assignment wrapper`);
    assert.match(source, /^## Scenario/im, `${file} needs a scenario`);
    assert.match(source, /^## (Requirements|Required product)/im, `${file} needs requirements`);
    assert.match(source, /^## Acceptance (criteria|criteria and evidence|evidence)/im, `${file} needs acceptance evidence`);
    assert.ok(source.includes("<Solution>"), `${file} needs solution guidance`);
  }
});

test("lesson explanations stay readable and avoid oversized prose blocks", async () => {
  const files = (await readdir(root, { recursive: true })).filter((file) => /^\d{2}-.*\.mdx$/.test(path.basename(file)));
  for (const file of files) {
    const source = await readFile(path.join(root, file), "utf8");
    const prose = source
      .replace(/^---[\s\S]*?---/m, "")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/<[^>]+>/g, "");
    const paragraphs = prose.split(/\r?\n\s*\r?\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
    for (const paragraph of paragraphs) {
      if (/^(#|[-*] |\d+\. |\|)/.test(paragraph)) continue;
      const words = paragraph.split(/\s+/).filter(Boolean).length;
      assert.ok(words <= 70, `${file} has a dense ${words}-word paragraph; split or simplify it`);
    }
  }
});
