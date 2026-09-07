import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "./services/api";

const statusColors = {
  Draft: ["#fff0c9", "#9a6700"],
  "Under Review": ["#e8f1ff", "#315ed8"],
  Pending: ["#fff0c9", "#9a6700"],
  Approved: ["#e3f7eb", "#1a7c4d"],
  Rejected: ["#ffe3e3", "#c83c3c"],
};

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [decisions, setDecisions] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewingId, setReviewingId] = useState(null);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }

    Promise.all([api.get("/me"), api.get("/decisions"), api.get("/teams")])
      .then(([profile, decisionList, teamList]) => {
        setUser(profile.data);
        setDecisions(decisionList.data || []);
        setTeams(teamList.data || []);
      })
      .catch((requestError) => {
        console.error("Dashboard loading error:", requestError);
        if (requestError.message?.toLowerCase().includes("token") || requestError.message?.includes("401")) {
          localStorage.removeItem("token");
          navigate("/login");
        } else {
          setError("We could not load your decisions. Please refresh and try again.");
        }
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  const reviewDecision = async (decisionId, status) => {
    setReviewingId(decisionId);
    try {
      const response = await api.put(`/decisions/${decisionId}/review`, { status });
      setDecisions((current) => current.map((decision) => (
        decision.id === decisionId ? { ...decision, ...response.data, status } : decision
      )));
    } catch (requestError) {
      alert(requestError?.response?.data?.detail || requestError.message || "Unable to update decision status.");
    } finally {
      setReviewingId(null);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading your workspace...</div>;
  }

  const safeDecisions = decisions;

  const stats = {
    total: safeDecisions.length,
    draft: safeDecisions.filter((item) => (item.status || "Draft") === "Draft" || (item.status || "Draft") === "Pending").length,
    review: safeDecisions.filter((item) => (item.status || "Draft") === "Under Review").length,
    approved: safeDecisions.filter((item) => (item.status || "Draft") === "Approved").length,
    rejected: safeDecisions.filter((item) => (item.status || "Draft") === "Rejected").length,
  };

  const tableRows = safeDecisions;

  const donutSegments = [
    { label: "Draft", value: stats.draft, color: "#f0c94a" },
    { label: "Under Review", value: stats.review, color: "#5b7ef9" },
    { label: "Approved", value: stats.approved, color: "#5fc7a0" },
    { label: "Rejected", value: stats.rejected, color: "#ef727a" },
  ];

  const totalService = stats.total || 1;
  let donutStart = 0;
  const donutGradient = stats.total
    ? `conic-gradient(${donutSegments.map((segment) => {
      const end = donutStart + (segment.value / totalService) * 100;
      const slice = `${segment.color} ${donutStart}% ${end}%`;
      donutStart = end;
      return slice;
    }).join(", ")})`
    : "#e8edf3";
  const displayDate = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div style={styles.pageShell}>
      <aside style={styles.sidebar}>
        <div style={styles.brandWrap}>
          <div style={styles.brandIcon}>✦</div>
          <div style={styles.brandText}>
            <span>Expert Decision</span>
            <span>Replay Platform</span>
          </div>
        </div>

        <nav style={styles.nav}>
          <NavButton label="Dashboard" icon="⌂" active onClick={() => navigate("/dashboard")} />
          <NavButton label="Decisions" icon="✓" onClick={() => navigate("/decisions")} />
          <NavButton label="Create Decision" icon="＋" onClick={() => navigate("/decisions/create")} />
          <NavButton label="Teams" icon="◎" onClick={() => navigate("/teams")} />
          <NavButton label="My Discussions" icon="◌" onClick={() => navigate("/discussions")} />
          <NavButton label="Knowledge Repository" icon="▦" onClick={() => navigate("/dashboard")} />
          <NavButton label="Documents" icon="▣" onClick={() => navigate("/files")} />
          <NavButton label="Analytics" icon="▤" onClick={() => navigate("/versions")} />
          <NavButton label="Profile" icon="◍" onClick={() => navigate("/profile")} />
          <NavButton label="Settings" icon="⚙" onClick={() => navigate("/profile")} />
        </nav>

        <button style={styles.logoutButton} onClick={logout}>↩ Logout</button>
      </aside>

      <main style={styles.mainArea}>
        <header style={styles.topBar}>
          <div style={styles.spacer} />
          <div style={styles.headerUser}>
            <button style={styles.headerIcon}>◔</button>
            <div style={styles.avatar}>{(user?.name || "John Doe").split(" ")[0]?.charAt(0).toUpperCase() || "J"}{(user?.name || "John Doe").split(" ")[1]?.charAt(0).toUpperCase() || "D"}</div>
            <div style={styles.userMeta}>
              <strong>{user?.name || "John Doe"}</strong>
              <span>{user?.role_name || "Employee"}</span>
            </div>
          </div>
        </header>

        <div style={styles.dashboardHeader}>
          <div>
            <h1 style={styles.heading}>Welcome back, {user?.name?.split(" ")[0] || "John"}!</h1>
            <p style={styles.subtitle}>Here&apos;s an overview of your decisions and team activity.</p>
          </div>
          <div style={styles.dateText}>{displayDate}</div>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <section style={styles.statsGrid}>
          <StatCard icon="▣" value={stats.total} label="Total Decisions" tone="blue" />
          <StatCard icon="✎" value={stats.draft} label="Draft" tone="gold" />
          <StatCard icon="◔" value={stats.review} label="Under Review" tone="lightBlue" />
          <StatCard icon="✓" value={stats.approved} label="Approved" tone="green" />
          <StatCard icon="✕" value={stats.rejected} label="Rejected" tone="red" />
        </section>

        <div style={styles.mainContent}>
          <div style={styles.tablePanel}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.panelTitle}>Recent Decisions</h2>
              <button style={styles.primaryButton} onClick={() => navigate("/decisions/create")}>＋ Create Decision</button>
            </div>

            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Title</th>
                  <th style={styles.th}>Team</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Created On</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={styles.emptyTableState}>No decisions yet. Create your first decision to populate this dashboard.</td>
                  </tr>
                ) : tableRows.map((decision) => {
                  const status = decision.status || "Draft";
                  const statusStyle = statusColors[status] || ["#fff0c9", "#9a6700"];

                  return (
                    <tr key={decision.id} style={styles.tr}>
                      <td style={styles.td}>{decision.title}</td>
                      <td style={styles.td}>{decision.team_name || "Unassigned"}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, background: statusStyle[0], color: statusStyle[1] }}>{status}</span>
                      </td>
                      <td style={styles.td}>{decision.created_at ? new Date(decision.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Date unavailable"}</td>
                      <td style={styles.tdAction}>
                        <button style={styles.viewButton} onClick={() => navigate("/decisions")}>View</button>
                        <button style={styles.menuButton}>⋯</button>
                        {user?.permissions?.can_approve && (
                          <div style={styles.reviewActions}>
                            <button
                              style={styles.pendingButton}
                              disabled={reviewingId === decision.id}
                              onClick={() => reviewDecision(decision.id, "Pending")}
                            >
                              Pending
                            </button>
                            <button
                              style={styles.approveButton}
                              disabled={reviewingId === decision.id}
                              onClick={() => reviewDecision(decision.id, "Approved")}
                            >
                              Approve
                            </button>
                            <button
                              style={styles.rejectButton}
                              disabled={reviewingId === decision.id}
                              onClick={() => reviewDecision(decision.id, "Rejected")}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <button style={styles.viewAll} onClick={() => navigate("/decisions")}>View all decisions →</button>
          </div>

          <div style={styles.sideStack}>
            <div style={styles.sidePanel}>
              <h3 style={styles.sideHeading}>Team Activity</h3>
              <div style={styles.activityList}>
                <div style={styles.emptySideState}>No team activity yet.</div>
              </div>
            </div>

            <div style={styles.sidePanel}>
              <div style={styles.teamsHeader}>
                <h3 style={styles.sideHeading}>My Teams</h3>
                <button style={styles.textLink} onClick={() => navigate("/teams")}>View all →</button>
              </div>

              <div style={styles.teamList}>
                {teams.length === 0 ? <div style={styles.emptySideState}>No teams created yet.</div> : teams.slice(0, 3).map((team) => (
                  <div key={team.id} style={styles.teamRow}>
                    <div style={styles.teamAvatar}>◉</div>
                    <div style={styles.teamMeta}>
                      <div style={styles.teamName}>{team.name}</div>
                      <div style={styles.teamCount}>{team.member_count} members</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        <section style={styles.bottomRow}>
          <div style={styles.bottomCard}>
            <div style={styles.bottomHeader}>
              <h3 style={styles.sideHeading}>Decisions by Status</h3>
            </div>

            <div style={styles.pieWrap}>
              <div style={styles.chartWrap}>
                <div style={{ ...styles.donut, background: donutGradient }} aria-label="Decisions by status">
                  <div style={styles.donutCenter}>
                    <strong>{stats.total}</strong>
                    <span style={styles.donutCenterLabel}>Total</span>
                  </div>
                </div>
              </div>

              <div style={styles.legendWrap}>
                {donutSegments.map((item) => (
                  <div key={item.label} style={styles.legendRow}>
                    <span style={{ ...styles.legendDot, background: item.color }} />
                    <span style={styles.legendLabel}>{item.label}</span>
                    <span style={styles.legendValue}>{item.value} ({Math.round((item.value / totalService) * 100)}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={styles.bottomCard}>
            <div style={styles.bottomHeader}>
              <h3 style={styles.sideHeading}>Recent Discussions</h3>
              <button style={styles.textLink} onClick={() => navigate("/discussions")}>View all →</button>
            </div>

            <div style={styles.discussionList}>
              <div style={styles.emptyDiscussionState}>No discussions yet.</div>
            </div>
          </div>
        </section>
        </div>
      </main>
    </div>
  );
}

function NavButton({ label, icon, onClick, active = false }) {
  return (
    <button style={{ ...styles.navButton, ...(active ? styles.navButtonActive : {}) }} onClick={onClick}>
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function StatCard({ icon, value, label, tone }) {
  const palette = {
    blue: ["#e8f1ff", "#3d6fe8"],
    green: ["#e8f8f0", "#1d9a5f"],
    gold: ["#fff1d4", "#d59b14"],
    lightBlue: ["#eaf3ff", "#3c7dd8"],
    red: ["#ffe6e8", "#d24b5d"],
  };

  const [background, color] = palette[tone] || palette.blue;

  return (
    <div style={styles.statCard}>
      <div style={{ ...styles.statIcon, background, color }}>{icon}</div>
      <div style={styles.statInfo}>
        <strong style={styles.statValue}>{value}</strong>
        <span style={styles.statLabel}>{label}</span>
      </div>
    </div>
  );
}

const styles = {
  pageShell: {
    display: "flex",
    minHeight: "100vh",
    background: "#f3f5f8",
    color: "#1e2430",
    fontFamily: "Inter, 'Segoe UI', sans-serif",
    overflowX: "hidden",
  },
  sidebar: {
    width: 188,
    flex: "0 0 188px",
    background: "#1d2f44",
    color: "#edf3ff",
    padding: "18px 10px 16px",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
  },
  brandWrap: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    padding: "0 6px 18px",
  },
  brandIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    background: "linear-gradient(135deg, #5b89f8, #4b68f5)",
    display: "grid",
    placeItems: "center",
    fontSize: 15,
    fontWeight: 700,
    color: "white",
  },
  brandText: {
    display: "flex",
    flexDirection: "column",
    gap: 0,
    fontWeight: 700,
    fontSize: 14,
    lineHeight: 1.2,
    letterSpacing: "-0.03em",
  },
  nav: {
    display: "grid",
    gap: 4,
    marginTop: 8,
  },
  navButton: {
    width: "100%",
    border: "none",
    background: "transparent",
    color: "#d9e3f2",
    display: "flex",
    alignItems: "center",
    gap: 9,
    padding: "10px 9px",
    borderRadius: 10,
    fontSize: 13,
    textAlign: "left",
    cursor: "pointer",
    fontWeight: 500,
  },
  navButtonActive: {
    background: "#eff4ff",
    color: "#1f2c47",
    fontWeight: 600,
  },
  logoutButton: {
    marginTop: "auto",
    border: "none",
    background: "#243b53",
    color: "#edf2ff",
    padding: "10px 9px",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 13,
  },
  mainArea: {
    flex: 1,
    minWidth: 0,
    padding: "16px 18px 24px",
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  spacer: { flex: 1 },
  headerUser: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "4px 8px 4px 4px",
  },
  headerIcon: {
    width: 34,
    height: 34,
    border: "1px solid #dde6f0",
    background: "#fff",
    borderRadius: 10,
    color: "#4a586d",
    cursor: "pointer",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #5d8ef8, #5365ed)",
    color: "#fff",
    display: "grid",
    placeItems: "center",
    fontWeight: 700,
    fontSize: 12,
  },
  userMeta: {
    display: "flex",
    flexDirection: "column",
    lineHeight: 1.2,
    fontSize: 12,
    color: "#202d41",
  },
  dashboardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  heading: {
    margin: 0,
    fontSize: 25,
    letterSpacing: "-0.04em",
    color: "#202a3a",
    fontWeight: 800,
  },
  subtitle: {
    margin: "8px 0 0",
    fontSize: 14,
    color: "#68788d",
    lineHeight: 1.5,
  },
  dateText: {
    color: "#5c6d84",
    fontSize: 13,
    fontWeight: 500,
    marginTop: 30,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
    gap: 12,
    marginBottom: 14,
  },
  statCard: {
    background: "#fff",
    border: "1px solid #e5ebf3",
    borderRadius: 10,
    padding: "13px 12px",
    display: "flex",
    alignItems: "center",
    gap: 9,
    minHeight: 76,
  },
  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    display: "grid",
    placeItems: "center",
    fontSize: 16,
    fontWeight: 700,
  },
  statInfo: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  statValue: {
    fontSize: 22,
    color: "#1d2737",
    fontWeight: 700,
    lineHeight: 1,
  },
  statLabel: {
    fontSize: 12,
    color: "#4b5d76",
  },
  mainContent: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 2.1fr) minmax(270px, 0.9fr)",
    gap: 12,
    alignItems: "start",
  },
  tablePanel: {
    background: "#fff",
    border: "1px solid #e4ebf3",
    borderRadius: 10,
    padding: "14px 14px 12px",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  panelTitle: {
    margin: 0,
    fontSize: 17,
    fontWeight: 700,
    color: "#202a3a",
  },
  primaryButton: {
    border: "none",
    background: "linear-gradient(180deg, #5e85f8, #4968f7)",
    color: "white",
    borderRadius: 10,
    padding: "8px 12px",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 10px 18px rgba(73,104,247,0.18)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    tableLayout: "fixed",
  },
  th: {
    textAlign: "left",
    padding: "12px 8px",
    color: "#677688",
    fontSize: 13,
    borderBottom: "1px solid #ecf0f5",
    fontWeight: 600,
  },
  tr: {
    borderBottom: "1px solid #f1f4f9",
  },
  td: {
    padding: "14px 8px",
    fontSize: 14,
    color: "#2b3747",
    verticalAlign: "middle",
  },
  tdAction: {
    padding: "14px 8px",
    verticalAlign: "middle",
  },
  reviewActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 7,
  },
  pendingButton: {
    border: "1px solid #ead27a",
    background: "#fff8df",
    color: "#936e00",
    borderRadius: 6,
    padding: "4px 6px",
    fontSize: 10,
    cursor: "pointer",
  },
  approveButton: {
    border: "1px solid #9ad9b9",
    background: "#e9f8ef",
    color: "#187445",
    borderRadius: 6,
    padding: "4px 6px",
    fontSize: 10,
    cursor: "pointer",
  },
  rejectButton: {
    border: "1px solid #efb2b2",
    background: "#fff0f0",
    color: "#b43737",
    borderRadius: 6,
    padding: "4px 6px",
    fontSize: 10,
    cursor: "pointer",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    fontSize: 11,
    padding: "5px 8px",
    minWidth: 80,
    fontWeight: 700,
  },
  viewButton: {
    border: "1px solid #dfeaf7",
    background: "#fff",
    color: "#415a7a",
    borderRadius: 8,
    padding: "6px 11px",
    cursor: "pointer",
  },
  menuButton: {
    border: "none",
    background: "transparent",
    color: "#65758a",
    fontSize: 18,
    cursor: "pointer",
  },
  viewAll: {
    marginTop: 16,
    color: "#486dd6",
    fontWeight: 600,
    fontSize: 14,
    textAlign: "right",
    display: "block",
    width: "100%",
    border: "none",
    background: "transparent",
    cursor: "pointer",
  },
  sideStack: {
    display: "grid",
    gap: 18,
  },
  sidePanel: {
    background: "#fff",
    border: "1px solid #e4ebf3",
    borderRadius: 10,
    padding: "12px 10px",
  },
  sideHeading: {
    margin: 0,
    fontSize: 15,
    fontWeight: 700,
    color: "#202a3a",
  },
  activityList: {
    marginTop: 10,
    display: "grid",
    gap: 8,
  },
  emptySideState: {
    color: "#718096",
    fontSize: 12,
    textAlign: "center",
    padding: "14px 6px",
  },
  activityRow: {
    display: "grid",
    gridTemplateColumns: "36px minmax(0,1fr) auto",
    gap: 10,
    alignItems: "center",
    paddingBottom: 8,
    borderBottom: "1px solid #eef2f6",
  },
  activityAvatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    background: "#edf2ff",
    color: "#465ec9",
    fontWeight: 700,
    display: "grid",
    placeItems: "center",
    fontSize: 11,
  },
  activityTextBlock: {
    minWidth: 0,
  },
  activityName: {
    fontSize: 11,
    color: "#5b6a7e",
    marginBottom: 2,
  },
  activityAction: {
    fontSize: 11,
    color: "#1e293b",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  activityTime: {
    fontSize: 11,
    color: "#7b8a9b",
    whiteSpace: "nowrap",
  },
  teamsHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  textLink: {
    border: "none",
    background: "transparent",
    color: "#496bd6",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
  },
  teamList: {
    display: "grid",
    gap: 8,
  },
  teamRow: {
    display: "grid",
    gridTemplateColumns: "38px minmax(0,1fr)",
    gap: 10,
    alignItems: "center",
  },
  teamAvatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    background: "linear-gradient(135deg, #eff5ff, #dde8ff)",
    color: "#3f63d8",
    display: "grid",
    placeItems: "center",
    fontSize: 16,
  },
  teamMeta: { minWidth: 0 },
  teamName: {
    fontSize: 14,
    color: "#24334a",
    fontWeight: 600,
  },
  teamCount: {
    fontSize: 12,
    color: "#67798c",
    marginTop: 2,
  },
  bottomRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 18,
    marginTop: 18,
    gridColumn: "1",
  },
  bottomCard: {
    background: "#fff",
    border: "1px solid #e4ebf3",
    borderRadius: 16,
    padding: "16px 14px",
    minHeight: 220,
  },
  bottomHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  pieWrap: {
    display: "flex",
    alignItems: "center",
    gap: 18,
  },
  chartWrap: {
    width: 160,
    height: 160,
    display: "grid",
    placeItems: "center",
  },
  donut: {
    width: 132,
    height: 132,
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    position: "relative",
  },
  donutCenter: {
    width: 78,
    height: 78,
    borderRadius: "50%",
    background: "#fff",
    display: "grid",
    placeItems: "center",
    alignContent: "center",
    gap: 2,
    color: "#1d2a3d",
  },
  donutCenterStrong: {
    fontSize: 22,
  },
  donutCenterLabel: {
    fontSize: 11,
    color: "#677888",
  },
  legendWrap: {
    flex: 1,
    display: "grid",
    gap: 10,
    paddingRight: 6,
  },
  legendRow: {
    display: "grid",
    gridTemplateColumns: "10px 1fr auto",
    gap: 8,
    alignItems: "center",
    fontSize: 13,
    color: "#2e3e54",
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    display: "inline-block",
  },
  legendLabel: { color: "#46566b" },
  legendValue: { color: "#5c6d83" },
  discussionList: {
    display: "grid",
    gap: 10,
  },
  emptyDiscussionState: {
    color: "#718096",
    fontSize: 12,
    padding: "22px 0",
  },
  discussionRow: {
    display: "grid",
    gridTemplateColumns: "30px minmax(0,1fr) auto",
    gap: 10,
    alignItems: "center",
    padding: "8px 0",
    borderBottom: "1px solid #eef2f6",
  },
  discussionIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    background: "#edf4ff",
    color: "#4366d3",
    display: "grid",
    placeItems: "center",
    fontSize: 13,
  },
  discussionText: {
    fontSize: 13,
    color: "#2a3848",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  discussionTime: {
    fontSize: 11,
    color: "#7a8aa0",
    whiteSpace: "nowrap",
  },
  error: {
    background: "#fff0f0",
    color: "#b62d2d",
    border: "1px solid #efc7c7",
    borderRadius: 10,
    padding: "10px 12px",
    marginBottom: 14,
  },
  loading: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background: "#eef3f8",
    color: "#1f2c47",
    fontSize: 18,
  },
};

export default Dashboard;
