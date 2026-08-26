function Dashboard({ user, onLogout }) {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.headerRow}>
          <div>
            <p style={styles.eyebrow}>Dashboard</p>
            <h1 style={styles.title}>Expert Decision Replay Platform</h1>
          </div>
          <button style={styles.logoutButton} onClick={onLogout}>
            Logout
          </button>
        </div>

        <h2 style={styles.welcome}>Welcome, {user?.name || "User"}</h2>

        <div style={styles.infoGrid}>
          <div style={styles.infoCard}>
            <span style={styles.label}>User ID</span>
            <strong>{user?.user_id ?? "N/A"}</strong>
          </div>
          <div style={styles.infoCard}>
            <span style={styles.label}>Email</span>
            <strong>{user?.email || "N/A"}</strong>
          </div>
          <div style={styles.infoCard}>
            <span style={styles.label}>Role</span>
            <strong>{user?.role || "N/A"}</strong>
          </div>
          <div style={styles.infoCard}>
            <span style={styles.label}>Team</span>
            <strong>{user?.team || "N/A"}</strong>
          </div>
          <div style={styles.infoCard}>
            <span style={styles.label}>Phone</span>
            <strong>{user?.phone || "Not provided"}</strong>
          </div>
          <div style={styles.infoCard}>
            <span style={styles.label}>Department</span>
            <strong>{user?.department || "Not provided"}</strong>
          </div>
          <div style={styles.infoCard}>
            <span style={styles.label}>Designation</span>
            <strong>{user?.designation || "Not provided"}</strong>
          </div>
          <div style={styles.infoCard}>
            <span style={styles.label}>Profile Image</span>
            <strong>{user?.profile_image ? "Available" : "Not provided"}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #eef4ff 0%, #f8fafc 100%)",
    padding: "20px",
    boxSizing: "border-box",
  },
  card: {
    width: "100%",
    maxWidth: "920px",
    backgroundColor: "#ffffff",
    padding: "34px",
    borderRadius: "20px",
    boxShadow: "0 14px 36px rgba(15, 23, 42, 0.08)",
    boxSizing: "border-box",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    marginBottom: "18px",
    flexWrap: "wrap",
  },
  eyebrow: {
    margin: 0,
    fontSize: "12px",
    color: "#4c63e8",
    textTransform: "uppercase",
    letterSpacing: "1.2px",
    fontWeight: "700",
  },
  title: {
    margin: "6px 0 0",
    color: "#111827",
    fontSize: "32px",
  },
  welcome: {
    margin: "18px 0 24px",
    color: "#1f2937",
    fontSize: "28px",
  },
  logoutButton: {
    backgroundColor: "#ef4444",
    border: "none",
    color: "white",
    borderRadius: "10px",
    padding: "12px 18px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "18px",
  },
  infoCard: {
    backgroundColor: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "18px 16px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    color: "#6b7280",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
  },
};

export default Dashboard;