import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useToast } from "../ToastContext.jsx";

const NODE_COLUMNS = {
  decision: 0,
  user: 1,
  team: 1,
  alternative: 2,
  attachment: 2,
  comment: 3,
  version: 3,
  audit: 3,
};

const NODE_TITLES = {
  decision: "Decision",
  user: "Contributor",
  team: "Team",
  alternative: "Alternative",
  attachment: "Document",
  comment: "Discussion",
  version: "Version",
  audit: "Audit event",
};

const GRAPH_WIDTH = 1190;
const NODE_WIDTH = 220;
const NODE_HEIGHT = 70;
const COLUMN_X = [30, 320, 610, 900];
const ROW_GAP = 96;

function formatValue(value) {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "string" && value.includes("T") && !Number.isNaN(Date.parse(value))) {
    return new Date(value).toLocaleString();
  }
  return String(value);
}

function formatLabel(key) {
  return key.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function layoutGraph(nodes) {
  const rowByColumn = [0, 0, 0, 0];
  const positions = {};
  for (const node of nodes) {
    const column = NODE_COLUMNS[node.type] ?? 3;
    positions[node.id] = {
      x: COLUMN_X[column],
      y: 32 + rowByColumn[column] * ROW_GAP,
      column,
    };
    rowByColumn[column] += 1;
  }
  const rowCount = Math.max(1, ...rowByColumn);
  return { positions, height: Math.max(360, rowCount * ROW_GAP + 24) };
}

export default function DecisionGraph() {
  const { showToast } = useToast();
  const [decisions, setDecisions] = useState([]);
  const [decisionId, setDecisionId] = useState("");
  const [graph, setGraph] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState("");
  const [loadingDecisions, setLoadingDecisions] = useState(true);
  const [loadingGraph, setLoadingGraph] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api.listDecisions()
      .then((result) => {
        if (!active) return;
        const rows = Array.isArray(result) ? result : [];
        setDecisions(rows);
        if (rows.length) setDecisionId(String(rows[0].id));
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoadingDecisions(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!decisionId) {
      setGraph(null);
      setSelectedNodeId("");
      return undefined;
    }

    let active = true;
    setLoadingGraph(true);
    setError("");
    api.getDecisionGraph(decisionId)
      .then((result) => {
        if (!active) return;
        setGraph(result);
        const decisionNode = result.nodes?.find((node) => node.type === "decision");
        setSelectedNodeId(decisionNode?.id || result.nodes?.[0]?.id || "");
      })
      .catch((err) => {
        if (active) {
          setGraph(null);
          setError(err.message);
        }
      })
      .finally(() => {
        if (active) setLoadingGraph(false);
      });
    return () => {
      active = false;
    };
  }, [decisionId]);

  const nodeLayout = useMemo(
    () => layoutGraph(graph?.nodes || []),
    [graph]
  );
  const selectedNode = graph?.nodes?.find((node) => node.id === selectedNodeId);
  const selectedDecision = decisions.find((decision) => String(decision.id) === String(decisionId));

  return (
    <div className="page-shell decision-graph-page">
      <div className="page-header decision-graph-header">
        <div>
          <h1>Decision Graph</h1>
          <p>Explore the people, team, options, records, and activity connected to a decision.</p>
        </div>
        {!loadingDecisions && decisions.length > 0 && (
          <div className="field decision-graph-select">
            <label htmlFor="graph-decision">Decision</label>
            <select
              id="graph-decision"
              value={decisionId}
              onChange={(event) => setDecisionId(event.target.value)}
            >
              {decisions.map((decision) => (
                <option key={decision.id} value={decision.id}>
                  {decision.title} · {decision.status}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loadingDecisions ? (
        <div className="loading-text">Loading decisions…</div>
      ) : decisions.length === 0 ? (
        <div className="empty-state"><h3>No decisions yet</h3><p>Create a decision to explore its connected records.</p></div>
      ) : error ? (
        <div className="empty-state"><h3>Graph unavailable</h3><p>{error}</p></div>
      ) : loadingGraph ? (
        <div className="loading-text">Loading connected records…</div>
      ) : graph ? (
        <>
          <section className="panel graph-panel">
            <div className="graph-legend" aria-label="Graph node types">
              {Object.entries(NODE_TITLES).map(([type, label]) => (
                <span className="graph-legend-item" key={type}>
                  <span className={`graph-legend-mark graph-node-${type}`} aria-hidden="true" />
                  {label}
                </span>
              ))}
            </div>
            <div className="graph-canvas-scroll">
              <svg
                className="decision-graph-svg"
                viewBox={`0 0 ${GRAPH_WIDTH} ${nodeLayout.height}`}
                role="group"
                aria-label={`Connected records for ${selectedDecision?.title || "selected decision"}`}
              >
                <defs>
                  <marker id="graph-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                    <path d="M0,0 L8,4 L0,8 z" />
                  </marker>
                </defs>
                {graph.edges.map((edge) => {
                  const source = nodeLayout.positions[edge.source];
                  const target = nodeLayout.positions[edge.target];
                  if (!source || !target) return null;
                  const sourceX = source.x + NODE_WIDTH;
                  const sourceY = source.y + NODE_HEIGHT / 2;
                  const targetX = target.x;
                  const targetY = target.y + NODE_HEIGHT / 2;
                  const bend = (sourceX + targetX) / 2;
                  return (
                    <g className="graph-edge" key={edge.id}>
                      <path
                        d={`M ${sourceX} ${sourceY} C ${bend} ${sourceY}, ${bend} ${targetY}, ${targetX} ${targetY}`}
                        markerEnd="url(#graph-arrow)"
                      />
                      <text x={bend} y={(sourceY + targetY) / 2 - 5} textAnchor="middle">{edge.label}</text>
                    </g>
                  );
                })}
                {graph.nodes.map((node) => {
                  const position = nodeLayout.positions[node.id];
                  if (!position) return null;
                  const selected = node.id === selectedNodeId;
                  return (
                    <g
                      key={node.id}
                      className={`graph-node graph-node-${node.type}${selected ? " selected" : ""}`}
                      transform={`translate(${position.x} ${position.y})`}
                      role="button"
                      tabIndex={0}
                      aria-label={`${NODE_TITLES[node.type] || node.type}: ${node.label}`}
                      aria-pressed={selected}
                      onClick={() => setSelectedNodeId(node.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedNodeId(node.id);
                        }
                      }}
                    >
                      <rect width={NODE_WIDTH} height={NODE_HEIGHT} rx="7" />
                      <text className="graph-node-type" x="12" y="19">{NODE_TITLES[node.type] || node.type}</text>
                      <text className="graph-node-label" x="12" y="43">
                        {node.label.length > 27 ? `${node.label.slice(0, 24)}…` : node.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </section>

          <section className="panel graph-details-panel" aria-live="polite">
            <div className="panel-header">
              <div>
                <span className="graph-detail-kicker">Selected node</span>
                <h2>{selectedNode?.label || "Select a graph node"}</h2>
              </div>
              <Link className="btn btn-secondary" to={`/decisions/${graph.decision_id}`}>
                Open decision
              </Link>
            </div>
            {selectedNode && (
              <dl className="graph-details-list">
                <div><dt>Type</dt><dd>{NODE_TITLES[selectedNode.type] || selectedNode.type}</dd></div>
                {Object.entries(selectedNode.details || {}).map(([key, value]) => {
                  const formatted = formatValue(value);
                  if (formatted === null) return null;
                  return <div key={key}><dt>{formatLabel(key)}</dt><dd>{formatted}</dd></div>;
                })}
              </dl>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
