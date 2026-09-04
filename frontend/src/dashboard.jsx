import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "./services/api";

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const loadData = async () => {
      try {
        const [userRes, decisionsRes] = await Promise.all([
          api.get("/me"),
          api.get("/decisions"),
        ]);

        setUser(userRes.data);
        setDecisions(decisionsRes.data || []);
      } catch (error) {
        console.error("Dashboard loading error:", error);
        localStorage.removeItem("token");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (loading) {
    return <div style={styles.loading}>Loading dashboard...</div>;
  }

  const totalDecisions = decisions.length;
  const draftDecisions = decisions.filter((decision) => decision.status === "Draft").length;
  const discussionCount = decisions.reduce((sum, decision) => sum + (decision.discussions || 0), 0);
  const versionCount = decisions.reduce((sum, decision) => sum + (decision.version_count || 0), 0);

  return (
    <div style={styles.app}>
      <aside style={styles.sidebar}>
        <div style={styles.logo}>Expert Decision<span style={styles.logoSmall}>Replay Platform</span></div>
        <nav>
          <button style={{ ...styles.navButton, ...styles.activeNav }}>🏠 Dashboard</button>
          <button style={styles.navButton} onClick={() => navigate("/decisions")}>📋 Decisions</button>
          <button style={styles.navButton} onClick={() => navigate("/decisions/create")}>➕ Create Decision</button>
          <button style={styles.navButton} onClick={() => navigate("/discussions")}>💬 Discussions</button>
          <button style={styles.navButton} onClick={() => navigate("/files")}>📁 Files</button>
          <button style={styles.navButton} onClick={() => navigate("/versions")}>🔄 Versions</button>
        </nav>

        <div style={styles.sidebarBottom}>
          <button style={styles.navButton} onClick={() => navigate("/profile")}>👤 Profile</button>
          <button style={styles.logoutButton} onClick={handleLogout}>🚪 Logout</button>
        </div>
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <h2 style={styles.pageTitle}>Dashboard</h2>
            <p style={styles.pageSubtitle}>Manage and replay organizational decisions</p>
          </div>

          <div style={styles.userArea}>
            <div style={styles.avatar}>{user?.name?.charAt(0)?.toUpperCase() || "U"}</div>
            <div>
              <strong>{user?.name || "User"}</strong>
              <div style={styles.userEmail}>{user?.email || ""}</div>
            </div>
          </div>
        </header>

        <section style={styles.welcome}>
          <div>
            <h1>Welcome back, {user?.name || "User"} 👋</h1>
            <p>Here’s an overview of your decision workspace.</p>
          </div>
          <button style={styles.primaryButton} onClick={() => navigate("/decisions/create")}>+ Create Decision</button>
        </section>

        <section style={styles.stats}>
          <div style={styles.card}><div style={styles.cardIcon}>📋</div><div><p style={styles.cardLabel}>Total Decisions</p><h2>{totalDecisions}</h2></div></div>
          <div style={styles.card}><div style={styles.cardIcon}>📝</div><div><p style={styles.cardLabel}>Draft Decisions</p><h2>{draftDecisions}</h2></div></div>
          <div style={styles.card}><div style={styles.cardIcon}>💬</div><div><p style={styles.cardLabel}>Discussions</p><h2>{discussionCount}</h2></div></div>
          <div style={styles.card}><div style={styles.cardIcon}>🔄</div><div><p style={styles.cardLabel}>Versions</p><h2>{versionCount}</h2></div></div>
        </section>

        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <div>
              <h2>Recent Decisions</h2>
              <p>Your latest organizational decisions</p>
            </div>
            <button style={styles.secondaryButton} onClick={() => navigate("/decisions")}>View All</button>
          </div>

          {decisions.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📋</div>
              <h3>No decisions yet</h3>
              <p>Create your first decision to start tracking organizational choices.</p>
              <button style={styles.primaryButton} onClick={() => navigate("/decisions/create")}>Create Your First Decision</button>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
              {decisions.slice(0, 4).map((decision) => (
                <div key={decision.id} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong>{decision.title}</strong>
                    <span style={{ background: "#eef2ff", color: "#4338ca", padding: "6px 10px", borderRadius: 999 }}>{decision.status}</span>
                  </div>
                  <p style={{ color: "#4b5563", margin: "8px 0" }}>{decision.problem_statement}</p>
                  <small style={{ color: "#6b7280" }}>{decision.category || "General"} • {decision.objective || "No objective provided"}</small>
                </div>
              ))}
            </div>
          )}
        </section>

        <section style={styles.section}>
          <h2>Quick Actions</h2>
          <div style={styles.quickActions}>
            <button style={styles.actionCard} onClick={() => navigate("/decisions/create")}><span>➕</span><strong>Create Decision</strong><small>Record a new organizational decision</small></button>
            <button style={styles.actionCard} onClick={() => navigate("/decisions")}><span>📋</span><strong>View Decisions</strong><small>Review existing decisions</small></button>
            <button style={styles.actionCard} onClick={() => navigate("/versions")}><span>🔄</span><strong>View History</strong><small>Track decision changes</small></button>
          </div>
        </section>
      </main>
    </div>
  );
}

const styles = {
  app: { display: "flex", minHeight: "100vh", background: "#f5f7fb", fontFamily: "Arial, sans-serif", color: "#172033" },
  sidebar: { width: "250px", background: "#111827", color: "white", padding: "24px 16px", display: "flex", flexDirection: "column", boxSizing: "border-box" },
  logo: { fontSize: "20px", fontWeight: "700", marginBottom: "40px", padding: "0 10px" },
  logoSmall: { display: "block", fontSize: "13px", fontWeight: "400", marginTop: "5px", opacity: 0.65 },
  navButton: { width: "100%", padding: "13px 14px", marginBottom: "7px", border: "none", borderRadius: "8px", background: "transparent", color: "#d1d5db", textAlign: "left", fontSize: "14px", cursor: "pointer" },
  activeNav: { background: "#4f46e5", color: "white" },
  sidebarBottom: { marginTop: "auto" },
  logoutButton: { width: "100%", padding: "13px", border: "none", borderRadius: "8px", background: "#374151", color: "white", cursor: "pointer" },
  main: { flex: 1, padding: "28px 38px", boxSizing: "border-box" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" },
  pageTitle: { margin: 0, fontSize: "28px" },
  pageSubtitle: { color: "#6b7280", marginTop: "6px" },
  userArea: { display: "flex", alignItems: "center", gap: "12px" },
  avatar: { width: "42px", height: "42px", borderRadius: "50%", background: "#4f46e5", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" },
  userEmail: { fontSize: "12px", color: "#6b7280", marginTop: "3px" },
  welcome: { background: "white", borderRadius: "14px", padding: "28px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", boxShadow: "0 2px 10px rgba(0,0,0,0.04)" },
  primaryButton: { background: "#4f46e5", color: "white", border: "none", padding: "12px 20px", borderRadius: "8px", fontWeight: "600", cursor: "pointer" },
  stats: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "18px", marginBottom: "30px" },
  card: { background: "white", borderRadius: "12px", padding: "20px", display: "flex", alignItems: "center", gap: "15px", boxShadow: "0 2px 10px rgba(0,0,0,0.04)" },
  cardIcon: { fontSize: "25px" },
  cardLabel: { margin: 0, color: "#6b7280", fontSize: "13px" },
  section: { background: "white", borderRadius: "14px", padding: "24px", marginBottom: "24px", boxShadow: "0 2px 10px rgba(0,0,0,0.04)" },
  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  secondaryButton: { background: "white", border: "1px solid #d1d5db", padding: "9px 16px", borderRadius: "7px", cursor: "pointer" },
  emptyState: { textAlign: "center", padding: "45px 20px", color: "#6b7280" },
  emptyIcon: { fontSize: "42px" },
  quickActions: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" },
  actionCard: { background: "#f8f9fc", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "20px", textAlign: "left", cursor: "pointer" },
  loading: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }
};

export default Dashboard;