import type { Metadata } from "next";
import Link from "next/link";
import { getModules, getTracks } from "@/lib/content/loader";
import { ResumeCard } from "@/components/dashboard/ResumeCard";
import { SkillProgress } from "@/components/dashboard/SkillProgress";
import { AllModulesOverview } from "@/components/dashboard/AllModulesOverview";
import { LearningStreak } from "@/components/progress/StreakWidget";
import { TrackCards } from "@/components/learning/TrackCards";

export const metadata: Metadata = {
  title: "Command Center",
  description: "Your personal AI engineering command center: resume where you left off, streak, skill progress, and every track and module from Python zero to advanced Gen AI, always open.",
};

export default async function Home() {
  const [modules, tracks] = await Promise.all([getModules(), getTracks()]);
  const totalLessons = modules.reduce((sum, module) => sum + module.lessons.length, 0);
  const availableCount = modules.filter((module) => module.status === "available").length;

  return (
    <div className="command-center">
      <header className="command-header">
        <p className="eyebrow">ZERO TO HERO · COMMAND CENTER</p>
        <h1>Python → Backend → Gen AI → AI/ML.</h1>
        <p className="command-sub">{availableCount} of {modules.length} modules live across {tracks.length} tracks · {totalLessons} lessons on the map · nothing is gated.</p>
      </header>

      <section className="command-grid">
        <ResumeCard modules={modules} />
        <LearningStreak />
      </section>

      <section className="home-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">THE TRACKS</p>
            <h2>Every track on the map</h2>
          </div>
          <Link className="inline-link" href="/roadmap">Open the skill tree <span aria-hidden="true">→</span></Link>
        </div>
        <TrackCards tracks={tracks} modules={modules} />
      </section>

      <section className="home-section">
        <SkillProgress tracks={tracks} modules={modules} />
      </section>

      <section className="home-section">
        <AllModulesOverview tracks={tracks} modules={modules} />
      </section>
    </div>
  );
}
