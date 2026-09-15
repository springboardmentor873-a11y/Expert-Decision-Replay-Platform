import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://127.0.0.1:8000";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Invalid email or password");
        setLoading(false);
        return;
      }

      localStorage.setItem("access_token", data.access_token);

      navigate("/dashboard");
    } catch (error) {
      console.error("Login error:", error);

      setError(
        "Cannot connect to backend. Make sure FastAPI is running."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">

        <div className="login-brand">
          <div className="login-brand-icon">ED</div>

          <div>
            <h1>Expert Decision</h1>
            <span>Replay Platform</span>
          </div>
        </div>

        <div className="login-header">
          <p className="login-eyebrow">DECISION INTELLIGENCE</p>

          <h2>Welcome back</h2>

          <p>
            Sign in to access your decision workspace.
          </p>
        </div>

        {error && (
          <div className="login-error">
            <strong>Sign in failed</strong>
            <span>{error}</span>
          </div>
        )}

        <form className="login-form" onSubmit={handleLogin}>

          <div className="form-field">
            <label htmlFor="email">Email address</label>

            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="password">Password</label>

            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            className="login-button"
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

        </form>

        <div className="login-security">
          <span className="security-icon">✓</span>

          <div>
            <strong>Secure authentication</strong>
            <span>Protected with JWT-based authentication</span>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Login;