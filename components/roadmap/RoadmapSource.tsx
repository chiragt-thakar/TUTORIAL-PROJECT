import { Inline } from "./inline";
import type { RoadmapBlock } from "@/types/roadmap";

/**
 * Renders roadmap prose inside the curriculum pages.
 *
 * Server components, deliberately read-only: the interactive 3-pass view of the same text lives
 * on the phase hub and the source page. What these add is context where the studying happens —
 * the section's own framing on its module page, and the phase's framing on its group page —
 * pulled from the markdown at request time rather than copied into the curriculum JSON.
 */

function Block({ block }: { block: RoadmapBlock }) {
  switch (block.kind) {
    case "bullets":
      return (
        <ul className="rm-list">
          {block.lines.map((line, index) => (
            <li key={index}>
              <Inline text={line} />
            </li>
          ))}
        </ul>
      );
    case "numbered":
      return (
        <ol className="rm-list">
          {block.lines.map((line, index) => (
            <li key={index}>
              <Inline text={line} />
            </li>
          ))}
        </ol>
      );
    case "label":
      return (
        <p className="rm-label">
          <Inline text={block.lines.join(" ")} />
        </p>
      );
    case "quote":
      return (
        <blockquote className="rm-quote">
          {block.lines.map((line, index) => (
            <p key={index}>
              <Inline text={line} />
            </p>
          ))}
        </blockquote>
      );
    default:
      return (
        <>
          {block.lines.map((line, index) => (
            <p key={index}>
              <Inline text={line} />
            </p>
          ))}
        </>
      );
  }
}

export function RoadmapProse({ blocks }: { blocks: RoadmapBlock[] }) {
  if (blocks.length === 0) return null;
  return (
    <div className="roadmap-prose">
      {blocks.map((block, index) => (
        <Block block={block} key={`${block.kind}-${index}`} />
      ))}
    </div>
  );
}

/**
 * The roadmap's "one resource per topic" recommendation for a section.
 *
 * The document is emphatic that resource-shopping is procrastination, so this is shown as the
 * single thing to read for the section rather than as a list of options among many.
 */
export function RoadmapResources({ blocks, sectionLabel }: { blocks: RoadmapBlock[]; sectionLabel?: string }) {
  if (blocks.length === 0) return null;
  return (
    <section className="roadmap-resources">
      <div className="section-heading">
        <div>
          <p className="eyebrow">FROM THE ROADMAP</p>
          <h2>What to read for {sectionLabel ?? "this section"}</h2>
        </div>
        <p>One resource per topic, as the roadmap prescribes. Finish it before looking at alternatives.</p>
      </div>
      {blocks.map((block, index) => (
        <Block block={block} key={index} />
      ))}
    </section>
  );
}

/** A phase's Proof Gate — the roadmap's real checkbox for finishing a phase. */
export function ProofGate({ blocks }: { blocks: RoadmapBlock[] | null }) {
  if (!blocks || blocks.length === 0) return null;
  const lines = blocks.flatMap((block) => block.lines);
  const body = lines.join(" ").replace(/^\*\*Proof Gate[^*]*\*\*:?\s*/, "");
  return (
    <section className="proof-gate">
      <p className="eyebrow">PROOF GATE</p>
      <p>
        <Inline text={body} />
      </p>
      <small>Checked boxes are not evidence. The gate is the real checkbox.</small>
    </section>
  );
}
