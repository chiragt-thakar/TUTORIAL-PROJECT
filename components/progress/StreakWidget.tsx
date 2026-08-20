"use client";
import { buildActivityWeeks, computeLongestStreak, computeStreak } from "@/lib/progress/progress";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { useProgress } from "./ProgressProvider";

export function LearningStreak() {
  const { progress, hydrated } = useProgress();
  if (!hydrated) return <div className="streak-card streak-card-loading" aria-hidden="true" />;

  const streak = computeStreak(progress.activityDates);
  const longest = computeLongestStreak(progress.activityDates);
  const weeks = buildActivityWeeks(progress.activityDates, 14);

  return (
    <div className="streak-card">
      <div className="streak-numbers">
        <div>
          <span className="streak-flame" aria-hidden="true">🔥</span>
          <strong><AnimatedNumber value={streak} /></strong>
          <span>day{streak === 1 ? "" : "s"} current</span>
        </div>
        <div className="streak-divider" aria-hidden="true" />
        <div>
          <strong><AnimatedNumber value={longest} /></strong>
          <span>longest streak</span>
        </div>
      </div>
      <div className="heatmap" role="img" aria-label={`Activity over the last ${weeks.length} weeks: ${progress.activityDates.length} active days`}>
        {weeks.map((column, columnIndex) => (
          <div className="heatmap-column" key={columnIndex}>
            {column.map((day) => (
              <span key={day.date} className={`heatmap-day${day.active ? " active" : ""}`} title={day.date} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
