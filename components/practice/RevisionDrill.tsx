"use client";

import { useMemo, useState } from "react";
import { seedFrom } from "@/lib/practice/select";
import type { RenderedPracticeSet } from "@/lib/practice/types";
import { CodePanel } from "./CodePanel";
import { RichText, RichLine } from "./RichText";
import type { RenderedCode } from "@/lib/practice/types";

/**
 * Revision as recall practice, not re-reading.
 *
 * Every card is a question drawn from work the learner has already done — a quiz question, a
 * tricky exercise, an interview question — with the answer hidden. The point is to force
 * retrieval before recognition: re-reading the lesson feels productive and teaches almost
 * nothing, which is exactly the failure mode the roadmap's three-week review rule exists to stop.
 *
 * Nothing here is scored. A revision drill you can fail on the record is a drill people avoid.
 */

interface Card {
  id: string;
  kind: string;
  question: string;
  code?: RenderedCode;
  answer: string;
}

function cardsFor(set: RenderedPracticeSet): Card[] {
  return [
    ...set.quizzes.flatMap((quiz) =>
      quiz.questions.map((question) => ({
        id: question.id,
        kind: "Recall",
        question: question.prompt,
        code: question.code,
        answer: question.modelAnswer ? `${question.modelAnswer}\n\n${question.explanation}` : question.explanation,
      })),
    ),
    ...set.exercises
      .filter((exercise) => exercise.tier === "tricky" || exercise.tier === "challenge")
      .map((exercise) => ({
        id: exercise.id,
        kind: exercise.tier === "tricky" ? "Tricky" : "Challenge",
        question: exercise.prompt,
        code: exercise.code,
        answer: exercise.solution,
      })),
    ...set.interview.map((question) => ({
      id: question.id,
      kind: "Interview",
      question: question.question,
      code: question.code,
      answer: question.shortAnswer,
    })),
  ];
}

function sample(cards: Card[], seed: string, size: number): Card[] {
  if (cards.length <= size) return cards;
  const picked: Card[] = [];
  const used = new Set<number>();
  let cursor = seedFrom(seed);
  while (picked.length < size) {
    cursor = (Math.imul(cursor, 1_664_525) + 1_013_904_223) >>> 0;
    const index = cursor % cards.length;
    if (used.has(index)) continue;
    used.add(index);
    picked.push(cards[index]);
  }
  return picked;
}

function DrillCard({ card }: { card: Card }) {
  const [shown, setShown] = useState(false);
  return (
    <li className="drill-card">
      <span className="kind-badge">{card.kind}</span>
      <p className="drill-question">
        <RichLine text={card.question} />
      </p>
      {card.code ? <CodePanel code={card.code} /> : null}
      {shown ? (
        <div className="drill-answer">
          <RichText text={card.answer} />
        </div>
      ) : (
        <button type="button" className="button secondary" onClick={() => setShown(true)}>
          Answer from memory first, then check
        </button>
      )}
    </li>
  );
}

export function RevisionDrill({ set }: { set: RenderedPracticeSet }) {
  const cards = useMemo(() => cardsFor(set), [set]);
  const [round, setRound] = useState(0);
  const drawn = useMemo(() => sample(cards, `${set.lessonId}:${round}`, 5), [cards, set.lessonId, round]);

  if (cards.length === 0) return <p className="practice-empty">This topic has nothing to revise yet.</p>;

  return (
    <div className="revision-drill">
      <div className="section-heading">
        <div>
          <p className="practice-label">Quick revision</p>
          <h3>Five questions from memory</h3>
        </div>
        <button type="button" className="button secondary" onClick={() => setRound(round + 1)}>
          Draw another five
        </button>
      </div>
      <ul className="drill-list">
        {drawn.map((card) => (
          <DrillCard key={`${round}-${card.id}`} card={card} />
        ))}
      </ul>
    </div>
  );
}
