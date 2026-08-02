import assert from "node:assert/strict";
import test from "node:test";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { frontmatterSchema, moduleSchema } from "../lib/content/schema";
import { parseMdxFrontmatter } from "../lib/content/frontmatter";
import { assertUniqueOrder, sortByOrder } from "../lib/curriculum/ordering";

const root = path.join(process.cwd(), "content", "modules");

test("curriculum metadata validates and orders deterministically", async () => {
  const directories = (await readdir(root, { withFileTypes: true })).filter((entry) => entry.isDirectory());
  const modules = await Promise.all(directories.map(async (entry) => moduleSchema.parse(JSON.parse(await readFile(path.join(root, entry.name, "module.json"), "utf8")))));
  assert.equal(modules.length, 15);
  assertUniqueOrder(modules.map((courseModule) => ({ order: courseModule.number })), "modules");
  assert.deepEqual(sortByOrder(modules.map((courseModule) => ({ order: courseModule.number }))).map((item) => item.order), [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]);
  assert.deepEqual(modules.filter((courseModule) => courseModule.status === "available").map((courseModule) => courseModule.number).sort((a, b) => a - b), [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]);
});

test("every available lesson has valid, matching frontmatter", async () => {
  const directories = (await readdir(root, { withFileTypes: true })).filter((entry) => entry.isDirectory());
  let count = 0;
  for (const entry of directories) {
    const courseModule = moduleSchema.parse(JSON.parse(await readFile(path.join(root, entry.name, "module.json"), "utf8")));
    if (courseModule.status !== "available") continue;
    for (const lesson of [...courseModule.lessons, ...(courseModule.assignment ? [courseModule.assignment] : [])]) {
      const file = path.join(root, entry.name, `${lesson.slug}.mdx`);
      const parsed = parseMdxFrontmatter(await readFile(file, "utf8"));
      const metadata = frontmatterSchema.parse(parsed.data);
      assert.equal(metadata.id, lesson.id);
      assert.equal(metadata.module, courseModule.slug);
      assert.ok(parsed.content.includes("<Solution>"));
      count += 1;
    }
  }
  assert.equal(count, 94);
});

test("fully authored normal lessons contain three focused exercises", async () => {
  const files = (await readdir(root, { recursive: true })).filter((file) => /^\d{2}-.*\.mdx$/.test(path.basename(file)));
  assert.equal(files.length, 79);
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

test("every assignment has a scenario, requirements, acceptance evidence, and solution guidance", async () => {
  const files = (await readdir(root, { recursive: true })).filter((file) => path.basename(file) === "assignment.mdx");
  assert.equal(files.length, 15);
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
