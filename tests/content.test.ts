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
  assert.equal(modules.length, 13);
  assertUniqueOrder(modules.map((courseModule) => ({ order: courseModule.number })), "modules");
  assert.deepEqual(sortByOrder(modules.map((courseModule) => ({ order: courseModule.number }))).map((item) => item.order), [1,2,3,4,5,6,7,8,9,10,11,12,13]);
  assert.deepEqual(modules.filter((courseModule) => courseModule.status === "available").map((courseModule) => courseModule.number).sort(), [1,2,3]);
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
  assert.equal(count, 18);
});

test("fully authored normal lessons contain three focused exercises", async () => {
  const files = (await readdir(root, { recursive: true })).filter((file) => /^0[1-5]-.*\.mdx$/.test(path.basename(file)));
  assert.equal(files.length, 15);
  for (const file of files) {
    const source = await readFile(path.join(root, file), "utf8");
    assert.ok((source.match(/<Exercise id=/g) ?? []).length >= 3, `${file} needs at least three exercises`);
  }
});
