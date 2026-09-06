import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { ArrowRight, LockKeyhole } from "lucide-react";
import "../styles/Login.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);

      const response = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Login failed");
        return;
      }

      localStorage.setItem("token", data.token);

      navigate("/dashboard", {
        replace: true,
      });
    } catch (error) {
      console.error("Login error:", error);
      alert("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <main className="login-shell">
        <div className="login-brand">
          <div className="login-brand-icon">
            <LockKeyhole size={18} strokeWidth={2.1} />
          </div>

          <span>
            Decision<span>Vault</span>
          </span>
        </div>

        <section className="login-card">
          <div className="login-heading">
            <span className="login-label">WELCOME BACK</span>

            <h1>Sign in.</h1>

            <p>Continue to your decision workspace.</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="login-form-group">
              <label htmlFor="login-email">Email</label>

              <input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="login-form-group">
              <div className="login-form-label-row">
                <label htmlFor="login-password">Password</label>

                <button
                  type="button"
                  className="login-forgot"
                  onClick={() => alert("Password recovery will be added later.")}
                >
                  Forgot?
                </button>
              </div>

              <input
                id="login-password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              <span>{loading ? "Signing in..." : "Sign in"}</span>

              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <div className="login-divider">
            <span />
            <small>OR</small>
            <span />
          </div>

          <div className="login-switch">
            <span>Don't have an account?</span>

            <button
              type="button"
              onClick={() => navigate("/register")}
            >
              Create one
              <ArrowRight size={14} />
            </button>
          </div>
        </section>

        <div className="login-legal">
          <span>© 2026 DecisionVault</span>
          <span>Private workspace</span>
        </div>
      </main>
    </div>
  );
}

export default Login;
