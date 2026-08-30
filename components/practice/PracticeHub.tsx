"use client";

import Link from "next/link";
import { useMemo } from "react";
import { STATUS_LABEL } from "@/lib/practice/mastery";
import { randomChallenge, revisionDue, weakTopics } from "@/lib/practice/select";
import type { PracticeIndexEntry } from "@/lib/practice/types";
import { useProgress } from "@/components/progress/ProgressProvider";
import { usePracticeEntries } from "./useReport";

/**
 * The cross-topic practice surface: what to revise, what is weak, and one problem to go and fail
 * at right now.
 *
 * It routes rather than teaches — every card links into the topic's own workbench, at the right
 * mode, because that is where the content and the progress keys live. Keeping the answers off
 * this page is what lets it be a static page at all (see `getPracticeIndex`).
 */

function href(entry: PracticeIndexEntry, mode?: string): string {
  return `/learn/${entry.module}/${entry.lesson}/${mode ? `#${mode}` : ""}`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function PracticeHub({ index }: { index: PracticeIndexEntry[] }) {
  const { progress, hydrated } = useProgress();
  const { entries } = usePracticeEntries(index);

  const due = useMemo(() => revisionDue(entries), [entries]);
  const weak = useMemo(() => weakTopics(entries), [entries]);
  const challenge = useMemo(
    () => randomChallenge(entries, progress.completedExercises, today()),
    [entries, progress.completedExercises],
  );

  const mastered = entries.filter((entry) => entry.report.status === "mastered").length;
  const totalExercises = index.reduce((sum, entry) => sum + entry.exercises.length, 0);
  const solved = hydrated
    ? index.reduce(
        (sum, entry) => sum + entry.exercises.filter((exercise) => progress.completedExercises.includes(exercise.id)).length,
        0,
      )
    : 0;

  if (index.length === 0) {
    return (
      <p className="practice-empty">
        No topic has practice content yet. Author the next topic listed in <code>CLAUDE.md</code>.
      </p>
    );
  }

  return (
    <>
      <div className="hub-grid">
        <section className="hub-card">
          <p className="practice-label">Today&rsquo;s challenge</p>
          <h2>Go and get stuck</h2>
          {challenge ? (
            <>
              <p>One unsolved problem, weighted toward the tiers that actually catch people out. It changes daily.</p>
              <Link className="hub-challenge" href={`${href(challenge.set, "practice")}`}>
                <small>{challenge.tier}</small>
                <strong>{challenge.title}</strong>
                <small>{challenge.set.title}</small>
              </Link>
            </>
          ) : (
            <p>Every exercise on the site is solved. Write the next topic, or run a revision drill.</p>
          )}
        </section>

        <section className="hub-card">
          <p className="practice-label">Spaced revision</p>
          <h2>Due for review</h2>
          {due.length === 0 ? (
            <p>
              Nothing has gone stale yet. Topics resurface here once they have not been practised for their revisit
              window — three weeks by default.
            </p>
          ) : (
            <ul className="hub-list">
              {due.map((entry) => (
                <li key={entry.set.lessonId}>
                  <Link href={href(entry.set, "review")}>{entry.set.title}</Link>
                  <span className="hub-meta">{entry.report.daysSinceActivity}d ago</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="hub-card">
          <p className="practice-label">Weak areas</p>
          <h2>What to work on</h2>
          {weak.length === 0 ? (
            <p>Nothing started and unfinished. Begin a topic, and whatever you score badly on will surface here.</p>
          ) : (
            <ul className="hub-list">
              {weak.map((entry) => (
                <li key={entry.set.lessonId}>
                  <Link href={href(entry.set, "practice")}>{entry.set.title}</Link>
                  <span className={`hub-status status-${entry.report.status}`}>{STATUS_LABEL[entry.report.status]}</span>
                  <span className="hub-meta">{entry.report.blocking[0] ?? `${entry.report.percent}%`}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="hub-card">
          <p className="practice-label">Where you are</p>
          <h2>Totals</h2>
          <ul className="hub-list">
            <li>
              Topics with practice content <span className="hub-meta">{index.length}</span>
            </li>
            <li>
              Mastered <span className="hub-meta">{hydrated ? mastered : 0}</span>
            </li>
            <li>
              Exercises solved{" "}
              <span className="hub-meta">
                {solved}/{totalExercises}
              </span>
            </li>
            <li>
              Interview questions answered{" "}
              <span className="hub-meta">
                {hydrated ? progress.reviewedInterview.length : 0}/
                {index.reduce((sum, entry) => sum + entry.interview.length, 0)}
              </span>
            </li>
          </ul>
        </section>
      </div>

      <section className="home-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">EVERY TOPIC</p>
            <h2>Mastery by topic</h2>
          </div>
        </div>
        <div className="hub-topics">
          {entries.map((entry) => (
            <Link className="hub-topic" key={entry.set.lessonId} href={href(entry.set)}>
              <span className="hub-topic-title">
                {entry.set.title}
                <small>{entry.set.summary}</small>
              </span>
              <span className={`hub-status status-${hydrated ? entry.report.status : "not-started"}`}>
                {STATUS_LABEL[hydrated ? entry.report.status : "not-started"]}
              </span>
              <span className="hub-topic-bar">
                <span style={{ width: `${hydrated ? entry.report.percent : 0}%` }} />
              </span>
              <span className="hub-topic-pct">{hydrated ? entry.report.percent : 0}%</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
