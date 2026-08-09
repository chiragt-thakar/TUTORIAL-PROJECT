import type { Metadata } from "next";
import { getModules, getTracks } from "@/lib/content/loader";
import { TrackCards } from "@/components/learning/TrackCards";
import { ResetProgress } from "@/components/progress/ProgressWidgets";

export const metadata: Metadata = {
  title: "All tracks",
  description: "Every track on this learning platform: Python backend, Python libraries, generative AI, machine learning, and the maths behind them.",
};

export default async function CurriculumPage() {
  const [tracks, modules] = await Promise.all([getTracks(), getModules()]);
  return (
    <div className="standard-page">
      <header className="page-header">
        <p className="eyebrow">ALL TRACKS</p>
        <h1>Pick a track. Every one leads somewhere real.</h1>
        <p>One learning platform, five tracks, zero prior AI/ML knowledge assumed. Work through them in order, or jump straight to what you need.</p>
        <ResetProgress />
      </header>
      <TrackCards tracks={tracks} modules={modules} />
    </div>
  );
}
