"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import { emptyProgress, parseProgress, PROGRESS_KEY, withTodayMarked, type ProgressData } from "@/lib/progress/progress";
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

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const progress = useSyncExternalStore(subscribe, snapshot, () => serverProgress);
  const session = useSyncExternalStore(subscribe, sessionSnapshot, () => null);
  const currentSyncStatus = useSyncExternalStore(subscribe, getSyncStatus, () => "idle" as SyncStatus);
  const hydrated = useSyncExternalStore(() => () => undefined, () => true, () => false);

  const update = useCallback((change: (current: ProgressData) => ProgressData) => { const next = change(snapshot()); publish({ ...next, lastActivityAt: new Date().toISOString(), activityDates: withTodayMarked(next.activityDates) }); }, []);
  const toggle = useCallback((field: "completedLessons" | "completedExercises" | "completedAssignments", id: string) => update((current) => { const values = new Set(current[field]); if (values.has(id)) values.delete(id); else values.add(id); return { ...current, [field]: [...values] }; }), [update]);

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
    const { data: remote } = await supabase.from("progress").select("data").eq("user_id", userId).maybeSingle();
    const remoteData = remote?.data as Partial<ProgressData> | undefined;
    if (remoteData && Object.keys(remoteData).length > 0) {
      const parsed = parseProgress(JSON.stringify(remoteData));
      clientProgress = parsed;
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(parsed));
    }
    notify();
    return {};
  }, []);

  const logOut = useCallback(() => { clientSession = null; localStorage.removeItem(SESSION_KEY); notify(); }, []);

  const value = useMemo<ProgressContextValue>(() => ({
    progress,
    hydrated,
    toggleLesson: (id) => toggle("completedLessons", id),
    toggleExercise: (id) => toggle("completedExercises", id),
    toggleAssignment: (id) => toggle("completedAssignments", id),
    visitLesson: (id) => { if (snapshot().lastVisitedLesson !== id) update((current) => ({ ...current, lastVisitedLesson: id })); },
    reset: () => { localStorage.removeItem(PROGRESS_KEY); clientProgress = emptyProgress(); notify(); },
    session,
    syncEnabled: getSupabaseClient() !== null,
    syncStatus: currentSyncStatus,
    signUp,
    logIn,
    logOut,
  }), [progress, hydrated, toggle, update, session, currentSyncStatus, signUp, logIn, logOut]);

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() { const value = useContext(ProgressContext); if (!value) throw new Error("useProgress must be used inside ProgressProvider"); return value; }
