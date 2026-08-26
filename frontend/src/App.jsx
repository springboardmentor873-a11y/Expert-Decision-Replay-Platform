import { useState, useEffect } from "react";
import Dashboard from "./Dashboard";

const API_BASE = "http://127.0.0.1:8000";

function App() {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialChecking, setInitialChecking] = useState(true);
  const [message, setMessage] = useState({ text: "", isError: false });

  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  // Restore session from token on initial load
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setInitialChecking(false);
      return;
    }

    fetch(`${API_BASE}/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Invalid session");
      })
      .then((data) => {
        setUser(data);
        setLoggedIn(true);
      })
      .catch(() => {
        localStorage.removeItem("token");
      })
      .finally(() => {
        setInitialChecking(false);
      });
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", isError: false });

    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({
          text: data.detail || "Invalid email or password",
          isError: true,
        });
        return;
      }

      localStorage.setItem("token", data.access_token);

      // Fetch user profile
      const meResponse = await fetch(`${API_BASE}/me`, {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });

      const meData = await meResponse.json();
      if (!meResponse.ok) {
        setMessage({
          text: meData.detail || "Failed to retrieve user profile",
          isError: true,
        });
        return;
      }

      setUser(meData);
      setLoggedIn(true);
    } catch (error) {
      console.error(error);
      setMessage({
        text: "Could not connect to the backend server.",
        isError: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", isError: false });

    try {
      const response = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          role_id: Number(roleId),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({
          text: data.detail || "Registration failed. Please check your details.",
          isError: true,
        });
        return;
      }

      setMessage({
        text: "Account created successfully! Logging you in...",
        isError: false,
      });

      // Auto login after registration
      const loginRes = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const loginData = await loginRes.json();
      if (loginRes.ok) {
        localStorage.setItem("token", loginData.access_token);
        const meRes = await fetch(`${API_BASE}/me`, {
          headers: { Authorization: `Bearer ${loginData.access_token}` },
        });
        const meData = await meRes.json();
        if (meRes.ok) {
          setUser(meData);
          setLoggedIn(true);
        }
      } else {
        setIsRegister(false);
      }
    } catch (error) {
      console.error(error);
      setMessage({
        text: "Could not connect to the backend server.",
        isError: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setLoggedIn(false);
    setUser(null);
    setEmail("");
    setPassword("");
    setName("");
    setMessage({ text: "", isError: false });
  };

  if (initialChecking) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={{ color: "#94a3b8", marginTop: "16px" }}>Loading session...</p>
      </div>
    );
  }

  if (loggedIn) {
    return <Dashboard user={user} onLogout={handleLogout} />;
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.brandHeader}>
          <span style={styles.brandIcon}>🧠</span>
          <h1 style={styles.title}>Expert Decision Replay</h1>
          <p style={styles.subtitle}>
            {isRegister
              ? "Create your account to get started"
              : "Sign in to access your platform dashboard"}
          </p>
        </div>

        {message.text && (
          <div
            style={
              message.isError ? styles.alertError : styles.alertSuccess
            }
          >
            {message.text}
          </div>
        )}

        {isRegister ? (
          <form onSubmit={handleRegister}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Full Name</label>
              <input
                style={styles.input}
                type="text"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Email</label>
              <input
                style={styles.input}
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Password</label>
              <input
                style={styles.input}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Role</label>
              <select
                style={styles.select}
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
              >
                <option value={1}>Employee (ID: 1)</option>
                <option value={2}>Reviewer (ID: 2)</option>
                <option value={3}>Manager (ID: 3)</option>
                <option value={4}>Administrator (ID: 4)</option>
              </select>
            </div>

            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? "Creating account..." : "Register"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Email</label>
              <input
                style={styles.input}
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Password</label>
              <input
                style={styles.input}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>
        )}

        <div style={styles.toggleRow}>
          <span style={styles.toggleText}>
            {isRegister
              ? "Already have an account?"
              : "Don't have an account?"}
          </span>
          <button
            type="button"
            style={styles.toggleLink}
            onClick={() => {
              setIsRegister(!isRegister);
              setMessage({ text: "", isError: false });
            }}
          >
            {isRegister ? "Login here" : "Register here"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f172a",
    padding: "20px",
    boxSizing: "border-box",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  loadingContainer: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f172a",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  spinner: {
    width: "36px",
    height: "36px",
    border: "3px solid #334155",
    borderTopColor: "#38bdf8",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  card: {
    width: "100%",
    maxWidth: "440px",
    padding: "36px",
    backgroundColor: "#1e293b",
    borderRadius: "16px",
    border: "1px solid #334155",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
    boxSizing: "border-box",
  },
  brandHeader: {
    textAlign: "center",
    marginBottom: "28px",
  },
  brandIcon: {
    fontSize: "36px",
    display: "inline-block",
    marginBottom: "8px",
  },
  title: {
    margin: "0 0 8px 0",
    fontSize: "22px",
    fontWeight: "700",
    color: "#f8fafc",
  },
  subtitle: {
    margin: 0,
    fontSize: "14px",
    color: "#94a3b8",
  },
  formGroup: {
    marginBottom: "18px",
  },
  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: "600",
    marginBottom: "6px",
    color: "#cbd5e1",
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    fontSize: "14px",
    backgroundColor: "#0f172a",
    color: "#f8fafc",
    border: "1px solid #334155",
    borderRadius: "8px",
    boxSizing: "border-box",
    outline: "none",
  },
  select: {
    width: "100%",
    padding: "12px 14px",
    fontSize: "14px",
    backgroundColor: "#0f172a",
    color: "#f8fafc",
    border: "1px solid #334155",
    borderRadius: "8px",
    boxSizing: "border-box",
    outline: "none",
  },
  button: {
    width: "100%",
    padding: "12px",
    marginTop: "8px",
    backgroundColor: "#0284c7",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
  },
  alertError: {
    padding: "10px 14px",
    backgroundColor: "#7f1d1d",
    color: "#fca5a5",
    borderRadius: "8px",
    fontSize: "13px",
    marginBottom: "18px",
    border: "1px solid #991b1b",
  },
  alertSuccess: {
    padding: "10px 14px",
    backgroundColor: "#064e3b",
    color: "#6ee7b7",
    borderRadius: "8px",
    fontSize: "13px",
    marginBottom: "18px",
    border: "1px solid #065f46",
  },
  toggleRow: {
    marginTop: "22px",
    textAlign: "center",
    fontSize: "13px",
    color: "#94a3b8",
  },
  toggleText: {
    marginRight: "6px",
  },
  toggleLink: {
    background: "none",
    border: "none",
    color: "#38bdf8",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "13px",
    padding: 0,
  },
};

export default App;