import type { Metadata } from "next";
import { getModules } from "@/lib/content/loader";
import { CurriculumCards } from "@/components/learning/CurriculumCards";
import { ResetProgress } from "@/components/progress/ProgressWidgets";
export const metadata: Metadata = { title: "Curriculum", description: "All available and planned Python backend learning modules." };
export default async function CurriculumPage() { const modules = await getModules(); return <div className="standard-page"><header className="page-header"><p className="eyebrow">CURRICULUM</p><h1>Python backend engineering, in dependency order.</h1><p>The first three modules are ready now. Later modules are deliberately planned—not padded with shallow placeholder lessons.</p><ResetProgress /></header><CurriculumCards modules={modules} /></div>; }
