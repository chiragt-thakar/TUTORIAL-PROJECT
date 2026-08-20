"use client";

import { useState, useSyncExternalStore } from "react";

const PREFIX = "practice-draft:";
const noSubscription = () => () => undefined;

/**
 * The learner's own attempt at an exercise, kept in local storage.
 *
 * This is scratch, not progress: it is intentionally *not* in the synced progress store, because
 * a half-finished attempt on a laptop is noise on a phone, and the additive merge in
 * `mergeProgress` would have no sensible way to combine two different drafts of the same answer.
 *
 * It exists because the brief's flow is "question -> my attempt -> hint -> solution", and a
 * learner who has to retype their reasoning after every reveal simply stops writing it down.
 *
 * Reads storage during render rather than in an effect — the same `useSyncExternalStore`
 * hydration flag `LessonNotes` uses — so the first paint after hydration already has the text,
 * with no second render and no server/client mismatch.
 */
export function useDraft(key: string): { value: string; setValue: (next: string) => void; hydrated: boolean } {
  const hydrated = useSyncExternalStore(noSubscription, () => true, () => false);
  const [draft, setDraft] = useState<string | null>(null);

  let stored = "";
  if (hydrated && draft === null) {
    try {
      stored = window.localStorage.getItem(PREFIX + key) ?? "";
    } catch {
      stored = "";
    }
  }

  function setValue(next: string) {
    setDraft(next);
    try {
      if (next.trim() === "") window.localStorage.removeItem(PREFIX + key);
      else window.localStorage.setItem(PREFIX + key, next);
    } catch {
      // A full or blocked storage quota must never break the exercise itself.
    }
  }

  return { value: draft ?? stored, setValue, hydrated };
}
