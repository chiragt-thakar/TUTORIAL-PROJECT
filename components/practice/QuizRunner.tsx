"use client";

import { useMemo, useState } from "react";
import { useProgress } from "@/components/progress/ProgressProvider";
import { isChoiceCorrect, scoreQuiz } from "@/lib/practice/mastery";
import type { RenderedQuiz, RenderedQuizQuestion } from "@/lib/practice/types";
import { CodePanel } from "./CodePanel";
import { RichText, RichLine } from "./RichText";

/**
 * Test mode.
 *
 * Nothing is graded until the whole quiz is submitted — no per-question "correct!" as you go,
 * because that turns a test into a guessing game with feedback. Choice questions grade
 * themselves; open questions ("explain", "write a function", "refactor this") are marked by the
 * learner against a model answer, and the score is only recorded once every one of them has been
 * marked. Self-marking is the only honest option without executing code, and the model answers
 * are written to make an unearned tick obvious.
 *
 * Multi-select is all-or-nothing (see `isChoiceCorrect`): partial credit rewards selecting
 * everything.
 */

type Phase = "taking" | "review" | "recorded";
type SelfMark = "right" | "wrong";

function isChoice(question: RenderedQuizQuestion): boolean {
  return question.options !== undefined;
}

export function QuizRunner({ quiz, lessonId }: { quiz: RenderedQuiz; lessonId: string }) {
  const { progress, hydrated, recordQuizScore, touchLesson } = useProgress();
  const [phase, setPhase] = useState<Phase>("taking");
  const [choices, setChoices] = useState<Record<string, string[]>>({});
  const [written, setWritten] = useState<Record<string, string>>({});
  const [marks, setMarks] = useState<Record<string, SelfMark>>({});

  const openQuestions = useMemo(() => quiz.questions.filter((question) => !isChoice(question)), [quiz.questions]);
  const possible = quiz.questions.reduce((sum, question) => sum + question.points, 0);
  const best = hydrated ? progress.quizScores[quiz.id] : undefined;

  const earned = quiz.questions.reduce((sum, question) => {
    if (isChoice(question)) return sum + (isChoiceCorrect(question.answer, choices[question.id] ?? []) ? question.points : 0);
    return sum + (marks[question.id] === "right" ? question.points : 0);
  }, 0);
  const percent = scoreQuiz(earned, possible);

  const answeredAll = quiz.questions.every((question) =>
    isChoice(question) ? (choices[question.id] ?? []).length > 0 : (written[question.id] ?? "").trim().length > 0,
  );
  const markedAll = openQuestions.every((question) => marks[question.id] !== undefined);

  function pick(question: RenderedQuizQuestion, optionId: string) {
    setChoices((current) => {
      const selected = current[question.id] ?? [];
      if (question.kind === "multi") {
        return { ...current, [question.id]: selected.includes(optionId) ? selected.filter((id) => id !== optionId) : [...selected, optionId] };
      }
      return { ...current, [question.id]: [optionId] };
    });
  }

  function reset() {
    setPhase("taking");
    setChoices({});
    setWritten({});
    setMarks({});
  }

  function record() {
    recordQuizScore(quiz.id, percent);
    touchLesson(lessonId);
    setPhase("recorded");
  }

  const passed = percent >= quiz.passScore;

  return (
    <section className="quiz">
      <header className="quiz-head">
        <div>
          <p className="practice-label">{quiz.kind === "assessment" ? "Assessment" : "Checkpoint"}</p>
          <h3>{quiz.title}</h3>
          <p className="quiz-meta">
            {quiz.questions.length} questions · {possible} points · pass mark {quiz.passScore}%
          </p>
        </div>
        {best ? (
          <p className={`quiz-best${best.best >= quiz.passScore ? " is-pass" : ""}`}>
            <strong>{best.best}%</strong>
            <small>
              best of {best.attempts} attempt{best.attempts === 1 ? "" : "s"}
            </small>
          </p>
        ) : null}
      </header>

      <ol className="quiz-questions">
        {quiz.questions.map((question, index) => {
          const selected = choices[question.id] ?? [];
          const graded = phase !== "taking";
          const correct = isChoice(question) && isChoiceCorrect(question.answer, selected);
          return (
            <li key={question.id} className={graded && isChoice(question) ? (correct ? "is-right" : "is-wrong") : undefined}>
              <p className="quiz-prompt">
                <span className="quiz-number">{index + 1}</span>
                <RichLine text={question.prompt} />
                {question.points > 1 ? <span className="quiz-points">{question.points} pts</span> : null}
              </p>
              {question.code ? <CodePanel code={question.code} /> : null}

              {question.options ? (
                <ul className="quiz-options">
                  {question.options.map((option) => {
                    const isSelected = selected.includes(option.id);
                    const isAnswer = question.answer.includes(option.id);
                    const className = graded ? (isAnswer ? "is-answer" : isSelected ? "is-mistake" : "") : "";
                    return (
                      <li key={option.id} className={className}>
                        <label>
                          <input
                            type={question.kind === "multi" ? "checkbox" : "radio"}
                            name={question.id}
                            checked={isSelected}
                            disabled={graded}
                            onChange={() => pick(question, option.id)}
                          />
                          <RichLine text={option.text} />
                        </label>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <textarea
                  className="quiz-written"
                  rows={4}
                  spellCheck={false}
                  disabled={graded}
                  value={written[question.id] ?? ""}
                  onChange={(event) => setWritten((current) => ({ ...current, [question.id]: event.target.value }))}
                  placeholder="Your answer…"
                  aria-label={`Answer to question ${index + 1}`}
                />
              )}

              {graded ? (
                <div className="quiz-feedback">
                  {question.modelAnswer ? (
                    <>
                      <p className="practice-label">Model answer</p>
                      <RichText text={question.modelAnswer} />
                      <div className="self-mark">
                        <span>Did your answer cover that?</span>
                        <button
                          type="button"
                          className={`button secondary${marks[question.id] === "right" ? " completed" : ""}`}
                          disabled={phase === "recorded"}
                          onClick={() => setMarks((current) => ({ ...current, [question.id]: "right" }))}
                        >
                          Yes — {question.points} pt{question.points === 1 ? "" : "s"}
                        </button>
                        <button
                          type="button"
                          className={`button secondary${marks[question.id] === "wrong" ? " completed" : ""}`}
                          disabled={phase === "recorded"}
                          onClick={() => setMarks((current) => ({ ...current, [question.id]: "wrong" }))}
                        >
                          No — 0
                        </button>
                      </div>
                    </>
                  ) : null}
                  <p className="practice-label">Why</p>
                  <RichText text={question.explanation} />
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>

      {phase === "taking" ? (
        <div className="quiz-actions">
          <button type="button" className="button primary" disabled={!answeredAll} onClick={() => setPhase("review")}>
            Submit answers
          </button>
          {!answeredAll ? <span className="quiz-note">Answer every question first — a blank is not a wrong answer.</span> : null}
        </div>
      ) : (
        <div className="quiz-actions">
          <p className={`quiz-score${passed ? " is-pass" : ""}`}>
            {percent}% · {earned}/{possible} points · {passed ? "pass" : `below the ${quiz.passScore}% pass mark`}
          </p>
          {phase === "review" ? (
            <button type="button" className="button primary" disabled={!markedAll} onClick={record}>
              Record this score
            </button>
          ) : (
            <span className="quiz-note">Recorded. Only your best score counts toward mastery.</span>
          )}
          {!markedAll && phase === "review" ? <span className="quiz-note">Mark every written answer to finish scoring.</span> : null}
          <button type="button" className="button secondary" onClick={reset}>
            Try again
          </button>
        </div>
      )}
    </section>
  );
}
