import React, { useState, useRef, useEffect } from "react";
import {
  Users,
  User,
  FileText,
  Tag,
  CheckCircle,
  Lightbulb,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles
} from "lucide-react";

function KnowledgeGraphWidget({ graphData, onNodeClick }) {
  const [hoveredNode, setHoveredNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [zoom, setZoom] = useState(1);

  // Positions mapped in a 400x320 SVG viewBox matching the exact design
  const defaultPositions = {
    "decision-1": { x: 200, y: 160, type: "decision", label: "Choose AI Model", sub: "Decision", color: "#2563eb" },
    "team-1": { x: 80, y: 70, type: "team", label: "AI Team", sub: "Team", color: "#10b981", edgeLabel: "created by" },
    "user-3": { x: 200, y: 55, type: "person", label: "Sarah Khan", sub: "Reviewer", color: "#f43f5e", edgeLabel: "discussed by" },
    "doc-1": { x: 320, y: 75, type: "document", label: "AI Model\nReport.pdf", sub: "Doc", color: "#f59e0b", edgeLabel: "supported by" },
    "topic-model-eval": { x: 75, y: 190, type: "topic", label: "Model\nEvaluation", sub: "Topic", color: "#8b5cf6", edgeLabel: "related to" },
    "outcome-approved": { x: 330, y: 205, type: "outcome", label: "Approved", sub: "Status", color: "#3b82f6", edgeLabel: "resulted in" },
    "influence-future": { x: 200, y: 275, type: "influence", label: "Future Projects", sub: "Influence", color: "#14b8a6", edgeLabel: "influences" },
  };

  const centerNode = defaultPositions["decision-1"];

  const peripheralNodes = [
    defaultPositions["team-1"],
    defaultPositions["user-3"],
    defaultPositions["doc-1"],
    defaultPositions["topic-model-eval"],
    defaultPositions["outcome-approved"],
    defaultPositions["influence-future"],
  ];

  const handleNodeClick = (node) => {
    setSelectedNode(node);
    if (onNodeClick) {
      onNodeClick(node);
    }
  };

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>Knowledge Graph</h3>
          <p style={styles.subtitle}>Visualize how decisions, documents, people and topics are connected.</p>
        </div>
        <div style={styles.controls}>
          <button style={styles.ctrlBtn} onClick={() => setZoom((z) => Math.min(z + 0.15, 1.6))} title="Zoom In">
            <ZoomIn size={14} />
          </button>
          <button style={styles.ctrlBtn} onClick={() => setZoom((z) => Math.max(z - 0.15, 0.7))} title="Zoom Out">
            <ZoomOut size={14} />
          </button>
          <button style={styles.ctrlBtn} onClick={() => setZoom(1)} title="Reset">
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      <div style={styles.graphContainer}>
        <svg
          viewBox="0 0 400 330"
          style={{
            width: "100%",
            height: "100%",
            transform: `scale(${zoom})`,
            transition: "transform 0.2s ease-out",
          }}
        >
          <defs>
            {/* Subtle drop shadows */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
            </filter>
            <filter id="centerGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#2563eb" floodOpacity="0.3" />
            </filter>
            {/* Arrow Marker */}
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="18"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#94a3b8" />
            </marker>
          </defs>

          {/* Connected Edges */}
          {peripheralNodes.map((node, idx) => {
            const isHighlighted =
              hoveredNode?.label === node.label ||
              hoveredNode?.label === centerNode.label ||
              selectedNode?.label === node.label;

            // Compute midpoint for edge label
            const midX = (centerNode.x + node.x) / 2;
            const midY = (centerNode.y + node.y) / 2;

            return (
              <g key={`edge-${idx}`}>
                <line
                  x1={node.x}
                  y1={node.y}
                  x2={centerNode.x}
                  y2={centerNode.y}
                  stroke={isHighlighted ? "#6366F1" : "rgba(255, 255, 255, 0.12)"}
                  strokeWidth={isHighlighted ? 2.5 : 1.5}
                  strokeDasharray={node.type === "influence" || node.type === "topic" ? "4 3" : "none"}
                  style={{ transition: "stroke 0.2s, stroke-width 0.2s" }}
                />
                {/* Edge relationship badge */}
                <rect
                  x={midX - 26}
                  y={midY - 8}
                  width="52"
                  height="16"
                  rx="8"
                  fill="#1E293B"
                  stroke="rgba(255, 255, 255, 0.15)"
                  strokeWidth="1"
                />
                <text
                  x={midX}
                  y={midY + 3.5}
                  textAnchor="middle"
                  fontSize="8"
                  fill="#94A3B8"
                  fontWeight="500"
                  style={{ pointerEvents: "none" }}
                >
                  {node.edgeLabel}
                </text>
              </g>
            );
          })}

          {/* Peripheral Nodes */}
          {peripheralNodes.map((node, idx) => {
            const isHovered = hoveredNode?.label === node.label;
            const isSelected = selectedNode?.label === node.label;

            return (
              <g
                key={`node-${idx}`}
                transform={`translate(${node.x}, ${node.y})`}
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => handleNodeClick(node)}
                style={{ cursor: "pointer", transition: "transform 0.15s ease" }}
              >
                <circle
                  r={isHovered || isSelected ? 22 : 19}
                  fill={node.color}
                  filter="url(#glow)"
                  opacity={isHovered ? 1 : 0.9}
                  style={{ transition: "all 0.2s" }}
                />
                {/* Outer ring on hover/select */}
                {(isHovered || isSelected) && (
                  <circle r={26} fill="none" stroke={node.color} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.8" />
                )}

                {/* Inner Icon representation */}
                {node.type === "team" && (
                  <g transform="translate(-8, -8)" fill="#ffffff" color="#ffffff">
                    <Users size={16} />
                  </g>
                )}
                {node.type === "person" && (
                  <g transform="translate(-8, -8)" fill="#ffffff" color="#ffffff">
                    <User size={16} />
                  </g>
                )}
                {node.type === "document" && (
                  <g transform="translate(-8, -8)" fill="#ffffff" color="#ffffff">
                    <FileText size={16} />
                  </g>
                )}
                {node.type === "topic" && (
                  <g transform="translate(-8, -8)" fill="#ffffff" color="#ffffff">
                    <Tag size={16} />
                  </g>
                )}
                {node.type === "outcome" && (
                  <g transform="translate(-8, -8)" fill="#ffffff" color="#ffffff">
                    <CheckCircle size={16} />
                  </g>
                )}
                {node.type === "influence" && (
                  <g transform="translate(-8, -8)" fill="#ffffff" color="#ffffff">
                    <Lightbulb size={16} />
                  </g>
                )}

                {/* Node Label underneath */}
                <text
                  y={28}
                  textAnchor="middle"
                  fontSize="9.5"
                  fontWeight="600"
                  fill="var(--text-primary)"
                  style={{ pointerEvents: "none" }}
                >
                  {node.label.split("\n")[0]}
                </text>
                {node.label.includes("\n") && (
                  <text
                    y={39}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="500"
                    fill="var(--text-secondary)"
                    style={{ pointerEvents: "none" }}
                  >
                    {node.label.split("\n")[1]}
                  </text>
                )}
              </g>
            );
          })}

          {/* Central Decision Node */}
          <g
            transform={`translate(${centerNode.x}, ${centerNode.y})`}
            onMouseEnter={() => setHoveredNode(centerNode)}
            onMouseLeave={() => setHoveredNode(null)}
            onClick={() => handleNodeClick(centerNode)}
            style={{ cursor: "pointer" }}
          >
            {/* Center card shape */}
            <rect
              x="-38"
              y="-32"
              width="76"
              height="64"
              rx="16"
              fill="var(--primary)"
              stroke="var(--border-subtle)"
              strokeWidth="1"
            />
            {/* White document icon */}
            <g transform="translate(-10, -22)" color="#ffffff">
              <FileText size={20} color="#ffffff" />
            </g>
            <text
              y="12"
              textAnchor="middle"
              fontSize="9"
              fontWeight="700"
              fill="#ffffff"
            >
              Choose AI
            </text>
            <text
              y="23"
              textAnchor="middle"
              fontSize="9"
              fontWeight="700"
              fill="#ffffff"
            >
              Model
            </text>
          </g>
        </svg>
      </div>

      {hoveredNode && (
        <div style={styles.tooltip}>
          <span style={styles.tooltipBadge}>{hoveredNode.sub}</span>
          <span style={styles.tooltipText}>{hoveredNode.label.replace("\n", " ")}</span>
        </div>
      )}
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: "var(--bg-surface)",
    borderRadius: "var(--radius-lg)",
    border: "1px solid var(--border-subtle)",
    padding: "20px",
    boxShadow: "var(--shadow-card)",
    position: "relative",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "10px",
  },
  title: {
    fontSize: "16px",
    fontWeight: "600",
    color: "var(--text-primary)",
    margin: 0,
  },
  subtitle: {
    fontSize: "12.5px",
    color: "var(--text-secondary)",
    margin: "3px 0 0 0",
    lineHeight: 1.4,
  },
  controls: {
    display: "flex",
    gap: "6px",
  },
  ctrlBtn: {
    background: "var(--bg-surface-container-high)",
    border: "none",
    borderRadius: "var(--radius-full)",
    padding: "6px",
    color: "var(--text-secondary)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all var(--md3-duration-short) var(--md3-easing)",
  },
  graphContainer: {
    width: "100%",
    height: "280px",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  tooltip: {
    position: "absolute",
    bottom: "12px",
    left: "18px",
    backgroundColor: "var(--bg-surface)",
    color: "var(--text-primary)",
    padding: "6px 12px",
    borderRadius: "var(--radius-md)",
    fontSize: "12px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    border: "1px solid var(--border-subtle)",
    boxShadow: "var(--shadow-md)",
    pointerEvents: "none",
  },
  tooltipBadge: {
    backgroundColor: "var(--secondary-container)",
    color: "var(--on-secondary-container)",
    padding: "2px 8px",
    borderRadius: "var(--radius-full)",
    fontSize: "10.5px",
    textTransform: "uppercase",
    fontWeight: "600",
  },
  tooltipText: {
    fontWeight: "500",
  },
};

export default KnowledgeGraphWidget;
