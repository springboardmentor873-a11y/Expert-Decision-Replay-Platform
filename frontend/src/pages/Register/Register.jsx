import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register as registerRequest } from "../../services/auth";
import { useAuth } from "../../context/AuthContext";
import "../Login/Login.css";

export default function Register() {
  const [fullName, setFullName] = useState("");
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
      await registerRequest(fullName, email, password);
      // New accounts start as Employee — log them straight in rather than
      // asking them to re-enter credentials on a separate screen.
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
          <p className="login-panel__eyebrow">New account</p>
          <h1 className="login-panel__title">
            Join the
            <br />
            decision record.
          </h1>
          <p className="login-panel__copy">
            New accounts start as an Employee. A Manager or Administrator
            can adjust your access once you're in.
          </p>
        </div>
        <p className="login-panel__footnote">Expert Decision Replay Platform</p>
      </aside>

      <main className="login-form-side">
        <form className="login-card" onSubmit={handleSubmit} noValidate>
          <h2 className="login-card__title">Create account</h2>
          <p className="login-card__subtitle">Set up access for your team.</p>

          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}

          <label className="field">
            <span className="field__label">Full name</span>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ada Lovelace"
              autoComplete="name"
              required
            />
          </label>

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
              placeholder="At least 8 characters"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>

          <button type="submit" className="login-button" disabled={submitting}>
            {submitting ? "Creating account…" : "Create account"}
          </button>

          <p className="login-card__register">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </main>
    </div>
  );
}
