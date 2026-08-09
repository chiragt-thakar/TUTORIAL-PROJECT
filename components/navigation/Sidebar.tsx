"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Module, Track } from "@/types/curriculum";
import { useProgress } from "@/components/progress/ProgressProvider";
import { percentage } from "@/lib/progress/progress";

export function Sidebar({ modules, tracks }: { modules: Module[]; tracks: Track[] }) {
  const pathname = usePathname();
  const { progress, hydrated } = useProgress();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand"><Link href="/">ZeroToHero<span>_</span></Link><p>Python · Backend · AI · ML</p></div>
      <nav aria-label="Curriculum">
        <Link className={pathname === "/" ? "nav-overview active" : "nav-overview"} href="/">Command Center</Link>
        <Link className={pathname === "/roadmap" ? "nav-overview active" : "nav-overview"} href="/roadmap">Skill tree</Link>
        <Link className={pathname === "/learn" ? "nav-overview active" : "nav-overview"} href="/learn">All tracks</Link>
        <Link className={pathname === "/account" ? "nav-overview active" : "nav-overview"} href="/account">Account &amp; sync</Link>
        {tracks.map((track) => {
          const trackModules = modules.filter((module) => module.track === track.slug);
          const trackActive = pathname.includes(`/tracks/${track.slug}`) || trackModules.some((module) => pathname.includes(`/learn/${module.slug}`));
          return (
            <div className="sidebar-track" key={track.slug}>
              <Link className={pathname === `/tracks/${track.slug}` ? "sidebar-track-heading active" : "sidebar-track-heading"} href={`/tracks/${track.slug}`}>
                <span>{track.title}</span>
                {track.status === "planned" && <span className="status planned">Planned</span>}
              </Link>
              {trackModules.map((module) => {
                const ids = module.lessons.map((lesson) => lesson.id);
                const done = ids.filter((id) => progress.completedLessons.includes(id)).length;
                return (
                  <details key={module.slug} open={trackActive && pathname.includes(`/learn/${module.slug}`)}>
                    <summary>
                      <span className="module-index">{String(module.number).padStart(2, "0")}</span>
                      <span>
                        <Link className="module-title-link" href={`/learn/${module.slug}`}>{module.title}</Link>
                        <small>{module.status === "planned" ? "Planned — always open" : `${hydrated ? percentage(done, ids.length) : 0}% complete`}</small>
                      </span>
                    </summary>
                    <div className="lesson-links">
                      {module.lessons.map((lesson) => module.status === "available" ? (
                        <Link key={lesson.id} className={pathname.endsWith(`/${lesson.slug}`) ? "active" : ""} href={`/learn/${module.slug}/${lesson.slug}`}>
                          <span aria-hidden="true">{progress.completedLessons.includes(lesson.id) ? "✓" : lesson.order}</span>{lesson.title}
                        </Link>
                      ) : (
                        <span className="planned-link" key={lesson.id}><span aria-hidden="true">·</span>{lesson.title}</span>
                      ))}
                    </div>
                  </details>
                );
              })}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

export function MobileNavigation({ modules, tracks }: { modules: Module[]; tracks: Track[] }) {
  return <details className="mobile-nav"><summary>Curriculum menu</summary><Sidebar modules={modules} tracks={tracks} /></details>;
}
