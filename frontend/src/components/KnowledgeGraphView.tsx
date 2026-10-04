import { useMemo, useState, type CSSProperties } from "react";
import type { GraphEdge, GraphNode } from "../lib/api";

const TYPE_ORDER: GraphNode["type"][] = ["team", "person", "document", "topic", "state"];

const TYPE_META: Record<
  GraphNode["type"],
  { accent: string; glow: string; icon: JSX.Element; label: string }
> = {
  decision: {
    accent: "#d9a34e",
    glow: "rgba(217,163,78,0.35)",
    label: "Decision",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2 22 12 12 22 2 12Z" />
      </svg>
    ),
  },
  team: {
    accent: "#8b7cc9",
    glow: "rgba(139,124,201,0.32)",
    label: "Team",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  person: {
    accent: "#4fb0a5",
    glow: "rgba(79,176,165,0.32)",
    label: "Person",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
      </svg>
    ),
  },
  document: {
    accent: "#5b93c9",
    glow: "rgba(91,147,201,0.32)",
    label: "Document",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
      </svg>
    ),
  },
  topic: {
    accent: "#d98f4e",
    glow: "rgba(217,143,78,0.32)",
    label: "Topic",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20.6 12.3 12.7 20.2a2 2 0 0 1-2.83 0l-7.07-7.07a2 2 0 0 1 0-2.83L10.7 2.3A2 2 0 0 1 12.1 1.7l7.5.8a2 2 0 0 1 1.77 1.77l.8 7.5a2 2 0 0 1-.57 1.53Z" />
        <circle cx="7.5" cy="7.5" r="1.2" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  state: {
    accent: "#c9636b",
    glow: "rgba(201,99,107,0.32)",
    label: "State",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 22V4a1 1 0 0 1 1-1h12l-2 5 2 5H6" />
        <path d="M6 3v19" />
      </svg>
    ),
  },
};

interface Placed extends GraphNode {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
}

function layout(nodes: GraphNode[], focalId: string): { placed: Placed[]; focal: Placed } {
  const focal = nodes.find((n) => n.id === focalId) || nodes[0];
  const others = nodes.filter((n) => n.id !== focal.id);

  const sorted = [...others].sort(
    (a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type)
  );

  const radiusX = 40;
  const radiusY = 36;
  const centerX = 50;
  const centerY = 50;

  const placed: Placed[] = sorted.map((node, idx) => {
    const angle = (idx / Math.max(sorted.length, 1)) * 2 * Math.PI - Math.PI / 2;
    return {
      ...node,
      x: centerX + radiusX * Math.cos(angle),
      y: centerY + radiusY * Math.sin(angle),
    };
  });

  const focalPlaced: Placed = { ...focal, x: centerX, y: centerY };
  return { placed: [focalPlaced, ...placed], focal: focalPlaced };
}

function quadraticMidpoint(p0: [number, number], c: [number, number], p2: [number, number]) {
  return [
    0.25 * p0[0] + 0.5 * c[0] + 0.25 * p2[0],
    0.25 * p0[1] + 0.5 * c[1] + 0.25 * p2[1],
  ] as [number, number];
}

export function KnowledgeGraphView({
  nodes,
  edges,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
}) {
  const focalId = nodes.find((n) => n.type === "decision")?.id || nodes[0]?.id;
  const [hovered, setHovered] = useState<string | null>(null);

  const { placed } = useMemo(() => layout(nodes, focalId), [nodes, focalId]);
  const byId = useMemo(() => new Map(placed.map((p) => [p.id, p])), [placed]);

  const focalNode = byId.get(focalId);

  return (
    <div className="kg-canvas">
      <svg className="kg-edges" viewBox="0 0 100 100" preserveAspectRatio="none">
        {edges.map((edge, idx) => {
          const from = byId.get(edge.source);
          const to = byId.get(edge.target);
          if (!from || !to) return null;

          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const bend = idx % 2 === 0 ? 1 : -1;
          const ctrl: [number, number] = [
            (from.x + to.x) / 2 - dy * 0.12 * bend,
            (from.y + to.y) / 2 + dx * 0.12 * bend,
          ];

          const isActive =
            hovered === null || hovered === edge.source || hovered === edge.target;
          const meta = TYPE_META[to.type];

          return (
            <path
              key={idx}
              d={`M ${from.x} ${from.y} Q ${ctrl[0]} ${ctrl[1]} ${to.x} ${to.y}`}
              fill="none"
              stroke={meta.accent}
              strokeWidth={isActive ? 0.35 : 0.18}
              opacity={isActive ? 0.75 : 0.22}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>

      {edges.map((edge, idx) => {
        const from = byId.get(edge.source);
        const to = byId.get(edge.target);
        if (!from || !to) return null;
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const bend = idx % 2 === 0 ? 1 : -1;
        const ctrl: [number, number] = [
          (from.x + to.x) / 2 - dy * 0.12 * bend,
          (from.y + to.y) / 2 + dx * 0.12 * bend,
        ];
        const [mx, my] = quadraticMidpoint([from.x, from.y], ctrl, [to.x, to.y]);
        const isActive = hovered === null || hovered === edge.source || hovered === edge.target;
        if (!isActive) return null;

        return (
          <span
            key={`label-${idx}`}
            className="kg-edge-label"
            style={{ left: `${mx}%`, top: `${my}%` }}
          >
            {edge.relation}
          </span>
        );
      })}

      {placed.map((node) => {
        const meta = TYPE_META[node.type];
        const isFocal = node.id === focalNode?.id;
        const dimmed = hovered !== null && hovered !== node.id;
        const nodeStyle = {
          left: `${node.x}%`,
          top: `${node.y}%`,
          "--kg-accent": meta.accent,
          "--kg-glow": meta.glow,
        } as CSSProperties;

        return (
          <div
            key={node.id}
            className={`kg-node${isFocal ? " kg-node-focal" : ""}${dimmed ? " kg-node-dim" : ""}`}
            style={nodeStyle}
            onMouseEnter={() => setHovered(node.id)}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="kg-node-icon">{meta.icon}</div>
            <div className="kg-node-text">
              <div className="kg-node-label">{node.label}</div>
              {node.subtitle && <div className="kg-node-subtitle">{node.subtitle}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function KnowledgeGraphLegend() {
  const order: GraphNode["type"][] = ["decision", "team", "person", "document", "topic", "state"];
  return (
    <div className="kg-legend">
      {order.map((type) => {
        const meta = TYPE_META[type];
        return (
          <div className="kg-legend-chip" key={type}>
            <span className="kg-legend-icon" style={{ color: meta.accent }}>
              {meta.icon}
            </span>
            {meta.label}
          </div>
        );
      })}
    </div>
  );
}
