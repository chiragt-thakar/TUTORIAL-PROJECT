"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { emptyProgress, MAX_PASS, mergeProgress, newSessionId, parseProgress, PROGRESS_KEY, toDayString, withTodayMarked, type ProgressData, type StudyLane } from "@/lib/progress/progress";
import { getSupabaseClient } from "@/lib/supabase/client";

const SESSION_KEY = "zerotohero-session";
const PUSH_DEBOUNCE_MS = 1200;

export interface Session { userId: string; email: string }
export type SyncStatus = "idle" | "syncing" | "error";
type AuthResult = { error?: string };

interface ProgressContextValue {
  progress: ProgressData;
  hydrated: boolean;
  toggleLesson(id: string): void;
  toggleExercise(id: string): void;
  toggleAssignment(id: string): void;
  visitLesson(id: string): void;
  /** Advance a roadmap topic to `pass` (1-3), or back to 0 to clear it. */
  setTopicPass(id: string, pass: number): void;
  /** Bump a roadmap topic one pass forward, wrapping 3 -> 0. */
  cycleTopicPass(id: string): void;
  toggleProofGate(id: string): void;
  /** A practice project the learner has built. Tracked apart from module assignments. */
  toggleProject(id: string): void;
  /** Mark an interview question as worked through, not merely read. */
  toggleInterviewReviewed(id: string): void;
  /** Record a finished quiz attempt. Only the best score is kept — see `QuizScore`. */
  recordQuizScore(quizId: string, percent: number): void;
  /** Stamp a lesson as practised today, which is what the spaced-revision queue counts from. */
  touchLesson(lessonId: string): void;
  logSession(lane: StudyLane, minutes: number): void;
  reset(): void;
  session: Session | null;
  syncEnabled: boolean;
  syncStatus: SyncStatus;
  signUp(email: string, password: string): Promise<AuthResult>;
  logIn(email: string, password: string): Promise<AuthResult>;
  logOut(): void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);
const serverProgress = emptyProgress();

let clientProgress: ProgressData | null = null;
let clientSession: Session | null | undefined;
let syncStatus: SyncStatus = "idle";
let pushTimer: ReturnType<typeof setTimeout> | null = null;

const listeners = new Set<() => void>();
function subscribe(listener: () => void) { listeners.add(listener); return () => listeners.delete(listener); }
function notify() { listeners.forEach((listener) => listener()); }

function snapshot() { if (clientProgress === null) clientProgress = parseProgress(localStorage.getItem(PROGRESS_KEY)); return clientProgress; }
function getSyncStatus() { return syncStatus; }

function sessionSnapshot(): Session | null {
  if (clientSession === undefined) {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      clientSession = raw ? (JSON.parse(raw) as Session) : null;
    } catch { clientSession = null; }
  }
  return clientSession;
}

function schedulePush(data: ProgressData) {
  const supabase = getSupabaseClient();
  const session = sessionSnapshot();
  if (!supabase || !session) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    syncStatus = "syncing";
    notify();
    supabase
      .from("progress")
      .upsert({ user_id: session.userId, data, updated_at: new Date().toISOString() })
      .then(({ error }) => { syncStatus = error ? "error" : "idle"; notify(); });
  }, PUSH_DEBOUNCE_MS);
}

function publish(next: ProgressData) {
  clientProgress = next;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
  notify();
  schedulePush(next);
}

/**
 * Pulls the server's copy and merges it into the local one, then pushes the union back.
 * Runs on mount, whenever a session appears, and when the tab regains focus, so a second
 * device's work actually arrives instead of being silently overwritten by the next local edit.
 */
let pulling = false;
async function pullAndMerge(): Promise<void> {
  const supabase = getSupabaseClient();
  const session = sessionSnapshot();
  if (!supabase || !session || pulling) return;
  pulling = true;
  syncStatus = "syncing";
  notify();
  try {
    const { data, error } = await supabase.from("progress").select("data").eq("user_id", session.userId).maybeSingle();
    if (error) { syncStatus = "error"; notify(); return; }
    const remote = data?.data ? parseProgress(JSON.stringify(data.data)) : emptyProgress();
    const merged = mergeProgress(snapshot(), remote);
    clientProgress = merged;
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(merged));
    syncStatus = "idle";
    notify();
    const { error: pushError } = await supabase
      .from("progress")
      .upsert({ user_id: session.userId, data: merged, updated_at: new Date().toISOString() });
    if (pushError) { syncStatus = "error"; notify(); }
  } catch {
    syncStatus = "error";
    notify();
  } finally {
    pulling = false;
  }
}

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const progress = useSyncExternalStore(subscribe, snapshot, () => serverProgress);
  const session = useSyncExternalStore(subscribe, sessionSnapshot, () => null);
  const currentSyncStatus = useSyncExternalStore(subscribe, getSyncStatus, () => "idle" as SyncStatus);
  const hydrated = useSyncExternalStore(() => () => undefined, () => true, () => false);

  // Pull-merge-push on mount, on sign-in, and whenever the tab regains focus.
  useEffect(() => {
    if (!session) return;
    void pullAndMerge();
    const onFocus = () => { void pullAndMerge(); };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [session]);

  const update = useCallback((change: (current: ProgressData) => ProgressData) => { const next = change(snapshot()); publish({ ...next, lastActivityAt: new Date().toISOString(), activityDates: withTodayMarked(next.activityDates) }); }, []);
  type ToggleField = "completedLessons" | "completedExercises" | "completedAssignments" | "completedProjects" | "reviewedInterview";
  const toggle = useCallback((field: ToggleField, id: string) => update((current) => { const values = new Set(current[field]); if (values.has(id)) values.delete(id); else values.add(id); return { ...current, [field]: [...values] }; }), [update]);

  const touchLesson = useCallback((lessonId: string) => update((current) => ({
    ...current,
    lessonDates: { ...current.lessonDates, [lessonId]: toDayString(new Date()) },
  })), [update]);

  const recordQuizScore = useCallback((quizId: string, percent: number) => {
    if (!Number.isFinite(percent)) return;
    const score = Math.min(100, Math.max(0, Math.round(percent)));
    update((current) => {
      const existing = current.quizScores[quizId];
      return {
        ...current,
        quizScores: {
          ...current.quizScores,
          [quizId]: {
            best: Math.max(existing?.best ?? 0, score),
            attempts: (existing?.attempts ?? 0) + 1,
            lastAt: toDayString(new Date()),
          },
        },
      };
    });
  }, [update]);

  const setTopicPass = useCallback((id: string, pass: number) => update((current) => {
    const passes = { ...current.topicPasses };
    const dates = { ...current.topicDates };
    const clamped = Math.min(MAX_PASS, Math.max(0, Math.round(pass)));
    if (clamped === 0) { delete passes[id]; delete dates[id]; }
    else { passes[id] = clamped; dates[id] = toDayString(new Date()); }
    return { ...current, topicPasses: passes, topicDates: dates };
  }), [update]);

  const signUp = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const supabase = getSupabaseClient();
    if (!supabase) return { error: "Sync isn't configured on this deployment yet." };
    const { data, error } = await supabase.rpc("signup", { p_email: email, p_password: password });
    if (error) return { error: error.message };
    const userId = (data as Array<{ user_id: string }> | null)?.[0]?.user_id;
    if (!userId) return { error: "Sign up failed. Try again." };
    clientSession = { userId, email: email.toLowerCase() };
    localStorage.setItem(SESSION_KEY, JSON.stringify(clientSession));
    await supabase.from("progress").upsert({ user_id: userId, data: snapshot(), updated_at: new Date().toISOString() });
    notify();
    return {};
  }, []);

  const logIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const supabase = getSupabaseClient();
    if (!supabase) return { error: "Sync isn't configured on this deployment yet." };
    const { data, error } = await supabase.rpc("login", { p_email: email, p_password: password });
    if (error) return { error: error.message };
    const userId = (data as Array<{ user_id: string }> | null)?.[0]?.user_id;
    if (!userId) return { error: "Incorrect email or password." };
    clientSession = { userId, email: email.toLowerCase() };
    localStorage.setItem(SESSION_KEY, JSON.stringify(clientSession));
    notify();
    // Merge instead of overwriting: work done on this device before signing in must survive.
    await pullAndMerge();
    return {};
  }, []);

  const logOut = useCallback(() => { clientSession = null; localStorage.removeItem(SESSION_KEY); notify(); }, []);

  const value = useMemo<ProgressContextValue>(() => ({
    progress,
    hydrated,
    toggleLesson: (id) => toggle("completedLessons", id),
    toggleExercise: (id) => toggle("completedExercises", id),
    toggleAssignment: (id) => toggle("completedAssignments", id),
    toggleProject: (id) => toggle("completedProjects", id),
    toggleInterviewReviewed: (id) => toggle("reviewedInterview", id),
    recordQuizScore,
    touchLesson,
    visitLesson: (id) => { if (snapshot().lastVisitedLesson !== id) update((current) => ({ ...current, lastVisitedLesson: id })); },
    setTopicPass,
    cycleTopicPass: (id) => setTopicPass(id, ((snapshot().topicPasses[id] ?? 0) + 1) % (MAX_PASS + 1)),
    toggleProofGate: (id) => update((current) => {
      const gates = new Set(current.proofGates);
      if (gates.has(id)) gates.delete(id); else gates.add(id);
      return { ...current, proofGates: [...gates] };
    }),
    logSession: (lane, minutes) => {
      if (!Number.isFinite(minutes) || minutes <= 0) return;
      update((current) => ({ ...current, sessions: [...current.sessions, { id: newSessionId(), date: toDayString(new Date()), minutes: Math.round(minutes), lane }] }));
    },
    reset: () => { localStorage.removeItem(PROGRESS_KEY); clientProgress = emptyProgress(); notify(); },
    session,
    syncEnabled: getSupabaseClient() !== null,
    syncStatus: currentSyncStatus,
    signUp,
    logIn,
    logOut,
  }), [progress, hydrated, toggle, update, setTopicPass, recordQuizScore, touchLesson, session, currentSyncStatus, signUp, logIn, logOut]);

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() { const value = useContext(ProgressContext); if (!value) throw new Error("useProgress must be used inside ProgressProvider"); return value; }
