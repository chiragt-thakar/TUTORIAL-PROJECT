import type { Roadmap, RoadmapBlock, RoadmapGroup, RoadmapPhase, RoadmapSection } from "@/types/roadmap";

/**
 * Looks a module's roadmap section back up in the parsed source document.
 *
 * Modules store only a `roadmapSectionId`; the prose, the topic list and the "one resource per
 * topic" blocks all stay in the markdown and are read from it at request time. That is what
 * keeps the curriculum from drifting away from the roadmap it was generated from — there is
 * only ever one copy of the text.
 */
export interface RoadmapSectionView {
  /** The phase this section sits in, when it sits in one. The cross-cutting tracks do not. */
  phase: RoadmapPhase | null;
  section: RoadmapSection;
  /** The `###` subsection, or null when the module maps to a phase's own intro (Phase 0). */
  group: RoadmapGroup | null;
  /** The blocks that belong to the module: the subsection's, or the phase intro's. */
  blocks: RoadmapBlock[];
}

export function findRoadmapSection(roadmap: Roadmap, sectionId: string): RoadmapSectionView | null {
  for (const phase of roadmap.phases) {
    if (phase.id === sectionId) return { phase, section: phase, group: null, blocks: phase.intro };
    const group = phase.groups.find((entry) => entry.id === sectionId);
    if (group) return { phase, section: phase, group, blocks: group.blocks };
  }
  for (const section of [...roadmap.appendixSections, ...roadmap.frontSections]) {
    if (section.id === sectionId) return { phase: null, section, group: null, blocks: section.intro };
    const group = section.groups.find((entry) => entry.id === sectionId);
    if (group) return { phase: null, section, group, blocks: group.blocks };
  }
  return null;
}

/**
 * The roadmap's "one resource per topic" block for a section.
 *
 * Every one of them is a blockquote whose first line opens `**Resource:**` or `**Resources:**`;
 * later lines in the same quote carry the sub-recommendations ("Watch first…", "Theory:",
 * "Practice:"). Other blockquotes in the document are argument, not reading — Phase 6's
 * "Prompt → Retrieval → Fine-tune → Distil" rule, for one — so they stay in the prose.
 */
function isResource(block: RoadmapBlock): boolean {
  return block.kind === "quote" && (block.lines[0] ?? "").startsWith("**Resource");
}

export function resourceBlocks(blocks: RoadmapBlock[]): RoadmapBlock[] {
  return blocks.filter(isResource);
}

/** Everything except the topic checklist and the resource block, in document order. */
export function proseBlocks(blocks: RoadmapBlock[]): RoadmapBlock[] {
  return blocks.filter((block) => block.kind !== "checklist" && !isResource(block));
}
