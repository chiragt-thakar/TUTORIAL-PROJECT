import "server-only";

import { cache } from "react";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { frontmatterSchema, moduleSchema, trackSchema } from "./schema";
import { parseMdxFrontmatter } from "./frontmatter";
import { assertUniqueOrder, sortByNumber } from "@/lib/curriculum/ordering";
import type { Lesson, Module, Track } from "@/types/curriculum";

const contentRoot = path.join(process.cwd(), "content", "modules");
const tracksFile = path.join(process.cwd(), "content", "tracks.json");

function invalid(error: unknown, file: string): never {
  const detail = error instanceof Error ? error.message : String(error);
  throw new Error(`Invalid curriculum content in ${file}: ${detail}`);
}

export const getTracks = cache(async (): Promise<Track[]> => {
  let tracks: Track[];
  try { tracks = trackSchema.array().parse(JSON.parse(await readFile(tracksFile, "utf8"))); }
  catch (error) { return invalid(error, tracksFile); }
  assertUniqueOrder(tracks.map((track) => ({ order: track.number })), "tracks");
  return sortByNumber(tracks) as Track[];
});

export const getModules = cache(async (): Promise<Module[]> => {
  const tracks = await getTracks();
  const trackSlugs = new Set(tracks.map((track) => track.slug));
  const trackEntries = (await readdir(contentRoot, { withFileTypes: true })).filter((entry) => entry.isDirectory());
  const modules = (await Promise.all(trackEntries.map(async (trackEntry) => {
    if (!trackSlugs.has(trackEntry.name)) throw new Error(`content/modules/${trackEntry.name} has no matching entry in content/tracks.json`);
    const trackDir = path.join(contentRoot, trackEntry.name);
    const moduleEntries = (await readdir(trackDir, { withFileTypes: true })).filter((entry) => entry.isDirectory());
    return Promise.all(moduleEntries.map(async (entry) => {
      const file = path.join(trackDir, entry.name, "module.json");
      try {
        const parsed = moduleSchema.parse(JSON.parse(await readFile(file, "utf8")));
        if (parsed.track !== trackEntry.name) throw new Error(`track "${parsed.track}" does not match directory content/modules/${trackEntry.name}`);
        return parsed;
      } catch (error) { return invalid(error, file); }
    }));
  }))).flat();
  for (const track of tracks) assertUniqueOrder(modules.filter((courseModule) => courseModule.track === track.slug).map((courseModule) => ({ order: courseModule.number })), `track ${track.slug}`);
  const slugs = new Set<string>();
  for (const courseModule of modules) {
    if (slugs.has(courseModule.slug)) throw new Error(`duplicate module slug "${courseModule.slug}" across tracks`);
    slugs.add(courseModule.slug);
  }
  for (const courseModule of modules) assertUniqueOrder(courseModule.lessons, `module ${courseModule.slug}`);
  return modules.sort((a, b) => a.track.localeCompare(b.track) || a.number - b.number) as Module[];
});

export async function getModulesByTrack(trackSlug: string): Promise<Module[]> {
  return sortByNumber((await getModules()).filter((courseModule) => courseModule.track === trackSlug)) as Module[];
}

export async function getModule(moduleSlug: string): Promise<Module | undefined> {
  return (await getModules()).find((courseModule) => courseModule.slug === moduleSlug);
}

export async function getLesson(moduleSlug: string, lessonSlug: string): Promise<Lesson | undefined> {
  const courseModule = await getModule(moduleSlug);
  const summary = courseModule?.lessons.find((lesson) => lesson.slug === lessonSlug) ?? (courseModule?.assignment?.slug === lessonSlug ? courseModule.assignment : undefined);
  if (!courseModule || !summary || courseModule.status === "planned") return undefined;
  const directory = `${String(courseModule.number).padStart(2, "0")}-${courseModule.slug}`;
  const file = path.join(contentRoot, courseModule.track, directory, `${lessonSlug}.mdx`);
  try {
    const parsed = parseMdxFrontmatter(await readFile(file, "utf8"));
    const metadata = frontmatterSchema.parse(parsed.data);
    if (metadata.module !== moduleSlug || metadata.id !== summary.id) throw new Error("frontmatter id/module does not match module.json");
    return { ...summary, ...metadata, slug: lessonSlug, status: "available", source: parsed.content };
  } catch (error) { return invalid(error, file); }
}

export async function validateAvailableContent(): Promise<number> {
  let count = 0;
  for (const courseModule of await getModules()) {
    if (courseModule.status !== "available") continue;
    for (const item of [...courseModule.lessons, ...(courseModule.assignment ? [courseModule.assignment] : [])]) {
      await getLesson(courseModule.slug, item.slug);
      count += 1;
    }
  }
  return count;
}

export function getAdjacentLessons(modules: Module[], moduleSlug: string, lessonSlug: string) {
  const courseModule = modules.find((item) => item.slug === moduleSlug);
  const trackModules = modules.filter((item) => item.status === "available" && item.track === courseModule?.track);
  const lessons = trackModules.flatMap((item) =>
    [...item.lessons, ...(item.assignment ? [item.assignment] : [])].map((lesson) => ({ module: item, lesson })),
  );
  const index = lessons.findIndex(({ module, lesson }) => module.slug === moduleSlug && lesson.slug === lessonSlug);
  return { previous: index > 0 ? lessons[index - 1] : undefined, next: index >= 0 ? lessons[index + 1] : undefined };
}

export function extractHeadings(source: string) {
  return source.split("\n").flatMap((line) => {
    const match = /^(##|###)\s+(.+)$/.exec(line.trim());
    if (!match) return [];
    const title = match[2].replace(/[`*_]/g, "");
    return [{ level: match[1].length, title, id: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") }];
  });
}
