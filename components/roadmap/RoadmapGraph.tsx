"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ReactFlow, Controls, Handle, Position, type Node, type Edge, type NodeProps } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { CurriculumGroup, Module } from "@/types/curriculum";
import { useProgress } from "@/components/progress/ProgressProvider";
import { groupIcon } from "@/lib/curriculum/trackMeta";
import { buildGroups, isRoadmapModule, navRef } from "@/lib/curriculum/groups";

type SkillStatus = "planned" | "available" | "in-progress" | "completed" | "mastered";

interface ModuleNodeData { title: string; ref: string; status: SkillStatus; lessonCount: number; completedCount: number; href: string; onRoadmap: boolean; [key: string]: unknown }
interface TrackNodeData { title: string; icon: string; planned: boolean; href: string; [key: string]: unknown }

const ROW_HEIGHT = 168;
const COL_WIDTH = 248;
const TRACK_COL_X = 0;
const MODULE_START_X = 260;

function ModuleNode({ data }: NodeProps<Node<ModuleNodeData>>) {
  const pct = data.lessonCount > 0 ? Math.round((data.completedCount / data.lessonCount) * 100) : 0;
  return (
    <div className={`skill-node status-${data.status}`}>
      <Handle type="target" position={Position.Left} />
      <div className="skill-node-top">
        <span className="skill-node-index">{data.onRoadmap ? data.ref : "·"}</span>
        <span className={`skill-node-badge badge-${data.status}`}>{data.status.replace("-", " ")}</span>
      </div>
      <p className="skill-node-title">{data.title}</p>
      {data.lessonCount > 0 && (
        <div className="skill-node-bar"><span style={{ width: `${pct}%` }} /></div>
      )}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

function TrackNode({ data }: NodeProps<Node<TrackNodeData>>) {
  return (
    <div className={`skill-node skill-track-node${data.planned ? " status-planned" : ""}`}>
      <span className="skill-track-icon" aria-hidden="true">{data.icon}</span>
      <p className="skill-node-title">{data.title}</p>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

const nodeTypes = { moduleNode: ModuleNode, trackNode: TrackNode };

export function RoadmapGraph({ groups, modules }: { groups: CurriculumGroup[]; modules: Module[] }) {
  const router = useRouter();
  const { progress, hydrated } = useProgress();

  const { nodes, edges } = useMemo(() => {
    const builtNodes: Node[] = [];
    const builtEdges: Edge[] = [];

    buildGroups(groups, modules).forEach((track, rowIndex) => {
      const y = rowIndex * ROW_HEIGHT;
      builtNodes.push({
        id: `track-${track.slug}`,
        type: "trackNode",
        position: { x: TRACK_COL_X, y },
        data: { title: track.title, icon: groupIcon[track.slug] ?? "◆", planned: track.kind === "extra", href: `/paths/${track.slug}` },
        draggable: false,
      });

      const trackModules = track.modules;
      trackModules.forEach((module, colIndex) => {
        const lessonIds = module.lessons.map((lesson) => lesson.id);
        const completedCount = hydrated ? lessonIds.filter((id) => progress.completedLessons.includes(id)).length : 0;
        const assignmentDone = hydrated && module.assignment ? progress.completedAssignments.includes(module.assignment.id) : false;
        let status: SkillStatus = "planned";
        if (module.status === "available") {
          if (completedCount === 0) status = "available";
          else if (completedCount < lessonIds.length) status = "in-progress";
          else status = assignmentDone || !module.assignment ? "mastered" : "completed";
        }
        const nodeId = `module-${module.slug}`;
        builtNodes.push({
          id: nodeId,
          type: "moduleNode",
          position: { x: MODULE_START_X + colIndex * COL_WIDTH, y },
          data: { title: module.title, ref: navRef(module), status, lessonCount: lessonIds.length, completedCount, href: `/learn/${module.slug}`, onRoadmap: isRoadmapModule(module) },
          draggable: false,
        });
        const sourceId = colIndex === 0 ? `track-${track.slug}` : `module-${trackModules[colIndex - 1].slug}`;
        builtEdges.push({ id: `${sourceId}-${nodeId}`, source: sourceId, target: nodeId, animated: status === "in-progress", style: { stroke: "var(--border)" } });
      });
    });

    // Cross-group edges are derived, not listed: an Extra Learning module that declares
    // `relatedRoadmapSection` is linked to the roadmap section it covers the same ground as, so
    // the graph can never point at a module that has since been renamed or removed.
    const byRoadmapGroup = new Map(
      modules.filter((entry) => entry.roadmapGroup).map((entry) => [entry.roadmapGroup as string, entry.slug]),
    );
    for (const entry of modules) {
      if (!entry.relatedRoadmapSection) continue;
      const target = byRoadmapGroup.get(entry.relatedRoadmapSection);
      if (!target) continue;
      const sourceId = `module-${entry.slug}`;
      const targetId = `module-${target}`;
      if (!builtNodes.some((node) => node.id === sourceId) || !builtNodes.some((node) => node.id === targetId)) continue;
      builtEdges.push({
        id: `cross-${entry.slug}-${target}`,
        source: sourceId,
        target: targetId,
        style: { stroke: "var(--accent-cyan)", strokeDasharray: "4 4" },
        label: "covers",
        labelStyle: { fill: "var(--muted)", fontSize: 10 },
      });
    }

    return { nodes: builtNodes, edges: builtEdges };
  }, [groups, modules, progress, hydrated]);

  return (
    <div className="roadmap-canvas">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        minZoom={0.4}
        maxZoom={1.5}
        nodesDraggable={false}
        onNodeClick={(_, node) => {
          const href = (node.data as { href?: string }).href;
          if (href) router.push(href);
        }}
      >
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
