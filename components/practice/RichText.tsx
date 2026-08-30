import { Fragment } from "react";

/**
 * The tiny prose format the practice YAML is written in.
 *
 * Practice content is data, not MDX, so it cannot be compiled — but a hint or an explanation
 * still needs `inline code`, emphasis and the occasional link to read properly. Rather than ship
 * a markdown parser to the browser for three features, this handles exactly those three plus
 * paragraphs and bullet lists, and nothing else.
 *
 * Anything needing more structure than this wants to be a `code` field or a list field in the
 * schema instead. That constraint is deliberate: it keeps authored practice content skimmable.
 */

const INLINE = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;

function inline(text: string, keyPrefix: string) {
  return text.split(INLINE).filter(Boolean).map((piece, index) => {
    const key = `${keyPrefix}-${index}`;
    if (piece.startsWith("`") && piece.endsWith("`")) return <code key={key}>{piece.slice(1, -1)}</code>;
    if (piece.startsWith("**") && piece.endsWith("**")) return <strong key={key}>{piece.slice(2, -2)}</strong>;
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(piece);
    if (link) {
      return (
        <a key={key} href={link[2]}>
          {link[1]}
        </a>
      );
    }
    return <Fragment key={key}>{piece}</Fragment>;
  });
}

export function RichText({ text, className }: { text: string; className?: string }) {
  const blocks = text.trim().split(/\n\s*\n/);
  return (
    <div className={className ? `rich-text ${className}` : "rich-text"}>
      {blocks.map((block, blockIndex) => {
        const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
        if (lines.every((line) => line.startsWith("- "))) {
          return (
            <ul key={blockIndex}>
              {lines.map((line, lineIndex) => (
                <li key={lineIndex}>{inline(line.slice(2), `${blockIndex}-${lineIndex}`)}</li>
              ))}
            </ul>
          );
        }
        return <p key={blockIndex}>{inline(lines.join(" "), String(blockIndex))}</p>;
      })}
    </div>
  );
}

/** One-line variant for question prompts and titles, where a wrapping `<p>` would be wrong. */
export function RichLine({ text }: { text: string }) {
  return <>{inline(text, "line")}</>;
}
