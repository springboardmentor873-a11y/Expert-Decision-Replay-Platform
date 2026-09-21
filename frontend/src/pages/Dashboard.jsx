import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";

const API_URL = "http://127.0.0.1:8000";

function Dashboard() {
  const navigate = useNavigate();

  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDecisions();
  }, []);

  async function fetchDecisions() {
    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/decisions/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem("access_token");
        navigate("/");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to load decisions");
      }

      setDecisions(data);
    } catch (err) {
      console.error(err);
      setError(
        "Unable to load decisions. Please make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  }

  const totalDecisions = decisions.length;

  const draftCount = decisions.filter(
    (decision) => decision.status === "Draft"
  ).length;

  const inProgressCount = decisions.filter(
    (decision) => decision.status === "In Progress"
  ).length;

  const completedCount = decisions.filter(
    (decision) => decision.status === "Completed"
  ).length;

  function getStatusClass(status) {
    if (status === "Completed") return "status-completed";
    if (status === "In Progress") return "status-progress";
    return "status-draft";
  }

  function getPriorityClass(priority) {
    if (priority === "High") return "priority-high";
    if (priority === "Low") return "priority-low";
    return "priority-medium";
  }

  return (
      <main className="page-container dashboard-container">

        {/* Hero */}
        <section className="dashboard-hero">
          <div>
            <span className="eyebrow">DECISION MANAGEMENT</span>

            <h2>Welcome back 👋</h2>

            <p>
              Track, evaluate and replay your organization's important
              decisions from one place.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={() => navigate("/decisions")}
          >
            + Manage Decisions
          </button>
        </section>

        {/* Error */}
        <ErrorMessage message={error} />

        {/* Statistics */}
        {!loading && !error && (
          <section className="stats-grid">

            <div className="stat-card">
              <div className="stat-icon blue">D</div>

              <div>
                <span>Total Decisions</span>
                <strong>{totalDecisions}</strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon orange">D</div>

              <div>
                <span>Draft</span>
                <strong>{draftCount}</strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon purple">P</div>

              <div>
                <span>In Progress</span>
                <strong>{inProgressCount}</strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon green">✓</div>

              <div>
                <span>Completed</span>
                <strong>{completedCount}</strong>
              </div>
            </div>

          </section>
        )}

        {/* Status Overview */}
<section className="dashboard-section status-overview">

  <div className="section-heading">
    <div>
      <span className="eyebrow">OVERVIEW</span>
      <h2>Decision Status</h2>
      <p>Current distribution of your decision records.</p>
    </div>
  </div>

  <div className="status-overview-grid">

    <div className="status-overview-card">
      <div className="status-overview-top">
        <span className="status-dot draft-dot"></span>
        <span>Draft</span>
      </div>

      <strong>{draftCount}</strong>

      <div className="status-progress-bar">
        <div
          className="status-progress-fill draft-fill"
          style={{
            width: totalDecisions
              ? `${(draftCount / totalDecisions) * 100}%`
              : "0%",
          }}
        ></div>
      </div>

      <small>
        {totalDecisions
          ? Math.round((draftCount / totalDecisions) * 100)
          : 0}
        % of decisions
      </small>
    </div>


    <div className="status-overview-card">
      <div className="status-overview-top">
        <span className="status-dot progress-dot"></span>
        <span>In Progress</span>
      </div>

      <strong>{inProgressCount}</strong>

      <div className="status-progress-bar">
        <div
          className="status-progress-fill progress-fill"
          style={{
            width: totalDecisions
              ? `${(inProgressCount / totalDecisions) * 100}%`
              : "0%",
          }}
        ></div>
      </div>

      <small>
        {totalDecisions
          ? Math.round((inProgressCount / totalDecisions) * 100)
          : 0}
        % of decisions
      </small>
    </div>


    <div className="status-overview-card">
      <div className="status-overview-top">
        <span className="status-dot completed-dot"></span>
        <span>Completed</span>
      </div>

      <strong>{completedCount}</strong>

      <div className="status-progress-bar">
        <div
          className="status-progress-fill completed-fill"
          style={{
            width: totalDecisions
              ? `${(completedCount / totalDecisions) * 100}%`
              : "0%",
          }}
        ></div>
      </div>

      <small>
        {totalDecisions
          ? Math.round((completedCount / totalDecisions) * 100)
          : 0}
        % of decisions
      </small>
    </div>

  </div>
</section>

{/* Priority Overview */}
<section className="dashboard-section priority-overview">

  <div className="section-heading">
    <div>
      <span className="eyebrow">PRIORITY</span>
      <h2>Decision Priority</h2>
      <p>Distribution of decisions based on priority level.</p>
    </div>
  </div>

  <div className="priority-overview-grid">

    {/* High */}
    <div className="priority-overview-card">
      <div className="priority-overview-header">
        <span className="priority-indicator high-indicator"></span>
        <span>High Priority</span>
      </div>

      <strong>
        {
          decisions.filter(
            (decision) => decision.priority === "High"
          ).length
        }
      </strong>

      <div className="priority-progress-bar">
        <div
          className="priority-progress-fill high-fill"
          style={{
            width: totalDecisions
              ? `${
                  (decisions.filter(
                    (decision) => decision.priority === "High"
                  ).length /
                    totalDecisions) *
                  100
                }%`
              : "0%",
          }}
        ></div>
      </div>

      <small>
        {
          totalDecisions
            ? Math.round(
                (decisions.filter(
                  (decision) => decision.priority === "High"
                ).length /
                  totalDecisions) *
                  100
              )
            : 0
        }
        % of decisions
      </small>
    </div>


    {/* Medium */}
    <div className="priority-overview-card">
      <div className="priority-overview-header">
        <span className="priority-indicator medium-indicator"></span>
        <span>Medium Priority</span>
      </div>

      <strong>
        {
          decisions.filter(
            (decision) => decision.priority === "Medium"
          ).length
        }
      </strong>

      <div className="priority-progress-bar">
        <div
          className="priority-progress-fill medium-fill"
          style={{
            width: totalDecisions
              ? `${
                  (decisions.filter(
                    (decision) => decision.priority === "Medium"
                  ).length /
                    totalDecisions) *
                  100
                }%`
              : "0%",
          }}
        ></div>
      </div>

      <small>
        {
          totalDecisions
            ? Math.round(
                (decisions.filter(
                  (decision) => decision.priority === "Medium"
                ).length /
                  totalDecisions) *
                  100
              )
            : 0
        }
        % of decisions
      </small>
    </div>


    {/* Low */}
    <div className="priority-overview-card">
      <div className="priority-overview-header">
        <span className="priority-indicator low-indicator"></span>
        <span>Low Priority</span>
      </div>

      <strong>
        {
          decisions.filter(
            (decision) => decision.priority === "Low"
          ).length
        }
      </strong>

      <div className="priority-progress-bar">
        <div
          className="priority-progress-fill low-fill"
          style={{
            width: totalDecisions
              ? `${
                  (decisions.filter(
                    (decision) => decision.priority === "Low"
                  ).length /
                    totalDecisions) *
                  100
                }%`
              : "0%",
          }}
        ></div>
      </div>

      <small>
        {
          totalDecisions
            ? Math.round(
                (decisions.filter(
                  (decision) => decision.priority === "Low"
                ).length /
                  totalDecisions) *
                  100
              )
            : 0
        }
        % of decisions
      </small>
    </div>

  </div>

</section>

{/* Decision Status Graph */}
<section className="dashboard-section dashboard-chart-section">

  <div className="section-heading">
    <div>
      <span className="eyebrow">ANALYTICS</span>
      <h2>Decision Status Analytics</h2>
      <p>Visual distribution of decisions by their current status.</p>
    </div>
  </div>

  <div className="decision-chart-card">

    <div className="chart-row">
      <div className="chart-label">
        <span className="chart-dot draft-chart-dot"></span>
        <span>Draft</span>
      </div>

      <div className="chart-bar-container">
        <div
          className="chart-bar draft-chart-bar"
          style={{
            width: totalDecisions
              ? `${(draftCount / totalDecisions) * 100}%`
              : "0%",
          }}
        ></div>
      </div>

      <strong>{draftCount}</strong>
    </div>


    <div className="chart-row">
      <div className="chart-label">
        <span className="chart-dot progress-chart-dot"></span>
        <span>In Progress</span>
      </div>

      <div className="chart-bar-container">
        <div
          className="chart-bar progress-chart-bar"
          style={{
            width: totalDecisions
              ? `${(inProgressCount / totalDecisions) * 100}%`
              : "0%",
          }}
        ></div>
      </div>

      <strong>{inProgressCount}</strong>
    </div>


    <div className="chart-row">
      <div className="chart-label">
        <span className="chart-dot completed-chart-dot"></span>
        <span>Completed</span>
      </div>

      <div className="chart-bar-container">
        <div
          className="chart-bar completed-chart-bar"
          style={{
            width: totalDecisions
              ? `${(completedCount / totalDecisions) * 100}%`
              : "0%",
          }}
        ></div>
      </div>

      <strong>{completedCount}</strong>
    </div>

  </div>

</section>

{/* Recent Decisions */}
<section className="dashboard-section">

          <div className="section-heading">
            <div>
              <span className="eyebrow">ACTIVITY</span>
              <h2>Recent Decisions</h2>
              <p>Your latest decision records.</p>
            </div>

            <button
              className="secondary-button"
              onClick={() => navigate("/decisions")}
            >
              View All
            </button>
          </div>

          {loading ? (
            <Loading message="Loading your decisions..." />
          ) : decisions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">+</div>

              <h3>No decisions yet</h3>

              <p>
                Create your first decision to start building a
                traceable decision history.
              </p>

              <button
                className="primary-button"
                onClick={() => navigate("/decisions")}
              >
                Create Decision
              </button>
            </div>
          ) : (
            <div className="recent-decision-list">

              {decisions.slice(0, 5).map((decision) => (
                <article
                  className="recent-decision-card"
                  key={decision.id}
                  onClick={() =>
                    navigate(`/decisions/${decision.id}`)
                  }
                >
                  <div className="decision-main">

                    <div className="decision-number">
                      #{decision.id}
                    </div>

                    <div>
                      <h3>{decision.title}</h3>

                      <p>
                        {decision.description ||
                          "No description available"}
                      </p>
                    </div>

                  </div>

                  <div className="decision-tags">

                    <span
                      className={`status-badge ${getStatusClass(
                        decision.status
                      )}`}
                    >
                      {decision.status}
                    </span>

                    <span
                      className={`priority-badge ${getPriorityClass(
                        decision.priority
                      )}`}
                    >
                      {decision.priority}
                    </span>

                    <span className="arrow">→</span>

                  </div>
                </article>
              ))}

            </div>
          )}

        </section>

      </main>
  );
}

export default Dashboard;