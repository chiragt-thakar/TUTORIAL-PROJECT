import type { Metadata } from "next";
import { getModules, getTracks } from "@/lib/content/loader";
import { RoadmapGraphLoader } from "@/components/roadmap/RoadmapGraphLoader";

export const metadata: Metadata = {
  title: "Roadmap",
  description: "The full zero-to-hero skill tree: every track and module, how they connect, and what's next.",
};

export default async function RoadmapPage() {
  const [modules, tracks] = await Promise.all([getModules(), getTracks()]);
  return (
    <div className="roadmap-page">
      <header className="page-header roadmap-header">
        <p className="eyebrow">SKILL TREE</p>
        <h1>The whole map, zero to hero.</h1>
        <p>Nothing here is gated — every track and module is always open. Pan and zoom to explore; solid lines are the in-track sequence, dashed cyan lines are real cross-track prerequisites. Click any node to jump straight to it.</p>
      </header>
      <RoadmapGraphLoader tracks={tracks} modules={modules} />
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
