import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getGroups, getModules, getTracks } from "@/lib/content/loader";
import { getRoadmap } from "@/lib/content/roadmapLoader";
import { buildGroups, subgroupByTrack } from "@/lib/curriculum/groups";
import { findRoadmapSection, proseBlocks, resourceBlocks } from "@/lib/curriculum/roadmapSections";
import { CurriculumCards } from "@/components/learning/CurriculumCards";
import { ProofGate, RoadmapProse, RoadmapResources } from "@/components/roadmap/RoadmapSource";
import { OverallProgress } from "@/components/progress/ProgressWidgets";

type Props = { params: Promise<{ groupSlug: string }> };

export async function generateStaticParams() {
  return (await getGroups()).map((group) => ({ groupSlug: group.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { groupSlug } = await params;
  const group = (await getGroups()).find((item) => item.slug === groupSlug);
  return group ? { title: group.title, description: group.description } : {};
}

/**
 * One roadmap phase — or the cross-cutting tracks, or the Extra Learning shelf.
 *
 * For a roadmap group the page is assembled from the source document itself: the phase's own
 * framing, its modules in the document's order, its resources, and its Proof Gate. Nothing here
 * is gated; a planned module is shown honestly as an outline and is still one click away.
 */
export default async function GroupPage({ params }: Props) {
  const { groupSlug } = await params;
  const [groups, modules, tracks, roadmap] = await Promise.all([
    getGroups(),
    getModules(),
    getTracks(),
    getRoadmap(),
  ]);
  const group = buildGroups(groups, modules).find((item) => item.slug === groupSlug);
  if (!group) notFound();

  const view = group.roadmapSectionId ? findRoadmapSection(roadmap, group.roadmapSectionId) : null;
  const phase = view?.phase ?? null;
  const lessonIds = group.modules
    .filter((courseModule) => courseModule.status === "available")
    .flatMap((courseModule) => courseModule.lessons.map((lesson) => lesson.id));
  const topicCount = group.modules.reduce((total, courseModule) => total + courseModule.lessons.length, 0);

  return (
    <div className="standard-page">
      <header className="page-header">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/learn">All topics</Link>
          <span>/</span>
          <span aria-current="page">{group.title}</span>
        </nav>
        <p className="eyebrow">{group.kind === "extra" ? "EXTRA LEARNING" : "MASTERY ROADMAP"}</p>
        <h1>{group.title}</h1>
        {group.tag || group.duration ? (
          <p className="phase-chips">
            {group.tag ? <span className="phase-chip is-tag">{group.tag}</span> : null}
            {group.duration ? <span className="phase-chip">{group.duration}</span> : null}
          </p>
        ) : (
          <p className="phase-chips">
            <span className="phase-chip">{group.tagline}</span>
          </p>
        )}
        <p>{group.description}</p>
        <p className="group-counts">
          <strong>{group.modules.length}</strong> {group.modules.length === 1 ? "section" : "sections"} ·{" "}
          <strong>{topicCount}</strong> topics
          {phase ? (
            <>
              {" "}
              ·{" "}
              <Link href="/roadmap/mastery">
                track the 3-pass state on the phase hub →
              </Link>
            </>
          ) : null}
        </p>
        {lessonIds.length > 0 && <OverallProgress lessonIds={lessonIds} />}
      </header>

      {view && view.blocks.length > 0 ? <RoadmapProse blocks={proseBlocks(view.blocks)} /> : null}

      {group.kind === "extra" ? (
        <>
          <div className="section-heading">
            <div>
              <p className="eyebrow">NOT ON THE ROADMAP</p>
              <h2>Written before this site followed the roadmap</h2>
            </div>
            <p>
              Real, finished material — it just isn&rsquo;t part of the roadmap&rsquo;s own sequence. Read it when
              the roadmap isn&rsquo;t waiting on you.
            </p>
          </div>
          {subgroupByTrack(group.modules, tracks).map((subgroup) => (
            <section className="group-subgroup" key={subgroup.track}>
              <h3 className="group-subgroup-heading">{subgroup.title}</h3>
              <CurriculumCards modules={subgroup.modules} />
            </section>
          ))}
        </>
      ) : (
        <section>
          <div className="section-heading">
            <div>
              <p className="eyebrow">SECTIONS</p>
              <h2>Work through these in the roadmap&rsquo;s order</h2>
            </div>
          </div>
          <CurriculumCards modules={group.modules} />
        </section>
      )}

      {view ? <RoadmapResources blocks={resourceBlocks(view.blocks)} sectionLabel={phase ? `Phase ${phase.number}` : group.title} /> : null}
      {phase ? <ProofGate blocks={phase.proofGate} /> : null}
    </div>
  );
}
