"use client";

import { useEffect, useState } from "react";
import type { RenderedPracticeSet } from "@/lib/practice/types";
import { ExerciseCard } from "./ExerciseCard";
import { InterviewCard } from "./InterviewCard";
import { MasteryPanel } from "./MasteryPanel";
import { ProjectPanel } from "./ProjectPanel";
import { QuizRunner } from "./QuizRunner";
import { ResourceList } from "./ResourceList";
import { RevisionDrill } from "./RevisionDrill";
import { usePracticeReport } from "./useReport";

/**
 * The lesson's modes.
 *
 * One route, seven panels — not seven routes. Splitting them would fragment a single topic across
 * URLs the learner has to navigate between mid-thought, and under `output: "export"` each one
 * would also be a separate static page loading the same content again.
 *
 * The Learn panel stays mounted and is hidden with CSS rather than unmounted, so the lesson's
 * table of contents anchors and the reading-progress bar keep working while the learner is in
 * another mode. Everything else mounts lazily, so a quiz in progress is not silently reset by a
 * detour into the interview questions.
 */

const MODES = ["learn", "practice", "debug", "interview", "test", "project", "review"] as const;
type Mode = (typeof MODES)[number];

const MODE_LABEL: Record<Mode, string> = {
  learn: "Learn",
  practice: "Practice",
  debug: "Debug",
  interview: "Interview",
  test: "Test",
  project: "Project",
  review: "Review",
};

const DEBUG_KINDS = new Set(["debug", "code-reading"]);
const TIER_ORDER = ["normal", "intermediate", "tricky", "challenge"] as const;
const TIER_HEADING: Record<string, string> = {
  normal: "Normal — does the concept stick?",
  intermediate: "Intermediate — combine it with something else",
  tricky: "Tricky — Python-specific behaviour and edge cases",
  challenge: "Challenge — design the solution yourself",
};

function isMode(value: string): value is Mode {
  return (MODES as readonly string[]).includes(value);
}

export function Workbench({ set, children }: { set: RenderedPracticeSet; children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>("learn");
  const { report, hydrated } = usePracticeReport(set);

  // Deep links use the hash (`#practice`), not a query param: `useSearchParams` would force this
  // whole subtree behind a Suspense boundary under static export, for no gain.
  useEffect(() => {
    function fromHash() {
      const value = window.location.hash.replace("#", "");
      if (isMode(value)) setMode(value);
    }
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  function choose(next: Mode) {
    setMode(next);
    history.replaceState(null, "", next === "learn" ? window.location.pathname : `#${next}`);
  }

  const practice = set.exercises.filter((exercise) => !DEBUG_KINDS.has(exercise.kind));
  const debugging = set.exercises.filter((exercise) => DEBUG_KINDS.has(exercise.kind));
  const checkpoints = set.quizzes.filter((quiz) => quiz.kind === "checkpoint");
  const assessment = set.quizzes.find((quiz) => quiz.kind === "assessment");
  const builds = set.projects.filter((project) => project.kind !== "final-challenge");
  const finals = set.projects.filter((project) => project.kind === "final-challenge");

  const counts: Record<Mode, number> = {
    learn: 0,
    practice: practice.length,
    debug: debugging.length,
    interview: set.interview.length,
    test: assessment ? assessment.questions.length : 0,
    project: set.projects.length,
    review: 0,
  };

  return (
    <div className="workbench">
      <nav className="mode-tabs" aria-label="Study mode">
        {MODES.map((item) => (
          <button
            key={item}
            type="button"
            className={`mode-tab${mode === item ? " is-on" : ""}`}
            aria-current={mode === item ? "page" : undefined}
            onClick={() => choose(item)}
          >
            {MODE_LABEL[item]}
            {counts[item] > 0 ? <span className="mode-count">{counts[item]}</span> : null}
          </button>
        ))}
      </nav>

      <div className={mode === "learn" ? "mode-panel" : "mode-panel is-hidden"} aria-hidden={mode !== "learn"}>
        {children}
        {set.resources.length > 0 ? (
          <section className="practice-section">
            <div className="section-heading">
              <div>
                <p className="practice-label">Go deeper</p>
                <h2>Free resources worth your time</h2>
              </div>
            </div>
            <ResourceList resources={set.resources} />
          </section>
        ) : null}
      </div>

      {mode === "practice" ? (
        <div className="mode-panel practice-mode">
          <p className="mode-intro">
            Write the code before you read the solution. Every hint you take is fine; every solution you open before
            trying is not.
          </p>
          {TIER_ORDER.map((tier) => {
            const items = practice.filter((exercise) => exercise.tier === tier);
            if (items.length === 0) return null;
            return (
              <section className="practice-section" key={tier}>
                <h2 className="tier-heading">{TIER_HEADING[tier]}</h2>
                {items.map((exercise) => (
                  <ExerciseCard key={exercise.id} exercise={exercise} lessonId={set.lessonId} />
                ))}
              </section>
            );
          })}
          {checkpoints.map((quiz) => (
            <QuizRunner key={quiz.id} quiz={quiz} lessonId={set.lessonId} />
          ))}
        </div>
      ) : null}

      {mode === "debug" ? (
        <div className="mode-panel">
          <p className="mode-intro">
            Broken code and unfamiliar code. For each one: what does it do, what goes wrong, why does Python behave that
            way, and what is the smallest correct fix?
          </p>
          {debugging.length === 0 ? (
            <p className="practice-empty">No debugging exercises for this topic yet.</p>
          ) : (
            debugging.map((exercise) => <ExerciseCard key={exercise.id} exercise={exercise} lessonId={set.lessonId} />)
          )}
        </div>
      ) : null}

      {mode === "interview" ? (
        <div className="mode-panel">
          <p className="mode-intro">
            Answer each one out loud, in full sentences, before revealing anything. If you cannot say it, you do not know
            it yet.
          </p>
          {set.interview.length === 0 ? (
            <p className="practice-empty">No interview questions for this topic yet.</p>
          ) : (
            set.interview.map((question) => (
              <InterviewCard key={question.id} question={question} lessonId={set.lessonId} />
            ))
          )}
        </div>
      ) : null}

      {mode === "test" ? (
        <div className="mode-panel">
          {assessment ? (
            <>
              <p className="mode-intro">
                Closed book. Nothing is graded until you submit, and only your best score counts toward mastery.
              </p>
              <QuizRunner quiz={assessment} lessonId={set.lessonId} />
            </>
          ) : (
            <p className="practice-empty">No assessment for this topic yet.</p>
          )}
        </div>
      ) : null}

      {mode === "project" ? (
        <div className="mode-panel">
          {set.projects.length === 0 ? (
            <p className="practice-empty">This topic has no project of its own — it is covered by a later combined one.</p>
          ) : (
            <>
              {builds.map((project) => (
                <ProjectPanel key={project.id} project={project} lessonId={set.lessonId} />
              ))}
              {finals.length > 0 ? (
                <section className="practice-section">
                  <h2 className="tier-heading">Final challenge — everything in this topic at once</h2>
                  {finals.map((project) => (
                    <ProjectPanel key={project.id} project={project} lessonId={set.lessonId} />
                  ))}
                </section>
              ) : null}
            </>
          )}
        </div>
      ) : null}

      {mode === "review" ? (
        <div className="mode-panel">
          <MasteryPanel report={report} hydrated={hydrated} />
          <RevisionDrill set={set} />
          {set.resources.length > 0 ? (
            <section className="practice-section">
              <h2 className="tier-heading">Resources</h2>
              <ResourceList resources={set.resources} />
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
