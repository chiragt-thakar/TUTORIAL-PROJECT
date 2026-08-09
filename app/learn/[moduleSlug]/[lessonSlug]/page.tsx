import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import { extractHeadings, getAdjacentLessons, getLesson, getModules, getTracks } from "@/lib/content/loader";
import { mdxComponents } from "@/components/mdx/blocks";
import { LessonProgress } from "@/components/progress/ProgressWidgets";
import { LessonNotes } from "@/components/lesson/LessonNotes";

type Props = { params: Promise<{ moduleSlug: string; lessonSlug: string }> };

export async function generateStaticParams() {
  return (await getModules()).filter((courseModule) => courseModule.status === "available").flatMap((courseModule) =>
    [...courseModule.lessons, ...(courseModule.assignment ? [courseModule.assignment] : [])].map((lesson) => ({ moduleSlug: courseModule.slug, lessonSlug: lesson.slug })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const value = await params;
  const lesson = await getLesson(value.moduleSlug, value.lessonSlug);
  return lesson ? { title: lesson.title, description: lesson.description } : {};
}

export default async function LessonPage({ params }: Props) {
  const value = await params;
  const [lesson, modules, tracks] = await Promise.all([getLesson(value.moduleSlug, value.lessonSlug), getModules(), getTracks()]);
  if (!lesson) notFound();
  const courseModule = modules.find((item) => item.slug === value.moduleSlug)!;
  const track = tracks.find((item) => item.slug === courseModule.track);
  const adjacent = getAdjacentLessons(modules, value.moduleSlug, value.lessonSlug);
  const headings = extractHeadings(lesson.source);

  const allLessons = modules.flatMap((module) => [...module.lessons, ...(module.assignment ? [module.assignment] : [])].map((item) => ({ ...item, module })));
  const prerequisites = lesson.prerequisites.map((id) => allLessons.find((item) => item.id === id)).filter((item): item is (typeof allLessons)[number] => Boolean(item));
  const moduleLessonIds = courseModule.lessons.map((item) => item.id);

  return <div className="lesson-layout">
    <article className="lesson-article">
      <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href={`/tracks/${courseModule.track}`}>{track?.title ?? courseModule.track}</Link><span>/</span><Link href={`/learn/${courseModule.slug}`}>Module {courseModule.number}</Link><span>/</span><span aria-current="page">{lesson.title}</span></nav>
      <header className="lesson-header"><p className="eyebrow">MODULE {String(courseModule.number).padStart(2, "0")} · {lesson.slug === "assignment" ? "ASSIGNMENT" : `LESSON ${String(lesson.order).padStart(2, "0")}`}</p><h1>{lesson.title}</h1><p>{lesson.description}</p><div className="lesson-meta"><span>{lesson.estimatedMinutes} min</span><span>{lesson.learningObjectives.length} objectives</span></div><div className="objective-box"><strong>Learning objectives</strong><ul>{lesson.learningObjectives.map((objective) => <li key={objective}>{objective}</li>)}</ul></div></header>
      <div className="prose"><MDXRemote source={lesson.source} components={mdxComponents} options={{ mdxOptions: { rehypePlugins: [rehypeSlug, [rehypePrettyCode, { theme: { light: "github-light", dark: "github-dark" }, keepBackground: false }]] } }} /></div>
      <LessonProgress lessonId={lesson.id} moduleLessonIds={moduleLessonIds} />
      <nav className="lesson-pagination" aria-label="Lesson pagination">{adjacent.previous ? <Link href={`/learn/${adjacent.previous.module.slug}/${adjacent.previous.lesson.slug}`}><small>Previous</small><span>← {adjacent.previous.lesson.title}</span></Link> : <span />}{adjacent.next ? <Link className="next" href={`/learn/${adjacent.next.module.slug}/${adjacent.next.lesson.slug}`}><small>Next</small><span>{adjacent.next.lesson.title} →</span></Link> : <Link className="next" href="/learn"><small>Course</small><span>Curriculum →</span></Link>}</nav>
    </article>
    <aside className="context-rail">
      {prerequisites.length > 0 && (
        <div className="context-section context-prereqs">
          <p>BUILDS ON</p>
          <ul>{prerequisites.map((item) => (
            <li key={item.id}><Link href={`/learn/${item.module.slug}/${item.slug}`}>{item.title}</Link><small>{item.module.title}</small></li>
          ))}</ul>
        </div>
      )}
      <div className="context-section toc">
        <p>ON THIS PAGE</p>
        <nav>{headings.map((heading) => <a className={heading.level === 3 ? "nested" : ""} href={`#${heading.id}`} key={heading.id}>{heading.title}</a>)}</nav>
      </div>
      <LessonNotes lessonId={lesson.id} />
    </aside>
  </div>;
}
