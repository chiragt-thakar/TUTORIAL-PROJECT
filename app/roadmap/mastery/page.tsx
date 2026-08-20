import type { Metadata } from "next";
import { getRoadmap } from "@/lib/content/roadmapLoader";
import { getModules } from "@/lib/content/loader";
import { buildPhases } from "@/lib/curriculum/phases";
import { PhaseHub } from "@/components/roadmap/PhaseHub";

export const metadata: Metadata = {
  title: "Mastery Roadmap",
  description:
    "The AI/ML Mastery Roadmap as a working surface: eleven phases, every topic tracked through the 3-pass rule, with the modules that teach them.",
};

export default async function MasteryRoadmapPage() {
  const [roadmap, modules] = await Promise.all([getRoadmap(), getModules()]);
  const phases = buildPhases(roadmap, modules);
  return (
    <div className="roadmap-page">
      <PhaseHub phases={phases} topicCount={roadmap.topicCount} complete={roadmap.complete} />
    </div>
  );
}
