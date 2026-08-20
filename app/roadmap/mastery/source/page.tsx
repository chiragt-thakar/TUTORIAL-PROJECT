import type { Metadata } from "next";
import Link from "next/link";
import { getRoadmap } from "@/lib/content/roadmapLoader";
import { getModules } from "@/lib/content/loader";
import { RoadmapDocument } from "@/components/roadmap/RoadmapDocument";

export const metadata: Metadata = {
  title: "Roadmap source",
  description:
    "The AI/ML Mastery Roadmap exactly as written — every phase, subsection, topic, resource, and Proof Gate, verbatim and unabridged.",
};

export default async function RoadmapSourcePage() {
  const [roadmap, modules] = await Promise.all([getRoadmap(), getModules()]);
  return (
    <div className="roadmap-page">
      <p className="rm-backlink">
        <Link href="/roadmap/mastery">← Back to the phase hub</Link>
      </p>
      <RoadmapDocument roadmap={roadmap} modules={modules} />
    </div>
  );
}
