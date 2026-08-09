"use client";
import Link from "next/link";
import type { Module } from "@/types/curriculum";
import { useProgress } from "@/components/progress/ProgressProvider";
import { ProgressRing } from "@/components/progress/ProgressRing";
import { nextIncompleteLesson, percentage } from "@/lib/progress/progress";

interface FlatLesson { id: string; slug: string; title: string; order: number; module: Module }

export function ResumeCard({ modules }: { modules: Module[] }) {
  const { progress, hydrated } = useProgress();
  const available = modules.filter((module) => module.status === "available");
  const flat: FlatLesson[] = available.flatMap((module) => module.lessons.map((lesson) => ({ id: lesson.id, slug: lesson.slug, title: lesson.title, order: lesson.order, module })));
  if (flat.length === 0) return null;

  const completedCount = flat.filter((lesson) => progress.completedLessons.includes(lesson.id)).length;
  const overallPct = hydrated ? percentage(completedCount, flat.length) : 0;
  const targetId = nextIncompleteLesson(flat.map((lesson) => lesson.id), progress.completedLessons, progress.lastVisitedLesson);
  const target = flat.find((lesson) => lesson.id === targetId) ?? flat[0];
  const isFresh = !hydrated || !progress.lastVisitedLesson;

  return (
    <div className="resume-card">
      <ProgressRing percent={overallPct} caption="overall" size={84} strokeWidth={6} />
      <div className="resume-body">
        <p className="eyebrow">{isFresh ? "START HERE" : "CONTINUE WHERE YOU LEFT OFF"}</p>
        <h2>{target.title}</h2>
        <p className="resume-module">{target.module.title}</p>
        <Link className="button primary" href={`/learn/${target.module.slug}/${target.slug}`}>
          {isFresh ? "Start learning" : "Jump back in"} <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}
