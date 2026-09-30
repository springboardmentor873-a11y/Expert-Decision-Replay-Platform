import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar/Navbar";
import { useAuth } from "../../context/AuthContext";
import {
  approveJoinRequest,
  listPendingJoinRequests,
  rejectJoinRequest,
} from "../../services/teams";
import "./JoinRequests.css";

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function JoinRequests() {
  const { tokens } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [success, setSuccess] = useState("");
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await listPendingJoinRequests(tokens.access_token);
        setRequests(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [tokens]);

  async function handleApprove(requestId) {
    setActionError("");
    setSuccess("");
    setProcessingId(requestId);
    try {
      await approveJoinRequest(requestId, tokens.access_token);
      setRequests((prev) => prev.filter((request) => request.id !== requestId));
      setSuccess("Join request approved. The member has been added to the team.");
    } catch (err) {
      setActionError(err.message);
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(requestId) {
    setActionError("");
    setSuccess("");
    setProcessingId(requestId);
    try {
      await rejectJoinRequest(requestId, tokens.access_token);
      setRequests((prev) => prev.filter((request) => request.id !== requestId));
      setSuccess("Join request rejected. The member was not added to the team.");
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
        <main className="join-requests">
          <p className="join-requests__loading">Loading…</p>
        </main>
      </div>
    );
  }

  return (
    <div className="page">
      <Navbar />
      <main className="join-requests">
        <div className="join-requests__header">
          <h1 className="join-requests__title">Team Join Requests</h1>
          <p className="join-requests__subtitle">Employees waiting to be added to a team</p>
        </div>

        {error && <div className="join-requests__error">{error}</div>}
        {actionError && <div className="join-requests__error">{actionError}</div>}
        {success && <div className="join-requests__success">{success}</div>}

        {requests.length === 0 ? (
          <div className="join-requests__empty">
            <p>No team join requests pending.</p>
          </div>
        ) : (
          <table className="join-requests__table">
            <thead>
              <tr>
                <th>Requester</th>
                <th>Team</th>
                <th>Requested</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id}>
                  <td>
                    <div className="join-requests__name">{request.requester_name}</div>
                    <div className="join-requests__email">{request.requester_email}</div>
                  </td>
                  <td>{request.team_name}</td>
                  <td className="join-requests__date">{formatDate(request.created_at)}</td>
                  <td>
                    <span className="join-requests__status">Pending</span>
                  </td>
                  <td>
                    <div className="join-requests__actions">
                      <button
                        className="join-requests__button join-requests__button--approve"
                        onClick={() => handleApprove(request.id)}
                        disabled={processingId === request.id}
                      >
                        {processingId === request.id ? "Processing…" : "Approve"}
                      </button>
                      <button
                        className="join-requests__button join-requests__button--reject"
                        onClick={() => handleReject(request.id)}
                        disabled={processingId === request.id}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}