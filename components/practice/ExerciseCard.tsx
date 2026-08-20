"use client";

import { useState } from "react";
import { useProgress } from "@/components/progress/ProgressProvider";
import type { RenderedExercise } from "@/lib/practice/types";
import { CodePanel } from "./CodePanel";
import { HintStack } from "./HintStack";
import { RichText } from "./RichText";
import { useDraft } from "./useDraft";

const TIER_LABEL: Record<string, string> = {
  normal: "Normal",
  intermediate: "Intermediate",
  tricky: "Tricky",
  challenge: "Challenge",
};

const KIND_LABEL: Record<string, string> = {
  "write-code": "Write code",
  "predict-output": "Predict the output",
  debug: "Find and fix the bug",
  refactor: "Refactor",
  "code-reading": "Read this code",
  explain: "Explain",
  design: "Design it yourself",
  performance: "Performance",
};

/**
 * One exercise, in the order the brief asked for:
 * question -> my attempt -> hints -> solution -> explanation.
 *
 * The solution stays shut until the learner opens it, and opening it is a separate, deliberate
 * click from taking a hint. Marking an exercise done is the learner's own call — there is no code
 * execution here to grade against, and a fake "correct!" would be worse than an honest checkbox.
 */
export function ExerciseCard({ exercise, lessonId }: { exercise: RenderedExercise; lessonId: string }) {
  const { progress, hydrated, toggleExercise, touchLesson } = useProgress();
  const [showSolution, setShowSolution] = useState(false);
  const { value: attempt, setValue: setAttempt } = useDraft(exercise.id);
  const done = hydrated && progress.completedExercises.includes(exercise.id);

  function markDone() {
    toggleExercise(exercise.id);
    touchLesson(lessonId);
  }

  return (
    <article className={`practice-card${done ? " is-done" : ""}`} id={exercise.id}>
      <header className="practice-card-head">
        <div className="practice-badges">
          <span className={`tier-badge tier-${exercise.tier}`}>{TIER_LABEL[exercise.tier] ?? exercise.tier}</span>
          <span className="kind-badge">{KIND_LABEL[exercise.kind] ?? exercise.kind}</span>
          <span className="practice-minutes">{exercise.minutes} min</span>
          {exercise.requiredForMastery ? <span className="required-badge">Required for mastery</span> : null}
        </div>
        <label className="practice-done">
          <input type="checkbox" checked={done} onChange={markDone} /> Solved
        </label>
      </header>

      <h3>{exercise.title}</h3>
      <RichText text={exercise.prompt} className="practice-prompt" />
      {exercise.code ? <CodePanel code={exercise.code} /> : null}

      <div className="attempt">
        <label htmlFor={`attempt-${exercise.id}`} className="practice-label">
          Your attempt
        </label>
        <p className="attempt-hint">
          Write the answer, or the reasoning, before you take a hint. Saved on this device only.
        </p>
        <textarea
          id={`attempt-${exercise.id}`}
          value={attempt}
          onChange={(event) => setAttempt(event.target.value)}
          rows={5}
          spellCheck={false}
          placeholder="Predict the output, sketch the function, or write down why you think this happens…"
        />
      </div>

      <HintStack hints={exercise.hints} />

      {showSolution ? (
        <div className="solution-reveal">
          <p className="practice-label">Solution</p>
          <RichText text={exercise.solution} />
          {exercise.solutionCode ? <CodePanel code={exercise.solutionCode} label="solution" /> : null}
          {exercise.explanation ? (
            <div className="solution-why">
              <p className="practice-label">Why</p>
              <RichText text={exercise.explanation} />
            </div>
          ) : null}
          <p className="concept-tags">
            {exercise.concepts.map((concept) => (
              <span key={concept}>{concept}</span>
            ))}
          </p>
        </div>
      ) : (
        <button type="button" className="button secondary" onClick={() => setShowSolution(true)}>
          Reveal solution
        </button>
      )}
    </article>
  );
}
