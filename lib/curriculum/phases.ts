import type { Module } from "@/types/curriculum";
import type { Roadmap, RoadmapBlock, RoadmapSection, RoadmapTopic } from "@/types/roadmap";

/**
 * Turns the parsed roadmap plus the module curriculum into the phase-shaped summaries the
 * site organizes itself around. The roadmap is the spine: phases are the top-level unit of
 * planning, and tracks/modules hang off them rather than the other way round.
 *
 * These are plain serializable objects so a server page can build them once and hand them to
 * client components.
 */

export interface PhaseModuleRef {
  slug: string;
  title: string;
  track: string;
  number: number;
  status: "available" | "planned";
  lessonIds: string[];
  group: string | null;
}

export interface PhaseGroupSummary {
  id: string;
  number: string | null;
  title: string;
  topics: RoadmapTopic[];
  modules: PhaseModuleRef[];
}

export interface PhaseSummary {
  id: string;
  number: number;
  title: string;
  tag: string;
  duration: string;
  /** First paragraph of the phase, used as the card blurb. Empty when the phase opens with a list. */
  blurb: string;
  topicIds: string[];
  groups: PhaseGroupSummary[];
  proofGateId: string | null;
  proofGateText: string;
  modules: PhaseModuleRef[];
}

function collectTopics(blocks: RoadmapBlock[]): RoadmapTopic[] {
  return blocks.flatMap((block) => block.items ?? []);
}

function collectTopicIds(blocks: RoadmapBlock[]): string[] {
  return collectTopics(blocks).map((topic) => topic.id);
}

function sectionTopicIds(section: RoadmapSection): string[] {
  return [
    ...collectTopicIds(section.intro),
    ...section.groups.flatMap((group) => collectTopicIds(group.blocks)),
    ...(section.proofGate ? collectTopicIds(section.proofGate) : []),
  ];
}

function firstParagraph(blocks: RoadmapBlock[]): string {
  return blocks.find((block) => block.kind === "paragraph")?.lines.join(" ") ?? "";
}

function toModuleRef(courseModule: Module): PhaseModuleRef {
  return {
    slug: courseModule.slug,
    title: courseModule.title,
    track: courseModule.track,
    number: courseModule.number,
    status: courseModule.status,
    lessonIds: courseModule.lessons.map((lesson) => lesson.id),
    group: courseModule.roadmapGroup ?? null,
  };
}

export function buildPhases(roadmap: Roadmap, modules: Module[]): PhaseSummary[] {
  const byPhase = new Map<number, Module[]>();
  for (const courseModule of modules) {
    if (courseModule.roadmapPhase === undefined) continue;
    const list = byPhase.get(courseModule.roadmapPhase) ?? [];
    list.push(courseModule);
    byPhase.set(courseModule.roadmapPhase, list);
  }

  return roadmap.phases.map((phase) => {
    const phaseModules = (byPhase.get(phase.number) ?? []).sort(
      (a, b) => (a.roadmapGroup ?? "").localeCompare(b.roadmapGroup ?? "") || a.number - b.number,
    );
    // Some phases (Phase 0) carry their checklists directly under bold labels with no `###`
    // subsection at all. Recover those as leading groups so no topic is stranded off-structure.
    const introGroups: PhaseGroupSummary[] = [];
    let label: string | null = null;
    let bucket: RoadmapTopic[] = [];
    const flushIntro = () => {
      if (bucket.length === 0) return;
      introGroups.push({
        id: `${phase.id}-intro-${introGroups.length}`,
        number: null,
        title: (label ?? "Checklist").replace(/:$/, ""),
        topics: bucket,
        modules: [],
      });
      bucket = [];
    };
    for (const block of phase.intro) {
      if (block.kind === "label") { flushIntro(); label = block.lines.join(" "); }
      else if (block.kind === "checklist") bucket.push(...(block.items ?? []));
    }
    flushIntro();

    const groups: PhaseGroupSummary[] = [
      ...introGroups,
      ...phase.groups.map((group) => ({
        id: group.id,
        number: group.number,
        title: group.title,
        topics: collectTopics(group.blocks),
        modules: group.number ? phaseModules.filter((entry) => entry.roadmapGroup === group.number).map(toModuleRef) : [],
      })),
    ];

    return {
      id: phase.id,
      number: phase.number,
      title: phase.title,
      tag: phase.tag,
      duration: phase.duration,
      blurb: firstParagraph(phase.intro),
      topicIds: sectionTopicIds(phase),
      groups,
      proofGateId: phase.proofGate ? `proof-gate:${phase.id}` : null,
      proofGateText: phase.proofGate
        ? phase.proofGate
            .filter((block) => block.kind === "paragraph")
            .map((block) => block.lines.join(" "))
            .join(" ")
            .replace(/^\*\*Proof Gate[^*]*\*\*:?\s*/, "")
            .replace(/^\*\*Proof Gate.*?:\*\*\s*/, "")
        : "",
      modules: phaseModules.map(toModuleRef),
    };
  });
}

export interface PhaseProgress {
  phase: PhaseSummary;
  topicsDone: number;
  topicsTotal: number;
  percent: number;
  lessonsDone: number;
  lessonsTotal: number;
  gateCleared: boolean;
  /** True once every topic is at pass 3 and the Proof Gate (if any) is cleared. */
  complete: boolean;
}

export function phaseProgress(
  phase: PhaseSummary,
  topicPasses: Record<string, number>,
  completedLessons: string[],
  proofGates: string[],
): PhaseProgress {
  const done = new Set(completedLessons);
  const topicsDone = phase.topicIds.filter((id) => (topicPasses[id] ?? 0) >= 3).length;
  const lessonIds = phase.modules.flatMap((entry) => entry.lessonIds);
  const lessonsDone = lessonIds.filter((id) => done.has(id)).length;
  const gateCleared = phase.proofGateId === null || proofGates.includes(phase.proofGateId);
  const topicsTotal = phase.topicIds.length;
  return {
    phase,
    topicsDone,
    topicsTotal,
    percent: topicsTotal === 0 ? 0 : Math.round((topicsDone / topicsTotal) * 100),
    lessonsDone,
    lessonsTotal: lessonIds.length,
    gateCleared,
    complete: topicsTotal > 0 && topicsDone === topicsTotal && gateCleared,
  };
}

/** The phase to work on now: the lowest-numbered one that isn't finished. */
export function currentPhase(all: PhaseProgress[]): PhaseProgress | null {
  return all.find((entry) => !entry.complete) ?? all.at(-1) ?? null;
}

/**
 * Which weekly lane a phase belongs to. The roadmap runs the maths phase in parallel with
 * whatever the current main-track phase is, which is exactly why it gets its own 4h/week slot.
 */
export function laneForPhase(phaseNumber: number): "math" | "main" {
  return phaseNumber === 2 ? "math" : "main";
}

/** A short "Phase 2" / "Phases 5–9" label for a track, derived from its modules' phase tags. */
export function trackPhaseLabel(modules: Module[], trackSlug: string): string | null {
  const numbers = [
    ...new Set(
      modules
        .filter((entry) => entry.track === trackSlug && entry.roadmapPhase !== undefined)
        .map((entry) => entry.roadmapPhase as number),
    ),
  ].sort((a, b) => a - b);
  if (numbers.length === 0) return null;
  if (numbers.length === 1) return `Phase ${numbers[0]}`;
  return `Phases ${numbers[0]}–${numbers[numbers.length - 1]}`;
}

/**
 * Orders modules the way the mastery roadmap does: by phase, then by subsection within the
 * phase, then by the module's own number. Modules with no `roadmapPhase` are outside the
 * roadmap's scope and sort to the end of their track, keeping their relative order.
 *
 * This is what makes sidebar and track-page navigation follow the roadmap rather than the
 * order modules happened to be authored in.
 */
export function sortByRoadmap<T extends { roadmapPhase?: number; roadmapGroup?: string; number: number }>(modules: T[]): T[] {
  return [...modules].sort((a, b) => {
    const phaseA = a.roadmapPhase ?? Number.POSITIVE_INFINITY;
    const phaseB = b.roadmapPhase ?? Number.POSITIVE_INFINITY;
    if (phaseA !== phaseB) return phaseA - phaseB;
    const groupA = a.roadmapGroup ?? "";
    const groupB = b.roadmapGroup ?? "";
    if (groupA !== groupB) {
      if (groupA === "") return 1;
      if (groupB === "") return -1;
      // "1.10" must sort after "1.9", so compare the two halves numerically.
      const [majorA, minorA] = groupA.split(".").map(Number);
      const [majorB, minorB] = groupB.split(".").map(Number);
      if (majorA !== majorB) return majorA - majorB;
      if (minorA !== minorB) return minorA - minorB;
    }
    return a.number - b.number;
  });
}

/** The short roadmap tag shown next to a module in navigation, e.g. "1.2" or "P6". */
export function roadmapTag(courseModule: { roadmapPhase?: number; roadmapGroup?: string }): string | null {
  if (courseModule.roadmapGroup) return courseModule.roadmapGroup;
  if (courseModule.roadmapPhase !== undefined) return `P${courseModule.roadmapPhase}`;
  return null;
}
