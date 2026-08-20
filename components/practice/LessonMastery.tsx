"use client";

import type { RenderedPracticeSet } from "@/lib/practice/types";
import { MasteryPanel } from "./MasteryPanel";
import { usePracticeReport } from "./useReport";

/**
 * The mastery panel in the lesson's context rail.
 *
 * A thin client wrapper so the lesson page can stay a server component: it holds the `useProgress`
 * subscription that the panel itself is deliberately free of, which keeps `MasteryPanel` a pure
 * presentation component reusable from the practice hub.
 */
export function LessonMastery({ set }: { set: RenderedPracticeSet }) {
  const { report, hydrated } = usePracticeReport(set);
  return (
    <div className="context-section context-mastery">
      <MasteryPanel report={report} hydrated={hydrated} />
    </div>
  );
}
