"use client";
import Link from "next/link";
import type { Module } from "@/types/curriculum";
import { useProgress } from "@/components/progress/ProgressProvider";
import { percentage } from "@/lib/progress/progress";
import { isRoadmapModule, navRef } from "@/lib/curriculum/groups";

/**
 * Module cards. Roadmap modules lead with the document's own section number ("1.2") and its
 * [CORE]/[TOOL] tag; extra modules say plainly that they are extra.
 */
export function CurriculumCards({ modules, compact = false }: { modules: Module[]; compact?: boolean }) {
  const { progress, hydrated } = useProgress();
  return (
    <div className={compact ? "module-grid compact" : "module-grid"}>
      {modules.map((courseModule) => {
        const completed = courseModule.lessons.filter((lesson) => progress.completedLessons.includes(lesson.id)).length;
        const pct = hydrated ? percentage(completed, courseModule.lessons.length) : 0;
        const onRoadmap = isRoadmapModule(courseModule);
        const status =
          courseModule.status === "planned"
            ? onRoadmap
              ? "Not written yet"
              : "Planned"
            : pct === 100
              ? "Completed"
              : pct > 0
                ? "In progress"
                : "Not started";
        return (
          <article className={`module-card ${courseModule.status}`} key={courseModule.slug}>
            <div className="module-card-top">
              <span>
                {onRoadmap ? (
                  <>
                    <span className="card-m-tag">{navRef(courseModule)}</span>
                    {courseModule.tag ?? "On the roadmap"}
                  </>
                ) : (
                  "Extra"
                )}
              </span>
              <span className={`status ${courseModule.status}`}>{status}</span>
            </div>
            <h2>
              <Link href={`/learn/${courseModule.slug}`}>{courseModule.title}</Link>
            </h2>
            <p>{courseModule.description}</p>
            <div className="module-meta">
              <span>
                {courseModule.lessons.length} {onRoadmap ? "topics" : "lessons"}
              </span>
              <span>{Math.round(courseModule.estimatedMinutes / 60)} hours</span>
              {courseModule.status === "available" && (
                <span>
                  {completed}/{courseModule.lessons.length} complete
                </span>
              )}
            </div>
            {courseModule.status === "available" && (
              <div className="mini-progress" aria-label={`${pct}% complete`}>
                <span style={{ width: `${pct}%` }} />
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
