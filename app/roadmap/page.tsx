import type { Metadata } from "next";
import Link from "next/link";
import { getGroups, getModules } from "@/lib/content/loader";
import { RoadmapGraphLoader } from "@/components/roadmap/RoadmapGraphLoader";

export const metadata: Metadata = {
  title: "Roadmap",
  description: "The full skill tree: every phase of the mastery roadmap, every section inside it, and the extra material that covers the same ground.",
};

export default async function RoadmapPage() {
  const [modules, groups] = await Promise.all([getModules(), getGroups()]);
  return (
    <div className="roadmap-page">
      <header className="page-header roadmap-header">
        <p className="eyebrow">SKILL TREE</p>
        <h1>The whole map, zero to hero.</h1>
        <p className="roadmap-mastery-link"><Link href="/roadmap/mastery">Open the Mastery Roadmap hub →</Link> — the phase-by-phase plan you actually work through, with every topic tracked by the 3-pass rule. The verbatim source document lives at <Link href="/roadmap/mastery/source">/roadmap/mastery/source</Link>.</p>
        <p>Nothing here is gated — every section is always open. Each row is one roadmap phase, in the document&rsquo;s order, with its sections along it; the last row is Extra Learning. Nodes carry the roadmap&rsquo;s own section number, and dashed cyan lines connect an extra module to the roadmap section it covers. Click any node to jump straight to it.</p>
      </header>
      <RoadmapGraphLoader groups={groups} modules={modules} />
      <ul className="roadmap-legend" aria-hidden="true">
        <li><span className="dot status-available" /> Available</li>
        <li><span className="dot status-in-progress" /> In progress</li>
        <li><span className="dot status-completed" /> Completed</li>
        <li><span className="dot status-mastered" /> Mastered</li>
        <li><span className="dot status-planned" /> Planned — outline only, click in anytime</li>
      </ul>
    </div>
  );
}
