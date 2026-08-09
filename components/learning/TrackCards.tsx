"use client";
import Link from "next/link";
import type { Module, Track } from "@/types/curriculum";
import { useProgress } from "@/components/progress/ProgressProvider";
import { percentage } from "@/lib/progress/progress";
import { trackIcon } from "@/lib/curriculum/trackMeta";

export function TrackCards({ tracks, modules }: { tracks: Track[]; modules: Module[] }) {
  const { progress, hydrated } = useProgress();
  return <div className="track-grid">{tracks.map((track, index) => {
    const trackModules = modules.filter((module) => module.track === track.slug);
    const available = trackModules.filter((module) => module.status === "available");
    const lessonIds = available.flatMap((module) => module.lessons.map((lesson) => lesson.id));
    const completed = lessonIds.filter((id) => progress.completedLessons.includes(id)).length;
    const pct = hydrated ? percentage(completed, lessonIds.length) : 0;
    return <Link className={`track-card ${track.status}`} href={`/tracks/${track.slug}`} key={track.slug} style={{ "--stagger": index } as React.CSSProperties}>
      <div className="track-card-top"><span className="track-icon" aria-hidden="true">{trackIcon[track.slug] ?? "📘"}</span><span className={`status ${track.status}`}>{track.status === "planned" ? "Coming next" : "Available"}</span></div>
      <h3>{track.title}</h3>
      <p className="track-tagline">{track.tagline}</p>
      <p>{track.description}</p>
      <div className="track-meta"><span>{trackModules.length} modules</span>{track.status === "available" && <span>{completed}/{lessonIds.length} lessons done</span>}</div>
      {track.status === "available" && lessonIds.length > 0 && <div className="mini-progress" aria-label={`${pct}% complete`}><span style={{ width: `${pct}%` }} /></div>}
    </Link>;
  })}</div>;
}
