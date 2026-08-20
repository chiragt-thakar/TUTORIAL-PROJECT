"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useProgress } from "@/components/progress/ProgressProvider";
import { ProgressRing } from "@/components/progress/ProgressRing";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { TopicPassControl } from "./TopicPassControl";
import { Inline } from "./inline";
import { MAX_PASS, PASS_LABEL } from "@/lib/progress/progress";
import { currentPhase, phaseProgress, type PhaseModuleRef, type PhaseSummary } from "@/lib/curriculum/phases";

/**
 * The working surface for the roadmap: phases as the top-level unit, the current phase
 * spotlit, and every topic advanceable through the 3-pass rule in place. The verbatim
 * document lives at /roadmap/mastery/source — this page is for doing the work, not reading it.
 */

function ModuleLink({ module: courseModule }: { module: PhaseModuleRef }) {
  return (
    <Link
      href={`/learn/${courseModule.slug}`}
      className={`ph-module${courseModule.status === "planned" ? " is-planned" : ""}`}
    >
      <span className="ph-module-title">{courseModule.title}</span>
      <span className="ph-module-status">{courseModule.status === "available" ? "Available" : "Outline"}</span>
    </Link>
  );
}

export function PhaseHub({ phases, topicCount, complete }: { phases: PhaseSummary[]; topicCount: number; complete: boolean }) {
  const { progress, hydrated, cycleTopicPass, toggleProofGate } = useProgress();
  const [selected, setSelected] = useState<number | null>(null);

  const allProgress = useMemo(
    () => phases.map((phase) => phaseProgress(phase, progress.topicPasses, progress.completedLessons, progress.proofGates)),
    [phases, progress.topicPasses, progress.completedLessons, progress.proofGates],
  );
  const active = currentPhase(allProgress);
  const openNumber = selected ?? active?.phase.number ?? phases[0]?.number ?? 0;
  const open = allProgress.find((entry) => entry.phase.number === openNumber) ?? allProgress[0];

  const totalDone = hydrated
    ? Object.entries(progress.topicPasses).filter(([id, pass]) => id.startsWith("roadmap:") && pass >= MAX_PASS).length
    : 0;
  const overallPercent = topicCount === 0 ? 0 : Math.round((totalDone / topicCount) * 100);

  // The next thing to actually do: first topic in the current phase that isn't at pass 3 yet.
  const findNextTopic = () => {
    if (!active) return null;
    for (const group of active.phase.groups) {
      for (const topic of group.topics) {
        const pass = progress.topicPasses[topic.id] ?? 0;
        if (pass < MAX_PASS) return { topic, pass, group };
      }
    }
    return null;
  };
  const nextTopic = findNextTopic();

  return (
    <div className="ph">
      <header className="ph-header">
        <div className="ph-header-text">
          <p className="eyebrow">MASTERY ROADMAP</p>
          <h1>Your phases, in order.</h1>
          <p className="ph-lede">
            Eleven phases, <strong>{topicCount}</strong> topics, each tracked through the roadmap&rsquo;s own 3-pass
            rule — intuition, derived on paper, implemented from scratch. Nothing is gated; the order is a
            recommendation, not a lock.
          </p>
          <p className="ph-links">
            <Link href="/roadmap/mastery/source">Read the source document →</Link>
            <Link href="/roadmap">Skill tree →</Link>
          </p>
        </div>
        <div className="ph-header-stat">
          <ProgressRing percent={hydrated ? overallPercent : 0} caption="of roadmap" size={116} strokeWidth={8} />
          <p>
            <strong>
              <AnimatedNumber value={hydrated ? totalDone : 0} /> / {topicCount}
            </strong>
            <span>topics at pass 3</span>
          </p>
        </div>
      </header>

      {!complete ? (
        <p className="ph-incomplete">
          The source document is <strong>incomplete</strong> — it was truncated partway through section 10.3. Phase 10
          is missing its tail until the rest is pasted into <code>content/roadmap/AI_ML_MASTERY_ROADMAP.md</code>.
        </p>
      ) : null}

      {active ? (
        <section className="ph-spotlight">
          <div className="ph-spotlight-head">
            <div>
              <p className="eyebrow">YOU ARE HERE</p>
              <h2>
                <span className="ph-spotlight-number">Phase {active.phase.number}</span>
                {active.phase.title}
              </h2>
              <p className="ph-spotlight-meta">
                <span className={`rm-tag${active.phase.tag.includes("CORE") ? " is-core" : ""}`}>{active.phase.tag}</span>
                <span className="rm-duration">{active.phase.duration}</span>
                <span className="rm-duration">
                  {active.topicsDone}/{active.topicsTotal} topics
                </span>
              </p>
            </div>
            <ProgressRing percent={hydrated ? active.percent : 0} caption="phase" size={88} strokeWidth={7} />
          </div>

          {nextTopic ? (
            <div className="ph-next">
              <p className="ph-next-label">NEXT UP · {nextTopic.group.number ?? ""} {nextTopic.group.title}</p>
              <div className="ph-next-topic">
                <TopicPassControl
                  pass={hydrated ? nextTopic.pass : 0}
                  onCycle={() => cycleTopicPass(nextTopic.topic.id)}
                  label={nextTopic.topic.text}
                />
                <span>
                  <Inline text={nextTopic.topic.text} />
                </span>
              </div>
              <p className="ph-next-hint">
                {nextTopic.pass === 0
                  ? "Pass 1 — read or watch for intuition. Confusion is allowed."
                  : `Pass ${nextTopic.pass} done (${PASS_LABEL[nextTopic.pass]}). Next: ${PASS_LABEL[nextTopic.pass + 1]}.`}
              </p>
            </div>
          ) : null}

          {active.phase.modules.length > 0 ? (
            <div className="ph-spotlight-modules">
              <p className="ph-modules-label">Modules on this site for this phase</p>
              <div className="ph-modules">
                {active.phase.modules.map((entry) => (
                  <ModuleLink key={entry.slug} module={entry} />
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="ph-timeline" aria-label="All phases">
        {allProgress.map((entry) => {
          const isOpen = entry.phase.number === openNumber;
          const isActive = active?.phase.number === entry.phase.number;
          return (
            <button
              type="button"
              key={entry.phase.id}
              className={`ph-pill${isOpen ? " is-open" : ""}${isActive ? " is-active" : ""}${entry.complete ? " is-complete" : ""}`}
              onClick={() => setSelected(entry.phase.number)}
              aria-pressed={isOpen}
            >
              <span className="ph-pill-number">P{entry.phase.number}</span>
              <span className="ph-pill-title">{entry.phase.title}</span>
              <span className="ph-pill-bar" aria-hidden="true">
                <span style={{ width: `${hydrated ? entry.percent : 0}%` }} />
              </span>
              <span className="ph-pill-pct">{hydrated ? `${entry.percent}%` : "—"}</span>
            </button>
          );
        })}
      </section>

      <AnimatePresence mode="wait">
        {open ? (
          <motion.section
            key={open.phase.id}
            className="ph-detail"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <header className="ph-detail-head">
              <h2>
                <span className="ph-spotlight-number">Phase {open.phase.number}</span>
                {open.phase.title}
              </h2>
              <p className="ph-spotlight-meta">
                <span className={`rm-tag${open.phase.tag.includes("CORE") ? " is-core" : ""}`}>{open.phase.tag}</span>
                <span className="rm-duration">{open.phase.duration}</span>
              </p>
              {open.phase.blurb ? (
                <p className="ph-detail-blurb">
                  <Inline text={open.phase.blurb} />
                </p>
              ) : null}
            </header>

            {open.phase.groups.map((group) => (
              <section className="ph-group" key={group.id}>
                <h3>
                  {group.number ? <span className="rm-group-number">{group.number}</span> : null}
                  <Inline text={group.title} />
                  {group.topics.length > 0 ? (
                    <span className="ph-group-count">
                      {group.topics.filter((topic) => (progress.topicPasses[topic.id] ?? 0) >= MAX_PASS).length}/
                      {group.topics.length}
                    </span>
                  ) : null}
                </h3>
                {group.topics.length > 0 ? (
                  <ul className="ph-topics">
                    {group.topics.map((topic) => {
                      const pass = hydrated ? progress.topicPasses[topic.id] ?? 0 : 0;
                      return (
                        <li key={topic.id} className={pass >= MAX_PASS ? "is-done" : ""}>
                          <TopicPassControl pass={pass} onCycle={() => cycleTopicPass(topic.id)} label={topic.text} />
                          <span>
                            <Inline text={topic.text} />
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
                {group.modules.length > 0 ? (
                  <div className="ph-modules">
                    {group.modules.map((entry) => (
                      <ModuleLink key={entry.slug} module={entry} />
                    ))}
                  </div>
                ) : null}
              </section>
            ))}

            {open.phase.proofGateId ? (
              <aside className={`ph-gate${open.gateCleared ? " is-cleared" : ""}`}>
                <label>
                  <input
                    type="checkbox"
                    checked={hydrated && open.gateCleared}
                    onChange={() => toggleProofGate(open.phase.proofGateId as string)}
                  />
                  <span>
                    <strong>Proof Gate — the real checkbox.</strong>{" "}
                    <Inline text={open.phase.proofGateText} />
                  </span>
                </label>
              </aside>
            ) : null}
          </motion.section>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
