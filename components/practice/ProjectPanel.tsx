"use client";

import { useState } from "react";
import { useProgress } from "@/components/progress/ProgressProvider";
import type { RenderedProject } from "@/lib/practice/types";
import { CodePanel } from "./CodePanel";
import { RichText, RichLine } from "./RichText";

const KIND_LABEL: Record<string, string> = {
  micro: "Micro-project",
  small: "Small project",
  major: "Project",
  "final-challenge": "Final challenge",
};

function List({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="project-block">
      <p className="practice-label">{label}</p>
      <ul>
        {items.map((item) => (
          <li key={item}>
            <RichLine text={item} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * A project brief, not a tutorial.
 *
 * The problem, requirements, constraints and expected behaviour are open by default — that is the
 * specification, and a spec you have to unfold is a bad spec. Architecture guidance sits behind
 * one reveal and the shape of a working solution behind another, because the brief is explicit
 * that the implementation must not arrive before the learner has tried to build it.
 */
export function ProjectPanel({ project, lessonId }: { project: RenderedProject; lessonId: string }) {
  const { progress, hydrated, toggleProject, touchLesson } = useProgress();
  const [showHints, setShowHints] = useState(false);
  const [showOutline, setShowOutline] = useState(false);
  const done = hydrated && progress.completedProjects.includes(project.id);

  function markDone() {
    toggleProject(project.id);
    touchLesson(lessonId);
  }

  return (
    <article className={`project-panel${done ? " is-done" : ""}`} id={project.id}>
      <header className="practice-card-head">
        <div className="practice-badges">
          <span className={`kind-badge project-${project.kind}`}>{KIND_LABEL[project.kind] ?? project.kind}</span>
          <span className="practice-minutes">{project.minutes} min</span>
        </div>
        <label className="practice-done">
          <input type="checkbox" checked={done} onChange={markDone} /> Built it
        </label>
      </header>

      <h3>{project.title}</h3>
      <p className="project-summary">
        <RichLine text={project.summary} />
      </p>

      <div className="project-block">
        <p className="practice-label">The problem</p>
        <RichText text={project.problem} />
      </div>

      <List label="Requirements" items={project.requirements} />
      <List label="Constraints" items={project.constraints} />
      <List label="Expected behaviour" items={project.expectedBehaviour} />

      {project.structure ? (
        <div className="project-block">
          <p className="practice-label">Suggested structure</p>
          <CodePanel code={project.structure} label="layout" />
        </div>
      ) : null}

      {project.milestones.length > 0 ? (
        <div className="project-block">
          <p className="practice-label">Milestones</p>
          <ol className="project-milestones">
            {project.milestones.map((milestone) => (
              <li key={milestone.title}>
                <strong>{milestone.title}</strong>
                <RichText text={milestone.detail} />
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      <List label="Testing requirements" items={project.testing} />
      <List label="Common failure cases" items={project.failureCases} />
      <List label="Bonus challenges" items={project.bonus} />

      {project.architectureHints.length > 0 ? (
        showHints ? (
          <List label="Architecture guidance" items={project.architectureHints} />
        ) : (
          <button type="button" className="button secondary" onClick={() => setShowHints(true)}>
            Stuck on the design? Reveal architecture guidance
          </button>
        )
      ) : null}

      {project.referenceOutline ? (
        showOutline ? (
          <div className="project-block project-outline">
            <p className="practice-label">Shape of a good solution</p>
            <RichText text={project.referenceOutline} />
          </div>
        ) : (
          <button type="button" className="button secondary" onClick={() => setShowOutline(true)}>
            Reveal the shape of a good solution
          </button>
        )
      ) : null}
    </article>
  );
}
