import type { Metadata } from "next";
import Link from "next/link";
import { getGroups, getModules } from "@/lib/content/loader";
import { GroupCards } from "@/components/learning/GroupCards";
import { ResetProgress } from "@/components/progress/ProgressWidgets";

export const metadata: Metadata = {
  title: "All topics",
  description: "Every phase of the AI/ML Mastery Roadmap, its sections in the document's own order, and the extra material written before the site followed it.",
};

export default async function CurriculumPage() {
  const [groups, modules] = await Promise.all([getGroups(), getModules()]);
  return (
    <div className="standard-page">
      <header className="page-header">
        <p className="eyebrow">ALL TOPICS</p>
        <h1>Every topic, in roadmap order.</h1>
        <p>One group per phase of the mastery roadmap, in the document&rsquo;s own order, then its cross-cutting tracks. Each group holds that phase&rsquo;s sections numbered as the roadmap numbers them, and each section holds its checkbox topics as lessons. <strong>Extra Learning</strong>, last, is the material written before this site followed the roadmap — real and finished, just not part of the sequence. Nothing is gated.</p>
        <p className="roadmap-mastery-link"><Link href="/roadmap/mastery">Open the Mastery Roadmap hub →</Link></p>
        <ResetProgress />
      </header>
      <GroupCards groups={groups} modules={modules} />
    </div>
  );
}
