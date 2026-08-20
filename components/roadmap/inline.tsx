import { Fragment, type ReactNode } from "react";

const TOKEN = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;

/**
 * Renders the small subset of inline markdown the roadmap uses: bold, italic, inline code,
 * and links. Deliberately not a full markdown engine — the roadmap's prose is hand-authored
 * and this keeps the rendered text identical to the source.
 */
export function Inline({ text }: { text: string }): ReactNode {
  const parts = text.split(TOKEN).filter((part) => part !== "");
  return (
    <>
      {parts.map((part, index) => {
        const key = `${index}-${part.slice(0, 12)}`;
        if (part.startsWith("**") && part.endsWith("**")) return <strong key={key}>{part.slice(2, -2)}</strong>;
        if (part.startsWith("`") && part.endsWith("`")) return <code key={key}>{part.slice(1, -1)}</code>;
        const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
        if (link) {
          return (
            <a key={key} href={link[2]} target="_blank" rel="noreferrer noopener">
              {link[1]}
            </a>
          );
        }
        if (part.startsWith("*") && part.endsWith("*") && part.length > 2) return <em key={key}>{part.slice(1, -1)}</em>;
        return <Fragment key={key}>{part}</Fragment>;
      })}
    </>
  );
}
