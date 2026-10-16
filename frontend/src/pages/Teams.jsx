import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext.jsx";
import { useToast } from "../ToastContext.jsx";

export default function Teams() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const canManage = user?.role === "administrator" || user?.role === "manager";
  const isAdmin = user?.role === "administrator";
  const isManager = user?.role === "manager";

  const [teams, setTeams] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [showModal, setShowModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamManagerId, setNewTeamManagerId] = useState("");
  const [assignUserId, setAssignUserId] = useState("");
  const [assignTeamId, setAssignTeamId] = useState("");
  const [requestingTeamId, setRequestingTeamId] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (refreshUser) {
        await refreshUser().catch(() => {});
      }
      const [apiTeams, apiDecisions, apiJoinReqs, apiUsers] = await Promise.all([
        api.listTeams(),
        api.listDecisions().catch(() => []),
        api.listTeamJoinRequests().catch(() => []),
        api.listUsers().catch(() => []),
      ]);
      setTeams(apiTeams || []);
      setDecisions(apiDecisions || []);
      setJoinRequests(apiJoinReqs || []);
      setUsers(apiUsers || []);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [showToast, refreshUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleRequestToJoin(teamId) {
    setRequestingTeamId(teamId);
    try {
      await api.requestToJoinTeam(teamId);
      showToast("Request to join team submitted! Awaiting manager or admin approval.");
      await loadData();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setRequestingTeamId(null);
    }
  }

  async function handleApproveRequest(requestId) {
    try {
      await api.approveTeamJoinRequest(requestId);
      showToast("Team join request approved! Member added to team.");
      await loadData();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function handleRejectRequest(requestId) {
    try {
      await api.rejectTeamJoinRequest(requestId);
      showToast("Join request rejected.");
      await loadData();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function handleLeaveTeam(teamId, teamName) {
    if (!window.confirm(`Are you sure you want to leave team "${teamName}"?`)) {
      return;
    }
    try {
      await api.leaveTeam(teamId);
      showToast(`You have left team "${teamName}".`);
      await loadData();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function handleCancelRequest(requestId) {
    try {
      await api.cancelTeamJoinRequest(requestId);
      showToast("Join request cancelled.");
      await loadData();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function handleCreateTeam(e) {
    e.preventDefault();
    if (!newTeamName.trim()) {
      showToast("Please provide a team name.", "error");
      return;
    }
    if (!newTeamManagerId) {
      showToast("Every team must have an assigned manager. Please select a manager.", "error");
      return;
    }
    try {
      await api.createTeam({
        name: newTeamName.trim(),
        manager_id: Number(newTeamManagerId),
      });
      showToast("Team created successfully!");
      setNewTeamName("");
      setNewTeamManagerId("");
      setShowModal(false);
      await loadData();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function handleAssignUser(e) {
    e.preventDefault();
    try {
      const res = await api.assignUserToTeam(assignUserId, assignTeamId);
      showToast(res?.message || "User assigned to team!");
      setAssignUserId("");
      setAssignTeamId("");
      await loadData();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  const teamColors = ["#2563eb", "#8b5cf6", "#f59e0b", "#ec4899", "#10b981", "#06b6d4"];

  const filteredTeams = teams
    .filter((t) => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "id") return b.id - a.id;
      return 0;
    });

  const currentUserTeam = teams.find((t) => String(t.id) === String(user?.team_id));
  const myPendingReq = joinRequests.find((r) => r.user_id === user?.id && r.status === "Pending");
  const myPendingTeam = myPendingReq ? teams.find((t) => String(t.id) === String(myPendingReq.team_id)) : null;

  const pendingJoinRequests = joinRequests.filter((r) => r.status === "Pending");

  return (
    <div className="teams-page-container" style={{ padding: "24px 32px", maxWidth: 1400, margin: "0 auto" }}>
      {/* Page Header */}
      <div className="teams-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div className="teams-title-section">
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: "#0f172a" }}>Organization Teams</h1>
          <p className="subtitle" style={{ color: "#64748b", margin: "4px 0 0 0", fontSize: 14 }}>
            Collaborate with teams, manage team assignments, and review manager approval workflows.
          </p>
        </div>

        <div className="teams-header-right">
          {canManage && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ padding: "10px 18px", fontSize: 13, fontWeight: 700, borderRadius: 8 }}>
              + Create / Assign Team
            </button>
          )}
        </div>
      </div>

      {/* User Current Team Membership Status Banner */}
      {currentUserTeam ? (
        <div
          style={{
            background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
            border: "1px solid #a7f3d0",
            borderRadius: 12,
            padding: "14px 20px",
            marginBottom: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 24 }}>🏢</span>
            <div>
              <div style={{ color: "#065f46", fontSize: 14, fontWeight: 700 }}>
                Current Team: <span style={{ color: "#047857" }}>{currentUserTeam.name}</span>
              </div>
              <div style={{ color: "#047857", fontSize: 12.5 }}>
                Team ID: #{currentUserTeam.id} · Manager: <strong>{currentUserTeam.manager_name || "Assigned Manager"}</strong>
              </div>
            </div>
          </div>
          <button
            onClick={() => handleLeaveTeam(currentUserTeam.id, currentUserTeam.name)}
            style={{
              background: "#ef4444",
              color: "#ffffff",
              border: "none",
              borderRadius: 8,
              padding: "7px 14px",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(239,68,68,0.25)"
            }}
          >
            🚪 Leave Current Team
          </button>
        </div>
      ) : myPendingReq ? (
        <div
          style={{
            background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
            border: "1px solid #fde68a",
            borderRadius: 12,
            padding: "14px 20px",
            marginBottom: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 24 }}>⏳</span>
            <div>
              <div style={{ color: "#92400e", fontSize: 14, fontWeight: 700 }}>
                Pending Join Request: <span style={{ color: "#b45309" }}>{myPendingTeam?.name || `Team #${myPendingReq.team_id}`}</span>
              </div>
              <div style={{ color: "#b45309", fontSize: 12.5 }}>
                Awaiting approval from team manager ({myPendingReq.team_manager_name || "Manager"}) or administrator.
              </div>
            </div>
          </div>
          <button
            onClick={() => handleCancelRequest(myPendingReq.id)}
            style={{
              background: "#ffffff",
              color: "#92400e",
              border: "1px solid #fcd34d",
              borderRadius: 8,
              padding: "7px 14px",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            ✕ Cancel Join Request
          </button>
        </div>
      ) : (
        <div
          style={{
            background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
            border: "1px solid #bfdbfe",
            borderRadius: 12,
            padding: "14px 20px",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span style={{ fontSize: 22 }}>👥</span>
          <div style={{ color: "#1e40af", fontSize: 13, fontWeight: 600 }}>
            You are not currently enrolled in a team. Click <strong>"Request to Join"</strong> on any team card below to submit a join request to that team&apos;s manager.
          </div>
        </div>
      )}

      {/* Tabs & Search Filter Bar */}
      <div className="teams-filter-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14, marginBottom: 24 }}>
        <div className="teams-tabs" style={{ display: "flex", gap: 8 }}>
          <button
            className={`tab-btn ${activeTab === "active" ? "active" : ""}`}
            onClick={() => setActiveTab("active")}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              background: activeTab === "active" ? "#2563eb" : "#ffffff",
              color: activeTab === "active" ? "#ffffff" : "#334155",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer"
            }}
          >
            Active Teams ({teams.length})
          </button>

          <button
            className={`tab-btn ${activeTab === "requests" ? "active" : ""}`}
            onClick={() => setActiveTab("requests")}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              background: activeTab === "requests" ? "#2563eb" : "#ffffff",
              color: activeTab === "requests" ? "#ffffff" : "#334155",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              position: "relative"
            }}
          >
            {canManage ? "Team Join Requests" : "My Requests"} ({pendingJoinRequests.length})
            {pendingJoinRequests.length > 0 && (
              <span style={{ marginLeft: 6, background: "#ef4444", color: "#ffffff", padding: "1px 6px", borderRadius: 10, fontSize: 10 }}>
                {pendingJoinRequests.length}
              </span>
            )}
          </button>
        </div>

        <div className="filter-controls" style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <input
            type="text"
            placeholder="Search teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, outline: "none" }}
          />

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, background: "#ffffff", cursor: "pointer" }}>
            <option value="name">Sort: Name</option>
            <option value="id">Sort: Recent (ID)</option>
          </select>
        </div>
      </div>

      {/* PENDING JOIN REQUESTS TAB */}
      {activeTab === "requests" && (
        <div style={{ background: "#ffffff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.03)", marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#0f172a" }}>
                {canManage ? "Team Join Requests Review & Approval" : "My Team Join Requests"}
              </h3>
              <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#64748b" }}>
                {canManage
                  ? "Only the assigned team manager or an administrator has authority to approve or reject employee join requests."
                  : "View the status of your submitted team join requests."}
              </p>
            </div>
            <span style={{ background: "#eff6ff", color: "#2563eb", padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700 }}>
              {pendingJoinRequests.length} Pending
            </span>
          </div>

          {joinRequests.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", background: "#f8fafc", borderRadius: 12 }}>
              <span style={{ fontSize: 32 }}>📥</span>
              <h4 style={{ margin: "8px 0 4px 0", color: "#334155" }}>No join requests found</h4>
              <p style={{ margin: 0, fontSize: 13 }}>Users can click &quot;Request to Join&quot; on any team card to submit a request.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {joinRequests.map((req) => {
                const isPending = req.status === "Pending";
                const isSelf = String(req.user_id) === String(user?.id);
                const isTeamManager = String(req.team_manager_id) === String(user?.id);
                
                // An Administrator can approve any request (including testing their own).
                // A Team Manager can approve requests for teams they manage (except their own).
                const canAction = isPending && (isAdmin || (isTeamManager && !isSelf));

                return (
                  <div
                    key={req.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "16px 20px",
                      borderRadius: 12,
                      border: "1px solid #e2e8f0",
                      background: isPending ? "#ffffff" : "#f8fafc"
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontWeight: 800, color: "#0f172a", fontSize: 15 }}>{req.user_name}</span>
                        <span style={{ color: "#64748b", fontSize: 12 }}>({req.user_email})</span>
                        {isSelf && (
                          <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "#e0e7ff", color: "#3730a3" }}>
                            You
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: 4,
                            background: req.status === "Approved" ? "#dcfce7" : req.status === "Rejected" ? "#fee2e2" : "#fef3c7",
                            color: req.status === "Approved" ? "#166534" : req.status === "Rejected" ? "#991b1b" : "#92400e"
                          }}
                        >
                          {req.status}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: "#475569", marginTop: 4 }}>
                        Requested team: <strong style={{ color: "#2563eb" }}>{req.team_name}</strong>
                        {req.team_manager_name && (
                          <span style={{ color: "#64748b" }}> · Assigned Manager: <strong style={{ color: "#0f172a" }}>{req.team_manager_name}</strong></span>
                        )}
                        {" "}· Submitted {new Date(req.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div>
                      {canAction ? (
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={() => handleApproveRequest(req.id)}
                            style={{ background: "#16a34a", color: "#ffffff", border: "none", padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                          >
                            ✅ Approve Request
                          </button>
                          <button
                            onClick={() => handleRejectRequest(req.id)}
                            style={{ background: "#ef4444", color: "#ffffff", border: "none", padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                          >
                            ❌ Reject
                          </button>
                        </div>
                      ) : isPending && isSelf ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 12, color: "#b45309", fontWeight: 700, background: "#fef3c7", padding: "6px 12px", borderRadius: 8 }}>
                            ⏳ Awaiting manager ({req.team_manager_name || "Manager"}) review
                          </span>
                          <button
                            onClick={() => handleCancelRequest(req.id)}
                            style={{ background: "#ffffff", color: "#ef4444", border: "1px solid #fecaca", padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                          >
                            ✕ Cancel
                          </button>
                        </div>
                      ) : isPending ? (
                        <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                          Only {req.team_manager_name || "Team Manager"} or Admin can approve
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ACTIVE TEAMS GRID */}
      {activeTab === "active" && (
        loading ? (
          <div className="loading-state" style={{ padding: 40, textAlign: "center" }}>Loading organization teams...</div>
        ) : filteredTeams.length === 0 ? (
          <div className="dashed-card" style={{ padding: 40, width: "100%", cursor: "pointer", textAlign: "center" }} onClick={() => setShowModal(true)}>
            <h3>No teams found</h3>
            <p>Click here to create a new team for your organization!</p>
            <button className="btn btn-primary">+ Create Team</button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
            {filteredTeams.map((team, idx) => {
              const isUserInThisTeam = user?.team_id && String(user.team_id) === String(team.id);
              const isUserInOtherTeam = user?.team_id && String(user.team_id) !== String(team.id);
              const hasPendingForThisTeam = myPendingReq && String(myPendingReq.team_id) === String(team.id);
              const hasPendingForOtherTeam = myPendingReq && String(myPendingReq.team_id) !== String(team.id);
              const teamDecs = decisions.filter((d) => String(d.creator_team_id || d.team_id) === String(team.id));

              return (
                <div
                  key={team.id}
                  style={{
                    background: "#ffffff",
                    borderRadius: 16,
                    border: isUserInThisTeam ? "2px solid #10b981" : "1px solid #e2e8f0",
                    padding: 20,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between"
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: teamColors[idx % teamColors.length], color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800 }}>
                        👥
                      </div>

                      {/* TEAM MEMBERSHIP & JOIN ACTION BUTTONS */}
                      {isUserInThisTeam ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ background: "#dcfce7", color: "#166534", padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 800 }}>
                            ✓ Current Team
                          </span>
                          <button
                            onClick={() => handleLeaveTeam(team.id, team.name)}
                            style={{
                              background: "#fee2e2",
                              color: "#991b1b",
                              border: "1px solid #fecaca",
                              padding: "4px 8px",
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: "pointer"
                            }}
                            title="Leave this team"
                          >
                            🚪 Leave
                          </button>
                        </div>
                      ) : hasPendingForThisTeam ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ background: "#fef3c7", color: "#92400e", padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 800 }}>
                            ⏳ Pending
                          </span>
                          <button
                            onClick={() => handleCancelRequest(myPendingReq.id)}
                            style={{
                              background: "#f1f5f9",
                              color: "#475569",
                              border: "1px solid #cbd5e1",
                              padding: "4px 8px",
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: "pointer"
                            }}
                            title="Cancel join request"
                          >
                            ✕ Cancel
                          </button>
                        </div>
                      ) : isUserInOtherTeam ? (
                        <span
                          style={{
                            background: "#f1f5f9",
                            color: "#64748b",
                            padding: "4px 8px",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: "not-allowed"
                          }}
                          title={`You belong to team '${currentUserTeam?.name || 'another team'}'. Leave it first to join '${team.name}'.`}
                        >
                          🔒 In {currentUserTeam?.name || "Another"}
                        </span>
                      ) : hasPendingForOtherTeam ? (
                        <span
                          style={{
                            background: "#f8fafc",
                            color: "#94a3b8",
                            padding: "4px 8px",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: "not-allowed"
                          }}
                          title={`You already have a pending request for '${myPendingTeam?.name || 'another team'}'. Cancel it first.`}
                        >
                          ⏳ Pending {myPendingTeam?.name || "Other"}
                        </span>
                      ) : (
                        <button
                          onClick={() => handleRequestToJoin(team.id)}
                          disabled={requestingTeamId === team.id}
                          style={{
                            background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                            color: "#ffffff",
                            border: "none",
                            padding: "6px 14px",
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                            boxShadow: "0 2px 6px rgba(37,99,235,0.3)"
                          }}
                        >
                          {requestingTeamId === team.id ? "Submitting..." : "✋ Request to Join"}
                        </button>
                      )}
                    </div>

                    <h3 style={{ margin: "0 0 4px 0", fontSize: 18, fontWeight: 800, color: "#0f172a" }}>{team.name}</h3>
                    <p style={{ margin: "0 0 14px 0", fontSize: 12.5, color: "#64748b" }}>
                      Team ID: #{team.id} · Managed by {team.manager_name || (team.manager_id ? `User #${team.manager_id}` : "Unassigned")}
                    </p>

                    <div style={{ background: "#f8fafc", padding: 12, borderRadius: 10, marginBottom: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: 6 }}>
                        Team Decisions ({teamDecs.length})
                      </div>
                      {teamDecs.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          {teamDecs.slice(0, 2).map((d) => (
                            <Link key={d.id} to={`/decisions/${d.id}`} style={{ fontSize: 12, fontWeight: 600, color: "#2563eb", textDecoration: "none" }}>
                              • {d.title}
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div style={{ fontSize: 12, color: "#94a3b8" }}>No team decisions logged yet.</div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, paddingTop: 10, borderTop: "1px solid #f1f5f9" }}>
                    <button
                      onClick={() => setSelectedTeam(team)}
                      style={{ flex: 1, padding: "8px", background: "#f1f5f9", color: "#334155", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                    >
                      View Details
                    </button>
                    <Link
                      to={`/repository?team=${team.id}`}
                      style={{ flex: 1, padding: "8px", background: "#eff6ff", color: "#2563eb", borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: "none", textAlign: "center" }}
                    >
                      🕸️ Team Graph
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Detail Modal */}
      {selectedTeam && (
        <div className="modal-backdrop" onClick={() => setSelectedTeam(null)} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ background: "#ffffff", padding: 24, borderRadius: 16, maxWidth: 500, width: "90%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{selectedTeam.name} Details</h3>
              <button onClick={() => setSelectedTeam(null)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer" }}>✕</button>
            </div>
            <p style={{ color: "#475569", fontSize: 13.5, marginBottom: 16 }}>
              Team ID: #{selectedTeam.id} · Managed by {selectedTeam.manager_name || (selectedTeam.manager_id ? `User #${selectedTeam.manager_id}` : "Unassigned")}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {canManage && (
                <div style={{ background: "#f8fafc", padding: 12, borderRadius: 10, border: "1px solid #e2e8f0" }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#334155", display: "block", marginBottom: 6 }}>
                    👑 Assign / Change Team Manager:
                  </label>
                  <select
                    value={selectedTeam.manager_id || ""}
                    onChange={async (e) => {
                      const mId = e.target.value ? Number(e.target.value) : null;
                      if (!mId) {
                        showToast("A team manager is required.", "error");
                        return;
                      }
                      try {
                        const updated = await api.setTeamManager(selectedTeam.id, mId);
                        showToast("Team manager updated successfully!");
                        setSelectedTeam(updated);
                        await loadData();
                      } catch (err) {
                        showToast(err.message, "error");
                      }
                    }}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, background: "#ffffff" }}
                  >
                    <option value="">-- Select Team Manager --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name} ({u.role?.name || "User"} · {u.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <Link
                to={`/repository?team=${selectedTeam.id}`}
                onClick={() => setSelectedTeam(null)}
                style={{ width: "100%", padding: "10px", background: "#8b5cf6", color: "#ffffff", borderRadius: 8, fontWeight: 700, fontSize: 13, textDecoration: "none", textAlign: "center", display: "block" }}
              >
                🕸️ Open Separate Team Knowledge Graph →
              </Link>

              {/* ACTION IN MODAL */}
              {user?.team_id && String(user.team_id) === String(selectedTeam.id) ? (
                <button
                  onClick={() => {
                    handleLeaveTeam(selectedTeam.id, selectedTeam.name);
                    setSelectedTeam(null);
                  }}
                  style={{ width: "100%", padding: "10px", background: "#fee2e2", color: "#991b1b", border: "1px solid #fecaca", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                >
                  🚪 Leave This Team
                </button>
              ) : myPendingReq && String(myPendingReq.team_id) === String(selectedTeam.id) ? (
                <button
                  onClick={() => {
                    handleCancelRequest(myPendingReq.id);
                    setSelectedTeam(null);
                  }}
                  style={{ width: "100%", padding: "10px", background: "#fef3c7", color: "#92400e", border: "1px solid #fcd34d", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                >
                  ✕ Cancel Pending Join Request
                </button>
              ) : user?.team_id ? (
                <div style={{ textAlign: "center", padding: "10px", background: "#f1f5f9", color: "#64748b", borderRadius: 8, fontSize: 12.5, fontWeight: 600 }}>
                  🔒 You are already a member of team &apos;{currentUserTeam?.name || "another team"}&apos;. Leave it first before joining {selectedTeam.name}.
                </div>
              ) : myPendingReq ? (
                <div style={{ textAlign: "center", padding: "10px", background: "#f8fafc", color: "#94a3b8", borderRadius: 8, fontSize: 12.5, fontWeight: 600 }}>
                  ⏳ You have a pending request for &apos;{myPendingTeam?.name || "another team"}&apos;. Cancel it before requesting this team.
                </div>
              ) : (
                <button
                  onClick={() => {
                    handleRequestToJoin(selectedTeam.id);
                    setSelectedTeam(null);
                  }}
                  style={{ width: "100%", padding: "10px", background: "#2563eb", color: "#ffffff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                >
                  ✋ Submit Join Request
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal for Creating / Assigning Team */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ background: "#ffffff", padding: 24, borderRadius: 16, maxWidth: 480, width: "90%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Create or Assign Team</h3>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer" }}>✕</button>
            </div>

            {canManage && (
              <form onSubmit={handleCreateTeam} style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
                <h4 style={{ margin: 0, fontSize: 14, color: "#0f172a" }}>Create New Team</h4>
                <input
                  type="text"
                  placeholder="e.g. AI Architecture Team"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  required
                  style={{ padding: "10px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}
                />
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", display: "block", marginBottom: 4 }}>
                    Team Manager: <span style={{ color: "#ef4444" }}>* (Required)</span>
                  </label>
                  <select
                    value={newTeamManagerId}
                    onChange={(e) => setNewTeamManagerId(e.target.value)}
                    required
                    style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, background: "#ffffff" }}
                  >
                    <option value="">-- Select Team Manager (Required) --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name} ({u.role?.name || "User"} · {u.email})
                      </option>
                    ))}
                  </select>
                </div>
                <button className="btn btn-primary" type="submit" style={{ padding: "10px", fontWeight: 700 }}>
                  Create Team in Database
                </button>
              </form>
            )}

            {canManage && <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: "16px 0" }} />}

            {canManage && (
              <form onSubmit={handleAssignUser} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <h4 style={{ margin: 0, fontSize: 14, color: "#0f172a" }}>Direct Assign User to Team</h4>
                <input
                  type="number"
                  placeholder="User ID"
                  value={assignUserId}
                  onChange={(e) => setAssignUserId(e.target.value)}
                  required
                  style={{ padding: "10px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}
                />
                <input
                  type="number"
                  placeholder="Team ID"
                  value={assignTeamId}
                  onChange={(e) => setAssignTeamId(e.target.value)}
                  required
                  style={{ padding: "10px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}
                />
                <button className="btn btn-secondary" type="submit" style={{ padding: "10px", fontWeight: 700 }}>
                  Direct Assign User
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
