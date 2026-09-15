import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";

const API_URL = "http://127.0.0.1:8000";

function Replay() {
  const { decisionId } = useParams();
  const navigate = useNavigate();

  const [replay, setReplay] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchReplay();
  }, [decisionId]);

  async function fetchReplay() {
    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/decisions/${decisionId}/replay`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        localStorage.removeItem("access_token");
        navigate("/");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to load replay");
      }

      setReplay(data);
    } catch (err) {
      console.error("Replay error:", err);
      setError(err.message || "Unable to load replay.");
    } finally {
      setLoading(false);
    }
  }

  function getStatusClass(status) {
    if (status === "Completed") return "status-completed";
    if (status === "In Progress") return "status-progress";
    if (status === "In Review") return "status-review";
    return "status-draft";
  }

  function getPriorityClass(priority) {
    if (priority === "High") return "priority-high";
    if (priority === "Low") return "priority-low";
    return "priority-medium";
  }

  if (loading) {
    return <Loading message="Loading decision history..." />;
  }

  return (
    <div className="replay-page">

      {/* PAGE HEADER */}

      <section className="replay-header">

        <div>
          <span className="eyebrow">
            DECISION HISTORY
          </span>

          <h1>Decision Replay</h1>

          <p>
            Review how this decision changed over time.
          </p>
        </div>

        <div className="replay-header-actions">

          <div className="version-count-card">
            <strong>{replay.length}</strong>
            <span>Versions</span>
          </div>

          <button
            className="secondary-button"
            onClick={() =>
              navigate(`/decisions/${decisionId}`)
            }
          >
            ← Back to Decision
          </button>

        </div>

      </section>


      {/* ERROR */}

      {error && (
        <ErrorMessage message={error} />
      )}


      {/* EMPTY STATE */}

      {!error && replay.length === 0 && (
        <section className="replay-empty-state">

          <div className="replay-empty-icon">
            ↻
          </div>

          <h2>No Version History</h2>

          <p>
            This decision does not have any recorded
            versions yet.
          </p>

          <button
            className="primary-button"
            onClick={() =>
              navigate(`/decisions/${decisionId}`)
            }
          >
            Back to Decision
          </button>

        </section>
      )}


      {/* VERSION TIMELINE */}

      {!error && replay.length > 0 && (
        <section className="replay-content">

          <div className="replay-intro">

            <div>
              <span className="eyebrow">
                VERSION TIMELINE
              </span>

              <h2>
                Decision Evolution
              </h2>

              <p>
                Each version represents a recorded state
                of this decision.
              </p>
            </div>

          </div>


          <div className="replay-timeline">

            {replay.map((version, index) => (

              <div
                className="replay-timeline-item"
                key={version.version_number}
              >

                {/* TIMELINE MARKER */}

                <div className="replay-marker">
                  <span>
                    V{version.version_number}
                  </span>
                </div>


                {/* VERSION CARD */}

                <article className="replay-version-card">

                  {/* CARD HEADER */}

                  <div className="replay-version-header">

                    <div>

                      <span className="version-label">
                        VERSION {version.version_number}
                      </span>

                      <h3>
                        {version.title}
                      </h3>

                    </div>

                    <div className="version-date">

                      <span>
                        Recorded
                      </span>

                      <strong>
                        {version.created_at
                          ? new Date(
                              version.created_at
                            ).toLocaleString()
                          : "Date unavailable"}
                      </strong>

                    </div>

                  </div>


                  {/* VERSION INFORMATION */}

                  <div className="replay-info-grid">

                    <div className="replay-info-item">

                      <span>
                        Status
                      </span>

                      <strong>
                        <span
                          className={`status-badge ${getStatusClass(
                            version.status
                          )}`}
                        >
                          {version.status}
                        </span>
                      </strong>

                    </div>


                    <div className="replay-info-item">

                      <span>
                        Priority
                      </span>

                      <strong>
                        <span
                          className={`priority-badge ${getPriorityClass(
                            version.priority
                          )}`}
                        >
                          {version.priority}
                        </span>
                      </strong>

                    </div>


                    <div className="replay-info-item">

                      <span>
                        Changed By
                      </span>

                      <strong>
                        User #{version.changed_by}
                      </strong>

                    </div>

                  </div>


                  {/* DESCRIPTION */}

                  <div className="replay-description">

                    <span className="detail-label">
                      Description
                    </span>

                    <p>
                      {version.description ||
                        "No description available."}
                    </p>

                  </div>


                  {/* CHANGES */}

                  <div className="replay-changes">

                    <div className="changes-heading">

                      <div>
                        <span className="detail-label">
                          CHANGE LOG
                        </span>

                        <h4>
                          Recorded Changes
                        </h4>
                      </div>

                    </div>


                    {version.changes &&
                    version.changes.length > 0 ? (

                      <ul className="change-list">

                        {version.changes.map(
                          (change, changeIndex) => (

                            <li key={changeIndex}>

                              <span className="change-icon">
                                ✓
                              </span>

                              <span>
                                {change}
                              </span>

                            </li>

                          )
                        )}

                      </ul>

                    ) : (

                      <div className="no-changes">

                        <span>
                          ✓
                        </span>

                        <p>
                          No changes recorded for this version.
                        </p>

                      </div>

                    )}

                  </div>

                </article>

              </div>

            ))}

          </div>

        </section>
      )}

    </div>
  );
}

export default Replay;