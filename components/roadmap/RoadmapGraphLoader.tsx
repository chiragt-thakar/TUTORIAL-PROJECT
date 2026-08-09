"use client";
import dynamic from "next/dynamic";
import type { Module, Track } from "@/types/curriculum";

const RoadmapGraph = dynamic(() => import("./RoadmapGraph").then((mod) => mod.RoadmapGraph), {
  ssr: false,
  loading: () => <div className="roadmap-canvas roadmap-canvas-loading" aria-hidden="true" />,
});

export function RoadmapGraphLoader({ tracks, modules }: { tracks: Track[]; modules: Module[] }) {
  return <RoadmapGraph tracks={tracks} modules={modules} />;
}
