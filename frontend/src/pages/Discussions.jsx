import React, { useEffect, useState } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";

const Discussions = () => {
  const navigate = useNavigate();

  const [decisions, setDecisions] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadDiscussions();
  }, []);

  const loadDiscussions = async () => {
    try {
      setLoading(true);
      setError("");

      const decisionResponse = await api.get("/decisions/");
      const decisionList = decisionResponse.data || [];

      setDecisions(decisionList);

      const discussionResults = [];

      for (const decision of decisionList) {
        try {
          const response = await api.get(
            `/decisions/${decision.id}/discussions/`
          );

          const decisionDiscussions = response.data || [];

          decisionDiscussions.forEach((discussion) => {
            discussionResults.push({
              ...discussion,
              decision_title: decision.title,
              decision_id: decision.id,
            });
          });
        } catch (err) {
          console.error(
            `Failed to load discussions for decision ${decision.id}`,
            err
          );
        }
      }

      discussionResults.sort(
        (a, b) =>
          new Date(b.created_at) -
          new Date(a.created_at)
      );

      setDiscussions(discussionResults);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Failed to load discussions."
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredDiscussions = discussions.filter(
    (discussion) => {
      const searchText = search.toLowerCase();

      return (
        discussion.comment
          ?.toLowerCase()
          .includes(searchText) ||
        discussion.decision_title
          ?.toLowerCase()
          .includes(searchText)
      );
    }
  );

  const formatDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  return (
    <div className="page-container discussions-page">

      {/* HEADER */}
      <div className="discussions-header">
        <div>
          <div className="discussions-eyebrow">
            COLLABORATION
          </div>

          <h1>Discussions</h1>

          <p>
            Review conversations and insights
            connected to your decisions.
          </p>
        </div>

        <div className="discussion-count-card">
          <strong>{discussions.length}</strong>
          <span>Total Discussions</span>
        </div>
      </div>

      {/* SEARCH */}
      <div className="discussion-toolbar">
        <div className="discussion-search">
          <span>⌕</span>

          <input
            type="text"
            placeholder="Search discussions or decisions..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>

        <div className="discussion-summary">
          {decisions.length} decisions
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* CONTENT */}
      {loading ? (
        <div className="discussion-empty">
          <div className="discussion-empty-icon">
            ◌
          </div>

          <h3>Loading discussions...</h3>

          <p>
            Fetching your decision conversations.
          </p>
        </div>
      ) : filteredDiscussions.length === 0 ? (
        <div className="discussion-empty">
          <div className="discussion-empty-icon">
            💬
          </div>

          <h3>
            {search
              ? "No discussions found"
              : "No discussions yet"}
          </h3>

          <p>
            {search
              ? "Try a different search term."
              : "Start a discussion from a decision details page."}
          </p>

          {!search && decisions.length > 0 && (
            <button
              className="primary-button"
              onClick={() =>
                navigate(
                  `/decisions/${decisions[0].id}`
                )
              }
            >
              Open a Decision
            </button>
          )}
        </div>
      ) : (
        <div className="discussions-list">
          {filteredDiscussions.map(
            (discussion) => (
              <div
                className="discussion-card"
                key={discussion.id}
              >
                <div className="discussion-card-top">
                  <div className="discussion-avatar">
                    {(
                      discussion.user_name ||
                      "U"
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="discussion-author">
                    <strong>
                      {discussion.user_name ||
                        `User #${discussion.user_id}`}
                    </strong>

                    <span>
                      {formatDate(
                        discussion.created_at
                      )}
                    </span>
                  </div>

                  <button
                    className="discussion-view-button"
                    onClick={() =>
                      navigate(
                        `/decisions/${discussion.decision_id}`
                      )
                    }
                  >
                    View Decision →
                  </button>
                </div>

                <div className="discussion-decision">
                  <span>Decision</span>

                  <h3>
                    {discussion.decision_title}
                  </h3>
                </div>

                <div className="discussion-comment">
                  {discussion.comment}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default Discussions;