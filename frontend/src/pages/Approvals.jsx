import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://127.0.0.1:8000";

function Approvals() {
  const navigate = useNavigate();

  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchApprovals() {
    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/");
      return;
    }

    try {
      setLoading(true);
      setError("");

      /*
       * We first get the user's decisions.
       * Then we retrieve approvals for each decision.
       */
      const decisionResponse = await fetch(`${API_URL}/decisions/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (decisionResponse.status === 401) {
        localStorage.removeItem("access_token");
        navigate("/");
        return;
      }

      const decisions = await decisionResponse.json();

      if (!decisionResponse.ok) {
        throw new Error(
          decisions.detail || "Failed to load decisions"
        );
      }

      const approvalRequests = decisions.map(async (decision) => {
        const response = await fetch(
          `${API_URL}/approvals/decision/${decision.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          return [];
        }

        const data = await response.json();

        return data.map((approval) => ({
          ...approval,
          decision_title: decision.title,
        }));
      });

      const approvalResults = await Promise.all(approvalRequests);

      const allApprovals = approvalResults.flat();

      setApprovals(allApprovals);
    } catch (err) {
      console.error(err);
      setError(
        "Unable to load approvals. Please make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchApprovals();
  }, []);

  async function handleReview(approvalId, status) {
  const token = localStorage.getItem("access_token");

  if (!token) {
    navigate("/");
    return;
  }

  const comments = window.prompt(
    `Enter comments for ${status.toLowerCase()} approval:`
  );

  if (comments === null) {
    return;
  }

  try {
    const response = await fetch(
      `${API_URL}/approvals/${approvalId}/review`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
          comments: comments || null,
        }),
      }
    );

    if (response.status === 401) {
      localStorage.removeItem("access_token");
      navigate("/");
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail || `Failed to ${status.toLowerCase()} approval`
      );
    }

    await fetchApprovals();
  } catch (err) {
    console.error(err);
    setError(err.message);
  }
}

  function getStatusClass(status) {
    if (status === "Approved") {
      return "approval-status approved";
    }

    if (status === "Rejected") {
      return "approval-status rejected";
    }

    return "approval-status pending";
  }

  function formatDate(dateValue) {
    if (!dateValue) {
      return "—";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleString();
  }

  const pendingCount = approvals.filter(
    (approval) => approval.status === "Pending"
  ).length;

  const approvedCount = approvals.filter(
    (approval) => approval.status === "Approved"
  ).length;

  const rejectedCount = approvals.filter(
    (approval) => approval.status === "Rejected"
  ).length;

  return (
    <div className="page-container approvals-page">
      <section className="page-header">
        <div>
          <span className="eyebrow">WORKFLOW</span>

          <h2>Approvals</h2>

          <p>
            Review and track approval requests associated with your
            organization's decisions.
          </p>
        </div>
      </section>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <section className="approval-stats">
            <div className="approval-stat-card">
              <span>Total Approvals</span>
              <strong>{approvals.length}</strong>
            </div>

            <div className="approval-stat-card pending-stat">
              <span>Pending</span>
              <strong>{pendingCount}</strong>
            </div>

            <div className="approval-stat-card approved-stat">
              <span>Approved</span>
              <strong>{approvedCount}</strong>
            </div>

            <div className="approval-stat-card rejected-stat">
              <span>Rejected</span>
              <strong>{rejectedCount}</strong>
            </div>
          </section>

          <section className="dashboard-section approvals-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">APPROVAL QUEUE</span>

                <h2>Decision Approvals</h2>

                <p>
                  Track the current approval status of decisions.
                </p>
              </div>
            </div>

            {approvals.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">✓</div>

                <h3>No approvals found</h3>

                <p>
                  Approval requests will appear here when they are
                  created for decisions.
                </p>

                <button
                  className="primary-button"
                  onClick={() => navigate("/decisions")}
                >
                  View Decisions
                </button>
              </div>
            ) : (
              <div className="approval-list">
                {approvals.map((approval) => (
                  <article
                    className="approval-card"
                    key={approval.id}
                  >
                    <div className="approval-main">
                      <div className="approval-icon">
                        ✓
                      </div>

                      <div className="approval-info">
                        <span className="approval-id">
                          Approval #{approval.id}
                        </span>

                        <h3>
                          {approval.decision_title ||
                            `Decision #${approval.decision_id}`}
                        </h3>

                        <p>
                          Reviewer ID:{" "}
                          {approval.reviewer_id || "Not assigned"}
                        </p>
                      </div>
                    </div>

                    <div className="approval-details">
                      <span
                        className={getStatusClass(
                          approval.status
                        )}
                      >
                        {approval.status}
                      </span>

                      <span className="approval-date">
                        Created:{" "}
                        {formatDate(approval.created_at)}
                      </span>

                      {approval.reviewed_at && (
                        <span className="approval-date">
                          Reviewed:{" "}
                          {formatDate(approval.reviewed_at)}
                        </span>
                      )}

                      <button
                        className="secondary-button"
                        onClick={() =>
                          navigate(
                            `/decisions/${approval.decision_id}`
                          )
                        }
                      >
                        View Decision
                      </button>
                      {approval.status === "Pending" && (
  <>
    <button
      className="approval-action approve-action"
      onClick={() =>
        handleReview(approval.id, "Approved")
      }
    >
      Approve
    </button>

    <button
      className="approval-action reject-action"
      onClick={() =>
        handleReview(approval.id, "Rejected")
      }
    >
      Reject
    </button>
  </>
)}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {loading && (
        <div className="loading-state">
          Loading approvals...
        </div>
      )}
    </div>
  );
}

export default Approvals;