import "server-only";

import { cache } from "react";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { parse } from "yaml";
import { practiceSetSchema } from "./schema";
import { renderPracticeSet } from "./render";
import type { PracticeIndexEntry, PracticeSet, RenderedPracticeSet } from "./types";

/**
 * The practice content boundary, mirroring `lib/content/loader.ts`.
 *
 * A practice set lives beside the lesson it belongs to, named `<lesson-slug>.practice.yaml`, so a
 * topic is one directory entry away from everything that tests it. The file's own `module` and
 * `lesson` fields must agree with where it sits on disk — that redundancy is what makes a
 * copy-pasted file fail loudly at build time instead of silently attaching its exercises to the
 * wrong lesson and corrupting that lesson's progress keys.
 */

const contentRoot = path.join(process.cwd(), "content", "modules");
const SUFFIX = ".practice.yaml";

function invalid(error: unknown, file: string): never {
  const detail = error instanceof Error ? error.message : String(error);
  throw new Error(`Invalid practice content in ${file}: ${detail}`);
}

interface Located {
  set: PracticeSet;
  file: string;
}

async function readSet(file: string, moduleDirectory: string, lessonSlug: string): Promise<Located> {
  try {
    const set = practiceSetSchema.parse(parse(await readFile(file, "utf8"))) as PracticeSet;
    if (set.lesson !== lessonSlug) throw new Error(`declares lesson "${set.lesson}" but is named for "${lessonSlug}"`);
    // Directory names are `NN-<module slug>`, so the slug is everything after the first dash.
    const expectedModule = moduleDirectory.replace(/^\d+-/, "");
    if (set.module !== expectedModule) throw new Error(`declares module "${set.module}" but lives in ${moduleDirectory}`);
    return { set, file };
  } catch (error) {
    return invalid(error, file);
  }
}

/** Every practice set on disk, keyed by `<moduleSlug>/<lessonSlug>`. */
const locateAll = cache(async (): Promise<Map<string, Located>> => {
  const found = new Map<string, Located>();
  const tracks = (await readdir(contentRoot, { withFileTypes: true })).filter((entry) => entry.isDirectory());
  for (const track of tracks) {
    const trackDir = path.join(contentRoot, track.name);
    const modules = (await readdir(trackDir, { withFileTypes: true })).filter((entry) => entry.isDirectory());
    for (const moduleEntry of modules) {
      const moduleDir = path.join(trackDir, moduleEntry.name);
      for (const file of await readdir(moduleDir)) {
        if (!file.endsWith(SUFFIX)) continue;
        const lessonSlug = file.slice(0, -SUFFIX.length);
        const located = await readSet(path.join(moduleDir, file), moduleEntry.name, lessonSlug);
        found.set(`${located.set.module}/${lessonSlug}`, located);
      }
    }
  }
  return found;
});

export const getPracticeSet = cache(async (moduleSlug: string, lessonSlug: string): Promise<RenderedPracticeSet | null> => {
  const located = (await locateAll()).get(`${moduleSlug}/${lessonSlug}`);
  return located ? renderPracticeSet(located.set) : null;
});

/** True when a lesson has practice content, without paying to highlight it. */
export async function hasPracticeSet(moduleSlug: string, lessonSlug: string): Promise<boolean> {
  return (await locateAll()).has(`${moduleSlug}/${lessonSlug}`);
}

/**
 * Every practice set, rendered. Used by the practice hub, which has to reason across topics to
 * pick a random challenge, surface weak areas and build a revision set.
 */
export const getAllPracticeSets = cache(async (): Promise<RenderedPracticeSet[]> => {
  const located = [...(await locateAll()).values()];
  const rendered = await Promise.all(located.map((entry) => renderPracticeSet(entry.set)));
  return rendered.sort((a, b) => a.module.localeCompare(b.module) || a.lesson.localeCompare(b.lesson));
});

/**
 * The un-highlighted sets. Tests and any future tooling want the raw content without paying for
 * Shiki, and the hub's *counts* do not need HTML either.
 */
export async function getRawPracticeSets(): Promise<PracticeSet[]> {
  return [...(await locateAll()).values()].map((entry) => entry.set);
}

/**
 * The stripped index the practice hub runs on: ids, tiers, titles and mastery rules, and none of
 * the prompts, hints, solutions or model answers.
 *
 * That is a deliberate decision, not a size optimisation. `/practice` is a static page, so
 * whatever it is given is baked into HTML the browser downloads — shipping every solution on the
 * site to a page whose whole purpose is to send you off to *attempt* something would put the
 * answers one devtools panel away from every unattempted exercise.
 */
export const getPracticeIndex = cache(async (): Promise<PracticeIndexEntry[]> => {
  const sets = await getRawPracticeSets();
  return sets
    .map((set) => ({
      lessonId: set.lessonId,
      module: set.module,
      lesson: set.lesson,
      title: set.title,
      summary: set.summary,
      mastery: set.mastery,
      exercises: set.exercises.map(({ id, kind, tier, title, minutes, requiredForMastery }) => ({ id, kind, tier, title, minutes, requiredForMastery })),
      quizzes: set.quizzes.map(({ id, kind, passScore, title }) => ({ id, kind, passScore, title })),
      interview: set.interview.map(({ id, level, requiredForMastery }) => ({ id, level, requiredForMastery })),
      projects: set.projects.map(({ id, kind, title }) => ({ id, kind, title })),
    }))
    .sort((a, b) => a.module.localeCompare(b.module) || a.lesson.localeCompare(b.lesson));
});
