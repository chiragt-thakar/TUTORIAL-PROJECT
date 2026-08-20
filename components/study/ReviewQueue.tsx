"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useProgress } from "@/components/progress/ProgressProvider";
import { Inline } from "@/components/roadmap/inline";
import { reviewQueue } from "@/lib/progress/progress";
import type { PhaseSummary } from "@/lib/curriculum/phases";

/**
 * The roadmap's Sunday ritual, made concrete: "re-derive something from three weeks ago,
 * from memory, on paper." Surfaces the topics whose last pass is oldest.
 */
export function ReviewQueue({ phases }: { phases: PhaseSummary[] }) {
  const { progress, hydrated } = useProgress();

  const textById = useMemo(() => {
    const map = new Map<string, string>();
    for (const phase of phases) for (const group of phase.groups) for (const topic of group.topics) map.set(topic.id, topic.text);
    return map;
  }, [phases]);

  const items = hydrated ? reviewQueue(progress.topicDates).filter((item) => textById.has(item.id)) : [];

  return (
    <div className="review-queue">
      <div className="review-queue-head">
        <p className="eyebrow">REVIEW QUEUE</p>
        <span className="review-queue-rule">3+ weeks old · re-derive from memory</span>
      </div>
      {items.length === 0 ? (
        <p className="review-empty">
          {hydrated
            ? "Nothing is due yet. Topics reappear here three weeks after you last advanced them — that gap is the point."
            : "Loading…"}
        </p>
      ) : (
        <ul className="review-list">
          {items.map((item) => (
            <li key={item.id}>
              <span className="review-age">{item.daysAgo}d</span>
              <span className="review-text">
                <Inline text={textById.get(item.id) ?? item.id} />
              </span>
            </li>
          ))}
        </ul>
      )}
      <Link className="inline-link" href="/roadmap/mastery">
        Open the roadmap <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}
