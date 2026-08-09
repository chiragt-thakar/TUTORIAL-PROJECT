"use client";
import Link from "next/link";
import type { Module, Track } from "@/types/curriculum";
import { useProgress } from "@/components/progress/ProgressProvider";
import { percentage } from "@/lib/progress/progress";
import { trackIcon } from "@/lib/curriculum/trackMeta";

export function AllModulesOverview({ tracks, modules }: { tracks: Track[]; modules: Module[] }) {
  const { progress, hydrated } = useProgress();
  return (
    <div className="all-modules">
      <p className="eyebrow">ALL MODULES · NOTHING IS GATED — JUMP ANYWHERE</p>
      {tracks.map((track) => {
        const trackModules = modules.filter((module) => module.track === track.slug).sort((a, b) => a.number - b.number);
        return (
          <div className="all-modules-track" key={track.slug}>
            <div className="all-modules-track-heading">
              <span aria-hidden="true">{trackIcon[track.slug] ?? "◆"}</span>
              <Link href={`/tracks/${track.slug}`}>{track.title}</Link>
            </div>
            <div className="all-modules-row">
              {trackModules.map((module) => {
                const lessonIds = module.lessons.map((lesson) => lesson.id);
                const done = lessonIds.filter((id) => progress.completedLessons.includes(id)).length;
                const pct = hydrated ? percentage(done, lessonIds.length) : 0;
                return (
                  <Link key={module.slug} href={`/learn/${module.slug}`} className={`module-chip ${module.status}`}>
                    <span className="module-chip-index">{String(module.number).padStart(2, "0")}</span>
                    <span className="module-chip-title">{module.title}</span>
                    <span className="module-chip-pct">{module.status === "available" ? `${pct}%` : "outline"}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
