"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useProgress } from "@/components/progress/ProgressProvider";

const keyFor = (lessonId: string) => `zerotohero-note:${lessonId}`;
const noSubscription = () => () => undefined;

export function LessonNotes({ lessonId }: { lessonId: string }) {
  // The page remounts on every route change (see PageTransition), so a fresh
  // component instance per lesson is guaranteed and this never needs to reset.
  const hydrated = useSyncExternalStore(noSubscription, () => true, () => false);
  const { session } = useProgress();
  const [draft, setDraft] = useState<string | null>(null);
  const [status, setStatus] = useState<"saved" | "saving" | "error">("saved");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pull the server's copy once per lesson. Local text wins if it differs and is non-empty:
  // the note in front of you is never replaced by an older remote one without warning.
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !session) return;
    let cancelled = false;
    void (async () => {
      const { data } = await supabase
        .from("notes")
        .select("body")
        .eq("user_id", session.userId)
        .eq("lesson_id", lessonId)
        .maybeSingle();
      if (cancelled || !data?.body) return;
      const local = localStorage.getItem(keyFor(lessonId)) ?? "";
      if (local.trim().length === 0) {
        localStorage.setItem(keyFor(lessonId), data.body);
        setDraft(data.body);
      }
    })();
    return () => { cancelled = true; };
  }, [session, lessonId]);

  if (!hydrated) return null;

  const value = draft ?? localStorage.getItem(keyFor(lessonId)) ?? "";

  const handleChange = (next: string) => {
    setDraft(next);
    setStatus("saving");
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (next.trim()) localStorage.setItem(keyFor(lessonId), next);
      else localStorage.removeItem(keyFor(lessonId));

      const supabase = getSupabaseClient();
      if (!supabase || !session) { setStatus("saved"); return; }
      void supabase
        .from("notes")
        .upsert({ user_id: session.userId, lesson_id: lessonId, body: next, updated_at: new Date().toISOString() }, { onConflict: "user_id,lesson_id" })
        .then(({ error }) => setStatus(error ? "error" : "saved"));
    }, 600);
  };

  const label = status === "saving" ? "Saving…" : status === "error" ? "Sync failed" : session ? "Synced" : "Saved";

  return (
    <div className="context-notes">
      <div className="context-notes-heading">
        <p>NOTES</p>
        <span className={status === "error" ? "note-status-error" : undefined}>{label}</span>
      </div>
      <textarea
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        placeholder={session ? "Jot a note for future you — synced to your account." : "Jot a note for future you — saved on this device only."}
        rows={4}
      />
    </div>
  );
}
