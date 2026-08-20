import assert from "node:assert/strict";
import test from "node:test";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { parseRoadmap, allTopics } from "../lib/content/roadmapParser";
import { moduleSchema } from "../lib/content/schema";
import { buildPhases, currentPhase, phaseProgress, roadmapTag, sortByRoadmap, trackPhaseLabel } from "../lib/curriculum/phases";
import type { Module } from "../types/curriculum";

const root = path.join(process.cwd(), "content", "modules");
const roadmapFile = path.join(process.cwd(), "content", "roadmap", "AI_ML_MASTERY_ROADMAP.md");

async function loadAll() {
  const roadmap = parseRoadmap(await readFile(roadmapFile, "utf8"));
  const modules: Module[] = [];
  for (const track of await readdir(root)) {
    const trackDir = path.join(root, track);
    for (const entry of await readdir(trackDir)) {
      const file = path.join(trackDir, entry, "module.json");
      modules.push(moduleSchema.parse(JSON.parse(await readFile(file, "utf8"))) as Module);
    }
  }
  return { roadmap, modules, phases: buildPhases(roadmap, modules) };
}

test("every roadmap phase becomes a phase summary, in order", async () => {
  const { phases } = await loadAll();
  assert.deepEqual(phases.map((phase) => phase.number), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
});

/**
 * The cross-cutting tracks are part of the roadmap but deliberately not part of any phase, so
 * the phase hub cannot be the thing that accounts for their topics. They are reachable from
 * the Cross-Cutting Tracks navigation group instead, which `roadmapCurriculum.test.ts` guards.
 */
function crossCuttingTopicIds(roadmap: Awaited<ReturnType<typeof loadAll>>["roadmap"]): Set<string> {
  const section = roadmap.appendixSections.find((entry) => entry.title.startsWith("CROSS-CUTTING TRACKS"));
  return new Set((section?.groups ?? []).flatMap((group) => group.blocks.flatMap((block) => (block.items ?? []).map((topic) => topic.id))));
}

test("no topic inside a phase is stranded outside a phase group", async () => {
  const { roadmap, phases } = await loadAll();
  const inGroups = new Set(phases.flatMap((phase) => phase.groups.flatMap((group) => group.topics.map((topic) => topic.id))));
  const crossCutting = crossCuttingTopicIds(roadmap);
  const missing = allTopics(roadmap)
    .map((topic) => topic.id)
    .filter((id) => !inGroups.has(id) && !crossCutting.has(id));
  assert.deepEqual(missing, [], "these topics would be invisible on the phase hub");
});

test("phase topic ids cover every phase topic in the document exactly once", async () => {
  const { roadmap, phases } = await loadAll();
  const ids = phases.flatMap((phase) => phase.topicIds);
  assert.equal(new Set(ids).size, ids.length, "a topic must not be counted by two phases");
  assert.equal(ids.length, roadmap.topicCount - crossCuttingTopicIds(roadmap).size);
});

test("each phase with a Proof Gate exposes a stable id and non-empty text", async () => {
  const { phases } = await loadAll();
  const gated = phases.filter((phase) => phase.proofGateId !== null);
  assert.equal(gated.length, 10, "Phases 0-9 each have a Proof Gate; Phase 10 does not");
  for (const phase of gated) {
    assert.equal(phase.proofGateId, `proof-gate:${phase.id}`);
    assert.ok(phase.proofGateText.length > 20, `phase ${phase.number} lost its Proof Gate text`);
    assert.ok(!phase.proofGateText.startsWith("**Proof Gate"), "the label should be stripped from the body text");
  }
});

test("phase progress only counts a topic once it reaches pass 3, and respects the gate", async () => {
  const { phases } = await loadAll();
  const phase = phases.find((entry) => entry.number === 1);
  assert.ok(phase);
  const [first, second] = phase.topicIds;

  const partial = phaseProgress(phase, { [first]: 2 }, [], []);
  assert.equal(partial.topicsDone, 0, "pass 2 is not done");

  const one = phaseProgress(phase, { [first]: 3, [second]: 1 }, [], []);
  assert.equal(one.topicsDone, 1);
  assert.equal(one.gateCleared, false);
  assert.equal(one.complete, false);

  const allPasses = Object.fromEntries(phase.topicIds.map((id) => [id, 3]));
  const noGate = phaseProgress(phase, allPasses, [], []);
  assert.equal(noGate.percent, 100);
  assert.equal(noGate.complete, false, "100% of topics still isn't done without the Proof Gate");

  const withGate = phaseProgress(phase, allPasses, [], [phase.proofGateId as string]);
  assert.equal(withGate.complete, true);
});

test("currentPhase picks the lowest unfinished phase", async () => {
  const { phases } = await loadAll();
  const fresh = phases.map((phase) => phaseProgress(phase, {}, [], []));
  assert.equal(currentPhase(fresh)?.phase.number, 0);

  const phase0 = phases[0];
  const donePhase0 = {
    ...Object.fromEntries(phase0.topicIds.map((id) => [id, 3])),
  };
  const advanced = phases.map((phase) => phaseProgress(phase, donePhase0, [], [phase0.proofGateId as string]));
  assert.equal(currentPhase(advanced)?.phase.number, 1);
});

test("tracks report the roadmap phases they serve", async () => {
  const { modules } = await loadAll();
  // Every roadmap-derived module lives in the one generated `mastery` track, which therefore
  // spans the whole document. The extra tracks are off the roadmap and report nothing.
  assert.equal(trackPhaseLabel(modules, "mastery"), "Phases 0–10");
  assert.equal(trackPhaseLabel(modules, "gen-ai"), null);
  assert.equal(trackPhaseLabel(modules, "python-backend"), null);
  assert.equal(trackPhaseLabel(modules, "python-libraries"), null);
});

test("every roadmap subsection now has at least one module to author content into", async () => {
  const { phases } = await loadAll();
  const uncovered: string[] = [];
  for (const phase of phases) {
    for (const group of phase.groups) {
      if (group.topics.length === 0) continue;
      // Phase 0's intro checklists are covered by the phase-level module, not a numbered group.
      const covered = group.modules.length > 0 || (group.number === null && phase.modules.length > 0);
      if (!covered) uncovered.push(`P${phase.number} ${group.number ?? group.title}`);
    }
  }
  assert.deepEqual(uncovered, [], "these roadmap subsections have nowhere to write content");
});

test("navigation order within every track follows the roadmap, with untagged modules last", async () => {
  const { modules } = await loadAll();
  for (const track of new Set(modules.map((entry) => entry.track))) {
    const ordered = sortByRoadmap(modules.filter((entry) => entry.track === track));
    // Mirror sortByRoadmap's contract: within a phase, numbered subsections come first and a
    // phase-level module with no subsection sorts last inside that phase.
    const keys = ordered.map((entry) =>
      entry.roadmapPhase === undefined
        ? Number.POSITIVE_INFINITY
        : entry.roadmapPhase + (entry.roadmapGroup ? Number(entry.roadmapGroup.split(".")[1]) / 100 : 0.99),
    );
    for (let i = 1; i < keys.length; i += 1) {
      assert.ok(keys[i] >= keys[i - 1], `${track} is out of roadmap order at position ${i} (${ordered[i].slug})`);
    }
    const firstUntagged = ordered.findIndex((entry) => entry.roadmapPhase === undefined);
    if (firstUntagged !== -1) {
      const after = ordered.slice(firstUntagged);
      assert.ok(after.every((entry) => entry.roadmapPhase === undefined), `${track} interleaves untagged modules`);
    }
  }
});

test("sortByRoadmap orders subsections numerically, not as strings", () => {
  const input = [
    { slug: "b", number: 2, roadmapPhase: 1, roadmapGroup: "1.10" },
    { slug: "a", number: 1, roadmapPhase: 1, roadmapGroup: "1.9" },
    { slug: "z", number: 3 },
    { slug: "c", number: 4, roadmapPhase: 0 },
  ];
  assert.deepEqual(sortByRoadmap(input).map((entry) => entry.slug), ["c", "a", "b", "z"]);
});

test("every roadmap-tagged module exposes a nav tag", async () => {
  const { modules } = await loadAll();
  for (const entry of modules) {
    const tag = roadmapTag(entry);
    if (entry.roadmapGroup) assert.equal(tag, entry.roadmapGroup);
    else if (entry.roadmapPhase !== undefined) assert.equal(tag, `P${entry.roadmapPhase}`);
    else assert.equal(tag, null);
  }
});
