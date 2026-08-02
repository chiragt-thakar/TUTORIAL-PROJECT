"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import { emptyProgress, parseProgress, PROGRESS_KEY, type ProgressData } from "@/lib/progress/progress";

interface ProgressContextValue { progress: ProgressData; hydrated: boolean; toggleLesson(id: string): void; toggleExercise(id: string): void; toggleAssignment(id: string): void; visitLesson(id: string): void; reset(): void; }
const ProgressContext = createContext<ProgressContextValue | null>(null);
const serverProgress = emptyProgress();
let clientProgress: ProgressData | null = null;
const listeners = new Set<() => void>();
function subscribe(listener: () => void) { listeners.add(listener); return () => listeners.delete(listener); }
function snapshot() { if (clientProgress === null) clientProgress = parseProgress(localStorage.getItem(PROGRESS_KEY)); return clientProgress; }
function publish(next: ProgressData) { clientProgress = next; localStorage.setItem(PROGRESS_KEY, JSON.stringify(next)); listeners.forEach((listener) => listener()); }

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const progress = useSyncExternalStore(subscribe, snapshot, () => serverProgress);
  const hydrated = useSyncExternalStore(() => () => undefined, () => true, () => false);
  const update = useCallback((change: (current: ProgressData) => ProgressData) => publish({ ...change(snapshot()), lastActivityAt: new Date().toISOString() }), []);
  const toggle = useCallback((field: "completedLessons" | "completedExercises" | "completedAssignments", id: string) => update((current) => { const values = new Set(current[field]); if (values.has(id)) values.delete(id); else values.add(id); return { ...current, [field]: [...values] }; }), [update]);
  const value = useMemo<ProgressContextValue>(() => ({ progress, hydrated, toggleLesson: (id) => toggle("completedLessons", id), toggleExercise: (id) => toggle("completedExercises", id), toggleAssignment: (id) => toggle("completedAssignments", id), visitLesson: (id) => { if (snapshot().lastVisitedLesson !== id) update((current) => ({ ...current, lastVisitedLesson: id })); }, reset: () => { localStorage.removeItem(PROGRESS_KEY); clientProgress = emptyProgress(); listeners.forEach((listener) => listener()); } }), [progress, hydrated, toggle, update]);
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() { const value = useContext(ProgressContext); if (!value) throw new Error("useProgress must be used inside ProgressProvider"); return value; }
