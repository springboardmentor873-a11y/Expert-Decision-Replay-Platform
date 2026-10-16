import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext.jsx";
import { useToast } from "../ToastContext.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import NewDecisionModal from "../components/NewDecisionModal.jsx";

export default function Dashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const canCreateDecision = ["manager", "administrator"].includes(user?.role);

  const [dashboardData, setDashboardData] = useState(null);
  const [decisions, setDecisions] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const userName = user?.full_name || user?.name || (user?.email ? user.email.split("@")[0] : "there");

  async function loadData() {
    setLoading(true);
    try {
      const [dash, decs, tms] = await Promise.all([
        api.getDashboard().catch(() => null),
        api.listDecisions().catch(() => []),
        api.listTeams().catch(() => []),
      ]);
      setDashboardData(dash);
      setDecisions(decs || []);
      setTeams(tms || []);
    } catch (err) {
      showToast(err.message || "Failed to load dashboard data", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="loading-state" style={{ padding: 40, textAlign: "center" }}>
        Loading DecisioHub Workspace Dashboard...
      </div>
    );
  }

  // Calculate Metrics from Real Data
  const totalDecisions = decisions.length;
  const activeTeamsCount = teams.length;
  const pendingApprovalsCount = dashboardData?.pending_approvals?.length || decisions.filter(d => d.status === "In Review" || d.status === "Pending").length;
  const approvedCount = decisions.filter(d => d.status === "Approved").length;

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1400, margin: "0 auto" }}>
      {/* Top Banner Row: Greeting + Quote Card (Matching Image 2) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr",
          gap: 20,
          marginBottom: 28,
          alignItems: "stretch"
        }}
      >
        {/* Welcome Banner */}
        <div
          style={{
            background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
            padding: "28px 32px",
            borderRadius: 18,
            boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.3)",
            color: "#ffffff",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between"
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <span className="status-pill blue" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Enterprise Workspace
              </span>
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, margin: "4px 0 8px 0", color: "#ffffff", letterSpacing: "-0.02em" }}>
              {getGreeting()}, {userName}! 👋
            </h1>
            <p style={{ color: "#94a3b8", fontSize: 14, margin: 0, lineHeight: 1.5, maxWidth: 540 }}>
              Welcome back to DecisioHub. Monitor team architectural decisions, participate in review workflows, and maintain transparent knowledge repository.
            </p>
          </div>

          <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
            {canCreateDecision && (
              <button
                className="btn btn-primary"
                onClick={() => setShowModal(true)}
                style={{
                  padding: "10px 18px",
                  fontSize: 13,
                  fontWeight: 700,
                  borderRadius: 8,
                  background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
                  cursor: "pointer"
                }}
              >
                + Document Decision
              </button>
            )}
            <Link
              to="/repository"
              className="btn btn-secondary"
              style={{
                padding: "10px 18px",
                fontSize: 13,
                fontWeight: 600,
                borderRadius: 8,
                background: "rgba(255, 255, 255, 0.1)",
                color: "#ffffff",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                textDecoration: "none"
              }}
            >
              Explore Knowledge Repository
            </Link>
          </div>
        </div>

        {/* Inspirational Architecture Quote Card (Matching Image 2) */}
        <div
          style={{
            background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
            padding: "24px 28px",
            borderRadius: 18,
            border: "1px solid #bfdbfe",
            boxShadow: "0 4px 14px rgba(37, 99, 235, 0.08)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between"
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 20 }}>💡</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase" }}>
                Architecture Principle of the Day
              </span>
            </div>
            <p style={{ fontSize: 14, color: "#1e3a8a", fontStyle: "italic", lineHeight: 1.5, margin: 0, fontWeight: 500 }}>
              "Good architecture is about making decisions that can be deferred as long as possible without consequences, keeping options open as requirements evolve."
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "#2563eb",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700
              }}
            >
              RM
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>Robert C. Martin</div>
              <div style={{ fontSize: 11, color: "#475569" }}>Author of Clean Architecture</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Metric / KPI Cards (Matching Image 2) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 18,
          marginBottom: 28
        }}
      >
        <div
          style={{
            background: "#ffffff",
            padding: 20,
            borderRadius: 14,
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
              Total Decisions
            </span>
            <span style={{ fontSize: 20 }}>📄</span>
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, color: "#0f172a", marginTop: 8 }}>
            {totalDecisions}
          </div>
          <div style={{ fontSize: 12, color: "#10b981", marginTop: 4, fontWeight: 600 }}>
            Active across all teams
          </div>
        </div>

        <div
          style={{
            background: "#ffffff",
            padding: 20,
            borderRadius: 14,
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#2563eb", textTransform: "uppercase" }}>
              Active Teams
            </span>
            <span style={{ fontSize: 20 }}>👥</span>
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, color: "#1d4ed8", marginTop: 8 }}>
            {activeTeamsCount}
          </div>
          <div style={{ fontSize: 12, color: "#3b82f6", marginTop: 4 }}>
            Collaborative groups
          </div>
        </div>

        <div
          style={{
            background: "#ffffff",
            padding: 20,
            borderRadius: 14,
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#d97706", textTransform: "uppercase" }}>
              Pending Approvals
            </span>
            <span style={{ fontSize: 20 }}>⏳</span>
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, color: "#b45309", marginTop: 8 }}>
            {pendingApprovalsCount}
          </div>
          <div style={{ fontSize: 12, color: "#d97706", marginTop: 4, fontWeight: 600 }}>
            Requires review
          </div>
        </div>

        <div
          style={{
            background: "#ffffff",
            padding: 20,
            borderRadius: 14,
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#16a34a", textTransform: "uppercase" }}>
              Approved Specs
            </span>
            <span style={{ fontSize: 20 }}>✅</span>
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, color: "#15803d", marginTop: 8 }}>
            {approvedCount}
          </div>
          <div style={{ fontSize: 12, color: "#22c55e", marginTop: 4 }}>
            Finalized architecture
          </div>
        </div>
      </div>

      {/* TEAM ANALYTICS & VISUAL CHARTS BREAKDOWN */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          marginBottom: 28
        }}
      >
        {/* Status Distribution Visual Chart Card */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: 16,
            border: "1px solid #e2e8f0",
            padding: 20,
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>📊</span>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                Status & Category Distribution
              </h3>
            </div>
            <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Live Breakdown</span>
          </div>

          {/* Status Segment Progress Bar */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
              Status Breakdown
            </div>
            <div style={{ height: 12, width: "100%", background: "#f1f5f9", borderRadius: 6, display: "flex", overflow: "hidden" }}>
              {["Approved", "Under Review", "Draft", "Rejected", "Archived"].map((st) => {
                const count = decisions.filter((d) => d.status === st).length;
                const pct = totalDecisions > 0 ? (count / totalDecisions) * 100 : 0;
                const colors = { Approved: "#16a34a", "Under Review": "#d97706", Draft: "#2563eb", Rejected: "#ef4444", Archived: "#64748b" };
                if (pct === 0) return null;
                return (
                  <div key={st} style={{ width: `${pct}%`, background: colors[st] || "#3b82f6" }} title={`${st}: ${count} (${Math.round(pct)}%)`} />
                );
              })}
            </div>
          </div>

          {/* Status Legend */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, fontSize: 12 }}>
            {[
              { label: "Approved", count: decisions.filter((d) => d.status === "Approved").length, color: "#16a34a" },
              { label: "Under Review", count: decisions.filter((d) => d.status === "Under Review").length, color: "#d97706" },
              { label: "Draft", count: decisions.filter((d) => d.status === "Draft").length, color: "#2563eb" },
              { label: "Archived", count: decisions.filter((d) => d.status === "Archived").length, color: "#64748b" },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: item.color }} />
                <span style={{ color: "#334155", fontWeight: 600 }}>{item.label}: <strong>{item.count}</strong></span>
              </div>
            ))}
          </div>
        </div>

        {/* Team Leaderboard & Velocity Card */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: 16,
            border: "1px solid #e2e8f0",
            padding: 20,
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>🏆</span>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                Team Decision Leaderboard
              </h3>
            </div>
            <span style={{ fontSize: 11, color: "#2563eb", fontWeight: 700, background: "#eff6ff", padding: "2px 8px", borderRadius: 4 }}>
              Top Contributors
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {teams.slice(0, 4).map((tm, idx) => {
              const tmDecs = decisions.filter((d) => String(d.creator_team_id || d.team_id) === String(tm.id)).length;
              const maxDecs = Math.max(1, decisions.length);
              const pct = Math.round((tmDecs / maxDecs) * 100);

              return (
                <div key={tm.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: idx === 0 ? "#d97706" : "#64748b", width: 20 }}>
                    #{idx + 1}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, color: "#0f172a", marginBottom: 3 }}>
                      <span>{tm.name}</span>
                      <span>{tmDecs} decision{tmDecs === 1 ? "" : "s"}</span>
                    </div>
                    <div style={{ height: 6, width: "100%", background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.max(15, pct)}%`, background: idx === 0 ? "#2563eb" : "#3b82f6", borderRadius: 4 }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid Layout (Matching Image 2) */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 24, alignItems: "start" }}>
        
        {/* Left Column: Recent Team Decisions Table + Learn From Past Banner */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          
          {/* Recent Team Decisions Table */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: 16,
              border: "1px solid #e2e8f0",
              padding: 22,
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                  Recent Team Decisions
                </h3>
                <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0 0 0" }}>
                  Latest decisions submitted across collaborative engineering groups
                </p>
              </div>

              <Link
                to="/decisions"
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#2563eb",
                  textDecoration: "none"
                }}
              >
                View All →
              </Link>
            </div>

            {decisions.length === 0 ? (
              <div style={{ textAlign: "center", padding: 30, color: "#94a3b8", fontSize: 13 }}>
                {canCreateDecision
                  ? 'No decisions documented yet. Click "+ Document Decision" to create your first one.'
                  : "No decisions documented yet."}
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="custom-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                      <th style={{ padding: "12px 14px", textAlign: "left", color: "#475569", fontWeight: 600 }}>Decision Title</th>
                      <th style={{ padding: "12px 14px", textAlign: "left", color: "#475569", fontWeight: 600 }}>Team</th>
                      <th style={{ padding: "12px 14px", textAlign: "left", color: "#475569", fontWeight: 600 }}>Status</th>
                      <th style={{ padding: "12px 14px", textAlign: "left", color: "#475569", fontWeight: 600 }}>Date</th>
                      <th style={{ padding: "12px 14px", textAlign: "right", color: "#475569", fontWeight: 600 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {decisions.slice(0, 6).map((d) => {
                      const tName = teams.find((t) => t.id === d.team_id)?.name || "General Team";
                      return (
                        <tr key={d.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "14px", fontWeight: 600, color: "#0f172a" }}>
                            {d.title}
                          </td>
                          <td style={{ padding: "14px", color: "#475569" }}>
                            <span style={{ background: "#f1f5f9", padding: "3px 8px", borderRadius: 4, fontSize: 12 }}>
                              {tName}
                            </span>
                          </td>
                          <td style={{ padding: "14px" }}>
                            <StatusBadge status={d.status} />
                          </td>
                          <td style={{ padding: "14px", color: "#64748b", fontSize: 12 }}>
                            {new Date(d.created_at || Date.now()).toLocaleDateString()}
                          </td>
                          <td style={{ padding: "14px", textAlign: "right" }}>
                            <Link
                              to={`/decisions/${d.id}`}
                              style={{
                                color: "#2563eb",
                                fontWeight: 600,
                                textDecoration: "none",
                                fontSize: 12
                              }}
                            >
                              Details
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* "Learn from the Past" Banner (Matching Image 2) */}
          <div
            style={{
              background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
              borderRadius: 16,
              padding: 24,
              color: "#ffffff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 6px 18px rgba(15, 23, 42, 0.25)"
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 18 }}>🔍</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#60a5fa", textTransform: "uppercase" }}>
                  Knowledge Reuse
                </span>
              </div>
              <h4 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#ffffff" }}>
                Learn from Past Decisions
              </h4>
              <p style={{ color: "#94a3b8", fontSize: 13, margin: "4px 0 0 0", maxWidth: 450 }}>
                Explore prior architectural trade-offs to prevent redundant analysis and accelerate current sprint decisions.
              </p>
            </div>

            <Link
              to="/repository"
              style={{
                background: "#2563eb",
                color: "#ffffff",
                padding: "10px 18px",
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 13,
                textDecoration: "none",
                whiteSpace: "nowrap",
                boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)"
              }}
            >
              Explore Repository →
            </Link>
          </div>

        </div>

        {/* Right Column: My Teams, Upcoming Activities, Quick Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          
          {/* My Teams List Widget (Matching Image 2) */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: 16,
              border: "1px solid #e2e8f0",
              padding: 20,
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>👥</span>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                  My Teams ({teams.length})
                </h3>
              </div>
              <Link to="/teams" style={{ fontSize: 12, fontWeight: 600, color: "#2563eb", textDecoration: "none" }}>
                Manage
              </Link>
            </div>

            {teams.length === 0 ? (
              <div style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: 10 }}>
                No teams registered yet.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {teams.slice(0, 4).map((team) => (
                  <div
                    key={team.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      borderRadius: 10,
                      background: "#f8fafc",
                      border: "1px solid #f1f5f9"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 8,
                          background: "#eff6ff",
                          color: "#2563eb",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: 13
                        }}
                      >
                        {team.name ? team.name.substring(0, 2).toUpperCase() : "TM"}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{team.name}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>
                          {team.description || "Collaborative Engineering Team"}
                        </div>
                      </div>
                    </div>

                    <span style={{ fontSize: 11, fontWeight: 600, color: "#10b981", background: "#ecfdf5", padding: "2px 6px", borderRadius: 4 }}>
                      Active
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Activities Stream (Matching Image 2) */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: 16,
              border: "1px solid #e2e8f0",
              padding: 20,
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 18 }}>⚡</span>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                Upcoming & Recent Activity
              </h3>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: "#fff7ed",
                  border: "1px solid #ffedd5"
                }}
              >
                <span style={{ fontSize: 16 }}>⏳</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#9a3412" }}>
                    Approval Pending: Architecture Spec
                  </div>
                  <div style={{ fontSize: 11, color: "#c2410c", marginTop: 2 }}>
                    Level 1 review requested by lead architect.
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: "#f0fdf4",
                  border: "1px solid #dcfce7"
                }}
              >
                <span style={{ fontSize: 16 }}>✅</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#166534" }}>
                    Decision Approved
                  </div>
                  <div style={{ fontSize: 11, color: "#15803d", marginTop: 2 }}>
                    PostgreSQL indexing strategy approved for release v2.4.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Continue Exploring Quick Links */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: 16,
              border: "1px solid #e2e8f0",
              padding: 20,
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
            }}
          >
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 12px 0" }}>
              Continue Exploring
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Link
                to="/discussions"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: "#f8fafc",
                  color: "#334155",
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: "none"
                }}
              >
                <span>💬 Join Team Discussions</span>
                <span>→</span>
              </Link>

              <Link
                to="/reports"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: "#f8fafc",
                  color: "#334155",
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: "none"
                }}
              >
                <span>📊 Visual Analytics & Reports</span>
                <span>→</span>
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* New Decision Modal */}
      {showModal && (
        <NewDecisionModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onCreated={() => {
            loadData();
            showToast("New decision documented successfully!");
          }}
        />
      )}
    </div>
  );
}
