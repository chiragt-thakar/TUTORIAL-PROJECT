"use client";
import Link from "next/link";
import type { CurriculumGroup, Module } from "@/types/curriculum";
import { useProgress } from "@/components/progress/ProgressProvider";
import { percentage } from "@/lib/progress/progress";
import { groupIcon } from "@/lib/curriculum/trackMeta";
import { buildGroups, isRoadmapModule, navRef } from "@/lib/curriculum/groups";

export function AllModulesOverview({ groups, modules }: { groups: CurriculumGroup[]; modules: Module[] }) {
  const { progress, hydrated } = useProgress();
  const built = buildGroups(groups, modules);
  return (
    <div className="all-modules">
      <p className="eyebrow">EVERY SECTION · IN ROADMAP ORDER · NOTHING IS GATED</p>
      {built.map((track) => {
        const trackModules = track.modules;
        return (
          <div className="all-modules-track" key={track.slug}>
            <div className="all-modules-track-heading">
              <span aria-hidden="true">{groupIcon[track.slug] ?? "◆"}</span>
              <Link href={`/paths/${track.slug}`}>{track.title}</Link>
            </div>
            <div className="all-modules-row">
              {trackModules.map((module) => {
                const lessonIds = module.lessons.map((lesson) => lesson.id);
                const done = lessonIds.filter((id) => progress.completedLessons.includes(id)).length;
                const pct = hydrated ? percentage(done, lessonIds.length) : 0;
                return (
                  <Link key={module.slug} href={`/learn/${module.slug}`} className={`module-chip ${module.status}`}>
                    <span className="module-chip-index">{isRoadmapModule(module) ? navRef(module) : "·"}</span>
                    <span className="module-chip-title">{module.title}</span>
                    <span className="module-chip-pct">{module.status === "available" ? `${pct}%` : `${lessonIds.length}t`}</span>
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
