import type { Metadata } from "next";
import { getModules } from "@/lib/content/loader";
import { CurriculumCards } from "@/components/learning/CurriculumCards";
import { ResetProgress } from "@/components/progress/ProgressWidgets";

export const metadata: Metadata = {
  title: "Curriculum",
  description: "Fifteen complete Python backend and FastAPI learning modules.",
};

export default async function CurriculumPage() {
  const modules = await getModules();
  return (
    <div className="standard-page">
      <header className="page-header">
        <p className="eyebrow">CURRICULUM</p>
        <h1>Python backend engineering, in dependency order.</h1>
        <p>All fifteen modules are fully authored, from Python fundamentals through FastAPI, persistence, reliability, and advanced Python concurrency.</p>
        <ResetProgress />
      </header>
      <CurriculumCards modules={modules} />
    </div>
  );
}
