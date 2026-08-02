import "server-only";

import { cache } from "react";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { frontmatterSchema, moduleSchema } from "./schema";
import { parseMdxFrontmatter } from "./frontmatter";
import { assertUniqueOrder, sortByNumber } from "@/lib/curriculum/ordering";
import type { Lesson, Module } from "@/types/curriculum";

const contentRoot = path.join(process.cwd(), "content", "modules");

function invalid(error: unknown, file: string): never {
  const detail = error instanceof Error ? error.message : String(error);
  throw new Error(`Invalid curriculum content in ${file}: ${detail}`);
}

export const getModules = cache(async (): Promise<Module[]> => {
  const entries = await readdir(contentRoot, { withFileTypes: true });
  const modules = await Promise.all(entries.filter((entry) => entry.isDirectory()).map(async (entry) => {
    const file = path.join(contentRoot, entry.name, "module.json");
    try { return moduleSchema.parse(JSON.parse(await readFile(file, "utf8"))); }
    catch (error) { return invalid(error, file); }
  }));
  assertUniqueOrder(modules.map((courseModule) => ({ order: courseModule.number })), "curriculum modules");
  for (const courseModule of modules) assertUniqueOrder(courseModule.lessons, `module ${courseModule.slug}`);
  return sortByNumber(modules) as Module[];
});

export async function getModule(slug: string): Promise<Module | undefined> {
  return (await getModules()).find((courseModule) => courseModule.slug === slug);
}

export async function getLesson(moduleSlug: string, lessonSlug: string): Promise<Lesson | undefined> {
  const courseModule = await getModule(moduleSlug);
  const summary = courseModule?.lessons.find((lesson) => lesson.slug === lessonSlug) ?? (courseModule?.assignment?.slug === lessonSlug ? courseModule.assignment : undefined);
  if (!courseModule || !summary || courseModule.status === "planned") return undefined;
  const directory = `${String(courseModule.number).padStart(2, "0")}-${courseModule.slug}`;
  const file = path.join(contentRoot, directory, `${lessonSlug}.mdx`);
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
  const lessons = modules.filter((courseModule) => courseModule.status === "available").flatMap((courseModule) =>
    [...courseModule.lessons, ...(courseModule.assignment ? [courseModule.assignment] : [])].map((lesson) => ({ module: courseModule, lesson })),
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
