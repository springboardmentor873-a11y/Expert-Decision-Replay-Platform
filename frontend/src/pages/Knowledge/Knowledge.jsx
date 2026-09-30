import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import KnowledgeGraph from "../../components/KnowledgeGraph/KnowledgeGraph";
import StatusBadge from "../../components/StatusBadge/StatusBadge";
import { useAuth } from "../../context/AuthContext";
import {
  getKnowledgeGraph,
  getKnowledgeSummary,
  listRepositoryDecisions,
  listRepositoryDocuments,
} from "../../services/knowledge";
import { listTeams } from "../../services/teams";
import "./Knowledge.css";

const PAGE_SIZE = 10;

const SORT_OPTIONS = [
  { value: "latest", label: "Latest" },
  { value: "oldest", label: "Oldest" },
  { value: "name_asc", label: "Name A–Z" },
  { value: "name_desc", label: "Name Z–A" },
];

const FILE_BADGES = {
  pdf: "PDF",
  docx: "DOCX",
  pptx: "PPTX",
};

const SUMMARY_CARDS = [
  { key: "total_documents", label: "Documents", hint: "in the repository" },
  { key: "decision_documents", label: "Linked to decisions", hint: "answer material" },
  { key: "teams_contributed", label: "Teams contributing", hint: "own materials" },
  { key: "recently_added", label: "Added last 7 days", hint: "recently curated" },
];

export default function KnowledgePage() {
  const { tokens } = useAuth();
  const [tab, setTab] = useState("all");

  const [summary, setSummary] = useState(null);
  const [graph, setGraph] = useState({ nodes: [], edges: [] });
  const [teams, setTeams] = useState([]);

  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [teamId, setTeamId] = useState("");
  const [fileType, setFileType] = useState("");
  const [tag, setTag] = useState("");
  const [sort, setSort] = useState("latest");
  const [documents, setDocuments] = useState([]);
  const [fileTypes, setFileTypes] = useState([]);
  const [tags, setTags] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [error, setError] = useState("");

  const [decisions, setDecisions] = useState([]);
  const [decisionsTotal, setDecisionsTotal] = useState(0);
  const [decisionsOffset, setDecisionsOffset] = useState(0);
  const [decisionsQuery, setDecisionsQuery] = useState("");
  const [appliedDecisionsQuery, setAppliedDecisionsQuery] = useState("");
  const [loadingDecisions, setLoadingDecisions] = useState(false);
  const [decisionsError, setDecisionsError] = useState("");

  const [centerId, setCenterId] = useState(null);

  const graphNodeIds = useMemo(() => {
    const ids = new Set();
    graph.nodes.forEach((node) => ids.add(node.id));
    return ids;
  }, [graph.nodes]);

  const defaultCenterId = useMemo(() => {
    if (documents.length > 0) return documents[0].id;
    const decision =
      graph.nodes.find((node) => node.type === "decision")?.id || null;
    const team = graph.nodes.find((node) => node.type === "team")?.id || null;
    return decision || team || graph.nodes[0]?.id || null;
  }, [documents, graph.nodes]);

  useEffect(() => {
    if (defaultCenterId && (!centerId || !graphNodeIds.has(centerId))) {
      setCenterId(defaultCenterId);
    }
  }, [defaultCenterId, centerId, graphNodeIds]);

  function handleShowInGraph(documentId) {
    setCenterId(documentId);
    if (tab === "decisions") setTab("documents");
  }

  const loadDocuments = useCallback(
    async (nextOffset = 0) => {
      setLoadingDocs(true);
      setError("");
      try {
        const params = {
          limit: PAGE_SIZE,
          offset: nextOffset,
          sort,
        };
        if (appliedQuery) params.query = appliedQuery;
        if (teamId) params.team_id = teamId;
        if (fileType) params.file_type = fileType;
        if (tag) params.tag = tag;
        const data = await listRepositoryDocuments(tokens.access_token, params);
        setDocuments(data.items);
        setTotal(data.total);
        setFileTypes(data.file_types);
        setTags(data.tags);
        setOffset(nextOffset);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingDocs(false);
      }
    },
    [tokens, appliedQuery, teamId, fileType, tag, sort]
  );

  const loadDecisions = useCallback(
    async (nextOffset = 0) => {
      setLoadingDecisions(true);
      setDecisionsError("");
      try {
        const params = { limit: PAGE_SIZE, offset: nextOffset };
        if (appliedDecisionsQuery) params.query = appliedDecisionsQuery;
        const data = await listRepositoryDecisions(tokens.access_token, params);
        setDecisions(data.items);
        setDecisionsTotal(data.total);
        setDecisionsOffset(nextOffset);
      } catch (err) {
        setDecisionsError(err.message);
      } finally {
        setLoadingDecisions(false);
      }
    },
    [tokens, appliedDecisionsQuery]
  );

  useEffect(() => {
    loadDocuments(0);
  }, [loadDocuments]);

  useEffect(() => {
    if (tab === "decisions") loadDecisions(0);
  }, [tab, loadDecisions]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [summaryData, graphData, teamsData] = await Promise.all([
          getKnowledgeSummary(tokens.access_token),
          getKnowledgeGraph(tokens.access_token),
          listTeams(tokens.access_token),
        ]);
        if (cancelled) return;
        setSummary(summaryData);
        setGraph(graphData);
        setTeams(teamsData);
      } catch {
        // header widgets are non-critical; the browsers below surface errors
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [tokens]);

  function handleApplyFilters() {
    setAppliedQuery(query.trim());
    setOffset(0);
  }

  function handleResetFilters() {
    setQuery("");
    setAppliedQuery("");
    setTeamId("");
    setFileType("");
    setTag("");
    setSort("latest");
    setOffset(0);
  }

  const hasFilters = Boolean(appliedQuery || teamId || fileType || tag || sort !== "latest");

  function handleApplyDecisionsSearch() {
    setAppliedDecisionsQuery(decisionsQuery.trim());
    setDecisionsOffset(0);
  }

  const docStart = total === 0 ? 0 : offset + 1;
  const docEnd = Math.min(offset + documents.length, total);
  const decisionStart = decisionsTotal === 0 ? 0 : decisionsOffset + 1;
  const decisionEnd = Math.min(decisionsOffset + decisions.length, decisionsTotal);

  return (
    <div className="page">
      <Navbar />
      <main className="knowledge">
        <div className="knowledge__header">
          <h1 className="knowledge__title">Knowledge Repository</h1>
          <p className="knowledge__subtitle">
            Curated documents, past decisions, and the relationships between
            them — read-only, sourced from the live database.
          </p>
        </div>

        <div className="knowledge__summary">
          {SUMMARY_CARDS.map((card) => (
            <div key={card.key} className="knowledge__summary-card">
              <span className="knowledge__summary-value">
                {summary ? summary[card.key] : 0}
              </span>
              <span className="knowledge__summary-label">{card.label}</span>
              <span className="knowledge__summary-hint">{card.hint}</span>
            </div>
          ))}
        </div>

        <div className="knowledge__tabs">
          <button
            type="button"
            className={`knowledge__tab ${tab === "all" ? "knowledge__tab--active" : ""}`}
            onClick={() => setTab("all")}
          >
            Overview
          </button>
          <button
            type="button"
            className={`knowledge__tab ${tab === "documents" ? "knowledge__tab--active" : ""}`}
            onClick={() => setTab("documents")}
          >
            Documents
          </button>
          <button
            type="button"
            className={`knowledge__tab ${tab === "decisions" ? "knowledge__tab--active" : ""}`}
            onClick={() => setTab("decisions")}
          >
            Past Decisions
          </button>
        </div>

        <div className="knowledge__grid">
          <section className="knowledge__content">
            {tab === "decisions" ? (
              <>
                <div className="knowledge__filter-row">
                  <input
                    type="search"
                    className="knowledge__search"
                    placeholder="Search decisions by title…"
                    value={decisionsQuery}
                    onChange={(e) => setDecisionsQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleApplyDecisionsSearch();
                    }}
                  />
                  <button
                    className="knowledge__button knowledge__button--primary"
                    onClick={handleApplyDecisionsSearch}
                  >
                    Search
                  </button>
                  {appliedDecisionsQuery && (
                    <button
                      className="knowledge__button"
                      onClick={() => {
                        setDecisionsQuery("");
                        setAppliedDecisionsQuery("");
                        setDecisionsOffset(0);
                      }}
                    >
                      Clear
                    </button>
                  )}
                </div>

                {decisionsError && <div className="knowledge__error">{decisionsError}</div>}

                {loadingDecisions ? (
                  <p className="knowledge__loading">Loading…</p>
                ) : decisions.length === 0 ? (
                  <div className="knowledge__empty">
                    <p>No past decisions match the current view.</p>
                  </div>
                ) : (
                  <>
                    <ul className="knowledge__decision-list">
                      {decisions.map((decision) => (
                        <li key={decision.id} className="knowledge__decision-row">
                          <Link
                            to={`/decisions/${decision.id}`}
                            className="knowledge__decision-title"
                          >
                            {decision.title}
                          </Link>
                          <div className="knowledge__decision-meta">
                            <StatusBadge status={decision.status} />
                            <span>{decision.team_name || "—"}</span>
                            <span>{decision.created_by_name || "—"}</span>
                            <span>{decision.document_count} document(s)</span>
                            <span>
                              {new Date(decision.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>

                    <div className="knowledge__pagination">
                      <span>
                        Showing {decisionStart}–{decisionEnd} of {decisionsTotal}
                      </span>
                      <div>
                        <button
                          className="knowledge__button"
                          onClick={() =>
                            loadDecisions(
                              Math.max(0, decisionsOffset - PAGE_SIZE)
                            )
                          }
                          disabled={decisionsOffset === 0 || loadingDecisions}
                        >
                          ← Prev
                        </button>
                        <button
                          className="knowledge__button"
                          onClick={() => loadDecisions(decisionsOffset + PAGE_SIZE)}
                          disabled={
                            decisionsOffset + decisions.length >=
                              decisionsTotal || loadingDecisions
                          }
                        >
                          Next →
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <div className="knowledge__filter-row">
                  <input
                    type="search"
                    className="knowledge__search"
                    placeholder="Search documents, teams, uploaders, tags…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleApplyFilters();
                    }}
                  />
                  <select
                    value={teamId}
                    onChange={(e) => setTeamId(e.target.value)}
                    aria-label="Filter by team"
                  >
                    <option value="">All teams</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={fileType}
                    onChange={(e) => setFileType(e.target.value)}
                    aria-label="Filter by file type"
                  >
                    <option value="">All types</option>
                    {fileTypes.map((type) => (
                      <option key={type} value={type}>
                        {type.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  <select
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    aria-label="Filter by tag"
                  >
                    <option value="">All tags</option>
                    {tags.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    aria-label="Sort documents"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <button
                    className="knowledge__button knowledge__button--primary"
                    onClick={handleApplyFilters}
                  >
                    Apply
                  </button>
                  {hasFilters && (
                    <button
                      className="knowledge__button"
                      onClick={handleResetFilters}
                    >
                      Clear
                    </button>
                  )}
                </div>

                {error && <div className="knowledge__error">{error}</div>}

                {loadingDocs ? (
                  <p className="knowledge__loading">Loading…</p>
                ) : documents.length === 0 ? (
                  <div className="knowledge__empty">
                    <p>No documents match the current view.</p>
                  </div>
                ) : (
                  <>
                    <ul className="knowledge__document-list">
                      {documents.map((document) => (
                        <li key={document.id} className="knowledge__document-row">
                          <div className="knowledge__document-main">
                            <span
                              className={`knowledge__doc-type knowledge__doc-type--${document.file_type || "other"}`}
                            >
                              {FILE_BADGES[document.file_type] ||
                                (document.file_type || "FILE").toUpperCase()}
                            </span>
                            <div className="knowledge__document-info">
                              <div className="knowledge__document-title-row">
                                <Link
                                  to={`/knowledge/documents/${document.id}`}
                                  className="knowledge__document-title"
                                >
                                  {document.title}
                                </Link>
                                <button
                                  type="button"
                                  className="knowledge__show-graph"
                                  onClick={() => handleShowInGraph(document.id)}
                                >
                                  Show in Graph
                                </button>
                              </div>
                              <p className="knowledge__document-description">
                                {document.description || "No description provided."}
                              </p>
                              <div className="knowledge__tag-row">
                                {(document.tags || []).map((t) => (
                                  <span key={t} className="knowledge__tag">
                                    {t}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="knowledge__document-meta">
                            <span>{document.team_name || "—"}</span>
                            <span>{document.uploader_name || "—"}</span>
                            <span>
                              {new Date(document.created_at).toLocaleDateString()}
                            </span>
                            {document.decision_title && (
                              <span className="knowledge__decision-link">
                                Links to: {document.decision_title}
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>

                    <div className="knowledge__pagination">
                      <span>
                        Showing {docStart}–{docEnd} of {total}
                      </span>
                      <div>
                        <button
                          className="knowledge__button"
                          onClick={() =>
                            loadDocuments(Math.max(0, offset - PAGE_SIZE))
                          }
                          disabled={offset === 0 || loadingDocs}
                        >
                          ← Prev
                        </button>
                        <button
                          className="knowledge__button"
                          onClick={() => loadDocuments(offset + PAGE_SIZE)}
                          disabled={offset + documents.length >= total || loadingDocs}
                        >
                          Next →
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </section>

          <aside className="knowledge__graph-panel">
            <h2 className="knowledge__graph-title">Knowledge Graph</h2>
            <p className="knowledge__graph-caption">
              Centers on one entity and shows only its direct relationships —
              click any node to refocus.
            </p>
            <KnowledgeGraph
              nodes={graph.nodes}
              edges={graph.edges}
              centerId={centerId}
              defaultCenterId={defaultCenterId}
              onCenterChange={setCenterId}
            />
          </aside>
        </div>
      </main>
    </div>
  );
}