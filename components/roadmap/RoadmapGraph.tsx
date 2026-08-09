"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ReactFlow, Controls, Handle, Position, type Node, type Edge, type NodeProps } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { Module, Track } from "@/types/curriculum";
import { useProgress } from "@/components/progress/ProgressProvider";
import { trackIcon } from "@/lib/curriculum/trackMeta";

type SkillStatus = "planned" | "available" | "in-progress" | "completed" | "mastered";

interface ModuleNodeData { title: string; moduleNumber: number; status: SkillStatus; lessonCount: number; completedCount: number; href: string; [key: string]: unknown }
interface TrackNodeData { title: string; icon: string; planned: boolean; href: string; [key: string]: unknown }

const ROW_HEIGHT = 168;
const COL_WIDTH = 248;
const TRACK_COL_X = 0;
const MODULE_START_X = 260;

// Cross-track edges, each backed by a real prerequisite noted in that module's own module.json.
const CROSS_TRACK_EDGES: Array<{ from: string; to: string }> = [
  { from: "python-fundamentals", to: "http-with-requests-and-httpx" },
  { from: "python-fundamentals", to: "what-machine-learning-is" },
  { from: "pydantic-foundations", to: "what-llms-actually-are" },
  { from: "numpy-arrays", to: "vectors-and-matrices" },
  { from: "calculus-for-ml", to: "intro-to-neural-networks" },
];

function ModuleNode({ data }: NodeProps<Node<ModuleNodeData>>) {
  const pct = data.lessonCount > 0 ? Math.round((data.completedCount / data.lessonCount) * 100) : 0;
  return (
    <div className={`skill-node status-${data.status}`}>
      <Handle type="target" position={Position.Left} />
      <div className="skill-node-top">
        <span className="skill-node-index">{String(data.moduleNumber).padStart(2, "0")}</span>
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

export function RoadmapGraph({ tracks, modules }: { tracks: Track[]; modules: Module[] }) {
  const router = useRouter();
  const { progress, hydrated } = useProgress();

  const { nodes, edges } = useMemo(() => {
    const builtNodes: Node[] = [];
    const builtEdges: Edge[] = [];

    tracks.forEach((track, rowIndex) => {
      const y = rowIndex * ROW_HEIGHT;
      builtNodes.push({
        id: `track-${track.slug}`,
        type: "trackNode",
        position: { x: TRACK_COL_X, y },
        data: { title: track.title, icon: trackIcon[track.slug] ?? "◆", planned: track.status === "planned", href: `/tracks/${track.slug}` },
        draggable: false,
      });

      const trackModules = modules.filter((module) => module.track === track.slug).sort((a, b) => a.number - b.number);
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
          data: { title: module.title, moduleNumber: module.number, status, lessonCount: lessonIds.length, completedCount, href: `/learn/${module.slug}` },
          draggable: false,
        });
        const sourceId = colIndex === 0 ? `track-${track.slug}` : `module-${trackModules[colIndex - 1].slug}`;
        builtEdges.push({ id: `${sourceId}-${nodeId}`, source: sourceId, target: nodeId, animated: status === "in-progress", style: { stroke: "var(--border)" } });
      });
    });

    for (const link of CROSS_TRACK_EDGES) {
      const sourceId = `module-${link.from}`;
      const targetId = `module-${link.to}`;
      if (builtNodes.some((node) => node.id === sourceId) && builtNodes.some((node) => node.id === targetId)) {
        builtEdges.push({ id: `cross-${link.from}-${link.to}`, source: sourceId, target: targetId, style: { stroke: "var(--accent-cyan)", strokeDasharray: "4 4" }, label: "feeds into", labelStyle: { fill: "var(--muted)", fontSize: 10 } });
      }
    }

    return { nodes: builtNodes, edges: builtEdges };
  }, [tracks, modules, progress, hydrated]);

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
