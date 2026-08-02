import { parse } from "yaml";

export function parseMdxFrontmatter(source: string): { data: unknown; content: string } {
  if (!source.startsWith("---\n") && !source.startsWith("---\r\n")) throw new Error("frontmatter must begin with ---");
  const normalized = source.replaceAll("\r\n", "\n");
  const end = normalized.indexOf("\n---\n", 4);
  if (end < 0) throw new Error("frontmatter must end with --- on its own line");
  return { data: parse(normalized.slice(4, end)), content: normalized.slice(end + 5) };
}
