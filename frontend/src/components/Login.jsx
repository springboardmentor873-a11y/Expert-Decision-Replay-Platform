import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  ArrowRight,
  BrainCircuit,
  FileText,
  LockKeyhole,
  Users,
} from "lucide-react";
import "../styles/Login.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Login failed");
        return;
      }

      localStorage.setItem("token", data.token);
      navigate("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      alert("Unable to connect to the server.");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-background-grid" />
      <div className="auth-glow auth-glow-left" />
      <div className="auth-glow auth-glow-right" />

      <div className="auth-layout">
        <section className="auth-visual">
          <div className="auth-brand">
            <div className="auth-brand-icon">
              <LockKeyhole size={19} strokeWidth={2.1} />
            </div>

            <span>
              Decision<span>Vault</span>
            </span>
          </div>

          <div className="auth-intro-block">
            <div className="auth-intro">
              <span className="visual-eyebrow">
                <span />
                Decision memory
              </span>

              <p>
                Your team's reasoning,
                <br />
                preserved in context.
              </p>
            </div>

            <div className="auth-metrics">
              <div className="auth-metric">
                <div className="metric-icon">
                  <FileText size={17} />
                </div>

                <strong>124</strong>
                <span>Decisions captured</span>
              </div>

              <div className="auth-metric">
                <div className="metric-icon">
                  <LockKeyhole size={17} />
                </div>

                <strong>89</strong>
                <span>Approved decisions</span>
              </div>

              <div className="auth-metric">
                <div className="metric-icon">
                  <Users size={17} />
                </div>

                <strong>94%</strong>
                <span>Context coverage</span>
              </div>
            </div>
          </div>

          <div className="auth-graphic">
            <div className="graphic-halo" />

            <div className="graphic-orbit graphic-orbit-1" />
            <div className="graphic-orbit graphic-orbit-2" />
            <div className="graphic-orbit graphic-orbit-3" />

            <div className="graphic-vault">
              <div className="graphic-vault-top" />

              <div className="graphic-vault-face">
                <div className="graphic-core">
                  <div className="graphic-ring ring-1" />
                  <div className="graphic-ring ring-2" />
                  <div className="graphic-ring ring-3" />

                  <div className="graphic-lock">
                    <LockKeyhole size={33} strokeWidth={1.7} />
                  </div>
                </div>

                <div className="graphic-label">DECISION / 01</div>
              </div>

              <div className="graphic-vault-side" />
              <div className="graphic-vault-bottom" />
            </div>

            <div className="graphic-node node-1">
              <BrainCircuit size={15} />
              <span>Reasoning</span>
            </div>

            <div className="graphic-node node-2">
              <span className="node-dot" />
              Context
            </div>

            <div className="graphic-node node-3">
              <span className="node-dot" />
              Outcome
            </div>
          </div>

          <div className="auth-bottom-copy">
            <span className="visual-eyebrow">
              <span />
              Decision intelligence
            </span>

            <h2>
              Remember
              <br />
              <span>why.</span>
            </h2>

            <p>
              Preserve the reasoning behind important decisions and make your
              team's knowledge easier to understand.
            </p>
          </div>

          <div className="visual-footer">
            <span>Secure by design</span>
            <span />
            <span>Decisions, preserved.</span>
          </div>
        </section>

        <section className="auth-panel">
          <div className="auth-card">
            <div className="auth-mobile-brand">
              <div className="auth-brand-icon">
                <LockKeyhole size={17} />
              </div>

              <span>
                Decision<span>Vault</span>
              </span>
            </div>

            <div className="auth-heading">
              <span className="auth-label">WELCOME BACK</span>

              <h1>Sign in.</h1>

              <p>Continue to your decision workspace.</p>
            </div>

            <form onSubmit={handleLogin}>
              <div className="auth-form-group">
                <label htmlFor="login-email">Email</label>

                <input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="auth-form-group">
                <div className="form-label-row">
                  <label htmlFor="login-password">Password</label>

                  <button type="button" className="login-forgot">
                    Forgot?
                  </button>
                </div>

                <input
                  id="login-password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>

              <button type="submit" className="auth-submit">
                <span>Sign in</span>
                <ArrowRight size={16} />
              </button>
            </form>

            <div className="auth-divider">
              <span />
              <small>OR</small>
              <span />
            </div>

            <div className="auth-switch">
              <span>Don't have an account?</span>

              <button type="button" onClick={() => navigate("/register")}>
                Create one
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          <div className="auth-legal">
            <span>© 2026 DecisionVault</span>
            <span>Private workspace</span>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Login;
