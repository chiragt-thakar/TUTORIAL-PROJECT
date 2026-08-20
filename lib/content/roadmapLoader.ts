import "server-only";

import { cache } from "react";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { parseRoadmap } from "./roadmapParser";
import type { Roadmap } from "@/types/roadmap";

export const roadmapFile = path.join(process.cwd(), "content", "roadmap", "AI_ML_MASTERY_ROADMAP.md");

export const getRoadmap = cache(async (): Promise<Roadmap> => {
  try {
    return parseRoadmap(await readFile(roadmapFile, "utf8"));
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid roadmap content in ${roadmapFile}: ${detail}`);
  }
});
