"use client";
import dynamic from "next/dynamic";
import type { Module, CurriculumGroup } from "@/types/curriculum";

const RoadmapGraph = dynamic(() => import("./RoadmapGraph").then((mod) => mod.RoadmapGraph), {
  ssr: false,
  loading: () => <div className="roadmap-canvas roadmap-canvas-loading" aria-hidden="true" />,
});

export function RoadmapGraphLoader({ groups, modules }: { groups: CurriculumGroup[]; modules: Module[] }) {
  return <RoadmapGraph groups={groups} modules={modules} />;
}
