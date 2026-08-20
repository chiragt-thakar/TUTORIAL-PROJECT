import type { Resource } from "@/lib/practice/types";
import { RichLine } from "./RichText";

const TYPE_LABEL: Record<string, string> = {
  docs: "Official docs",
  tutorial: "Official tutorial",
  university: "University",
  article: "Article",
  interactive: "Interactive",
  video: "Video",
  repo: "Repository",
  book: "Book",
  talk: "Talk",
};

/**
 * Curated reading, sorted by usefulness.
 *
 * Every entry has to say *why* it is here and *what part of the topic* it covers, because the
 * brief rejects link dumps: a resource that cannot justify itself in one sentence is one the
 * learner will open once and never return to. Nothing below usefulness 3 is allowed in by the
 * schema at all.
 */
export function ResourceList({ resources }: { resources: Resource[] }) {
  if (resources.length === 0) return null;
  const sorted = [...resources].sort((a, b) => b.usefulness - a.usefulness);

  return (
    <ul className="resource-list">
      {sorted.map((resource) => (
        <li key={resource.url}>
          <div className="resource-head">
            <a href={resource.url} target="_blank" rel="noreferrer noopener">
              {resource.name}
            </a>
            <span className="resource-type">{TYPE_LABEL[resource.type] ?? resource.type}</span>
            <span className={`resource-difficulty is-${resource.difficulty}`}>{resource.difficulty}</span>
            <span className="resource-score" title={`Usefulness ${resource.usefulness} of 5`}>
              {"★".repeat(resource.usefulness)}
              <span className="resource-score-dim">{"★".repeat(5 - resource.usefulness)}</span>
            </span>
          </div>
          <p className="resource-why">
            <RichLine text={resource.why} />
          </p>
          <p className="resource-covers">
            Covers: <RichLine text={resource.covers} />
          </p>
        </li>
      ))}
    </ul>
  );
}
