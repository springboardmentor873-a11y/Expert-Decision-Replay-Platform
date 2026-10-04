import { useEffect, useState } from "react";
import { AppLayout } from "../components/AppLayout";
import { KnowledgeGraphLegend, KnowledgeGraphView } from "../components/KnowledgeGraphView";
import { api, ApiError, type Decision, type KnowledgeGraphData } from "../lib/api";

export function KnowledgeGraph() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [focalId, setFocalId] = useState<number | "">("");
  const [graph, setGraph] = useState<KnowledgeGraphData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .get<Decision[]>("/decisions")
      .then((all) => {
        setDecisions(all);
        if (all.length > 0) setFocalId(all[0].id);
      })
      .catch((e) => setError(e.message));
  }, []);

  const loadGraph = (decisionId: number) => {
    setLoading(true);
    setError(null);
    api
      .get<KnowledgeGraphData>(`/decisions/${decisionId}/knowledge-graph`)
      .then(setGraph)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load graph"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (focalId) loadGraph(focalId);
  }, [focalId]);

  return (
    <AppLayout title="Knowledge Graph">
      <div className="kg-panel">
        <div className="kg-panel-header">
          <div>
            <div className="kg-panel-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <path d="m12 3-1.9 4.02-4.43.38 3.36 2.94L7.9 14.7 12 12.3l4.1 2.4-1.13-4.36 3.36-2.94-4.43-.38Z" />
              </svg>
              Knowledge Graph
            </div>
            <p className="text-muted" style={{ margin: "4px 0 0 0" }}>
              How this decision connects to the people, team, documents and topics around it.
            </p>
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => focalId && loadGraph(focalId)}
            title="Refresh"
          >
            ⟲ Refresh
          </button>
        </div>

        <div className="field" style={{ maxWidth: 480 }}>
          <label>Focal decision</label>
          <select
            value={focalId}
            onChange={(e) => setFocalId(Number(e.target.value))}
          >
            {decisions.length === 0 && <option value="">No decisions available</option>}
            {decisions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </select>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="loading-row">Building the graph…</div>
        ) : graph && graph.nodes.length > 0 ? (
          <>
            <KnowledgeGraphView nodes={graph.nodes} edges={graph.edges} />
            <KnowledgeGraphLegend />
          </>
        ) : (
          !error && (
            <div className="empty-state">
              <h3>No decisions to visualize yet</h3>
              <p>Create a decision to see its knowledge graph here.</p>
            </div>
          )
        )}
      </div>
    </AppLayout>
  );
}
