import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getGroups, getModule, getModules } from "@/lib/content/loader";
import { getRoadmap } from "@/lib/content/roadmapLoader";
import { findRoadmapSection, proseBlocks, resourceBlocks } from "@/lib/curriculum/roadmapSections";
import { ContinueLearning, OverallProgress } from "@/components/progress/ProgressWidgets";
import { RoadmapProse, RoadmapResources } from "@/components/roadmap/RoadmapSource";
import { isLessonPublished } from "@/lib/content/published";

type Props = { params: Promise<{ moduleSlug: string }> };

export async function generateStaticParams() {
  return (await getModules()).map((courseModule) => ({ moduleSlug: courseModule.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const courseModule = await getModule((await params).moduleSlug);
  return courseModule ? { title: courseModule.title, description: courseModule.description } : {};
}

export default async function ModulePage({ params }: Props) {
  const courseModule = await getModule((await params).moduleSlug);
  if (!courseModule) notFound();
  const [groups, roadmap] = await Promise.all([getGroups(), getRoadmap()]);
  const group = groups.find((item) => item.slug === courseModule.group);
  const view = courseModule.roadmapSectionId ? findRoadmapSection(roadmap, courseModule.roadmapSectionId) : null;
  const lessons = courseModule.lessons.map((lesson) => ({ id: lesson.id, href: `/learn/${courseModule.slug}/${lesson.slug}` }));
  const eyebrow = courseModule.roadmapRef
    ? `ROADMAP ${courseModule.roadmapRef}${courseModule.tag ? ` · ${courseModule.tag}` : ""}`
    : `MODULE ${String(courseModule.number).padStart(2, "0")} · ${courseModule.status.toUpperCase()}`;

  return (
    <div className="standard-page module-page">
      <header className="page-header">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/learn">All topics</Link>
          <span>/</span>
          <Link href={`/paths/${courseModule.group}`}>{group?.title ?? courseModule.group}</Link>
        </nav>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{courseModule.title}</h1>
        <p>{courseModule.description}</p>
        <div className="module-facts">
          <span>
            {courseModule.lessons.length} {view ? "topics" : "lessons"}
          </span>
          <span>{Math.round(courseModule.estimatedMinutes / 60)} hours</span>
          <span>
            {courseModule.prerequisites.length
              ? `Requires ${courseModule.prerequisites.join(", ")}`
              : "No course prerequisites"}
          </span>
          {courseModule.relatedRoadmapSection ? <span>Overlaps roadmap {courseModule.relatedRoadmapSection}</span> : null}
        </div>
        {courseModule.status === "available" ? (
          <>
            <OverallProgress lessonIds={courseModule.lessons.map((lesson) => lesson.id)} />
            <ContinueLearning lessons={lessons} />
          </>
        ) : view ? (
          <p className="planned-notice">
            These are the roadmap&rsquo;s own topics for {courseModule.roadmapRef}, in its order, with nothing added or
            dropped. No lesson has been written for them yet — tick them off by the 3-pass rule on the{" "}
            <Link href="/roadmap/mastery">phase hub</Link> while the writing catches up.
          </p>
        ) : (
          <p className="planned-notice">
            This module is still being authored. Lessons are published one at a time as each is finished — any lesson
            shown as a link below is complete and ready to read.
          </p>
        )}
      </header>

      {view ? <RoadmapProse blocks={proseBlocks(view.blocks)} /> : null}

      <section className="outcomes">
        <p className="eyebrow">BY THE END</p>
        <h2>Learning outcomes</h2>
        <ul>
          {courseModule.learningOutcomes.map((outcome) => (
            <li key={outcome}>{outcome}</li>
          ))}
        </ul>
      </section>

      <section className="lesson-list">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{view ? "TOPICS" : "LESSONS"}</p>
            <h2>{courseModule.status === "available" ? "Study sequence" : "Planned sequence"}</h2>
          </div>
        </div>
        {courseModule.lessons.map((lesson) => (
          <article key={lesson.id}>
            <span className="lesson-number">{String(lesson.order).padStart(2, "0")}</span>
            <div>
              <h3>
                {isLessonPublished(courseModule, lesson) ? (
                  <Link href={`/learn/${courseModule.slug}/${lesson.slug}`}>{lesson.title}</Link>
                ) : (
                  lesson.title
                )}
              </h3>
              {lesson.description ? <p>{lesson.description}</p> : null}
              <small>
                {lesson.estimatedMinutes} min
                {lesson.learningObjectives.length > 0 ? ` · ${lesson.learningObjectives.length} objectives` : ""}
              </small>
            </div>
            {isLessonPublished(courseModule, lesson) && (
              <Link className="lesson-arrow" aria-label={`Open ${lesson.title}`} href={`/learn/${courseModule.slug}/${lesson.slug}`}>
                →
              </Link>
            )}
          </article>
        ))}
        {courseModule.assignment && (
          <article className="assignment-row">
            <span className="lesson-number">A</span>
            <div>
              <h3>
                <Link href={`/learn/${courseModule.slug}/${courseModule.assignment.slug}`}>
                  {courseModule.assignment.title}
                </Link>
              </h3>
              {courseModule.assignment.description ? <p>{courseModule.assignment.description}</p> : null}
              <small>{courseModule.assignment.estimatedMinutes} min · Cumulative project increment</small>
            </div>
            <Link
              className="lesson-arrow"
              aria-label={`Open ${courseModule.assignment.title}`}
              href={`/learn/${courseModule.slug}/${courseModule.assignment.slug}`}
            >
              →
            </Link>
          </article>
        )}
      </section>

      {view ? <RoadmapResources blocks={resourceBlocks(view.blocks)} sectionLabel={courseModule.roadmapRef} /> : null}
    </div>
  );
}
