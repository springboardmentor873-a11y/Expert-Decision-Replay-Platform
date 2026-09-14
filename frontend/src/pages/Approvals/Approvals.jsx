import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import { useAuth } from "../../context/AuthContext";
import { listPendingApprovals, approveDecision, rejectDecision } from "../../services/decision";
import StatusBadge from "../../components/StatusBadge/StatusBadge";
import "./Approvals.css";

export default function Approvals() {
  const { tokens } = useAuth();
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const [rejectionReasons, setRejectionReasons] = useState({});

  useEffect(() => {
    async function load() {
      try {
        const data = await listPendingApprovals(tokens.access_token);
        setDecisions(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [tokens]);

  async function handleApprove(id) {
    setActionError("");
    setProcessingId(id);
    try {
      await approveDecision(id, tokens.access_token);
      setDecisions((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      setActionError(err.message);
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(id) {
    const reason = rejectionReasons[id] || "";
    if (!reason.trim()) {
      setActionError("A reason is required when rejecting.");
      return;
    }
    setActionError("");
    setProcessingId(id);
    try {
      await rejectDecision(id, reason, tokens.access_token);
      setDecisions((prev) => prev.filter((d) => d.id !== id));
      setRejectionReasons((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (err) {
      setActionError(err.message);
    } finally {
      setProcessingId(null);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <Navbar />
        <main className="approvals">
          <p className="approvals__loading">Loading…</p>
        </main>
      </div>
    );
  }

  return (
    <div className="page">
      <Navbar />
      <main className="approvals">
        <div className="approvals__header">
          <h1 className="approvals__title">Approval Queue</h1>
          <p className="approvals__subtitle">Decisions awaiting your attention</p>
        </div>

        {error && <div className="approvals__error">{error}</div>}
        {actionError && <div className="approvals__error">{actionError}</div>}

        {decisions.length === 0 ? (
          <div className="approvals__empty">
            <p>No decisions pending your approval.</p>
          </div>
        ) : (
          <ul className="approvals__list">
            {decisions.map((decision) => (
              <li key={decision.id} className="approvals__item">
                <div className="approvals__item-info">
                  <h2 className="approvals__item-title">{decision.title}</h2>
                  <StatusBadge status={decision.status} />
                  <span className="approvals__item-stage">
                    Stage: {decision.current_stage === "reviewer" ? "Reviewer Review" : "Manager Review"}
                  </span>
                </div>
                <div className="approvals__item-actions">
                  <button
                    className="approvals__button approvals__button--approve"
                    onClick={() => handleApprove(decision.id)}
                    disabled={processingId === decision.id}
                  >
                    {processingId === decision.id ? "Processing…" : "Approve"}
                  </button>
                  {rejectionReasons[decision.id] !== undefined ? (
                    <div className="approvals__reject-form">
                      <textarea
                        placeholder="Reason for rejection…"
                        value={rejectionReasons[decision.id] || ""}
                        onChange={(e) =>
                          setRejectionReasons((prev) => ({ ...prev, [decision.id]: e.target.value }))
                        }
                        rows={2}
                        autoFocus
                      />
                      <div>
                        <button
                          className="approvals__button approvals__button--reject"
                          onClick={() => handleReject(decision.id)}
                          disabled={processingId === decision.id}
                        >
                          Confirm Reject
                        </button>
                        <button
                          className="approvals__button approvals__button--cancel"
                          onClick={() => {
                            setRejectionReasons((prev) => {
                              const next = { ...prev };
                              delete next[decision.id];
                              return next;
                            });
                            setActionError("");
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="approvals__button approvals__button--reject"
                      onClick={() =>
                        setRejectionReasons((prev) => ({ ...prev, [decision.id]: "" }))
                      }
                      disabled={processingId === decision.id}
                    >
                      Reject
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}