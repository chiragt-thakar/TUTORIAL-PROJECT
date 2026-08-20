import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { parseRoadmap, allTopics } from "../lib/content/roadmapParser";

const roadmapFile = path.join(process.cwd(), "content", "roadmap", "AI_ML_MASTERY_ROADMAP.md");

async function load() {
  return parseRoadmap(await readFile(roadmapFile, "utf8"));
}

/** The source lines the parser is responsible for, with editorial HTML comments removed. */
async function sourceLines(): Promise<string[]> {
  const raw = await readFile(roadmapFile, "utf8");
  const lines: string[] = [];
  let inComment = false;
  for (const line of raw.split(/\r?\n/).map((entry) => entry.trim())) {
    if (inComment) {
      if (line.includes("-->")) inComment = false;
      continue;
    }
    if (line.startsWith("<!--")) {
      if (!line.includes("-->")) inComment = true;
      continue;
    }
    if (line === "" || line === "---") continue;
    lines.push(line);
  }
  return lines;
}

test("the roadmap parses into every phase, in the source's own order", async () => {
  const roadmap = await load();
  assert.equal(roadmap.title, "The AI/ML Mastery Roadmap — Beginner to Top 1%");
  assert.deepEqual(roadmap.phases.map((phase) => phase.number), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  for (const phase of roadmap.phases) {
    assert.ok(phase.title.length > 0, `phase ${phase.number} lost its title`);
    assert.ok(phase.tag.length > 0, `phase ${phase.number} lost its [CORE]/[TOOL] tag`);
    assert.ok(phase.duration.length > 0, `phase ${phase.number} lost its duration`);
  }
});

test("every numbered subsection survives parsing, in order", async () => {
  const roadmap = await load();
  const numbered = roadmap.phases.flatMap((phase) =>
    phase.groups.filter((group) => group.number !== null).map((group) => group.number),
  );
  assert.deepEqual(numbered, [
    "1.1", "1.2", "1.3",
    "2.1", "2.2", "2.3", "2.4", "2.5", "2.6",
    "3.1", "3.2", "3.3", "3.4", "3.5",
    "4.1", "4.2", "4.3", "4.4", "4.5",
    "5.1", "5.2", "5.3",
    "6.1", "6.2", "6.3", "6.4", "6.5",
    "7.1", "7.2", "7.3", "7.4", "7.5",
    "8.1", "8.2", "8.3",
    "9.1", "9.2", "9.3", "9.4",
    "10.1", "10.2", "10.3",
  ]);
});

test("no checklist topic is dropped between the markdown and the parsed roadmap", async () => {
  const roadmap = await load();
  // Goes through sourceLines(), which strips HTML comments. The editorial notes in this document
  // quote topic text, and counting those would make this test pass for the wrong reason.
  const expected = (await sourceLines())
    .filter((line) => /^- \[[ xX]\] /.test(line))
    .map((line) => line.replace(/^- \[[ xX]\] /, ""));
  const parsed = allTopics(roadmap).map((topic) => topic.text);
  assert.deepEqual(parsed, expected, "the parsed topic list must match the source checkboxes exactly, in order");
  assert.equal(roadmap.topicCount, expected.length);
  assert.ok(expected.length >= 434, `expected the roadmap's full topic list, found ${expected.length}`);
});

test("every trackable topic has a unique, stable progress ID", async () => {
  const roadmap = await load();
  const ids = allTopics(roadmap).map((topic) => topic.id);
  assert.equal(new Set(ids).size, ids.length, "duplicate roadmap topic IDs would collide in saved progress");
  for (const id of ids) assert.match(id, /^roadmap:[a-z0-9-]+(?:-\d+(?:\.\d+)*)?:\d+$/);
});

test("every non-empty source line is represented in the parsed roadmap", async () => {
  const roadmap = await load();
  const rendered = new Set<string>();
  const addBlocks = (blocks: { lines: string[] }[]) => {
    for (const block of blocks) for (const line of block.lines) rendered.add(line);
  };
  const addSection = (section: {
    title: string;
    intro: { lines: string[] }[];
    groups: { title: string; blocks: { lines: string[] }[] }[];
    proofGate: { lines: string[] }[] | null;
  }) => {
    rendered.add(section.title);
    addBlocks(section.intro);
    for (const group of section.groups) {
      rendered.add(group.title);
      addBlocks(group.blocks);
    }
    if (section.proofGate) addBlocks(section.proofGate);
  };
  roadmap.frontSections.forEach(addSection);
  roadmap.appendixSections.forEach(addSection);
  roadmap.phases.forEach((phase) => {
    addSection(phase);
    // Headings are stored as their parts, so reconstruct the source form before comparing.
    rendered.add(`PHASE ${phase.number} — ${phase.title} \`[${phase.tag}]\` — ${phase.duration}`);
  });
  for (const section of [...roadmap.frontSections, ...roadmap.appendixSections, ...roadmap.phases]) {
    for (const group of section.groups) {
      if (group.number !== null) rendered.add(`${group.number} ${group.title}`);
      if (group.number !== null) rendered.add(`${group.number}. ${group.title}`);
    }
  }
  roadmap.meta.forEach((line) => rendered.add(line));
  roadmap.notice.forEach((line) => rendered.add(line));
  rendered.add(roadmap.title);

  const haystack = [...rendered].join("\n");
  const missing = (await sourceLines()).filter((line) => {
    const bare = line
      .replace(/^#+\s+/, "")
      .replace(/^- \[[ xX]\] /, "")
      .replace(/^[-*]\s+/, "")
      .replace(/^\d+\.\s+/, "")
      .replace(/^>\s?/, "")
      .trim();
    if (bare === "") return false;
    return !haystack.includes(bare) && !haystack.includes(bare.replace(/^\*\*|\*\*:?$/g, ""));
  });
  assert.deepEqual(missing, [], "these source lines never made it into the parsed roadmap");
});

test("the sections after Phase 10 are parsed as an appendix, not as front matter", async () => {
  const roadmap = await load();
  assert.deepEqual(roadmap.appendixSections.map((section) => section.title), [
    "CROSS-CUTTING TRACKS (run these throughout, never as separate phases)",
    "REVIEW & CALIBRATION",
    "ANTI-PATTERNS — the ways this goes wrong",
    "THE HONEST SUMMARY",
  ]);
  assert.deepEqual(roadmap.frontSections.map((section) => section.title), [
    "READ THIS BEFORE THE ROADMAP",
    "HOW TO USE THIS DOCUMENT",
  ]);
  const tracks = roadmap.appendixSections[0];
  assert.deepEqual(tracks.groups.map((group) => group.title), [
    "Track A — Software engineering excellence `[CORE]`",
    "Track B — Portfolio `[CORE]`",
    "Track C — Career & compensation `[CORE]`",
  ]);
  assert.equal(tracks.groups[0].topicCount, 5, "Track A's five habits must be trackable");
  assert.equal(tracks.groups[2].topicCount, 8, "Track C's eight month-milestones must be trackable");
});

test("the roadmap reports honestly whether its source document is complete", async () => {
  const roadmap = await load();
  const raw = await readFile(roadmapFile, "utf8");
  assert.equal(roadmap.complete, !raw.includes("TRUNCATED HERE"));
});
