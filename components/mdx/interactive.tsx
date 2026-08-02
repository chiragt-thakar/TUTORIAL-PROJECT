"use client";
import { useProgress } from "@/components/progress/ProgressProvider";

export function Exercise({ id, children }: { id: string; children: React.ReactNode }) {
  const { progress, hydrated, toggleExercise } = useProgress();
  const done = hydrated && progress.completedExercises.includes(id);
  return <section className="exercise"><div className="exercise-heading"><strong>Exercise</strong><label><input type="checkbox" checked={done} onChange={() => toggleExercise(id)} /> Done</label></div>{children}</section>;
}

export function Assignment({ id, children }: { id: string; children: React.ReactNode }) {
  const { progress, hydrated, toggleAssignment } = useProgress();
  const done = hydrated && progress.completedAssignments.includes(id);
  return <section className="assignment"><div className="exercise-heading"><strong>Module assignment</strong><label><input type="checkbox" checked={done} onChange={() => toggleAssignment(id)} /> Completed</label></div>{children}</section>;
}
