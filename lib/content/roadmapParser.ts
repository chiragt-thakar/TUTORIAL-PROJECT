import type {
  Roadmap,
  RoadmapBlock,
  RoadmapBlockKind,
  RoadmapGroup,
  RoadmapPhase,
  RoadmapSection,
  RoadmapTopic,
} from "@/types/roadmap";

/**
 * Parses the verbatim roadmap markdown into the structures the site renders.
 *
 * Deliberately conservative: every non-empty source line ends up inside some block, so the
 * rendered page is a faithful, complete view of the document rather than a summary of it.
 * HTML comments are stripped (they carry editorial notes, not curriculum) and a
 * `TRUNCATED HERE` marker flips `complete` to false.
 */

const PHASE_HEADING = /^## PHASE (\d+) — (.*?) `\[(.*?)\]` — (.*)$/;
const SECTION_HEADING = /^## (.+)$/;
const GROUP_HEADING = /^### (?:(\d+(?:\.\d+)*)\.?\s+)?(.+)$/;
const CHECKBOX = /^- \[[ xX]\] (.*)$/;
const BULLET = /^[-*] (.+)$/;
const NUMBERED = /^\d+\. (.+)$/;
const QUOTE = /^>\s?(.*)$/;
const TABLE_ROW = /^\|.*\|\s*$/;
const WHOLE_LINE_LABEL = /^\*\*[^*].*\*\*:?$/;
const PROOF_GATE = /^\*\*Proof Gate/;
const META_LINE = /^\*\*(Built for|Built on|Honest duration):\*\*/;

function stripHtmlComments(source: string): { lines: string[]; truncated: boolean } {
  const truncated = source.includes("TRUNCATED HERE");
  const lines: string[] = [];
  let inComment = false;
  for (const raw of source.split(/\r?\n/)) {
    const line = raw.replace(/\s+$/, "");
    if (inComment) {
      if (line.includes("-->")) inComment = false;
      continue;
    }
    if (line.trimStart().startsWith("<!--")) {
      if (!line.includes("-->")) inComment = true;
      continue;
    }
    lines.push(line);
  }
  return { lines, truncated };
}

/** Accumulates lines into typed blocks, flushing whenever the line kind or a blank line breaks the run. */
class BlockCollector {
  private blocks: RoadmapBlock[] = [];
  private kind: RoadmapBlockKind | null = null;
  private buffer: string[] = [];

  private topicIndex = 0;

  constructor(private readonly groupKey: string) {}

  push(kind: RoadmapBlockKind, text: string): void {
    // Paragraph lines wrap onto one another; every other kind keeps one entry per line.
    if (this.kind !== kind) this.flush();
    this.kind = kind;
    this.buffer.push(text);
  }

  break(): void {
    this.flush();
  }

  flush(): void {
    if (this.kind === null || this.buffer.length === 0) {
      this.kind = null;
      this.buffer = [];
      return;
    }
    const block: RoadmapBlock =
      this.kind === "paragraph"
        ? { kind: "paragraph", lines: [this.buffer.join(" ")] }
        : { kind: this.kind, lines: [...this.buffer] };
    if (block.kind === "checklist") {
      const items: RoadmapTopic[] = block.lines.map((text) => ({
        id: `roadmap:${this.groupKey}:${this.topicIndex++}`,
        text,
      }));
      block.items = items;
    }
    this.blocks.push(block);
    this.kind = null;
    this.buffer = [];
  }

  result(): RoadmapBlock[] {
    this.flush();
    return this.blocks;
  }

}

function countTopics(blocks: RoadmapBlock[]): number {
  return blocks.reduce((total, block) => total + (block.items?.length ?? 0), 0);
}

interface OpenGroup {
  id: string;
  number: string | null;
  title: string;
  collector: BlockCollector;
}

interface OpenSection {
  id: string;
  title: string;
  /** True when this non-phase section appears after the first phase, i.e. it is an appendix. */
  afterPhases: boolean;
  phase: { number: number; tag: string; duration: string } | null;
  intro: BlockCollector;
  groups: OpenGroup[];
  proofGate: BlockCollector | null;
  groupCount: number;
}

export function parseRoadmap(source: string): Roadmap {
  const { lines, truncated } = stripHtmlComments(source);

  let title = "";
  const meta: string[] = [];
  const notice: string[] = [];
  const sections: OpenSection[] = [];
  let section: OpenSection | null = null;
  let group: OpenGroup | null = null;
  let frontCount = 0;
  let sawPhase = false;

  const target = (): BlockCollector | null => {
    if (!section) return null;
    if (section.proofGate) return section.proofGate;
    if (group) return group.collector;
    return section.intro;
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (!section) {
      // Preamble: title, the Built for / Built on / Honest duration lines, and the provenance quote.
      if (trimmed.startsWith("# ") && !title) {
        title = trimmed.slice(2).trim();
        continue;
      }
      if (META_LINE.test(trimmed)) {
        meta.push(trimmed);
        continue;
      }
      const quoted = QUOTE.exec(trimmed);
      if (quoted && !trimmed.startsWith("## ")) {
        notice.push(quoted[1]);
        continue;
      }
    }

    const phaseHeading = PHASE_HEADING.exec(trimmed);
    if (phaseHeading) {
      target()?.break();
      const id = `phase-${phaseHeading[1]}`;
      sawPhase = true;
      section = {
        id,
        title: phaseHeading[2].trim(),
        afterPhases: false,
        phase: { number: Number(phaseHeading[1]), tag: phaseHeading[3].trim(), duration: phaseHeading[4].trim() },
        intro: new BlockCollector(`${id}-intro`),
        groups: [],
        proofGate: null,
        groupCount: 0,
      };
      sections.push(section);
      group = null;
      continue;
    }

    const sectionHeading = trimmed.startsWith("## ") ? SECTION_HEADING.exec(trimmed) : null;
    if (sectionHeading) {
      target()?.break();
      frontCount += 1;
      const id = sawPhase ? `appendix-${frontCount}` : `front-${frontCount}`;
      section = {
        id,
        title: sectionHeading[1].trim(),
        afterPhases: sawPhase,
        phase: null,
        intro: new BlockCollector(`${id}-intro`),
        groups: [],
        proofGate: null,
        groupCount: 0,
      };
      sections.push(section);
      group = null;
      continue;
    }

    const groupHeading = trimmed.startsWith("### ") ? GROUP_HEADING.exec(trimmed) : null;
    if (groupHeading && section) {
      target()?.break();
      section.proofGate = null;
      section.groupCount += 1;
      const number = groupHeading[1] ?? null;
      const key = `${section.id}-${number ?? `g${section.groupCount}`}`;
      group = { id: key, number, title: groupHeading[2].trim(), collector: new BlockCollector(key) };
      section.groups.push(group);
      continue;
    }

    if (!section) continue;

    if (trimmed === "" || trimmed === "---") {
      target()?.break();
      continue;
    }

    if (PROOF_GATE.test(trimmed)) {
      target()?.break();
      const key = `${section.id}-proof-gate`;
      section.proofGate = new BlockCollector(key);
      section.proofGate.push("paragraph", trimmed);
      continue;
    }

    const collector = target();
    if (!collector) continue;

    const checkbox = CHECKBOX.exec(trimmed);
    if (checkbox) {
      collector.push("checklist", checkbox[1].trim());
      continue;
    }
    const quoted = QUOTE.exec(trimmed);
    if (quoted) {
      collector.push("quote", quoted[1].trim());
      continue;
    }
    if (TABLE_ROW.test(trimmed)) {
      collector.push("table", trimmed);
      continue;
    }
    const numbered = NUMBERED.exec(trimmed);
    if (numbered) {
      collector.push("numbered", numbered[1].trim());
      continue;
    }
    const bullet = BULLET.exec(trimmed);
    if (bullet) {
      collector.push("bullets", bullet[1].trim());
      continue;
    }
    if (WHOLE_LINE_LABEL.test(trimmed)) {
      collector.break();
      collector.push("label", trimmed.replace(/^\*\*/, "").replace(/\*\*$/, ""));
      collector.break();
      continue;
    }
    collector.push("paragraph", trimmed);
  }

  const finish = (open: OpenSection): RoadmapSection => {
    const intro = open.intro.result();
    const groups: RoadmapGroup[] = open.groups.map((entry) => {
      const blocks = entry.collector.result();
      return { id: entry.id, number: entry.number, title: entry.title, blocks, topicCount: countTopics(blocks) };
    });
    const proofGate = open.proofGate ? open.proofGate.result() : null;
    const topicCount =
      countTopics(intro) +
      groups.reduce((total, entry) => total + entry.topicCount, 0) +
      (proofGate ? countTopics(proofGate) : 0);
    return { id: open.id, title: open.title, intro, groups, proofGate, topicCount };
  };

  const frontSections: RoadmapSection[] = [];
  const appendixSections: RoadmapSection[] = [];
  const phases: RoadmapPhase[] = [];
  for (const open of sections) {
    const header = open.phase;
    if (header !== null) phases.push({ ...finish(open), ...header });
    else if (open.afterPhases) appendixSections.push(finish(open));
    else frontSections.push(finish(open));
  }
  phases.sort((a, b) => a.number - b.number);

  const topicCount =
    frontSections.reduce((total, entry) => total + entry.topicCount, 0) +
    phases.reduce((total, entry) => total + entry.topicCount, 0) +
    appendixSections.reduce((total, entry) => total + entry.topicCount, 0);

  return {
    title,
    meta,
    notice,
    complete: !truncated,
    frontSections,
    appendixSections,
    phases,
    topicCount,
    sourcePath: "content/roadmap/AI_ML_MASTERY_ROADMAP.md",
  };
}

/** Every trackable topic in document order — used for progress totals and by the tests. */
export function allTopics(roadmap: Roadmap): RoadmapTopic[] {
  const topics: RoadmapTopic[] = [];
  const walk = (blocks: RoadmapBlock[]) => {
    for (const block of blocks) if (block.items) topics.push(...block.items);
  };
  const walkSection = (entry: RoadmapSection) => {
    walk(entry.intro);
    for (const collection of entry.groups) walk(collection.blocks);
    if (entry.proofGate) walk(entry.proofGate);
  };
  roadmap.frontSections.forEach(walkSection);
  roadmap.phases.forEach(walkSection);
  roadmap.appendixSections.forEach(walkSection);
  return topics;
}
