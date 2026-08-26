import React from "react";

function Dashboard({ user, onLogout }) {
  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.brand}>
          <span style={styles.logoIcon}>🧠</span>
          <span style={styles.logoText}>DecisionReplay</span>
        </div>
        <button style={styles.logoutBtn} onClick={onLogout}>
          Sign Out
        </button>
      </header>

      <main style={styles.main}>
        <div style={styles.welcomeCard}>
          <div style={styles.avatar}>
            {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div>
            <h1 style={styles.title}>Welcome, {user?.name || "User"}!</h1>
            <p style={styles.subtitle}>
              Expert Decision Replay Platform &bull; Milestone 1 Active
            </p>
          </div>
        </div>

        <div style={styles.grid}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>User Profile</h2>
            <div style={styles.infoRow}>
              <span style={styles.label}>Full Name:</span>
              <span style={styles.value}>{user?.name}</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.label}>Email Address:</span>
              <span style={styles.value}>{user?.email}</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.label}>User ID:</span>
              <span style={styles.value}>#{user?.id}</span>
            </div>
          </div>

          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Role & Team</h2>
            <div style={styles.infoRow}>
              <span style={styles.label}>Role ID:</span>
              <span style={styles.value}>
                {user?.role_name ? `${user.role_name} (ID: ${user.role_id})` : user?.role_id}
              </span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.label}>Team:</span>
              <span style={styles.value}>
                {user?.team_name ? `${user.team_name} (ID: ${user.team_id})` : (user?.team_id ? `Team #${user.team_id}` : "Not assigned")}
              </span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.label}>Status:</span>
              <span style={styles.badgeSuccess}>Authenticated</span>
            </div>
          </div>
        </div>

        <div style={styles.milestoneBox}>
          <div style={styles.milestoneBadge}>Milestone 1 Complete</div>
          <p style={styles.milestoneText}>
            Authentication & User Management Foundation is operational.
          </p>
        </div>
      </main>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#0f172a",
    color: "#f8fafc",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    boxSizing: "border-box",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 32px",
    backgroundColor: "#1e293b",
    borderBottom: "1px solid #334155",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  logoIcon: {
    fontSize: "24px",
  },
  logoText: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#38bdf8",
    letterSpacing: "-0.5px",
  },
  logoutBtn: {
    padding: "8px 18px",
    backgroundColor: "#ef4444",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "14px",
  },
  main: {
    maxWidth: "900px",
    margin: "40px auto",
    padding: "0 20px",
  },
  welcomeCard: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    backgroundColor: "#1e293b",
    padding: "24px 32px",
    borderRadius: "14px",
    border: "1px solid #334155",
    marginBottom: "24px",
  },
  avatar: {
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    backgroundColor: "#38bdf8",
    color: "#0f172a",
    fontSize: "26px",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    margin: "0 0 4px 0",
    fontSize: "24px",
    fontWeight: "700",
    color: "#f8fafc",
  },
  subtitle: {
    margin: 0,
    fontSize: "14px",
    color: "#94a3b8",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "20px",
    marginBottom: "24px",
  },
  card: {
    backgroundColor: "#1e293b",
    padding: "24px",
    borderRadius: "14px",
    border: "1px solid #334155",
  },
  cardTitle: {
    margin: "0 0 18px 0",
    fontSize: "16px",
    fontWeight: "600",
    color: "#38bdf8",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 0",
    borderBottom: "1px solid #334155",
    fontSize: "14px",
  },
  label: {
    color: "#94a3b8",
    fontWeight: "500",
  },
  value: {
    color: "#f8fafc",
    fontWeight: "600",
  },
  badgeSuccess: {
    padding: "4px 10px",
    backgroundColor: "#065f46",
    color: "#34d399",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
  },
  milestoneBox: {
    backgroundColor: "#1e293b",
    padding: "20px 24px",
    borderRadius: "14px",
    border: "1px solid #334155",
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  milestoneBadge: {
    padding: "6px 12px",
    backgroundColor: "#0369a1",
    color: "#7dd3fc",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },
  milestoneText: {
    margin: 0,
    fontSize: "14px",
    color: "#94a3b8",
  },
};

export default Dashboard;
