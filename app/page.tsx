import type { Metadata } from "next";
import Link from "next/link";
import { getGroups, getModules } from "@/lib/content/loader";
import { getRoadmap } from "@/lib/content/roadmapLoader";
import { buildPhases } from "@/lib/curriculum/phases";
import { ResumeCard } from "@/components/dashboard/ResumeCard";
import { PhaseProgressPanel } from "@/components/dashboard/PhaseProgressPanel";
import { SkillProgress } from "@/components/dashboard/SkillProgress";
import { AllModulesOverview } from "@/components/dashboard/AllModulesOverview";
import { LearningStreak } from "@/components/progress/StreakWidget";
import { StudyTimer } from "@/components/study/StudyTimer";
import { ReviewQueue } from "@/components/study/ReviewQueue";
import { GroupCards } from "@/components/learning/GroupCards";
import { Reveal } from "@/components/motion/Reveal";

export const metadata: Metadata = {
  title: "Command Center",
  description:
    "Your AI engineering command center: the roadmap phase you're on, what to do next, this week's cadence against the plan, your review queue, and every phase and section — always open.",
};

export default async function Home() {
  const [modules, groups, roadmap] = await Promise.all([getModules(), getGroups(), getRoadmap()]);
  const phases = buildPhases(roadmap, modules);
  const totalLessons = modules.reduce((sum, module) => sum + module.lessons.length, 0);
  const availableCount = modules.filter((module) => module.status === "available").length;

  return (
    <div className="command-center">
      <header className="command-header">
        <p className="eyebrow">COMMAND CENTER</p>
        <h1>One roadmap. Eleven phases. Start where you are.</h1>
        <p className="command-sub">
          {roadmap.topicCount} roadmap topics · {availableCount} of {modules.length} modules live across {groups.length}{" "}
          groups · {totalLessons} lessons on the map · nothing is gated.
        </p>
      </header>

      <section className="command-grid">
        <ResumeCard modules={modules} />
        <LearningStreak />
      </section>

      <Reveal as="section" className="command-grid command-grid-study">
        <StudyTimer />
        <ReviewQueue phases={phases} />
      </Reveal>

      <Reveal as="section" className="home-section">
        <PhaseProgressPanel phases={phases} />
      </Reveal>

      <Reveal as="section" className="home-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">THE CURRICULUM</p>
            <h2>Every topic, in roadmap order</h2>
          </div>
          <Link className="inline-link" href="/roadmap">
            Open the skill tree <span aria-hidden="true">→</span>
          </Link>
        </div>
        <GroupCards groups={groups} modules={modules} />
      </Reveal>

      <Reveal as="section" className="home-section">
        <SkillProgress groups={groups} modules={modules} />
      </Reveal>

      <Reveal as="section" className="home-section">
        <AllModulesOverview groups={groups} modules={modules} />
      </Reveal>
    </div>
  );
}
