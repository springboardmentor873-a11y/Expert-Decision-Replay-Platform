import React, { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import DecisionKnowledgeGraph from "../components/DecisionKnowledgeGraph";

const KnowledgeRepository = () => {
const [decisions, setDecisions] = useState([]);
const [teams, setTeams] = useState([]);
const [documents, setDocuments] = useState([]);
const [discussions, setDiscussions] = useState([]);

const [search, setSearch] = useState("");
const [activeTab, setActiveTab] = useState("all");
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

const [selectedDecision, setSelectedDecision] = useState(null);
const [graphData, setGraphData] = useState({
  owner: null,
  team: null,
  alternatives: [],
  documents: [],
  discussions: [],
  approval: null,
});
const [graphLoading, setGraphLoading] = useState(false);

const openDecisionGraph = async (decision) => {
  try {
    setGraphLoading(true);
    setSelectedDecision(decision);

    const [
      usersResponse,
      teamsResponse,
      alternativesResponse,
      filesResponse,
      discussionsResponse,
      approvalsResponse,
    ] = await Promise.all([
      api.get("/users/"),
      api.get("/teams/overview"),
      api.get(
        `/decisions/${decision.id}/alternatives/`
      ),
      api.get(
        `/decisions/${decision.id}/files/`
      ),
      api.get(
        `/decisions/${decision.id}/discussions/`
      ),
      api.get(
        `/approvals/decision/${decision.id}`
      ),
    ]);

    const users = usersResponse.data || [];
    const teams = teamsResponse.data || [];

    const owner =
      users.find(
        (user) => user.id === decision.owner_id
      ) || null;

    const team =
      teams.find(
        (team) => team.id === owner?.team_id
      ) || null;

    const approvals =
      approvalsResponse.data || [];

    const approval =
      approvals.length > 0
        ? approvals[0]
        : null;

    setGraphData({
      owner,
      team,
      alternatives:
        alternativesResponse.data || [],
      documents:
        filesResponse.data || [],
      discussions:
        discussionsResponse.data || [],
      approval,
    });

    setTimeout(() => {
      document
        .getElementById("decision-knowledge-graph")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 100);
  } catch (err) {
    console.error(
      "Decision graph loading error:",
      err
    );

    setError(
      err.response?.data?.detail ||
        "Unable to load decision knowledge graph."
    );
  } finally {
    setGraphLoading(false);
  }
};

  const loadRepository = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        decisionsResponse,
        teamsResponse,
      ] = await Promise.all([
        api.get("/decisions/"),
        api.get("/teams/"),
      ]);

      const decisionData = decisionsResponse.data || [];
      const teamData = teamsResponse.data || [];

      setDecisions(decisionData);
      setTeams(teamData);

      const documentResults = [];
      const discussionResults = [];

      await Promise.all(
        decisionData.map(async (decision) => {
          try {
  const filesResponse = await api.get(
  `/decisions/${decision.id}/files/`
);

            (filesResponse.data || []).forEach((file) => {
              documentResults.push({
                ...file,
                decision_id: decision.id,
                decision_title: decision.title,
              });
            });
          } catch {
            // Some decisions may have no files.
          }

          try {
            const discussionsResponse = await api.get(
              `/decisions/${decision.id}/discussions/`
            );

            (discussionsResponse.data || []).forEach(
              (discussion) => {
                discussionResults.push({
                  ...discussion,
                  decision_id: decision.id,
                  decision_title: decision.title,
                });
              }
            );
          } catch {
            // Some decisions may have no discussions.
          }
        })
      );

      documentResults.sort(
        (a, b) =>
          new Date(b.uploaded_at || 0) -
          new Date(a.uploaded_at || 0)
      );

      discussionResults.sort(
        (a, b) =>
          new Date(b.created_at || 0) -
          new Date(a.created_at || 0)
      );

      setDocuments(documentResults);
      setDiscussions(discussionResults);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Failed to load knowledge repository."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRepository();
  }, []);

  const filteredDecisions = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return decisions;

    return decisions.filter((decision) =>
      [
        decision.title,
        decision.description,
        decision.status,
        decision.priority,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(term)
        )
    );
  }, [decisions, search]);

  const filteredDocuments = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return documents;

    return documents.filter((document) =>
      [
        document.file_name,
        document.file_type,
        document.decision_title,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(term)
        )
    );
  }, [documents, search]);

  const filteredDiscussions = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return discussions;

    return discussions.filter((discussion) =>
      [
        discussion.comment,
        discussion.decision_title,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(term)
        )
    );
  }, [discussions, search]);

  const formatDate = (date) => {
    if (!date) return "Recently";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusClass = (status) => {
    if (status === "Approved" || status === "Completed") {
      return "status-approved";
    }

    if (status === "Rejected") {
      return "status-rejected";
    }

    if (status === "In Progress") {
      return "status-progress";
    }

    return "status-draft";
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="repository-loading">
          <div className="loading-spinner">◌</div>
          <h2>Loading Knowledge Repository</h2>
          <p>
            Collecting decisions, documents and discussions...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container knowledge-page">
      {/* Header */}
      <div className="repository-hero">
        <div>
          <div className="repository-eyebrow">
            KNOWLEDGE CENTER
          </div>

          <h1>Knowledge Repository</h1>

          <p>
            Discover decisions, documents, discussions and
            organizational knowledge in one place.
          </p>
        </div>

        <div className="repository-hero-icon">
          🧠
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Summary */}
      <div className="repository-stats">
        <div className="repository-stat-card">
          <div className="repository-stat-icon blue">
            🎯
          </div>

          <div>
            <strong>{decisions.length}</strong>
            <span>Decisions</span>
          </div>
        </div>

        <div className="repository-stat-card">
          <div className="repository-stat-icon purple">
            📄
          </div>

          <div>
            <strong>{documents.length}</strong>
            <span>Documents</span>
          </div>
        </div>

        <div className="repository-stat-card">
          <div className="repository-stat-icon green">
            👥
          </div>

          <div>
            <strong>{teams.length}</strong>
            <span>Teams</span>
          </div>
        </div>

        <div className="repository-stat-card">
          <div className="repository-stat-icon orange">
            💬
          </div>

          <div>
            <strong>{discussions.length}</strong>
            <span>Discussions</span>
          </div>
        </div>
      </div>

      {/* DECISION KNOWLEDGE GRAPH */}

{selectedDecision && (
  <div
    id="decision-knowledge-graph"
    className="knowledge-graph-wrapper"
  >
    {graphLoading ? (
      <div className="knowledge-graph-loading">
        <div className="loading-spinner">
          ◌
        </div>

        <h3>Building Decision Graph...</h3>

        <p>
          Connecting people, teams, documents,
          discussions and approvals.
        </p>
      </div>
    ) : (
      <DecisionKnowledgeGraph
        decision={selectedDecision}
        owner={graphData.owner}
        team={graphData.team}
        alternatives={graphData.alternatives}
        documents={graphData.documents}
        discussions={graphData.discussions}
        approval={graphData.approval}
        onClose={() => {
          setSelectedDecision(null);
          setGraphData({
            owner: null,
            team: null,
            alternatives: [],
            documents: [],
            discussions: [],
            approval: null,
          });
        }}
      />
    )}
  </div>
)}

      {/* Search */}
      <div className="repository-search-card">
        <div className="repository-search">
          <span>🔍</span>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search decisions, documents, discussions..."
          />

          {search && (
            <button
              onClick={() => setSearch("")}
              className="clear-search"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="repository-tabs">
        <button
          className={
            activeTab === "all"
              ? "repository-tab active"
              : "repository-tab"
          }
          onClick={() => setActiveTab("all")}
        >
          All Knowledge
        </button>

        <button
          className={
            activeTab === "decisions"
              ? "repository-tab active"
              : "repository-tab"
          }
          onClick={() => setActiveTab("decisions")}
        >
          Decisions
        </button>

        <button
          className={
            activeTab === "documents"
              ? "repository-tab active"
              : "repository-tab"
          }
          onClick={() => setActiveTab("documents")}
        >
          Documents
        </button>

        <button
          className={
            activeTab === "discussions"
              ? "repository-tab active"
              : "repository-tab"
          }
          onClick={() => setActiveTab("discussions")}
        >
          Discussions
        </button>
      </div>

      {/* All */}
      {activeTab === "all" && (
        <div className="repository-layout">
          <div className="repository-main">
            <div className="repository-section-header">
              <div>
                <h2>Recent Knowledge</h2>
                <p>
                  Latest decisions and documents from the
                  platform.
                </p>
              </div>
            </div>

            <div className="knowledge-list">
              {filteredDecisions
                .slice(0, 6)
                .map((decision) => (
                  <div
                    className="knowledge-item"
                    key={`decision-${decision.id}`}
                  >
                    <div className="knowledge-icon decision-icon">
                      🎯
                    </div>

                    <div className="knowledge-content">
                      <div className="knowledge-type">
                        DECISION
                      </div>

                      <h3>{decision.title}</h3>

                      <p>
                        {decision.description ||
                          "No description available."}
                      </p>

                      <div className="knowledge-meta">
                        <span
                          className={`status-pill ${getStatusClass(
                            decision.status
                          )}`}
                        >
                          {decision.status}
                        </span>

                        <span>
                          {formatDate(
                            decision.updated_at ||
                              decision.created_at
                          )}
                        </span>

                        <span>
                          Priority: {decision.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

              {filteredDocuments
                .slice(0, 6)
                .map((document) => (
                  <div
                    className="knowledge-item"
                    key={`file-${document.id}`}
                  >
                    <div className="knowledge-icon document-icon">
                      📄
                    </div>

                    <div className="knowledge-content">
                      <div className="knowledge-type">
                        DOCUMENT
                      </div>

                      <h3>{document.file_name}</h3>

                      <p>
                        Related decision:{" "}
                        {document.decision_title}
                      </p>

                      <div className="knowledge-meta">
                        <span>
                          {document.file_type ||
                            "Document"}
                        </span>

                        <span>
                          {formatDate(
                            document.uploaded_at
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

              {filteredDecisions.length === 0 &&
                filteredDocuments.length === 0 && (
                  <div className="repository-empty">
                    <div>🔎</div>
                    <h3>No knowledge found</h3>
                    <p>
                      Try a different search term.
                    </p>
                  </div>
                )}
            </div>
          </div>

          {/* Overview */}
          <div className="repository-side">
            <div className="repository-overview-card">
              <h3>Knowledge Overview</h3>

              <div className="overview-row">
                <span>Decisions</span>
                <strong>{decisions.length}</strong>
              </div>

              <div className="overview-row">
                <span>Documents</span>
                <strong>{documents.length}</strong>
              </div>

              <div className="overview-row">
                <span>Discussions</span>
                <strong>{discussions.length}</strong>
              </div>

              <div className="overview-row">
                <span>Teams</span>
                <strong>{teams.length}</strong>
              </div>
            </div>

            <div className="repository-tip-card">
              <div>💡</div>

              <h3>Decision Intelligence</h3>

              <p>
                Use decisions, discussions and supporting
                documents together to understand how
                organizational decisions evolve over time.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Decisions */}
      {activeTab === "decisions" && (
        <div className="repository-content-card">
          <div className="repository-section-header">
            <div>
              <h2>Decisions</h2>
              <p>
                {filteredDecisions.length} decision
                {filteredDecisions.length !== 1
                  ? "s"
                  : ""}{" "}
                found
              </p>
            </div>
          </div>

          <div className="repository-grid">
            {filteredDecisions.map((decision) => (
              <div
                className="repository-decision-card"
                key={decision.id}
              >
                <div className="repository-card-top">
                  <span className="repository-card-icon">
                    🎯
                  </span>

                  <span
                    className={`status-pill ${getStatusClass(
                      decision.status
                    )}`}
                  >
                    {decision.status}
                  </span>
                </div>

                <h3>{decision.title}</h3>

                <p>
                  {decision.description ||
                    "No description available."}
                </p>

<div className="repository-card-footer">
  <span>
    {formatDate(
      decision.updated_at ||
        decision.created_at
    )}
  </span>

  <span>
    {decision.priority}
  </span>

  <button
    className="graph-explore-button"
    onClick={() =>
      openDecisionGraph(decision)
    }
  >
    ◈ Explore Graph
  </button>
</div>
              </div>
            ))}

            {filteredDecisions.length === 0 && (
              <div className="repository-empty">
                <div>🎯</div>
                <h3>No decisions found</h3>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Documents */}
      {activeTab === "documents" && (
        <div className="repository-content-card">
          <div className="repository-section-header">
            <div>
              <h2>Documents</h2>
              <p>
                {filteredDocuments.length} document
                {filteredDocuments.length !== 1
                  ? "s"
                  : ""}{" "}
                found
              </p>
            </div>
          </div>

          <div className="repository-grid">
            {filteredDocuments.map((document) => (
              <div
                className="repository-document-card"
                key={document.id}
              >
                <div className="document-card-icon">
                  📄
                </div>

                <h3>{document.file_name}</h3>

                <p>
                  {document.decision_title}
                </p>

                <div className="repository-card-footer">
                  <span>
                    {document.file_type ||
                      "Document"}
                  </span>

                  <span>
                    {formatDate(
                      document.uploaded_at
                    )}
                  </span>
                </div>
              </div>
            ))}

            {filteredDocuments.length === 0 && (
              <div className="repository-empty">
                <div>📄</div>
                <h3>No documents found</h3>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Discussions */}
      {activeTab === "discussions" && (
        <div className="repository-content-card">
          <div className="repository-section-header">
            <div>
              <h2>Discussions</h2>
              <p>
                {filteredDiscussions.length} discussion
                {filteredDiscussions.length !== 1
                  ? "s"
                  : ""}{" "}
                found
              </p>
            </div>
          </div>

          <div className="discussion-repository-list">
            {filteredDiscussions.map((discussion) => (
              <div
                className="repository-discussion"
                key={discussion.id}
              >
                <div className="discussion-repository-icon">
                  💬
                </div>

                <div>
                  <h3>
                    {discussion.decision_title}
                  </h3>

                  <p>{discussion.comment}</p>

                  <span>
                    {formatDate(
                      discussion.created_at
                    )}
                  </span>
                </div>
              </div>
            ))}

            {filteredDiscussions.length === 0 && (
              <div className="repository-empty">
                <div>💬</div>
                <h3>No discussions found</h3>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeRepository;