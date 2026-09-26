import React from "react";

const DecisionKnowledgeGraph = ({
  decision,
  owner,
  team,
  alternatives = [],
  documents = [],
  discussions = [],
  approval = null,
  onClose,
}) => {
  if (!decision) {
    return (
      <div className="knowledge-graph-empty">
        <div className="knowledge-graph-empty-icon">◉</div>
        <h3>Select a decision</h3>
        <p>
          Select a decision to explore its connected knowledge.
        </p>
      </div>
    );
  }

  const status =
    decision.status === "Approved" ||
    decision.status === "Completed"
      ? "Completed"
      : decision.status;

  return (
    <section className="decision-graph-panel">

      {/* GRAPH HEADER */}
      <div className="decision-graph-header">
        <div>
          <span className="graph-eyebrow">
            DECISION INTELLIGENCE
          </span>

          <h2>Knowledge Graph</h2>

          <p>
            Explore how this decision connects with people,
            teams, documents and outcomes.
          </p>
        </div>

        <button
          className="graph-close-button"
          onClick={onClose}
          title="Close graph"
        >
          ×
        </button>
      </div>

      {/* GRAPH AREA */}
      <div className="decision-graph-canvas">

        <div className="graph-orbit orbit-one"></div>
        <div className="graph-orbit orbit-two"></div>

        {/* CONNECTIONS */}
        <span className="graph-line line-team"></span>
        <span className="graph-line line-owner"></span>
        <span className="graph-line line-documents"></span>
        <span className="graph-line line-alternatives"></span>
        <span className="graph-line line-discussions"></span>
        <span className="graph-line line-approval"></span>
        <span className="graph-line line-topic"></span>

        {/* CENTER */}
        <div className="graph-center-node">
          <div className="graph-center-icon">◈</div>

          <div className="graph-center-label">
            <span>DECISION</span>
            <strong>{decision.title}</strong>
          </div>

          <small>
            {decision.priority || "Medium"} priority
          </small>
        </div>

        {/* TEAM */}
        <div className="graph-node graph-team-node">
          <div className="graph-node-icon">♣</div>
          <div>
            <span>TEAM</span>
            <strong>
              {team?.name || "No Team"}
            </strong>
            <small>
              {team?.member_count
                ? `${team.member_count} members`
                : "Team connection"}
            </small>
          </div>
        </div>

        {/* OWNER */}
        <div className="graph-node graph-owner-node">
          <div className="graph-node-icon">●</div>
          <div>
            <span>OWNER</span>
            <strong>
              {owner?.full_name || "Unknown"}
            </strong>
            <small>Decision creator</small>
          </div>
        </div>

        {/* DOCUMENTS */}
        <div className="graph-node graph-document-node">
          <div className="graph-node-icon">▣</div>
          <div>
            <span>DOCUMENTS</span>
            <strong>{documents.length} files</strong>
            <small>Supporting knowledge</small>
          </div>
        </div>

        {/* ALTERNATIVES */}
        <div className="graph-node graph-alternative-node">
          <div className="graph-node-icon">◇</div>
          <div>
            <span>ALTERNATIVES</span>
            <strong>
              {alternatives.length} options
            </strong>
            <small>Compared choices</small>
          </div>
        </div>

        {/* DISCUSSIONS */}
        <div className="graph-node graph-discussion-node">
          <div className="graph-node-icon">◌</div>
          <div>
            <span>DISCUSSIONS</span>
            <strong>
              {discussions.length} conversations
            </strong>
            <small>Team insights</small>
          </div>
        </div>

        {/* APPROVAL */}
        <div className="graph-node graph-approval-node">
          <div className="graph-node-icon">✓</div>
          <div>
            <span>APPROVAL</span>
            <strong>
              {approval?.status || "Not Requested"}
            </strong>
            <small>Workflow state</small>
          </div>
        </div>

        {/* TOPIC */}
        <div className="graph-node graph-topic-node">
          <div className="graph-node-icon">#</div>
          <div>
            <span>CONTEXT</span>
            <strong>
              {decision.priority || "General"}
            </strong>
            <small>
              {status}
            </small>
          </div>
        </div>
      </div>

      {/* LEGEND */}
      <div className="graph-legend">
        <span>
          <i className="legend-dot decision"></i>
          Decision
        </span>

        <span>
          <i className="legend-dot team"></i>
          Team
        </span>

        <span>
          <i className="legend-dot people"></i>
          Owner
        </span>

        <span>
          <i className="legend-dot document"></i>
          Documents
        </span>

        <span>
          <i className="legend-dot collaboration"></i>
          Collaboration
        </span>

        <span>
          <i className="legend-dot outcome"></i>
          Outcome
        </span>
      </div>
    </section>
  );
};

export default DecisionKnowledgeGraph;