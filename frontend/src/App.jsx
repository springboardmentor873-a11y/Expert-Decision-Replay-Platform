import { useState, useEffect } from "react";
import Dashboard from "./Dashboard";
import { Brain, Mail, Lock, User, Shield, Briefcase, Sparkles, ArrowRight } from "lucide-react";
import MD3Button from "./components/md3/MD3Button";
import MD3Card from "./components/md3/MD3Card";
import MD3TextField from "./components/md3/MD3TextField";
import MD3AmbientBackground from "./components/md3/MD3AmbientBackground";

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
    if (e) e.preventDefault();
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

  const handleQuickLogin = async (quickEmail, quickPassword = "password123") => {
    setEmail(quickEmail);
    setPassword(quickPassword);
    setLoading(true);
    setMessage({ text: "", isError: false });

    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: quickEmail, password: quickPassword }),
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
        text: "Account created successfully! Signing in...",
        isError: false,
      });

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
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "var(--bg-canvas)",
          fontFamily: "var(--font-sans)",
        }}
      >
        <div
          style={{
            width: "42px",
            height: "42px",
            border: "4px solid var(--secondary-container)",
            borderTopColor: "var(--primary)",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <p
          style={{
            color: "var(--text-secondary)",
            marginTop: "18px",
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          Loading Decision Replay Platform...
        </p>
      </div>
    );
  }

  if (loggedIn) {
    return <Dashboard user={user} onLogout={handleLogout} />;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "24px 16px",
        boxSizing: "border-box",
        position: "relative",
        fontFamily: "var(--font-sans)",
        backgroundColor: "var(--bg-canvas)",
      }}
    >
      {/* Material You Layered Organic Ambient Background */}
      <MD3AmbientBackground />

      {/* Main Authentication Card in Surface Container */}
      <MD3Card
        variant="filled"
        radius="32px"
        style={{
          width: "100%",
          maxWidth: "460px",
          padding: "36px 32px",
          zIndex: 1,
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: "26px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "56px",
              height: "56px",
              borderRadius: "20px",
              backgroundColor: "var(--primary-container)",
              color: "var(--on-primary-container)",
              marginBottom: "14px",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <Brain size={30} />
          </div>

          <h1
            style={{
              margin: "0 0 6px 0",
              fontSize: "26px",
              fontWeight: "500",
              color: "var(--text-primary)",
              fontFamily: "var(--font-sans)",
            }}
          >
            DecisionIntel
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: "14px",
              color: "var(--text-secondary)",
              lineHeight: 1.5,
            }}
          >
            {isRegister
              ? "Join the enterprise decision intelligence workspace"
              : "Expert Decision Replay & Knowledge Graph Platform"}
          </p>
        </div>

        {/* Feedback Alert Snackbar */}
        {message.text && (
          <div
            style={{
              padding: "12px 16px",
              backgroundColor: message.isError
                ? "var(--accent-rose-subtle)"
                : "rgba(22, 163, 74, 0.12)",
              color: message.isError ? "var(--accent-rose)" : "var(--accent-emerald)",
              borderRadius: "var(--radius-md)",
              fontSize: "13.5px",
              fontWeight: "500",
              marginBottom: "18px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              animation: "md3FadeIn 0.25s var(--md3-easing)",
            }}
          >
            <Sparkles size={16} />
            <span>{message.text}</span>
          </div>
        )}

        {isRegister ? (
          /* ========================================================
             REGISTRATION FORM (MATERIAL YOU STYLE)
             ======================================================== */
          <form onSubmit={handleRegister}>
            <MD3TextField
              label="Full Name"
              placeholder="e.g. Elena Rostova"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              leadingIcon={<User size={18} />}
            />

            <MD3TextField
              label="Work Email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              leadingIcon={<Mail size={18} />}
            />

            <MD3TextField
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              leadingIcon={<Lock size={18} />}
            />

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: "500",
                  color: "var(--text-secondary)",
                  marginBottom: "6px",
                }}
              >
                Assigned Role
              </label>
              <div
                style={{
                  backgroundColor: "var(--bg-surface-container-high)",
                  borderTopLeftRadius: "12px",
                  borderTopRightRadius: "12px",
                  borderBottom: "2px solid var(--border-muted)",
                  overflow: "hidden",
                }}
              >
                <select
                  style={{
                    width: "100%",
                    height: "56px",
                    padding: "0 16px",
                    fontSize: "15px",
                    color: "var(--text-primary)",
                    backgroundColor: "transparent",
                    border: "none",
                    outline: "none",
                    cursor: "pointer",
                    fontFamily: "var(--font-sans)",
                  }}
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                >
                  <option value={1}>Employee (Create & Participate)</option>
                  <option value={2}>Reviewer (Critique & Score)</option>
                  <option value={3}>Manager (Approve & Govern)</option>
                  <option value={4}>Administrator (Full Access)</option>
                </select>
              </div>
            </div>

            <MD3Button
              type="submit"
              variant="filled"
              size="lg"
              fullWidth
              loading={loading}
              style={{ marginTop: "6px" }}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </MD3Button>
          </form>
        ) : (
          /* ========================================================
             SIGN IN FORM
             ======================================================== */
          <div>
            {/* Credentials Login Form */}
            <form onSubmit={handleLogin}>
              <MD3TextField
                label="Email Address"
                type="email"
                placeholder="admin@company.com or emp@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                leadingIcon={<Mail size={18} />}
              />

              <MD3TextField
                label="Password"
                type="password"
                placeholder="password123"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                leadingIcon={<Lock size={18} />}
              />

              <MD3Button
                type="submit"
                variant="filled"
                size="lg"
                fullWidth
                loading={loading}
                icon={<ArrowRight size={18} />}
                style={{ marginTop: "6px" }}
              >
                {loading ? "Signing in..." : "Sign In to Workspace"}
              </MD3Button>
            </form>
          </div>
        )}

        {/* Toggle between Login and Register */}
        <div
          style={{
            marginTop: "24px",
            textAlign: "center",
            fontSize: "13.5px",
            color: "var(--text-secondary)",
          }}
        >
          <span>
            {isRegister ? "Already have an account?" : "Need account access?"}
          </span>{" "}
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setMessage({ text: "", isError: false });
            }}
            style={{
              background: "none",
              border: "none",
              color: "var(--primary)",
              fontWeight: "600",
              cursor: "pointer",
              fontSize: "13.5px",
              padding: 0,
              marginLeft: "4px",
              outline: "none",
            }}
          >
            {isRegister ? "Sign in" : "Register here"}
          </button>
        </div>
      </MD3Card>
    </div>
  );
}

export default App;