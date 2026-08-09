import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getModule, getModules, getTracks } from "@/lib/content/loader";
import { ContinueLearning, OverallProgress } from "@/components/progress/ProgressWidgets";

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
  const track = (await getTracks()).find((item) => item.slug === courseModule.track);
  const lessons = courseModule.lessons.map((lesson) => ({ id: lesson.id, href: `/learn/${courseModule.slug}/${lesson.slug}` }));
  return <div className="standard-page module-page">
    <header className="page-header">
      <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/learn">All tracks</Link><span>/</span><Link href={`/tracks/${courseModule.track}`}>{track?.title ?? courseModule.track}</Link></nav>
      <p className="eyebrow">MODULE {String(courseModule.number).padStart(2, "0")} · {courseModule.status.toUpperCase()}</p>
      <h1>{courseModule.title}</h1><p>{courseModule.description}</p>
      <div className="module-facts"><span>{courseModule.lessons.length} lessons</span><span>{Math.round(courseModule.estimatedMinutes / 60)} hours</span><span>{courseModule.prerequisites.length ? `Requires ${courseModule.prerequisites.join(", ")}` : "No course prerequisites"}</span></div>
      {courseModule.status === "available" ? <><OverallProgress lessonIds={courseModule.lessons.map((lesson) => lesson.id)} /><ContinueLearning lessons={lessons} /></> : <p className="planned-notice">This module is curriculum-planned. Its lesson pages will unlock when the material is fully authored and reviewed.</p>}
    </header>
    <section className="outcomes"><p className="eyebrow">BY THE END</p><h2>Learning outcomes</h2><ul>{courseModule.learningOutcomes.map((outcome) => <li key={outcome}>{outcome}</li>)}</ul></section>
    <section className="lesson-list">
      <div className="section-heading"><div><p className="eyebrow">LESSONS</p><h2>{courseModule.status === "available" ? "Study sequence" : "Planned sequence"}</h2></div></div>
      {courseModule.lessons.map((lesson) => <article key={lesson.id}><span className="lesson-number">{String(lesson.order).padStart(2, "0")}</span><div><h3>{courseModule.status === "available" ? <Link href={`/learn/${courseModule.slug}/${lesson.slug}`}>{lesson.title}</Link> : lesson.title}</h3><p>{lesson.description}</p><small>{lesson.estimatedMinutes} min · {lesson.learningObjectives.length} objectives</small></div>{courseModule.status === "available" && <Link className="lesson-arrow" aria-label={`Open ${lesson.title}`} href={`/learn/${courseModule.slug}/${lesson.slug}`}>→</Link>}</article>)}
      {courseModule.assignment && <article className="assignment-row"><span className="lesson-number">A</span><div><h3><Link href={`/learn/${courseModule.slug}/${courseModule.assignment.slug}`}>{courseModule.assignment.title}</Link></h3><p>{courseModule.assignment.description}</p><small>{courseModule.assignment.estimatedMinutes} min · Cumulative project increment</small></div><Link className="lesson-arrow" aria-label={`Open ${courseModule.assignment.title}`} href={`/learn/${courseModule.slug}/${courseModule.assignment.slug}`}>→</Link></article>}
    </section>
  </div>;
}
