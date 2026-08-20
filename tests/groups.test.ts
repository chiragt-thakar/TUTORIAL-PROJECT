import assert from "node:assert/strict";
import test from "node:test";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { groupSchema, moduleSchema } from "../lib/content/schema";
import { assertUniqueOrder } from "../lib/curriculum/ordering";
import { buildGroups, isRoadmapModule, orderGroupModules } from "../lib/curriculum/groups";
import type { CurriculumGroup, Module } from "../types/curriculum";

const root = path.join(process.cwd(), "content", "modules");
const groupsFile = path.join(process.cwd(), "content", "groups.json");

async function loadAll() {
  const groups: CurriculumGroup[] = groupSchema.array().parse(JSON.parse(await readFile(groupsFile, "utf8")));
  const modules: Module[] = [];
  for (const track of await readdir(root)) {
    for (const entry of await readdir(path.join(root, track))) {
      modules.push(moduleSchema.parse(JSON.parse(await readFile(path.join(root, track, entry, "module.json"), "utf8"))) as Module);
    }
  }
  return { groups, modules };
}

test("groups.json is well formed and uniquely ordered", async () => {
  const { groups } = await loadAll();
  assertUniqueOrder(groups.map((group) => ({ order: group.number })), "groups");
  assert.ok(groups.length >= 10, `expected the full group set, found ${groups.length}`);
});

test("every module belongs to exactly one declared group", async () => {
  const { groups, modules } = await loadAll();
  const slugs = new Set(groups.map((group) => group.slug));
  const orphans = modules.filter((module) => !slugs.has(module.group)).map((module) => module.slug);
  assert.deepEqual(orphans, [], "these modules reference a group that does not exist");
  assert.equal(modules.length, 79, "47 roadmap-derived modules plus 32 kept as Extra Learning");
});

test("no group is empty, and every module appears exactly once across groups", async () => {
  const { groups, modules } = await loadAll();
  const built = buildGroups(groups, modules);
  assert.equal(built.length, groups.length, "an empty group would silently disappear from navigation");
  const seen = built.flatMap((group) => group.modules.map((module) => module.slug));
  assert.equal(new Set(seen).size, seen.length, "a module must not appear in two groups");
  assert.equal(seen.length, modules.length, "every module must be reachable from navigation");
});

test("inside a group, roadmap modules come first and extras follow", async () => {
  const { groups, modules } = await loadAll();
  for (const group of buildGroups(groups, modules)) {
    const flags = group.modules.map(isRoadmapModule);
    const firstExtra = flags.indexOf(false);
    if (firstExtra === -1) continue;
    assert.ok(
      flags.slice(firstExtra).every((flag) => flag === false),
      `${group.slug} interleaves extra modules among the roadmap ones`,
    );
  }
});

test("roadmap modules inside a group stay in roadmap order", async () => {
  const { groups, modules } = await loadAll();
  for (const group of buildGroups(groups, modules)) {
    const onRoadmap = group.modules.filter(isRoadmapModule);
    // The cross-cutting tracks belong to no phase, so they sort by their own module number.
    const keys = onRoadmap.map((module) =>
      module.roadmapPhase === undefined
        ? module.number
        : module.roadmapPhase + (module.roadmapGroup ? Number(module.roadmapGroup.split(".")[1]) / 100 : 0.99),
    );
    for (let index = 1; index < keys.length; index += 1) {
      assert.ok(keys[index] >= keys[index - 1], `${group.slug} is out of roadmap order at ${onRoadmap[index].slug}`);
    }
  }
});

test("orderGroupModules is stable and does not drop or duplicate modules", async () => {
  const { modules } = await loadAll();
  const sample = modules.filter((module) => module.group === "extra-learning");
  const ordered = orderGroupModules(sample);
  assert.equal(ordered.length, sample.length);
  assert.deepEqual(new Set(ordered.map((m) => m.slug)), new Set(sample.map((m) => m.slug)));
  assert.deepEqual(orderGroupModules(ordered).map((m) => m.slug), ordered.map((m) => m.slug), "ordering must be idempotent");
});

test("the roadmap-driven groups appear in roadmap order, with the extras group last", async () => {
  const { groups } = await loadAll();
  const ordered = [...groups].sort((a, b) => a.number - b.number).map((group) => group.slug);
  assert.deepEqual(ordered, [
    "phase-0",
    "phase-1",
    "phase-2",
    "phase-3",
    "phase-4",
    "phase-5",
    "phase-6",
    "phase-7",
    "phase-8",
    "phase-9",
    "phase-10",
    "cross-cutting-tracks",
    "extra-learning",
  ]);
});

test("the extras group is last and is the only group off the roadmap", async () => {
  const { groups, modules } = await loadAll();
  const ordered = [...groups].sort((a, b) => a.number - b.number);
  assert.equal(ordered.at(-1)?.slug, "extra-learning");
  assert.deepEqual(ordered.filter((group) => group.kind === "extra").map((group) => group.slug), ["extra-learning"]);
  for (const group of buildGroups(groups, modules)) {
    const expected = group.kind === "extra" ? 0 : group.modules.length;
    assert.equal(group.roadmapCount, expected, `${group.slug} mixes roadmap and extra modules`);
  }
});
