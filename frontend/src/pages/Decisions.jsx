import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://127.0.0.1:8000";

function Decisions() {
  const navigate = useNavigate();

  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

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
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
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
      console.error("Error loading decisions:", err);
      setError(
        "Unable to load decisions. Make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  }

  function openDecision(decisionId) {
    navigate(`/decisions/${decisionId}`);
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

  const filteredDecisions = decisions.filter((decision) => {
    const matchesSearch =
      decision.title
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||
      decision.description
        ?.toLowerCase()
        .includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All" ||
      decision.status === statusFilter;

    const matchesPriority =
      priorityFilter === "All" ||
      decision.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="decisions-page">

      {/* PAGE HEADER */}

      <section className="decisions-hero">

        <div>
          <span className="eyebrow">DECISION MANAGEMENT</span>

          <h1>Decisions</h1>

          <p>
            Create, review and manage your organization's
            decision records.
          </p>
        </div>

        <button
          className="primary-button"
         onClick={() => navigate("/decisions/create")}
        >
          + Create Decision
        </button>

      </section>


      {/* FILTER BAR */}

      <section className="decision-toolbar">

        <div className="search-box">

          <span>⌕</span>

          <input
            type="text"
            placeholder="Search decisions..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

        </div>


        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="All">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="In Progress">In Progress</option>
          <option value="In Review">In Review</option>
          <option value="Completed">Completed</option>
        </select>


        <select
          value={priorityFilter}
          onChange={(event) =>
            setPriorityFilter(event.target.value)
          }
        >
          <option value="All">All Priorities</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

      </section>


      {/* ERROR */}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}


      {/* DECISIONS */}

      <section className="decisions-section">

        <div className="section-heading">

          <div>
            <span className="eyebrow">RECORDS</span>

            <h2>All Decisions</h2>

            <p>
              {filteredDecisions.length} decision
              {filteredDecisions.length !== 1 ? "s" : ""} found
            </p>
          </div>

        </div>


        {loading ? (

          <div className="decisions-loading">
            <div className="loading-spinner"></div>
            <p>Loading decisions...</p>
          </div>

        ) : filteredDecisions.length === 0 ? (

          <div className="empty-state">

            <div className="empty-icon">⌕</div>

            <h3>
              {decisions.length === 0
                ? "No decisions yet"
                : "No matching decisions"}
            </h3>

            <p>
              {decisions.length === 0
                ? "Create your first decision to start building a traceable decision history."
                : "Try changing your search or filters."}
            </p>

{decisions.length === 0 && (
  <button
    className="primary-button"
    onClick={() => navigate("/decisions/create")}
  >
    Create Decision
  </button>
)}

          </div>

        ) : (

          <div className="decisions-list">

            {filteredDecisions.map((decision) => (

              <article
                className="decision-row"
                key={decision.id}
                onClick={() => openDecision(decision.id)}
              >

                <div className="decision-row-main">

                  <div className="decision-number">
                    #{decision.id}
                  </div>

                  <div className="decision-content">

                    <h3>{decision.title}</h3>

                    <p>
                      {decision.description ||
                        "No description available"}
                    </p>

                  </div>

                </div>


                <div className="decision-row-meta">

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

                  <span className="decision-arrow">
                    →
                  </span>

                </div>

              </article>

            ))}

          </div>

        )}

      </section>

    </div>
  );
}

export default Decisions;   