import { useEffect, useMemo, useState } from "react";
import "./KnowledgeGraph.css";

const NODE_W = 170;
const NODE_H = 62;
const CENTER_W = 210;
const CENTER_H = 72;
const X_GAP = 40;
const MAX_NEIGHBORS = 10;

const TYPE_COLORS = {
  team: "#c1893f",
  person: "#3f6b63",
  document: "#4f69c6",
  decision: "#8f5bb5",
};

const CENTER_COLORS = {
  team: "#9a6f2c",
  person: "#2d534c",
  document: "#3a4f9c",
  decision: "#6f3f8c",
};

const TYPE_ICONS = {
  team: "🏢",
  person: "👤",
  document: "📄",
  decision: "✅",
};

const TYPE_LABELS = {
  team: "TEAM",
  person: "PERSON",
  document: "DOCUMENT",
  decision: "DECISION",
};

const EDGE_LABELS = {
  member: "member of",
  uploaded: "uploaded by",
  "belongs to": "belongs to",
  "attached to": "attached to",
  "created by": "created by",
  associated: "associated with",
};

const DECISION_STATUS_LABELS = {
  draft: "Draft",
  under_review: "Under Review",
  pending_manager_review: "Mgr Review",
  approved: "Approved",
  rejected: "Rejected",
  archived: "Archived",
};

function roleLabel(role) {
  if (!role) return "";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function truncate(text, max) {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function nodeMeta(node) {
  if (node.type === "team") return TYPE_LABELS.team;
  if (node.type === "person") {
    const role = roleLabel(node.subtitle);
    return role ? `PERSON · ${role}` : TYPE_LABELS.person;
  }
  if (node.type === "document") {
    const type = (node.subtitle || "document").toUpperCase();
    return `DOCUMENT · ${type}`;
  }
  const status = DECISION_STATUS_LABELS[node.subtitle] || node.subtitle || "";
  return status ? `DECISION · ${status}` : TYPE_LABELS.decision;
}

export default function KnowledgeGraph({
  nodes,
  edges,
  centerId,
  defaultCenterId,
  onCenterChange,
}) {
  const [zoom, setZoom] = useState(1);

  const nodeById = useMemo(() => {
    const map = {};
    nodes.forEach((node) => {
      map[node.id] = node;
    });
    return map;
  }, [nodes]);

  const teamNameById = useMemo(() => {
    const map = {};
    nodes.forEach((node) => {
      if (node.type === "team") map[node.id] = node.label;
    });
    return map;
  }, [nodes]);

  const focus = useMemo(() => {
    const center = centerId ? nodeById[centerId] : null;
    if (!center) return { center: null, relatives: [], edges: [] };

    const relatedByEdge = new Map();
    const centerEdges = [];
    edges.forEach((edge) => {
      if (edge.source === center.id) {
        centerEdges.push(edge);
        if (nodeById[edge.target]) relatedByEdge.set(edge.target, edge.relationship);
      } else if (edge.target === center.id) {
        centerEdges.push(edge);
        if (nodeById[edge.source]) relatedByEdge.set(edge.source, edge.relationship);
      }
    });

    const relatives = [...relatedByEdge.entries()]
      .map(([id, relationship]) => ({ node: nodeById[id], relationship }))
      .sort(
        (a, b) =>
          a.relationship.localeCompare(b.relationship) ||
          a.node.label.localeCompare(b.node.label)
      );

    const truncated = relatives.length > MAX_NEIGHBORS;
    return {
      center,
      relatives: truncated ? relatives.slice(0, MAX_NEIGHBORS) : relatives,
      totalRelated: relatives.length,
      truncated,
      edges: centerEdges,
    };
  }, [centerId, nodeById, edges]);

  const layout = useMemo(() => {
    if (!focus.center) return null;
    const count = focus.relatives.length;
    const radius = Math.max(
      150,
      Math.round((count * (NODE_W + X_GAP)) / (2 * Math.PI))
    );
    const half = radius + CENTER_W;
    const W = Math.max(760, half * 2 + 60);
    const H = Math.max(520, half * 2 + 60);
    const cx = W / 2;
    const cy = H / 2;

    const positioned = focus.relatives.map((rel, i) => {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / Math.max(1, count);
      return {
        ...rel,
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
      };
    });

    const posById = {};
    positioned.forEach((p) => {
      posById[p.node.id] = p;
    });

    return {
      W,
      H,
      cx,
      cy,
      radius,
      posById,
    };
  }, [focus]);

  useEffect(() => {
    setZoom(1);
  }, [centerId]);

  function nodeTooltip(node) {
    if (node.type === "team") {
      return `${node.label}\nTeam`;
    }
    if (node.type === "person") {
      return `${node.label}\n${roleLabel(node.subtitle) || "Person"}\nTeam: ${teamNameById[node.team_id] || "No team"}`;
    }
    if (node.type === "document") {
      return `${node.label}\nType: ${(node.subtitle || "document").toUpperCase()}\nTeam: ${teamNameById[node.team_id] || "—"}`;
    }
    return `${node.label}\nStatus: ${DECISION_STATUS_LABELS[node.subtitle] || node.subtitle || "—"}\nTeam: ${teamNameById[node.team_id] || "—"}`;
  }

  if (nodes.length === 0 || !focus.center || !layout) {
    return (
      <div className="knowledge-graph">
        <div className="knowledge-graph__empty">
          <p>
            The Knowledge Graph centers on a selected entity and its direct
            relationships, built live from the database. Nothing to focus yet —
            select a document, decision, or team from the Repository.
          </p>
        </div>
      </div>
    );
  }

  const cy = layout.cy;
  const labelT = Math.max(0.62, (CENTER_W / 2 + 12) / layout.radius);
  const centerPos = { x: layout.cx, y: layout.cy };
  const truncationNote = focus.truncated
    ? ` · showing ${focus.relatives.length} of ${focus.totalRelated} directly related`
    : "";

  return (
    <div className="knowledge-graph">
      <div className="knowledge-graph__toolbar">
        <div className="knowledge-graph__zoom">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}
          >
            −
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(2, +(z + 0.25).toFixed(2)))}
          >
            +
          </button>
          <button type="button" onClick={() => setZoom(1)}>
            Reset zoom
          </button>
          <button
            type="button"
            className="knowledge-graph__reset-graph"
            onClick={() => onCenterChange(defaultCenterId)}
            disabled={!defaultCenterId}
          >
            Reset Graph
          </button>
        </div>
        <span className="knowledge-graph__hint">
          Click a node to refocus · scroll to pan
        </span>
      </div>

      <p className="knowledge-graph__caption">
        Focus · <strong>{truncate(focus.center.label, 46)}</strong>
        {truncationNote}
      </p>

      <div className="knowledge-graph__canvas">
        <svg
          width={layout.W}
          height={layout.H}
          viewBox={`0 0 ${layout.W} ${layout.H}`}
          className="knowledge-graph__svg"
        >
          <g
            transform={`translate(${layout.cx} ${cy}) scale(${zoom}) translate(${-layout.cx} ${-cy})`}
          >
            {focus.edges.map((edge) => {
              const otherId =
                edge.source === focus.center.id ? edge.target : edge.source;
              const target = layout.posById[otherId];
              if (!target) return null;
              const label = EDGE_LABELS[edge.relationship] || edge.relationship;
              const lx = centerPos.x + (target.x - centerPos.x) * labelT;
              const ly = centerPos.y + (target.y - centerPos.y) * labelT;
              return (
                <g key={`${edge.source}-${edge.target}`}>
                  <line
                    x1={centerPos.x}
                    y1={centerPos.y}
                    x2={target.x}
                    y2={target.y}
                    className="knowledge-graph__edge"
                  />
                  <text
                    x={lx}
                    y={ly}
                    textAnchor="middle"
                    className="knowledge-graph__edge-label"
                  >
                    {label}
                  </text>
                </g>
              );
            })}

            <g transform={`translate(${centerPos.x - CENTER_W / 2} ${centerPos.y - CENTER_H / 2})`}>
              <title>{nodeTooltip(focus.center)}</title>
              <rect
                width={CENTER_W}
                height={CENTER_H}
                rx={10}
                fill={CENTER_COLORS[focus.center.type]}
                className="knowledge-graph__node-center-rect"
              />
              <text x={16} y={30} className="knowledge-graph__icon">
                {TYPE_ICONS[focus.center.type]}
              </text>
              <text x={44} y={28} className="knowledge-graph__label">
                {truncate(focus.center.label, 22)}
              </text>
              <text x={44} y={48} className="knowledge-graph__subtitle">
                {nodeMeta(focus.center)}
              </text>
            </g>

            {focus.relatives.map((rel) => {
              const pos = layout.posById[rel.node.id];
              if (!pos) return null;
              return (
                <g
                  key={rel.node.id}
                  transform={`translate(${pos.x - NODE_W / 2} ${pos.y - NODE_H / 2})`}
                  className="knowledge-graph__node"
                  onClick={() => onCenterChange(rel.node.id)}
                >
                  <title>{nodeTooltip(rel.node)}</title>
                  <rect
                    width={NODE_W}
                    height={NODE_H}
                    rx={9}
                    fill={TYPE_COLORS[rel.node.type]}
                  />
                  <text x={12} y={26} className="knowledge-graph__icon">
                    {TYPE_ICONS[rel.node.type]}
                  </text>
                  <text x={34} y={24} className="knowledge-graph__label">
                    {truncate(rel.node.label, 20)}
                  </text>
                  <text x={34} y={42} className="knowledge-graph__subtitle">
                    {truncate(nodeMeta(rel.node), 22)}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      <div className="knowledge-graph__legend">
        {Object.entries(TYPE_LABELS).map(([type, label]) => (
          <span key={type} className="knowledge-graph__legend-item">
            <span
              className="knowledge-graph__legend-swatch"
              style={{ background: TYPE_COLORS[type] }}
            />
            {label}
          </span>
        ))}
        <span className="knowledge-graph__legend-note">
          only direct relationships to the focus shown
        </span>
      </div>
    </div>
  );
}