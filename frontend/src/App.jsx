import { useState } from "react";
import "./App.css";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");
    setUser(null);
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.detail ||
            data.message ||
            "Invalid email or password"
        );
        return;
      }

      setMessage(data.message || "Login successful");
      setUser(data);
    } catch (error) {
      setError(
        "Unable to connect to the server. Please make sure the FastAPI backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setMessage("");
    setError("");
    setEmail("");
    setPassword("");
  };

  return (
    <div className="app-shell">
      <div className="background-decoration decoration-one"></div>
      <div className="background-decoration decoration-two"></div>

      <main className="main-container">
        <section className="login-card">

          {/* Logo / Branding */}
          <div className="brand-section">
            <div className="brand-icon">
              ↯
            </div>

            <h1>Expert Decision</h1>
            <h1 className="brand-title-second">
              Replay Platform
            </h1>

            <p className="brand-subtitle">
              Reconstruct • Analyze • Replay Decisions
            </p>
          </div>

          {!user ? (
            <>
              {/* Login Header */}
              <div className="login-header">
                <h2>Welcome Back</h2>
                <p>
                  Sign in to continue to your workspace
                </p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLogin} className="login-form">

                <div className="form-group">
                  <label htmlFor="email">
                    Email Address
                  </label>

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">
                    Password
                  </label>

                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder="Enter your password"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="login-button"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Logging in...
                    </>
                  ) : (
                    <>
                      Login
                      <span className="button-arrow">→</span>
                    </>
                  )}
                </button>
              </form>

              {/* Messages */}
              {message && (
                <div className="success-message">
                  <span className="message-icon">✓</span>
                  <span>{message}</span>
                </div>
              )}

              {error && (
                <div className="error-message">
                  <span className="message-icon">!</span>
                  <span>{error}</span>
                </div>
              )}

              <div className="login-footer">
                <span>Expert Decision Replay Platform</span>
              </div>
            </>
          ) : (
            /* Logged-in Dashboard */
            <div className="dashboard">

              <div className="success-icon">
                ✓
              </div>

              <h2>Login Successful!</h2>

              <p className="welcome-text">
                Welcome to your workspace, {user.name}.
              </p>

              <div className="user-card">

                <div className="user-card-header">
                  <div className="avatar">
                    {user.name
                      ? user.name.charAt(0).toUpperCase()
                      : "U"}
                  </div>

                  <div>
                    <h3>{user.name}</h3>
                    <span>{user.role}</span>
                  </div>
                </div>

                <div className="user-details">

                  <div className="detail-row">
                    <span className="detail-label">
                      Email
                    </span>

                    <span className="detail-value">
                      {user.email}
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">
                      Role
                    </span>

                    <span className="detail-value">
                      {user.role}
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">
                      Team
                    </span>

                    <span className="detail-value">
                      {user.team || "Not assigned"}
                    </span>
                  </div>

                </div>
              </div>

              <button
                onClick={handleLogout}
                className="logout-button"
              >
                Logout
              </button>
            </div>
          )}
        </section>

        <footer className="page-footer">
          <span>Expert Decision Replay Platform</span>
          <span>•</span>
          <span>Secure Workspace</span>
        </footer>
      </main>
    </div>
  );
}

export default App;