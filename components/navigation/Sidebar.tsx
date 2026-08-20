"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CurriculumGroup, Module, Track } from "@/types/curriculum";
import { useProgress } from "@/components/progress/ProgressProvider";
import { isLessonPublished } from "@/lib/content/published";
import { buildGroups, isRoadmapModule, navRef, subgroupByTrack } from "@/lib/curriculum/groups";
import { percentage } from "@/lib/progress/progress";

/**
 * Curriculum navigation: the AI/ML Mastery Roadmap, in its own order.
 *
 * One entry per roadmap phase, then the cross-cutting tracks, then Extra Learning — the
 * material written before this site followed the roadmap, grouped by the curriculum it came
 * from. Section numbers ("1.2") come straight from the document. Nothing here is gated.
 */

function ModuleEntry({
  courseModule,
  open,
  pathname,
  completed,
  hydrated,
}: {
  courseModule: Module;
  open: boolean;
  pathname: string;
  completed: string[];
  hydrated: boolean;
}) {
  const ids = courseModule.lessons.map((lesson) => lesson.id);
  const done = ids.filter((id) => completed.includes(id)).length;
  const onRoadmap = isRoadmapModule(courseModule);
  const summary =
    courseModule.status === "available"
      ? `${hydrated ? percentage(done, ids.length) : 0}% complete`
      : onRoadmap
        ? `${ids.length} ${ids.length === 1 ? "topic" : "topics"} · not written yet`
        : "Planned — always open";

  return (
    <details open={open}>
      <summary>
        <span className={onRoadmap ? "module-tag is-roadmap" : "module-tag"} aria-hidden="true">
          {onRoadmap ? navRef(courseModule) : ""}
        </span>
        <span>
          <Link className="module-title-link" href={`/learn/${courseModule.slug}`}>
            {courseModule.title}
          </Link>
          <small>{summary}</small>
        </span>
      </summary>
      <div className="lesson-links">
        {courseModule.lessons.map((lesson) =>
          isLessonPublished(courseModule, lesson) ? (
            <Link
              key={lesson.id}
              className={pathname.endsWith(`/${lesson.slug}`) ? "active" : ""}
              href={`/learn/${courseModule.slug}/${lesson.slug}`}
            >
              <span aria-hidden="true">{completed.includes(lesson.id) ? "✓" : lesson.order}</span>
              {lesson.title}
            </Link>
          ) : (
            <span className="planned-link" key={lesson.id}>
              <span aria-hidden="true">·</span>
              {lesson.title}
            </span>
          ),
        )}
      </div>
    </details>
  );
}

export function Sidebar({ modules, groups, tracks }: { modules: Module[]; groups: CurriculumGroup[]; tracks: Track[] }) {
  const pathname = usePathname();
  const { progress, hydrated } = useProgress();
  const built = buildGroups(groups, modules);

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <Link href="/">
          ZeroToHero<span>_</span>
        </Link>
        <p>The mastery roadmap, section by section.</p>
      </div>
      <nav aria-label="Curriculum">
        <Link className={pathname === "/" ? "nav-overview active" : "nav-overview"} href="/">Command Center</Link>
        <Link className={pathname === "/practice" ? "nav-overview active" : "nav-overview"} href="/practice">Practice</Link>
        <Link className={pathname === "/roadmap/mastery" ? "nav-overview active" : "nav-overview"} href="/roadmap/mastery">Mastery roadmap</Link>
        <Link className={pathname === "/roadmap/mastery/source" ? "nav-overview nav-sub active" : "nav-overview nav-sub"} href="/roadmap/mastery/source">↳ Source document</Link>
        <Link className={pathname === "/roadmap" ? "nav-overview active" : "nav-overview"} href="/roadmap">Skill tree</Link>
        <Link className={pathname === "/learn" ? "nav-overview active" : "nav-overview"} href="/learn">All topics</Link>
        <Link className={pathname === "/account" ? "nav-overview active" : "nav-overview"} href="/account">Account &amp; sync</Link>

        {built.map((group) => {
          const groupActive =
            pathname.includes(`/paths/${group.slug}`) ||
            group.modules.some((courseModule) => pathname.includes(`/learn/${courseModule.slug}`));
          const isOpen = (courseModule: Module) => groupActive && pathname.includes(`/learn/${courseModule.slug}`);
          return (
            <div className={group.kind === "extra" ? "sidebar-track is-extra" : "sidebar-track"} key={group.slug}>
              <Link
                className={pathname === `/paths/${group.slug}` ? "sidebar-track-heading active" : "sidebar-track-heading"}
                href={`/paths/${group.slug}`}
              >
                <span>{group.title}</span>
              </Link>
              {group.kind === "extra"
                ? subgroupByTrack(group.modules, tracks).map((subgroup) => (
                    <div className="sidebar-subgroup" key={subgroup.track}>
                      <p className="sidebar-subgroup-heading">{subgroup.title}</p>
                      {subgroup.modules.map((courseModule) => (
                        <ModuleEntry
                          key={courseModule.slug}
                          courseModule={courseModule}
                          open={isOpen(courseModule)}
                          pathname={pathname}
                          completed={progress.completedLessons}
                          hydrated={hydrated}
                        />
                      ))}
                    </div>
                  ))
                : group.modules.map((courseModule) => (
                    <ModuleEntry
                      key={courseModule.slug}
                      courseModule={courseModule}
                      open={isOpen(courseModule)}
                      pathname={pathname}
                      completed={progress.completedLessons}
                      hydrated={hydrated}
                    />
                  ))}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

export function MobileNavigation({ modules, groups, tracks }: { modules: Module[]; groups: CurriculumGroup[]; tracks: Track[] }) {
  return (
    <details className="mobile-nav">
      <summary>Curriculum menu</summary>
      <Sidebar modules={modules} groups={groups} tracks={tracks} />
    </details>
  );
}
