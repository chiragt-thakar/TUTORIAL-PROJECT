"use client";
import { useProgress } from "@/components/progress/ProgressProvider";

export type ExerciseDifficulty = "easy" | "medium" | "hard" | "interview" | "real-world";

const DIFFICULTY_LABEL: Record<ExerciseDifficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  interview: "Interview",
  "real-world": "Real World",
};

export function Exercise({ id, difficulty, children }: { id: string; difficulty?: ExerciseDifficulty; children: React.ReactNode }) {
  const { progress, hydrated, toggleExercise } = useProgress();
  const done = hydrated && progress.completedExercises.includes(id);
  return (
    <section className="exercise">
      <div className="exercise-heading">
        <span className="exercise-heading-left">
          <strong>Exercise</strong>
          {difficulty && <span className={`difficulty-badge difficulty-${difficulty}`}>{DIFFICULTY_LABEL[difficulty]}</span>}
        </span>
        <label><input type="checkbox" checked={done} onChange={() => toggleExercise(id)} /> Done</label>
      </div>
      {children}
    </section>
  );
}

export function Assignment({ id, children }: { id: string; children: React.ReactNode }) {
  const { progress, hydrated, toggleAssignment } = useProgress();
  const done = hydrated && progress.completedAssignments.includes(id);
  return <section className="assignment"><div className="exercise-heading"><strong>Module assignment</strong><label><input type="checkbox" checked={done} onChange={() => toggleAssignment(id)} /> Completed</label></div>{children}</section>;
}
