"use client";

import Link from "next/link";
import { useEffect } from "react";
import { nextIncompleteLesson, percentage } from "@/lib/progress/progress";
import { useProgress } from "./ProgressProvider";

export function ProgressBar({ completed, total, label }: { completed: number; total: number; label: string }) {
  const value = percentage(completed, total);
  return <div className="progress-wrap"><div className="progress-copy"><span>{label}</span><span>{value}%</span></div><div className="progress-track" aria-label={`${label}: ${value}%`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}><span style={{ width: `${value}%` }} /></div></div>;
}

export function OverallProgress({ lessonIds }: { lessonIds: string[] }) {
  const { progress, hydrated } = useProgress();
  const completed = lessonIds.filter((id) => progress.completedLessons.includes(id)).length;
  return <ProgressBar completed={hydrated ? completed : 0} total={lessonIds.length} label={`${hydrated ? completed : 0} of ${lessonIds.length} lessons`} />;
}

export function ContinueLearning({ lessons }: { lessons: Array<{ id: string; href: string }> }) {
  const { progress, hydrated } = useProgress();
  const id = nextIncompleteLesson(lessons.map((lesson) => lesson.id), progress.completedLessons, progress.lastVisitedLesson);
  const href = lessons.find((lesson) => lesson.id === id)?.href ?? lessons[0]?.href ?? "/learn";
  return <Link className="button primary" href={href}>{hydrated && progress.lastVisitedLesson ? "Continue learning" : "Start learning"}<span aria-hidden="true">→</span></Link>;
}

export function LessonProgress({ lessonId, moduleLessonIds }: { lessonId: string; moduleLessonIds: string[] }) {
  const { progress, hydrated, toggleLesson, visitLesson } = useProgress();
  useEffect(() => { visitLesson(lessonId); }, [lessonId, visitLesson]);
  const done = hydrated && progress.completedLessons.includes(lessonId);
  const completed = moduleLessonIds.filter((id) => progress.completedLessons.includes(id)).length;
  return <div className="lesson-progress"><ProgressBar completed={hydrated ? completed : 0} total={moduleLessonIds.length} label="Module progress" /><button className={`button ${done ? "completed" : "primary"}`} type="button" onClick={() => toggleLesson(lessonId)}>{done ? "✓ Lesson completed" : "Mark lesson complete"}</button></div>;
}

export function ResetProgress() {
  const { reset } = useProgress();
  return <button className="text-button" type="button" onClick={() => { if (window.confirm("Reset all lesson, exercise, and assignment progress on this device?")) reset(); }}>Reset progress</button>;
}
