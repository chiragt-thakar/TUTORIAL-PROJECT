"use client";

import { useState } from "react";
import { useProgress } from "@/components/progress/ProgressProvider";
import type { RenderedInterviewQuestion } from "@/lib/practice/types";
import { CodePanel } from "./CodePanel";
import { RichText, RichLine } from "./RichText";

const LEVEL_LABEL: Record<string, string> = {
  basic: "Basic",
  intermediate: "Intermediate",
  advanced: "Advanced",
  tricky: "Tricky",
  scenario: "Scenario",
  debugging: "Debugging",
  output: "Code output",
  internals: "Internals",
  comparison: "Comparison",
};

/**
 * One interview question, answered in two layers.
 *
 * The short answer is what you actually say in the room — a few sentences, no preamble. The full
 * answer is the model underneath it, which is what the follow-ups are testing for. They are
 * separate reveals because rehearsing the paragraph you would really say is a different exercise
 * from understanding the topic, and interviews are lost by people who only did the second one.
 *
 * "Reviewed" means worked through out loud, not read.
 */
export function InterviewCard({ question, lessonId }: { question: RenderedInterviewQuestion; lessonId: string }) {
  const { progress, hydrated, toggleInterviewReviewed, touchLesson } = useProgress();
  const [shown, setShown] = useState(false);
  const reviewed = hydrated && progress.reviewedInterview.includes(question.id);

  function markReviewed() {
    toggleInterviewReviewed(question.id);
    touchLesson(lessonId);
  }

  return (
    <article className={`interview-card${reviewed ? " is-done" : ""}`} id={question.id}>
      <header className="practice-card-head">
        <div className="practice-badges">
          <span className="level-badge">{LEVEL_LABEL[question.level] ?? question.level}</span>
          {question.requiredForMastery ? <span className="required-badge">Required for mastery</span> : null}
        </div>
        <label className="practice-done">
          <input type="checkbox" checked={reviewed} onChange={markReviewed} /> Answered out loud
        </label>
      </header>

      <p className="interview-question">
        <RichLine text={question.question} />
      </p>
      {question.code ? <CodePanel code={question.code} /> : null}

      {shown ? (
        <div className="interview-answer">
          <div className="interview-short">
            <p className="practice-label">Say this</p>
            <RichText text={question.shortAnswer} />
          </div>

          <p className="practice-label">The model underneath it</p>
          <RichText text={question.fullAnswer} />

          {question.commonWrongAnswer ? (
            <div className="interview-wrong">
              <p className="practice-label">The answer that loses the point</p>
              <RichText text={question.commonWrongAnswer} />
            </div>
          ) : null}

          {question.followUps.length > 0 ? (
            <div className="interview-followups">
              <p className="practice-label">They will follow up with</p>
              <ul>
                {question.followUps.map((followUp) => (
                  <li key={followUp}>
                    <RichLine text={followUp} />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : (
        <button type="button" className="button secondary" onClick={() => setShown(true)}>
          Answer it first, then reveal
        </button>
      )}
    </article>
  );
}
