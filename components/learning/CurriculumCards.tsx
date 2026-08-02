"use client";
import Link from "next/link";
import type { Module } from "@/types/curriculum";
import { useProgress } from "@/components/progress/ProgressProvider";
import { percentage } from "@/lib/progress/progress";

export function CurriculumCards({ modules, compact = false }: { modules: Module[]; compact?: boolean }) {
  const { progress, hydrated } = useProgress();
  return <div className={compact ? "module-grid compact" : "module-grid"}>{modules.map((module) => { const completed = module.lessons.filter((lesson) => progress.completedLessons.includes(lesson.id)).length; const pct = hydrated ? percentage(completed, module.lessons.length) : 0; const status = module.status === "planned" ? "Planned" : pct === 100 ? "Completed" : pct > 0 ? "In progress" : "Not started"; return <article className={`module-card ${module.status}`} key={module.slug}><div className="module-card-top"><span>Module {String(module.number).padStart(2, "0")}</span><span className={`status ${module.status}`}>{status}</span></div><h2><Link href={`/learn/${module.slug}`}>{module.title}</Link></h2><p>{module.description}</p><div className="module-meta"><span>{module.lessons.length} lessons</span><span>{Math.round(module.estimatedMinutes / 60)} hours</span>{module.status === "available" && <span>{completed}/{module.lessons.length} complete</span>}</div>{module.status === "available" && <div className="mini-progress" aria-label={`${pct}% complete`}><span style={{ width: `${pct}%` }} /></div>}</article>; })}</div>;
}
