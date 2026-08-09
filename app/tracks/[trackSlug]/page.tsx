import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getModulesByTrack, getTracks } from "@/lib/content/loader";
import { CurriculumCards } from "@/components/learning/CurriculumCards";
import { OverallProgress } from "@/components/progress/ProgressWidgets";

type Props = { params: Promise<{ trackSlug: string }> };

export async function generateStaticParams() {
  return (await getTracks()).map((track) => ({ trackSlug: track.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { trackSlug } = await params;
  const track = (await getTracks()).find((item) => item.slug === trackSlug);
  return track ? { title: track.title, description: track.description } : {};
}

export default async function TrackPage({ params }: Props) {
  const { trackSlug } = await params;
  const [tracks, modules] = await Promise.all([getTracks(), getModulesByTrack(trackSlug)]);
  const track = tracks.find((item) => item.slug === trackSlug);
  if (!track) notFound();
  const available = modules.filter((module) => module.status === "available");
  const lessonIds = available.flatMap((module) => module.lessons.map((lesson) => lesson.id));
  return <div className="standard-page">
    <header className="page-header">
      <p className="eyebrow">TRACK {String(track.number).padStart(2, "0")} · {track.status.toUpperCase()}</p>
      <h1>{track.title}</h1>
      <p>{track.description}</p>
      {lessonIds.length > 0 && <div className="module-facts"><span>{modules.length} modules</span></div>}
      {lessonIds.length > 0 && <OverallProgress lessonIds={lessonIds} />}
      {track.status === "planned" && <p className="planned-notice">This track is curriculum-planned. Modules below unlock as they are fully authored and reviewed.</p>}
    </header>
    <CurriculumCards modules={modules} />
  </div>;
}
