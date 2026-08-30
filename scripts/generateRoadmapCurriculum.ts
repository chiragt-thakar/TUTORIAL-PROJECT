/**
 * Regenerates the curriculum from the AI/ML Mastery Roadmap.
 *
 * The roadmap document is the spine of this site, so the navigation is *generated* from it
 * rather than transcribed alongside it. Run this script whenever
 * `content/roadmap/AI_ML_MASTERY_ROADMAP.md` changes:
 *
 *     npx tsx scripts/generateRoadmapCurriculum.ts
 *
 * What it produces:
 *   - `content/groups.json`      one navigation group per roadmap phase, plus the cross-cutting
 *                                tracks, plus a single "Extra Learning" group.
 *   - `content/modules/mastery/` one module per roadmap subsection, one lesson per checkbox
 *                                topic, with lesson ids equal to the parser's own topic ids so a
 *                                lesson and its roadmap checkbox are literally the same entity.
 *   - existing modules           re-pointed at the Extra Learning group, or deleted when the
 *                                roadmap now covers the same ground with a module of its own.
 *
 * Titles, section numbers, tags and durations are copied verbatim from the document. Nothing
 * here paraphrases it. `tests/roadmapCurriculum.test.ts` asserts the two stay in lockstep.
 */
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseRoadmap } from "../lib/content/roadmapParser";
import type { Roadmap, RoadmapBlock, RoadmapSection, RoadmapTopic } from "../types/roadmap";

const cwd = process.cwd();
const roadmapFile = path.join(cwd, "content", "roadmap", "AI_ML_MASTERY_ROADMAP.md");
const modulesRoot = path.join(cwd, "content", "modules");
const groupsFile = path.join(cwd, "content", "groups.json");
const tracksFile = path.join(cwd, "content", "tracks.json");
const masteryTrack = "mastery";

/** Placeholder study time for a topic nobody has written a lesson for yet. */
const MINUTES_PER_TOPIC = 45;

/** The roadmap's own definition of "learned" — the objective every unwritten topic inherits. */
const THREE_PASS_OBJECTIVES = [
  "Pass 1 — watch or read for intuition, and accept the confusion",
  "Pass 2 — derive it on paper",
  "Pass 3 — implement it from scratch",
];

// ---------------------------------------------------------------------------- text helpers

/** Strips inline markdown so a title or slug reads as plain text. */
function plain(text: string): string {
  return text.replace(/`([^`]*)`/g, "$1").replace(/\*\*/g, "").replace(/\*/g, "").trim();
}

function slugify(text: string, maxWords = 8): string {
  const words = plain(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, maxWords);
  return words.join("-") || "topic";
}

/**
 * A readable URL slug for a section heading. Roadmap headings often carry a subtitle after a
 * dash, colon or bracket ("Data work (this is 70% of the actual job)"); a word-count cut lands
 * mid-phrase, so take the headline instead and only fall back to the full heading when the
 * headline is too thin to identify the section on its own.
 */
function headlineSlug(title: string): string {
  const headline = plain(title).split(/\s+[—–-]\s+|\s*[(:]/)[0];
  const short = slugify(headline, 6);
  if (short.split("-").length >= 2 || slugify(title).split("-").length < 2) return short;
  return slugify(title, 5);
}

/** Splits a heading like "1.2 NumPy — the actual foundation `[CORE]`" into title and tag. */
function splitTag(title: string): { title: string; tag?: string } {
  const match = /^(.*?)\s*`\[(.+?)\]`\s*$/.exec(title);
  return match ? { title: match[1].trim(), tag: match[2].trim() } : { title: title.trim() };
}

/** The section's own opening paragraph, used verbatim as a description when it has one. */
function firstParagraph(blocks: RoadmapBlock[]): string | null {
  const block = blocks.find((entry) => entry.kind === "paragraph");
  return block ? plain(block.lines.join(" ")) : null;
}

function topicsOf(blocks: RoadmapBlock[]): RoadmapTopic[] {
  return blocks.flatMap((block) => block.items ?? []);
}

// ---------------------------------------------------------------------------- specs

interface LessonSpec {
  id: string;
  slug: string;
  title: string;
  order: number;
  estimatedMinutes: number;
  prerequisites: string[];
  learningObjectives: string[];
}

interface ModuleSpec {
  slug: string;
  title: string;
  description: string;
  group: string;
  roadmapSectionId: string;
  roadmapRef: string;
  roadmapPhase?: number;
  roadmapGroup?: string;
  tag?: string;
  lessons: LessonSpec[];
}

interface GroupSpec {
  slug: string;
  number: number;
  title: string;
  tagline: string;
  description: string;
  kind: "roadmap" | "extra";
  roadmapPhase?: number;
  roadmapSectionId?: string;
  tag?: string;
  duration?: string;
}

function toLesson(id: string, text: string, index: number): LessonSpec {
  return {
    id,
    slug: `${String(index + 1).padStart(2, "0")}-${slugify(text)}`,
    title: plain(text),
    order: index + 1,
    estimatedMinutes: MINUTES_PER_TOPIC,
    prerequisites: [],
    learningObjectives: THREE_PASS_OBJECTIVES,
  };
}

function toLessons(topics: RoadmapTopic[]): LessonSpec[] {
  return topics.map((topic, index) => toLesson(topic.id, topic.text, index));
}

function describe(blocks: RoadmapBlock[], ref: string, count: number): string {
  const paragraph = firstParagraph(blocks);
  if (paragraph) return paragraph;
  return `Roadmap ${ref} — ${count} topic${count === 1 ? "" : "s"}, in the document's own order.`;
}

/**
 * Phase 0 has no numbered subsections: its topics sit under two bold labels in the phase intro.
 * Each label becomes a module so the phase is navigable like every other one.
 */
function phaseZeroModules(section: RoadmapSection, groupSlug: string): ModuleSpec[] {
  const specs: ModuleSpec[] = [];
  let pendingLabel: string | null = null;
  for (const block of section.intro) {
    if (block.kind === "label") {
      pendingLabel = plain(block.lines.join(" "));
      continue;
    }
    if (block.kind !== "checklist" || !block.items) continue;
    const label = pendingLabel ?? "Phase 0 audit";
    pendingLabel = null;
    // Slug from the label's headline only: everything before its first bracket, dash or colon.
    const headline = label.split(/\s*[(—:]/)[0];
    specs.push({
      slug: `phase-0-${slugify(headline, 4)}`,
      title: label.replace(/:$/, ""),
      description: `Roadmap Phase 0 — ${block.items.length} topics, in the document's own order.`,
      group: groupSlug,
      roadmapSectionId: section.id,
      roadmapRef: "Phase 0",
      roadmapPhase: 0,
      lessons: toLessons(block.items),
    });
  }
  return specs;
}

function buildSpecs(roadmap: Roadmap): { groups: GroupSpec[]; modules: ModuleSpec[] } {
  const groups: GroupSpec[] = [];
  const modules: ModuleSpec[] = [];
  let groupNumber = 0;

  for (const phase of roadmap.phases) {
    groupNumber += 1;
    const slug = `phase-${phase.number}`;
    const subsectionTitles = phase.groups.map((entry) =>
      [entry.number, splitTag(entry.title).title].filter(Boolean).join(" "),
    );
    groups.push({
      slug,
      number: groupNumber,
      title: `Phase ${phase.number} — ${plain(phase.title)}`,
      tagline: `${phase.tag} · ${phase.duration}`,
      description: firstParagraph(phase.intro) ?? subsectionTitles.join(" · "),
      kind: "roadmap",
      roadmapPhase: phase.number,
      roadmapSectionId: phase.id,
      tag: phase.tag,
      duration: phase.duration,
    });

    if (phase.groups.length === 0) {
      modules.push(...phaseZeroModules(phase, slug));
      continue;
    }

    for (const entry of phase.groups) {
      const { title, tag } = splitTag(entry.title);
      const topics = topicsOf(entry.blocks);
      const ref = entry.number ?? `Phase ${phase.number}`;
      modules.push({
        slug: `${(entry.number ?? String(phase.number)).replace(/\./g, "-")}-${headlineSlug(title)}`,
        title: entry.number ? `${entry.number} ${title}` : title,
        description: describe(entry.blocks, ref, topics.length),
        group: slug,
        roadmapSectionId: entry.id,
        roadmapRef: ref,
        roadmapPhase: phase.number,
        roadmapGroup: entry.number ?? undefined,
        tag,
        lessons: toLessons(topics),
      });
    }
  }

  // The cross-cutting tracks are part of the roadmap but deliberately not a phase.
  const crossCutting = roadmap.appendixSections.find((entry) =>
    entry.title.startsWith("CROSS-CUTTING TRACKS"),
  );
  if (crossCutting) {
    groupNumber += 1;
    const slug = "cross-cutting-tracks";
    groups.push({
      slug,
      number: groupNumber,
      title: "Cross-Cutting Tracks",
      tagline: "Run these throughout, never as separate phases",
      description:
        "The roadmap's three tracks that run alongside every phase: software engineering excellence, the portfolio, and career and compensation.",
      kind: "roadmap",
      roadmapSectionId: crossCutting.id,
    });
    for (const entry of crossCutting.groups) {
      const { title, tag } = splitTag(entry.title);
      const ref = /^(Track [A-Z])/.exec(title)?.[1] ?? title;
      const topics = topicsOf(entry.blocks);
      // Track B lists five portfolio targets as a numbered list rather than as checkboxes.
      const numbered = topics.length === 0 ? entry.blocks.find((block) => block.kind === "numbered") : undefined;
      const lessons = numbered
        ? numbered.lines.map((line, index) => toLesson(`portfolio:${entry.id}:${index}`, line, index))
        : toLessons(topics);
      modules.push({
        slug: slugify(title, 10),
        title,
        description: describe(entry.blocks, ref, lessons.length),
        group: slug,
        roadmapSectionId: entry.id,
        roadmapRef: ref,
        tag,
        lessons,
      });
    }
  }

  groupNumber += 1;
  groups.push({
    slug: "extra-learning",
    number: groupNumber,
    title: "Extra Learning",
    tagline: "Written before this site followed the roadmap",
    description:
      "The modules this project had already written when it was rebuilt around the mastery roadmap: the production Python and FastAPI curriculum, the Generative AI engineering track, and a scientific-Python module. All of it is real, finished material — it just is not part of the roadmap's own sequence.",
    kind: "extra",
  });

  return { groups, modules };
}

// ---------------------------------------------------------------------------- file writing

function compact<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T;
}

async function writeJson(file: string, value: unknown): Promise<void> {
  await writeFile(file, `${JSON.stringify(value)}\n`, "utf8");
}

// ---------------------------------------------------------------- preserving authored work

/**
 * What a regeneration must not destroy.
 *
 * Lessons are authored *in place* under `content/modules/mastery/` (see `CLAUDE.md`),
 * so this script can no longer treat that directory as disposable. Before the rebuild it snapshots
 * every hand-written file and every hand-written lesson field; afterwards it restores them.
 *
 * Lesson metadata is keyed by lesson **id**, not by slug or position, because the id is the roadmap
 * topic id and is the one thing guaranteed stable across a regeneration. Files are keyed by module
 * slug plus filename, which survives the directory being renumbered.
 */
interface AuthoredLesson {
  status?: "available" | "planned";
  description?: string;
  estimatedMinutes?: number;
  learningObjectives?: string[];
}

interface Authored {
  /** Lesson id -> the fields a human filled in. */
  lessons: Map<string, AuthoredLesson>;
  /** `<module slug>/<filename>` -> file contents, for everything that is not `module.json`. */
  files: Map<string, Buffer>;
  /** Module slugs a human marked available. */
  availableModules: Set<string>;
}

async function snapshotAuthored(): Promise<Authored> {
  const authored: Authored = { lessons: new Map(), files: new Map(), availableModules: new Set() };
  const trackDir = path.join(modulesRoot, masteryTrack);
  let directories: string[];
  try {
    directories = await readdir(trackDir);
  } catch {
    return authored; // first ever run
  }

  for (const directory of directories) {
    const moduleDir = path.join(trackDir, directory);
    let parsed: { slug: string; status?: string; lessons?: Array<Record<string, unknown>> };
    try {
      parsed = JSON.parse(await readFile(path.join(moduleDir, "module.json"), "utf8"));
    } catch {
      continue;
    }
    if (parsed.status === "available") authored.availableModules.add(parsed.slug);

    for (const lesson of parsed.lessons ?? []) {
      const id = lesson.id;
      if (typeof id !== "string") continue;
      const fields: AuthoredLesson = {};
      if (lesson.status === "available" || lesson.status === "planned") fields.status = lesson.status;
      if (typeof lesson.description === "string") fields.description = lesson.description;
      // A flat placeholder estimate is not authored metadata — only a changed one is.
      if (typeof lesson.estimatedMinutes === "number" && lesson.estimatedMinutes !== MINUTES_PER_TOPIC) {
        fields.estimatedMinutes = lesson.estimatedMinutes;
      }
      if (Array.isArray(lesson.learningObjectives)) {
        const objectives = lesson.learningObjectives.filter((item): item is string => typeof item === "string");
        const isPlaceholder =
          objectives.length === THREE_PASS_OBJECTIVES.length &&
          objectives.every((item, index) => item === THREE_PASS_OBJECTIVES[index]);
        if (!isPlaceholder) fields.learningObjectives = objectives;
      }
      if (Object.keys(fields).length > 0) authored.lessons.set(id, fields);
    }

    for (const file of await readdir(moduleDir)) {
      if (file === "module.json") continue;
      authored.files.set(`${parsed.slug}/${file}`, await readFile(path.join(moduleDir, file)));
    }
  }
  return authored;
}

/** Restores the files a human wrote into a freshly generated module directory. */
async function restoreFiles(authored: Authored, moduleSlug: string, directory: string): Promise<string[]> {
  const restored: string[] = [];
  for (const [key, contents] of authored.files) {
    const [slug, ...rest] = key.split("/");
    if (slug !== moduleSlug) continue;
    const name = rest.join("/");
    await writeFile(path.join(directory, name), contents);
    restored.push(name);
  }
  return restored;
}

async function main(): Promise<void> {
  const roadmap = parseRoadmap(await readFile(roadmapFile, "utf8"));
  if (!roadmap.complete) throw new Error("the roadmap source is marked truncated; fix it before generating");
  const { groups, modules } = buildSpecs(roadmap);

  // 1. The roadmap-derived modules. The *outline* is rebuilt from scratch on every run; anything
  //    a human wrote inside it is snapshotted first and merged back afterwards.
  const authored = await snapshotAuthored();

  // Check for orphans *before* deleting anything: a renamed roadmap heading changes a module slug,
  // and there would be nowhere to put that module's lesson files back.
  const producedSlugs = new Set(modules.map((spec) => spec.slug));
  const orphaned = [...authored.files.keys()].filter((key) => !producedSlugs.has(key.split("/")[0]));
  if (orphaned.length > 0) {
    throw new Error(
      `these authored files belong to modules the roadmap no longer produces, and would be lost:\n  ${orphaned.join("\n  ")}\n` +
        "Re-home them by hand before regenerating. Nothing has been deleted.",
    );
  }

  await rm(path.join(modulesRoot, masteryTrack), { recursive: true, force: true });
  let number = 0;
  let restoredFiles = 0;
  let mergedLessons = 0;
  for (const spec of modules) {
    number += 1;
    const directory = path.join(modulesRoot, masteryTrack, `${String(number).padStart(2, "0")}-${spec.slug}`);
    await mkdir(directory, { recursive: true });

    const lessons = spec.lessons.map((lesson) => {
      const extra = authored.lessons.get(lesson.id);
      if (!extra) return lesson;
      mergedLessons += 1;
      return compact({ ...lesson, ...extra });
    });

    await writeJson(
      path.join(directory, "module.json"),
      compact({
        slug: spec.slug,
        track: masteryTrack,
        number,
        title: spec.title,
        description: spec.description,
        status: authored.availableModules.has(spec.slug) ? "available" : "planned",
        estimatedMinutes: lessons.reduce((total, lesson) => total + (lesson.estimatedMinutes ?? MINUTES_PER_TOPIC), 0) || MINUTES_PER_TOPIC,
        prerequisites: [],
        learningOutcomes: [
          "Take every topic in this section to pass 3 of the roadmap's rule: intuition, then derived on paper, then implemented from scratch.",
        ],
        lessons,
        group: spec.group,
        roadmapPhase: spec.roadmapPhase,
        roadmapGroup: spec.roadmapGroup,
        roadmapSectionId: spec.roadmapSectionId,
        roadmapRef: spec.roadmapRef,
        tag: spec.tag,
      }),
    );
    restoredFiles += (await restoreFiles(authored, spec.slug, directory)).length;
  }
  console.log(`preserved ${restoredFiles} authored file(s) and ${mergedLessons} authored lesson entr(ies)`);

  // 2. Existing modules: keep the written ones as Extra Learning, drop planned outlines that
  //    the roadmap now covers with a module of its own.
  const kept: Array<{ track: string; slug: string }> = [];
  const removed: string[] = [];
  for (const track of await readdir(modulesRoot)) {
    if (track === masteryTrack) continue;
    for (const entry of await readdir(path.join(modulesRoot, track))) {
      const directory = path.join(modulesRoot, track, entry);
      const file = path.join(directory, "module.json");
      const parsed = JSON.parse(await readFile(file, "utf8")) as Record<string, unknown>;
      // "Written" means prose exists on disk, not that the module is flagged available: a
      // planned module can hold a single finished lesson published ahead of the rest, and
      // deleting it would throw away real work.
      const written = (await readdir(directory)).some((child) => child.endsWith(".mdx"));
      const overlapsRoadmap = parsed.roadmapPhase !== undefined;
      if (!written && overlapsRoadmap) {
        await rm(directory, { recursive: true, force: true });
        removed.push(`${track}/${entry}`);
        continue;
      }
      const related = parsed.roadmapGroup as string | undefined;
      delete parsed.roadmapPhase;
      delete parsed.roadmapGroup;
      delete parsed.roadmapSectionId;
      delete parsed.roadmapRef;
      parsed.group = "extra-learning";
      if (related) parsed.relatedRoadmapSection = related;
      await writeJson(file, parsed);
      kept.push({ track, slug: String(parsed.slug) });
    }
  }

  // 3. Drop storage tracks that no longer hold anything, and register the mastery track.
  const remainingTracks = new Set(kept.map((entry) => entry.track));
  for (const track of await readdir(modulesRoot)) {
    if (track === masteryTrack || remainingTracks.has(track)) continue;
    await rm(path.join(modulesRoot, track), { recursive: true, force: true });
  }
  const existingTracks = (JSON.parse(await readFile(tracksFile, "utf8")) as Array<Record<string, unknown>>).filter(
    (track) => remainingTracks.has(String(track.slug)),
  );
  const tracks: Array<Record<string, unknown>> = [
    {
      slug: masteryTrack,
      number: 1,
      title: "The AI/ML Mastery Roadmap",
      tagline: "The roadmap, one module per section",
      description:
        "Every section of content/roadmap/AI_ML_MASTERY_ROADMAP.md as a module, and every checkbox in it as a lesson. Generated by scripts/generateRoadmapCurriculum.ts — do not hand-edit.",
      status: "planned",
    },
    ...existingTracks.map((track, index) => ({ ...track, number: index + 2 })),
  ];
  await writeJson(tracksFile, tracks);

  // 4. Navigation groups.
  await writeJson(groupsFile, groups.map(compact));

  const lessonCount = modules.reduce((total, spec) => total + spec.lessons.length, 0);
  console.log(`roadmap topics parsed : ${roadmap.topicCount}`);
  console.log(`groups written        : ${groups.length}`);
  console.log(`mastery modules       : ${modules.length}`);
  console.log(`mastery lessons       : ${lessonCount}`);
  console.log(`modules kept as extra : ${kept.length}`);
  console.log(`planned outlines cut  : ${removed.length}`);
  console.log(`tracks remaining      : ${tracks.map((track) => track.slug).join(", ")}`);
}

await main();
