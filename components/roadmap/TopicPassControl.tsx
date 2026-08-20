"use client";

import { MAX_PASS, PASS_LABEL } from "@/lib/progress/progress";

/**
 * The roadmap's 3-pass rule as a control: click to advance a topic through
 * intuition -> derived on paper -> implemented from scratch, then back to untouched.
 * A binary checkbox would lose exactly the distinction the roadmap says is "the entire difference."
 */
export function TopicPassControl({ pass, onCycle, label }: { pass: number; onCycle: () => void; label: string }) {
  const state = pass === 0 ? "Not started" : PASS_LABEL[pass];
  return (
    <button
      type="button"
      className={`pass-control pass-${pass}`}
      onClick={onCycle}
      title={`${label} — ${state} (pass ${pass}/${MAX_PASS}). Click to advance.`}
      aria-label={`${label}. ${state}, pass ${pass} of ${MAX_PASS}. Activate to advance.`}
    >
      {Array.from({ length: MAX_PASS }, (_, index) => (
        <span key={index} className={index < pass ? "on" : ""} aria-hidden="true" />
      ))}
    </button>
  );
}
