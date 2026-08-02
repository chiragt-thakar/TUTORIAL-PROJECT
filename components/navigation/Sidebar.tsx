"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Module } from "@/types/curriculum";
import { useProgress } from "@/components/progress/ProgressProvider";
import { percentage } from "@/lib/progress/progress";

export function Sidebar({ modules }: { modules: Module[] }) {
  const pathname = usePathname();
  const { progress, hydrated } = useProgress();
  return <aside className="sidebar"><div className="sidebar-brand"><Link href="/">PyBackend<span>_</span></Link><p>Zero to Master</p></div><nav aria-label="Curriculum"><Link className={pathname === "/learn" ? "nav-overview active" : "nav-overview"} href="/learn">Curriculum overview</Link>{modules.map((module) => { const ids = module.lessons.map((lesson) => lesson.id); const done = ids.filter((id) => progress.completedLessons.includes(id)).length; return <details key={module.slug} open={pathname.includes(`/learn/${module.slug}`)}><summary><span className="module-index">{String(module.number).padStart(2, "0")}</span><span>{module.title}<small>{module.status === "planned" ? "Planned" : `${hydrated ? percentage(done, ids.length) : 0}% complete`}</small></span></summary><div className="lesson-links">{module.lessons.map((lesson) => module.status === "available" ? <Link key={lesson.id} className={pathname.endsWith(`/${lesson.slug}`) ? "active" : ""} href={`/learn/${module.slug}/${lesson.slug}`}><span aria-hidden="true">{progress.completedLessons.includes(lesson.id) ? "✓" : lesson.order}</span>{lesson.title}</Link> : <span className="planned-link" key={lesson.id}><span aria-hidden="true">·</span>{lesson.title}</span>)}</div></details>; })}</nav></aside>;
}

export function MobileNavigation({ modules }: { modules: Module[] }) { return <details className="mobile-nav"><summary>Curriculum menu</summary><Sidebar modules={modules} /></details>; }
