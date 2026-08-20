"use client";
import Link from "next/link";
import type { CurriculumGroup, Module } from "@/types/curriculum";
import { useProgress } from "@/components/progress/ProgressProvider";
import { percentage } from "@/lib/progress/progress";
import { groupIcon } from "@/lib/curriculum/trackMeta";
import { buildGroups } from "@/lib/curriculum/groups";

export function GroupCards({ groups, modules }: { groups: CurriculumGroup[]; modules: Module[] }) {
  const { progress, hydrated } = useProgress();
  const built = buildGroups(groups, modules);
  return (
    <div className="track-grid">
      {built.map((group, index) => {
        const available = group.modules.filter((module) => module.status === "available");
        const lessonIds = available.flatMap((module) => module.lessons.map((lesson) => lesson.id));
        const completed = lessonIds.filter((id) => progress.completedLessons.includes(id)).length;
        const pct = hydrated ? percentage(completed, lessonIds.length) : 0;
        return (
          <Link className="track-card" href={`/paths/${group.slug}`} key={group.slug} style={{ "--stagger": index } as React.CSSProperties}>
            <div className="track-card-top">
              <span className="track-icon" aria-hidden="true">{groupIcon[group.slug] ?? "📘"}</span>
              {group.kind === "roadmap"
                ? <span className="status available">{group.tag ?? "ROADMAP"}</span>
                : <span className="status planned">Extra</span>}
            </div>
            <h3>{group.title}</h3>
            <p className="track-tagline">{group.duration ?? group.tagline}</p>
            <p>{group.description}</p>
            <div className="track-meta">
              <span>{group.modules.length} {group.modules.length === 1 ? "section" : "sections"}</span>
              <span>{group.modules.reduce((total, module) => total + module.lessons.length, 0)} topics</span>
              {lessonIds.length > 0 && <span>{completed}/{lessonIds.length} lessons done</span>}
            </div>
            {lessonIds.length > 0 && <div className="mini-progress" aria-label={`${pct}% complete`}><span style={{ width: `${pct}%` }} /></div>}
          </Link>
        );
      })}
    </div>
  );
}
