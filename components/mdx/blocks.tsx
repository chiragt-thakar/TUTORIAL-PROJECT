import { Assignment, Exercise } from "./interactive";

function Block({ kind, title, children }: { kind: string; title: string; children: React.ReactNode }) { return <aside className={`mdx-block ${kind}`}><p className="mdx-block-title">{title}</p><div>{children}</div></aside>; }
export const Callout = ({ children }: { children: React.ReactNode }) => <Block kind="callout" title="Note">{children}</Block>;
export const Concept = ({ children }: { children: React.ReactNode }) => <Block kind="concept" title="Core concept">{children}</Block>;
export const WhyItMatters = ({ children }: { children: React.ReactNode }) => <Block kind="why" title="Why it matters">{children}</Block>;
export const TypeScriptComparison = ({ children }: { children: React.ReactNode }) => <Block kind="typescript" title="From TypeScript">{children}</Block>;
export const CommonMistake = ({ children }: { children: React.ReactNode }) => <Block kind="mistake" title="Common mistake">{children}</Block>;
export const ProductionNote = ({ children }: { children: React.ReactNode }) => <Block kind="production" title="Production note">{children}</Block>;
export const Checkpoint = ({ children }: { children: React.ReactNode }) => <Block kind="checkpoint" title="Checkpoint">{children}</Block>;
export const FurtherReading = ({ children }: { children: React.ReactNode }) => <Block kind="reading" title="Further reading">{children}</Block>;
export const CodeExample = ({ title, children }: { title?: string; children: React.ReactNode }) => <section className="code-example">{title && <p className="code-title">{title}</p>}{children}</section>;
export function Solution({ children }: { children: React.ReactNode }) { return <details className="solution"><summary>Reveal solution</summary><div>{children}</div></details>; }

export const mdxComponents = { Callout, Concept, WhyItMatters, TypeScriptComparison, CommonMistake, ProductionNote, Checkpoint, FurtherReading, CodeExample, Exercise, Solution, Assignment };
