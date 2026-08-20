"use client";

import { useState } from "react";
import { RichText } from "./RichText";

const LADDER = ["a nudge", "a stronger clue", "almost the approach", "the approach"];

/**
 * Progressive hints, one at a time.
 *
 * Revealing all of them at once is the same as revealing the solution, so each press opens
 * exactly one more and the button says how deep the next one goes. The count is visible up front
 * so the learner can decide to keep struggling — knowing three hints exist is itself information,
 * and hiding that just makes people give up and open the solution.
 */
export function HintStack({ hints }: { hints: string[] }) {
  const [shown, setShown] = useState(0);
  if (hints.length === 0) return null;

  return (
    <div className="hint-stack">
      <div className="hint-stack-head">
        <span className="practice-label">Hints</span>
        <span className="hint-count">
          {shown} of {hints.length} used
        </span>
      </div>

      {hints.slice(0, shown).map((hint, index) => (
        <div className="hint" key={index}>
          <span className="hint-index">Hint {index + 1}</span>
          <RichText text={hint} />
        </div>
      ))}

      {shown < hints.length ? (
        <button type="button" className="button secondary hint-button" onClick={() => setShown(shown + 1)}>
          Show hint {shown + 1} <small>({LADDER[Math.min(shown, LADDER.length - 1)]})</small>
        </button>
      ) : (
        <p className="hint-exhausted">That is every hint. Write down what you think happens before you open the solution.</p>
      )}
    </div>
  );
}
