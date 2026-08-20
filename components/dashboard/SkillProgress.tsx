"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import type { CurriculumGroup, Module } from "@/types/curriculum";
import { useProgress } from "@/components/progress/ProgressProvider";
import { percentage } from "@/lib/progress/progress";
import { groupIcon } from "@/lib/curriculum/trackMeta";
import { buildGroups } from "@/lib/curriculum/groups";

const SEGMENTS = 10;

export function SkillProgress({ groups, modules }: { groups: CurriculumGroup[]; modules: Module[] }) {
  const { progress, hydrated } = useProgress();
  const built = buildGroups(groups, modules);
  return (
    <div className="skill-progress">
      <p className="eyebrow">SKILL PROGRESS</p>
      <ul className="skill-list">
        {built.map((track) => {
          const trackModules = track.modules.filter((module) => module.status === "available");
          const lessonIds = trackModules.flatMap((module) => module.lessons.map((lesson) => lesson.id));
          const completed = lessonIds.filter((id) => progress.completedLessons.includes(id)).length;
          const pct = hydrated ? percentage(completed, lessonIds.length) : 0;
          const filledSegments = Math.round((pct / 100) * SEGMENTS);
          return (
            <li key={track.slug}>
              <Link href={`/paths/${track.slug}`} className="skill-row">
                <span className="skill-icon" aria-hidden="true">{groupIcon[track.slug] ?? "◆"}</span>
                <span className="skill-name">{track.title}</span>
                <span className="skill-pct">{lessonIds.length > 0 ? `${pct}%` : "—"}</span>
              </Link>
              <div className="skill-segments" aria-hidden="true">
                {Array.from({ length: SEGMENTS }, (_, index) => (
                  <motion.span
                    key={index}
                    className={index < filledSegments ? "filled" : ""}
                    initial={{ scaleY: 0.3, opacity: 0.4 }}
                    animate={{ scaleY: 1, opacity: index < filledSegments ? 1 : 0.35 }}
                    transition={{ duration: 0.3, delay: index * 0.02 }}
                  />
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
