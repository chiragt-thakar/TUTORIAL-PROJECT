"use client";

import { STAGE_LABEL, STATUS_LABEL, type MasteryReport } from "@/lib/practice/mastery";

/**
 * Where this topic stands, and what is still in the way.
 *
 * The blocking list matters more than the percentage: "Mastered" is the goal, but "Interview
 * (0/4)" is the instruction. A stage the topic has no work for is not shown at all rather than
 * shown as complete — see `computeMastery` on inapplicable stages.
 */
export function MasteryPanel({ report, hydrated }: { report: MasteryReport; hydrated: boolean }) {
  const stages = report.stages.filter((stage) => stage.applicable);

  return (
    <section className={`mastery-panel status-${hydrated ? report.status : "not-started"}`}>
      <header className="mastery-head">
        <div>
          <p className="practice-label">Topic status</p>
          <strong className="mastery-status">{hydrated ? STATUS_LABEL[report.status] : "…"}</strong>
        </div>
        <div className="mastery-percent">
          <strong>{hydrated ? report.percent : 0}%</strong>
          <small>of this topic&rsquo;s work done</small>
        </div>
      </header>

      <ol className="mastery-stages">
        {stages.map((stage) => (
          <li key={stage.stage} className={stage.complete ? "is-complete" : undefined}>
            <span className="mastery-stage-name">{STAGE_LABEL[stage.stage]}</span>
            <span className="mastery-stage-bar">
              <span style={{ width: `${Math.round((stage.done / stage.total) * 100)}%` }} />
            </span>
            <span className="mastery-stage-count">
              {stage.done}/{stage.total}
            </span>
          </li>
        ))}
      </ol>

      {hydrated && report.blocking.length > 0 ? (
        <p className="mastery-blocking">
          <span className="practice-label">Still to do</span>
          {report.blocking.join(" · ")}
        </p>
      ) : null}

      {hydrated && report.status === "needs-review" ? (
        <p className="mastery-stale">
          Last practised {report.daysSinceActivity} days ago. Run the revision questions before you count this as known.
        </p>
      ) : null}

      {hydrated && report.assessmentScore !== null ? (
        <p className="mastery-score">
          Best assessment score: <strong>{report.assessmentScore}%</strong>
        </p>
      ) : null}
    </section>
  );
}
