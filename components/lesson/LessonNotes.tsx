"use client";
import { useRef, useState, useSyncExternalStore } from "react";

const keyFor = (lessonId: string) => `zerotohero-note:${lessonId}`;
const noSubscription = () => () => undefined;

export function LessonNotes({ lessonId }: { lessonId: string }) {
  // The page remounts on every route change (see PageTransition), so a fresh
  // component instance per lesson is guaranteed and this never needs to reset.
  const hydrated = useSyncExternalStore(noSubscription, () => true, () => false);
  const [draft, setDraft] = useState<string | null>(null);
  const [saved, setSaved] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!hydrated) return null;

  const value = draft ?? localStorage.getItem(keyFor(lessonId)) ?? "";

  const handleChange = (next: string) => {
    setDraft(next);
    setSaved(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (next.trim()) localStorage.setItem(keyFor(lessonId), next);
      else localStorage.removeItem(keyFor(lessonId));
      setSaved(true);
    }, 500);
  };

  return (
    <div className="context-notes">
      <div className="context-notes-heading">
        <p>NOTES</p>
        <span>{saved ? "Saved" : "Saving…"}</span>
      </div>
      <textarea
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        placeholder="Jot a note for future you — saved on this device only."
        rows={4}
      />
    </div>
  );
}
