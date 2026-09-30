import React, { useMemo, useState } from "react";

function KnowledgeGraph({ decisions = [] }) {
  const [selectedNode, setSelectedNode] = useState(null);

  // Make sure we always have an array
  const safeDecisions = Array.isArray(decisions)
    ? decisions
    : [];

  // Create graph nodes and connections dynamically
  const graphData = useMemo(() => {
    const nodes = [];
    const edges = [];

    safeDecisions.forEach((decision, decisionIndex) => {
      const decisionId =
        decision._id || `decision-${decisionIndex}`;

      // =========================
      // DECISION NODE
      // =========================

      nodes.push({
        id: decisionId,
        type: "decision",
        title: decision.title || "Untitled Decision",
        description:
          decision.problemStatement ||
          decision.description ||
          "No description available.",
        x: 450,
        y: 100 + decisionIndex * 350,
      });

      // =========================
      // PROBLEM NODE
      // =========================

      if (decision.problemStatement) {
        const problemId = `${decisionId}-problem`;

        nodes.push({
          id: problemId,
          type: "problem",
          title: "Problem",
          description: decision.problemStatement,
          x: 100,
          y: 100 + decisionIndex * 350,
        });

        edges.push({
          from: problemId,
          to: decisionId,
        });
      }

      // =========================
      // ALTERNATIVES
      // =========================

      if (
        Array.isArray(decision.alternatives) &&
        decision.alternatives.length > 0
      ) {
        decision.alternatives.forEach(
          (alternative, index) => {
            const alternativeId =
              `${decisionId}-alternative-${index}`;

            const alternativeName =
              typeof alternative === "string"
                ? alternative
                : alternative.name ||
                  alternative.title ||
                  `Alternative ${index + 1}`;

            nodes.push({
              id: alternativeId,
              type: "alternative",
              title: alternativeName,
              description:
                typeof alternative === "string"
                  ? alternative
                  : alternative.description ||
                    "Alternative option",
              x: 800,
              y:
                40 +
                decisionIndex * 350 +
                index * 100,
            });

            edges.push({
              from: decisionId,
              to: alternativeId,
            });
          }
        );
      }

      // =========================
      // CATEGORY
      // =========================

      if (decision.category) {
        const categoryId =
          `${decisionId}-category`;

        nodes.push({
          id: categoryId,
          type: "category",
          title: decision.category,
          description: "Decision category",
          x: 450,
          y: 230 + decisionIndex * 350,
        });

        edges.push({
          from: decisionId,
          to: categoryId,
        });
      }

      // =========================
      // OUTCOME
      // =========================

      if (
        decision.outcome ||
        decision.result ||
        decision.implementationStatus
      ) {
        const outcomeId =
          `${decisionId}-outcome`;

        nodes.push({
          id: outcomeId,
          type: "outcome",
          title: "Outcome",
          description:
            decision.outcome ||
            decision.result ||
            decision.implementationStatus,
          x: 450,
          y: 300 + decisionIndex * 350,
        });

        edges.push({
          from: decisionId,
          to: outcomeId,
        });
      }

      // =========================
      // RISKS
      // =========================

      if (
        Array.isArray(decision.risks) &&
        decision.risks.length > 0
      ) {
        decision.risks.forEach((risk, index) => {
          const riskId =
            `${decisionId}-risk-${index}`;

          const riskName =
            typeof risk === "string"
              ? risk
              : risk.name ||
                risk.description ||
                `Risk ${index + 1}`;

          nodes.push({
            id: riskId,
            type: "risk",
            title: "Risk",
            description: riskName,
            x: 100,
            y:
              220 +
              decisionIndex * 350 +
              index * 90,
          });

          edges.push({
            from: decisionId,
            to: riskId,
          });
        });
      }
    });

    return { nodes, edges };
  }, [safeDecisions]);

  // =========================
  // NODE COLORS
  // =========================

  const getNodeStyle = (type) => {
    switch (type) {
      case "decision":
        return {
          background: "#2563eb",
          border: "#1d4ed8",
          color: "#ffffff",
        };

      case "problem":
        return {
          background: "#fef2f2",
          border: "#ef4444",
          color: "#991b1b",
        };

      case "alternative":
        return {
          background: "#eff6ff",
          border: "#3b82f6",
          color: "#1e3a8a",
        };

      case "category":
        return {
          background: "#f5f3ff",
          border: "#8b5cf6",
          color: "#5b21b6",
        };

      case "outcome":
        return {
          background: "#ecfdf5",
          border: "#10b981",
          color: "#065f46",
        };

      case "risk":
        return {
          background: "#fff7ed",
          border: "#f97316",
          color: "#9a3412",
        };

      default:
        return {
          background: "#ffffff",
          border: "#cbd5e1",
          color: "#0f172a",
        };
    }
  };

  // =========================
  // EMPTY STATE
  // =========================

  if (safeDecisions.length === 0) {
    return (
      <div
        style={{
          padding: "50px",
          textAlign: "center",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          background: "#ffffff",
          color: "#64748b",
        }}
      >
        <div
          style={{
            fontSize: "40px",
            marginBottom: "12px",
          }}
        >
          🧠
        </div>

        <h3
          style={{
            margin: "0 0 8px",
            color: "#0f172a",
          }}
        >
          No Knowledge Graph Data
        </h3>

        <p style={{ margin: 0 }}>
          Search or add decisions to generate the
          knowledge graph.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "14px",
        padding: "20px",
        marginTop: "20px",
      }}
    >
      {/* =========================
          HEADER
      ========================= */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "15px",
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: "20px",
              color: "#0f172a",
            }}
          >
            Decision Knowledge Graph
          </h3>

          <p
            style={{
              margin: "5px 0 0",
              fontSize: "13px",
              color: "#64748b",
            }}
          >
            Explore relationships between decisions,
            problems, alternatives and outcomes.
          </p>
        </div>

        <span
          style={{
            padding: "7px 12px",
            borderRadius: "20px",
            background: "#eff6ff",
            color: "#2563eb",
            fontSize: "13px",
            fontWeight: "600",
          }}
        >
          {safeDecisions.length} Decision
          {safeDecisions.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* =========================
          LEGEND
      ========================= */}

      <div
        style={{
          display: "flex",
          gap: "18px",
          flexWrap: "wrap",
          marginBottom: "15px",
          fontSize: "12px",
          color: "#475569",
        }}
      >
        <span>🔵 Decision</span>
        <span>🔴 Problem</span>
        <span>🔷 Alternative</span>
        <span>🟣 Category</span>
        <span>🟢 Outcome</span>
        <span>🟠 Risk</span>
      </div>

      {/* =========================
          GRAPH AREA
      ========================= */}

      <div
        style={{
          width: "100%",
          height: "650px",
          overflow: "auto",
          borderRadius: "10px",
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
        }}
      >
        <svg
          width="1100"
          height={Math.max(
            700,
            safeDecisions.length * 350 + 100
          )}
          viewBox={`0 0 1100 ${Math.max(
            700,
            safeDecisions.length * 350 + 100
          )}`}
        >
          {/* =========================
              EDGES
          ========================= */}

          {graphData.edges.map((edge, index) => {
            const from = graphData.nodes.find(
              (node) => node.id === edge.from
            );

            const to = graphData.nodes.find(
              (node) => node.id === edge.to
            );

            if (!from || !to) {
              return null;
            }

            return (
              <line
                key={`edge-${index}`}
                x1={from.x + 90}
                y1={from.y + 35}
                x2={to.x + 90}
                y2={to.y + 35}
                stroke="#cbd5e1"
                strokeWidth="2"
              />
            );
          })}

          {/* =========================
              NODES
          ========================= */}

          {graphData.nodes.map((node) => {
            const nodeStyle = getNodeStyle(node.type);

            return (
              <g
                key={node.id}
                onClick={() =>
                  setSelectedNode(node)
                }
                style={{
                  cursor: "pointer",
                }}
              >
                <rect
                  x={node.x}
                  y={node.y}
                  width="180"
                  height="70"
                  rx="10"
                  fill={nodeStyle.background}
                  stroke={nodeStyle.border}
                  strokeWidth="2"
                />

                <text
                  x={node.x + 90}
                  y={node.y + 27}
                  textAnchor="middle"
                  fill={nodeStyle.color}
                  fontSize="13"
                  fontWeight="600"
                >
                  {node.title.length > 24
                    ? `${node.title.substring(
                        0,
                        24
                      )}...`
                    : node.title}
                </text>

                <text
                  x={node.x + 90}
                  y={node.y + 49}
                  textAnchor="middle"
                  fill={nodeStyle.color}
                  fontSize="11"
                  opacity="0.8"
                >
                  {node.type
                    .charAt(0)
                    .toUpperCase() +
                    node.type.slice(1)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* =========================
          SELECTED NODE DETAILS
      ========================= */}

      {selectedNode && (
        <div
          style={{
            marginTop: "15px",
            padding: "16px",
            borderRadius: "10px",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h4
                style={{
                  margin: 0,
                  color: "#0f172a",
                }}
              >
                {selectedNode.title}
              </h4>

              <span
                style={{
                  fontSize: "12px",
                  color: "#64748b",
                }}
              >
                {selectedNode.type}
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                setSelectedNode(null)
              }
              style={{
                border: "none",
                background: "#e2e8f0",
                borderRadius: "6px",
                padding: "5px 9px",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>

          <p
            style={{
              margin: "10px 0 0",
              fontSize: "14px",
              lineHeight: "1.6",
              color: "#475569",
            }}
          >
            {selectedNode.description}
          </p>
        </div>
      )}
    </div>
  );
}

export default KnowledgeGraph;