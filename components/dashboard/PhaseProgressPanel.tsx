"use client";

import Link from "next/link";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { useProgress } from "@/components/progress/ProgressProvider";
import { currentPhase, phaseProgress, type PhaseSummary } from "@/lib/curriculum/phases";

/** Every roadmap phase at a glance, with the one you're on called out. */
export function PhaseProgressPanel({ phases }: { phases: PhaseSummary[] }) {
  const { progress, hydrated } = useProgress();
  const all = useMemo(
    () => phases.map((phase) => phaseProgress(phase, progress.topicPasses, progress.completedLessons, progress.proofGates)),
    [phases, progress.topicPasses, progress.completedLessons, progress.proofGates],
  );
  const active = currentPhase(all);

  return (
    <div className="phase-panel">
      <div className="phase-panel-head">
        <p className="eyebrow">ROADMAP PHASES</p>
        <Link className="inline-link" href="/roadmap/mastery">
          Open the hub <span aria-hidden="true">→</span>
        </Link>
      </div>
      <ol className="phase-panel-list">
        {all.map((entry, index) => (
          <li
            key={entry.phase.id}
            className={`${entry.complete ? "is-complete " : ""}${active?.phase.number === entry.phase.number ? "is-active" : ""}`}
          >
            <Link href={`/roadmap/mastery#${entry.phase.id}`}>
              <span className="phase-panel-num">P{entry.phase.number}</span>
              <span className="phase-panel-title">{entry.phase.title}</span>
              <span className="phase-panel-bar" aria-hidden="true">
                <motion.span
                  initial={{ width: 0 }}
                  animate={{ width: `${hydrated ? entry.percent : 0}%` }}
                  transition={{ duration: 0.6, delay: index * 0.03, ease: [0.16, 1, 0.3, 1] }}
                />
              </span>
              <span className="phase-panel-pct">{hydrated ? `${entry.percent}%` : "—"}</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
