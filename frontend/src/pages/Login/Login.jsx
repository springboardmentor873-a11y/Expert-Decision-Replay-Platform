import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Login.css";

const STAGES = ["Draft", "Under Review", "Approved", "Archived"];

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-screen">
      <aside className="login-panel">
        <div className="login-panel__mark">EDR</div>

        <div className="login-panel__body">
          <p className="login-panel__eyebrow">Case No. 2026 — 0417</p>
          <h1 className="login-panel__title">
            Every decision,
            <br />
            on the record.
          </h1>
          <p className="login-panel__copy">
            Alternatives weighed, risks noted, sign-offs logged. Nothing
            approved without a trail back to why.
          </p>

          <ol className="ledger" aria-label="Decision lifecycle">
            {STAGES.map((stage, i) => (
              <li className="ledger__stage" key={stage}>
                <span className="ledger__dot" aria-hidden="true" />
                <span className="ledger__label">{stage}</span>
                {i < STAGES.length - 1 && <span className="ledger__track" aria-hidden="true" />}
              </li>
            ))}
          </ol>
        </div>

        <p className="login-panel__footnote">Expert Decision Replay Platform</p>
      </aside>

      <main className="login-form-side">
        <form className="login-card" onSubmit={handleSubmit} noValidate>
          <h2 className="login-card__title">Sign in</h2>
          <p className="login-card__subtitle">Access your team's decision record.</p>

          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}

          <label className="field">
            <span className="field__label">Work email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
              required
            />
          </label>

          <label className="field">
            <span className="field__label">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </label>

          <button type="submit" className="login-button" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </button>

          <p className="login-card__register">
            New here? <Link to="/register">Create an account</Link>
          </p>
        </form>
      </main>
    </div>
  );
}
