"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useProgress } from "@/components/progress/ProgressProvider";
import {
  formatDuration,
  LANE_LABEL,
  LANE_TARGET_HOURS,
  STUDY_LANES,
  weeklyLaneTotals,
  type StudyLane,
} from "@/lib/progress/progress";

/**
 * A focus timer that logs into one of the roadmap's four weekly lanes, so the
 * "4h math / 6h main / 3h build / 1h paper" cadence is measured rather than hoped for.
 * Time is banked when you stop, so a half-finished session still counts.
 */
export function StudyTimer() {
  const { progress, hydrated, logSession } = useProgress();
  const [lane, setLane] = useState<StudyLane>("main");
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      if (startedAt.current !== null) setSeconds(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const start = useCallback(() => {
    startedAt.current = Date.now() - seconds * 1000;
    setRunning(true);
  }, [seconds]);

  const pause = useCallback(() => {
    setRunning(false);
    startedAt.current = null;
  }, []);

  const bank = useCallback(() => {
    const minutes = Math.round(seconds / 60);
    if (minutes > 0) logSession(lane, minutes);
    setRunning(false);
    setSeconds(0);
    startedAt.current = null;
  }, [seconds, lane, logSession]);

  const totals = hydrated ? weeklyLaneTotals(progress.sessions) : [];
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="study-timer">
      <div className="study-timer-head">
        <p className="eyebrow">FOCUS SESSION</p>
        <div className="study-lanes" role="group" aria-label="Which weekly lane this session counts toward">
          {STUDY_LANES.map((entry) => (
            <button
              type="button"
              key={entry}
              className={`study-lane-pick${entry === lane ? " is-on" : ""}`}
              onClick={() => setLane(entry)}
              aria-pressed={entry === lane}
            >
              {LANE_LABEL[entry]}
            </button>
          ))}
        </div>
      </div>

      <div className="study-clock">
        <motion.strong animate={running ? { opacity: [1, 0.55, 1] } : { opacity: 1 }} transition={{ duration: 2, repeat: running ? Infinity : 0 }}>
          {mm}:{ss}
        </motion.strong>
        <div className="study-actions">
          {running ? (
            <button type="button" className="button secondary" onClick={pause}>Pause</button>
          ) : (
            <button type="button" className="button primary" onClick={start}>{seconds > 0 ? "Resume" : "Start"}</button>
          )}
          <button type="button" className="button secondary" onClick={bank} disabled={seconds < 60}>
            Log {seconds >= 60 ? formatDuration(Math.round(seconds / 60)) : ""}
          </button>
        </div>
      </div>

      <ul className="study-week" aria-label="This week against the roadmap's cadence">
        {totals.map((entry) => (
          <li key={entry.lane} className={entry.minutes >= entry.targetMinutes ? "is-met" : ""}>
            <span className="study-week-name">{LANE_LABEL[entry.lane]}</span>
            <span className="study-week-bar" aria-hidden="true">
              <span style={{ width: `${entry.percent}%` }} />
            </span>
            <span className="study-week-num">
              {formatDuration(entry.minutes)} <small>/ {LANE_TARGET_HOURS[entry.lane]}h</small>
            </span>
          </li>
        ))}
        {!hydrated ? <li className="study-week-loading" aria-hidden="true" /> : null}
      </ul>
    </div>
  );
}
