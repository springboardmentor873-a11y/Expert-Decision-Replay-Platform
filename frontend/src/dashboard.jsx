function Dashboard({ user, onLogout }) {
  return (
    <div style={styles.container}>

      <div style={styles.card}>

        <h1 style={styles.title}>
          Expert Decision Replay Platform
        </h1>

        <h2 style={styles.welcome}>
          Welcome, {user?.name}! 
        </h2>

        <p style={styles.subtitle}>
          You are successfully logged in.
        </p>

        <div style={styles.infoBox}>

          <p>
            <strong>Name:</strong> {user?.name}
          </p>

          <p>
            <strong>Email:</strong> {user?.email}
          </p>

          <p>
            <strong>User ID:</strong> {user?.id}
          </p>

          <p>
            <strong>Role ID:</strong> {user?.role_id}
          </p>

          <p>
            <strong>Team ID:</strong>{" "}
            {user?.team_id ?? "No team assigned"}
          </p>

        </div>

        <button
          style={styles.button}
          onClick={onLogout}
        >
          Logout
        </button>

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
    backgroundColor: "#f5f7fb",
    padding: "20px",
  },

  card: {
    width: "100%",
    maxWidth: "650px",
    backgroundColor: "#ffffff",
    padding: "45px",
    borderRadius: "18px",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
  },

  title: {
    textAlign: "center",
    color: "#111827",
    marginBottom: "30px",
  },

  welcome: {
    textAlign: "center",
    color: "#4c63e8",
    marginBottom: "10px",
  },

  subtitle: {
    textAlign: "center",
    color: "#6b7280",
    marginBottom: "30px",
  },

  infoBox: {
    backgroundColor: "#f8fafc",
    padding: "20px",
    borderRadius: "10px",
    lineHeight: "1.8",
  },

  button: {
    width: "100%",
    padding: "14px",
    marginTop: "25px",
    backgroundColor: "#4c63e8",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "17px",
    fontWeight: "600",
    cursor: "pointer",
  },
};

export default Dashboard;