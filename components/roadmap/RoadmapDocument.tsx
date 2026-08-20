"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useProgress } from "@/components/progress/ProgressProvider";
import { Reveal } from "@/components/motion/Reveal";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { Inline } from "./inline";
import { TopicPassControl } from "./TopicPassControl";
import { MAX_PASS } from "@/lib/progress/progress";
import type { Roadmap, RoadmapBlock, RoadmapSection, RoadmapTopic } from "@/types/roadmap";
import type { Module } from "@/types/curriculum";

/**
 * Renders the roadmap source document in full, verbatim, in its own order — the "raw data"
 * view at /roadmap/mastery/source. Every `- [ ]` line is a trackable topic sharing the same
 * 3-pass state as the phase hub at /roadmap/mastery. Nothing here is gated or summarised.
 */

function TopicRow({ topic, pass, onCycle }: { topic: RoadmapTopic; pass: number; onCycle: () => void }) {
  return (
    <li className={`rm-topic${pass >= MAX_PASS ? " is-done" : ""}`}>
      <TopicPassControl pass={pass} onCycle={onCycle} label={topic.text} />
      <span>
        <Inline text={topic.text} />
      </span>
    </li>
  );
}

function Table({ lines }: { lines: string[] }) {
  const rows = lines.filter((line) => !/^\|[\s:|-]+\|$/.test(line)).map((line) =>
    line.slice(1, line.lastIndexOf("|")).split("|").map((cell) => cell.trim()),
  );
  if (rows.length === 0) return null;
  const [header, ...body] = rows;
  return (
    <div className="rm-table-wrap">
      <table className="rm-table">
        <thead>
          <tr>
            {header.map((cell, index) => (
              <th key={index} scope="col">
                <Inline text={cell} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>
                  <Inline text={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Blocks({
  blocks,
  passOf,
  cycle,
}: {
  blocks: RoadmapBlock[];
  passOf: (id: string) => number;
  cycle: (id: string) => void;
}) {
  return (
    <>
      {blocks.map((block, index) => {
        const key = `${block.kind}-${index}`;
        switch (block.kind) {
          case "checklist":
            return (
              <ul className="rm-topics" key={key}>
                {(block.items ?? []).map((topic) => (
                  <TopicRow key={topic.id} topic={topic} pass={passOf(topic.id)} onCycle={() => cycle(topic.id)} />
                ))}
              </ul>
            );
          case "bullets":
            return (
              <ul className="rm-list" key={key}>
                {block.lines.map((line, lineIndex) => (
                  <li key={lineIndex}>
                    <Inline text={line} />
                  </li>
                ))}
              </ul>
            );
          case "numbered":
            return (
              <ol className="rm-list" key={key}>
                {block.lines.map((line, lineIndex) => (
                  <li key={lineIndex}>
                    <Inline text={line} />
                  </li>
                ))}
              </ol>
            );
          case "quote":
            return (
              <blockquote className="rm-quote" key={key}>
                {block.lines.map((line, lineIndex) => (
                  <p key={lineIndex}>
                    <Inline text={line} />
                  </p>
                ))}
              </blockquote>
            );
          case "label":
            return (
              <p className="rm-label" key={key}>
                <Inline text={block.lines.join(" ")} />
              </p>
            );
          case "table":
            return <Table key={key} lines={block.lines} />;
          default:
            return (
              <p className="rm-paragraph" key={key}>
                <Inline text={block.lines.join(" ")} />
              </p>
            );
        }
      })}
    </>
  );
}

function ModuleChips({ modules }: { modules: Module[] }) {
  if (modules.length === 0) return null;
  return (
    <div className="rm-modules" aria-label="Curriculum built for this part of the roadmap">
      <span className="rm-modules-label">On this site:</span>
      {modules.map((courseModule) => (
        <Link
          key={courseModule.slug}
          href={`/learn/${courseModule.slug}`}
          className={`module-chip${courseModule.status === "planned" ? " planned" : ""}`}
        >
          <span className="module-chip-title">{courseModule.title}</span>
          <span className={`status ${courseModule.status}`}>
            {courseModule.status === "available" ? "Available" : "Planned"}
          </span>
        </Link>
      ))}
    </div>
  );
}

function SectionBody({
  section,
  passOf,
  cycle,
  doneIn,
  phaseModules,
  groupModules,
}: {
  section: RoadmapSection;
  passOf: (id: string) => number;
  cycle: (id: string) => void;
  doneIn: (section: RoadmapSection) => number;
  phaseModules?: Module[];
  groupModules?: (groupNumber: string) => Module[];
}) {
  return (
    <>
      <Blocks blocks={section.intro} passOf={passOf} cycle={cycle} />
      {phaseModules ? <ModuleChips modules={phaseModules} /> : null}
      {section.groups.map((group) => (
        <section className="rm-group" id={group.id} key={group.id}>
          <h3>
            {group.number ? <span className="rm-group-number">{group.number}</span> : null}
            <Inline text={group.title} />
            {group.topicCount > 0 ? <span className="rm-group-count">{group.topicCount} topics</span> : null}
          </h3>
          <Blocks blocks={group.blocks} passOf={passOf} cycle={cycle} />
          {group.number && groupModules ? <ModuleChips modules={groupModules(group.number)} /> : null}
        </section>
      ))}
      {section.proofGate ? (
        <aside className="rm-proof-gate">
          <p className="rm-proof-gate-label">Proof Gate — the real checkbox</p>
          <Blocks blocks={section.proofGate} passOf={passOf} cycle={cycle} />
        </aside>
      ) : null}
      {section.topicCount > 0 ? (
        <p className="rm-section-progress">
          {doneIn(section)} / {section.topicCount} topics ticked
        </p>
      ) : null}
    </>
  );
}

export function RoadmapDocument({ roadmap, modules }: { roadmap: Roadmap; modules: Module[] }) {
  const { progress, hydrated, cycleTopicPass } = useProgress();
  const passes = progress.topicPasses;

  const modulesByPhase = useMemo(() => {
    const map = new Map<number, Module[]>();
    for (const courseModule of modules) {
      if (courseModule.roadmapPhase === undefined) continue;
      const list = map.get(courseModule.roadmapPhase) ?? [];
      list.push(courseModule);
      map.set(courseModule.roadmapPhase, list);
    }
    return map;
  }, [modules]);

  const modulesByGroup = useMemo(() => {
    const map = new Map<string, Module[]>();
    for (const courseModule of modules) {
      if (!courseModule.roadmapGroup) continue;
      const list = map.get(courseModule.roadmapGroup) ?? [];
      list.push(courseModule);
      map.set(courseModule.roadmapGroup, list);
    }
    return map;
  }, [modules]);

  const phaseOnlyModules = (phase: number) =>
    (modulesByPhase.get(phase) ?? []).filter((courseModule) => !courseModule.roadmapGroup);

  const passOf = (id: string) => (hydrated ? passes[id] ?? 0 : 0);
  const doneIn = (section: RoadmapSection) => {
    if (!hydrated) return 0;
    let count = 0;
    const walk = (blocks: RoadmapBlock[]) => {
      for (const block of blocks) for (const topic of block.items ?? []) if ((passes[topic.id] ?? 0) >= MAX_PASS) count += 1;
    };
    walk(section.intro);
    for (const group of section.groups) walk(group.blocks);
    if (section.proofGate) walk(section.proofGate);
    return count;
  };

  const completed = hydrated
    ? Object.entries(passes).filter(([id, pass]) => id.startsWith("roadmap:") && pass >= MAX_PASS).length
    : 0;
  const percent = roadmap.topicCount === 0 ? 0 : Math.round((completed / roadmap.topicCount) * 100);

  return (
    <div className="rm">
      <header className="page-header">
        <p className="eyebrow">MASTERY ROADMAP</p>
        <h1>{roadmap.title}</h1>
        <ul className="rm-meta">
          {roadmap.meta.map((line, index) => (
            <li key={index}>
              <Inline text={line} />
            </li>
          ))}
        </ul>
        <p className="rm-progress-line">
          <strong>
            <AnimatedNumber value={completed} /> / {roadmap.topicCount}
          </strong>{" "}
          topics ticked (<AnimatedNumber value={percent} suffix="%" />) across {roadmap.phases.length} phases. Nothing
          is gated — work the phases in order, but read anything, anytime.
        </p>
        {!roadmap.complete ? (
          <p className="rm-incomplete">
            This document is stored verbatim and is currently <strong>incomplete</strong>: its source was truncated
            partway through section 10.3. The missing tail must be pasted into{" "}
            <code>{roadmap.sourcePath}</code>; this page updates itself the moment it is.
          </p>
        ) : null}
      </header>

      <nav className="rm-toc" aria-label="Roadmap contents">
        {roadmap.frontSections.map((section) => (
          <a href={`#${section.id}`} key={section.id}>
            {section.title}
          </a>
        ))}
        {roadmap.phases.map((phase) => (
          <a href={`#${phase.id}`} key={phase.id}>
            <span className="rm-toc-number">P{phase.number}</span>
            {phase.title}
          </a>
        ))}
        {roadmap.appendixSections.map((section) => (
          <a href={`#${section.id}`} key={section.id}>
            {section.title}
          </a>
        ))}
      </nav>

      {roadmap.notice.length > 0 ? (
        <aside className="rm-notice">
          {roadmap.notice.map((line, index) => (
            <p key={index}>
              <Inline text={line} />
            </p>
          ))}
        </aside>
      ) : null}

      {roadmap.frontSections.map((section) => (
        <Reveal as="section" className="rm-section" id={section.id} key={section.id}>
          <h2>{section.title}</h2>
          <SectionBody section={section} passOf={passOf} cycle={cycleTopicPass} doneIn={doneIn} />
        </Reveal>
      ))}

      {roadmap.phases.map((phase) => (
        <Reveal as="section" className="rm-section rm-phase" id={phase.id} key={phase.id}>
          <h2>
            <span className="rm-phase-number">Phase {phase.number}</span>
            {phase.title}
          </h2>
          <p className="rm-phase-meta">
            <span className={`rm-tag${phase.tag.includes("CORE") ? " is-core" : ""}`}>{phase.tag}</span>
            <span className="rm-duration">{phase.duration}</span>
          </p>
          <SectionBody
            section={phase}
            passOf={passOf}
            cycle={cycleTopicPass}
            doneIn={doneIn}
            phaseModules={phaseOnlyModules(phase.number)}
            groupModules={(groupNumber) => modulesByGroup.get(groupNumber) ?? []}
          />
        </Reveal>
      ))}

      {roadmap.appendixSections.map((section) => (
        <Reveal as="section" className="rm-section" id={section.id} key={section.id}>
          <h2>{section.title}</h2>
          <SectionBody section={section} passOf={passOf} cycle={cycleTopicPass} doneIn={doneIn} />
        </Reveal>
      ))}
    </div>
  );
}
