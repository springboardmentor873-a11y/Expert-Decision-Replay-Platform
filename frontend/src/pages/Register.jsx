import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import { useToast } from "../ToastContext.jsx";

const ROLES = [
  { value: "employee", label: "Employee" },
  { value: "reviewer", label: "Reviewer" },
  { value: "manager", label: "Manager" },
  { value: "administrator", label: "Administrator" },
];

export default function Register() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleName, setRoleName] = useState("employee");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await register({ full_name: fullName, email, password, role_name: roleName });
      showToast("Account created successfully! Please sign in.");
      navigate("/login");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", padding: 20 }}>
      <div className="widget-card" style={{ width: "100%", maxWidth: 460, padding: 36 }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, justifyContent: "center" }}>
          <div className="brand-icon" style={{ width: 44, height: 44 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 24, height: 24 }}>
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/>
              <circle cx="12" cy="12" r="2"/>
            </svg>
          </div>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>DecisioHub</h2>
            <p style={{ fontSize: 12, color: "#64748b" }}>Smarter Decisions Together</p>
          </div>
        </div>

        <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 6, textAlign: "center" }}>
          Create your account
        </h3>
        <p style={{ fontSize: 13, color: "#64748b", marginBottom: 24, textAlign: "center" }}>
          Join your organization's decision intelligence network.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="form-field">
            <label htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ipsita Priyadarshini"
            />
          </div>

          <div className="form-field">
            <label htmlFor="email">Work Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </div>

          <div className="form-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
          </div>

          <div className="form-field">
            <label htmlFor="role">Role</label>
            <select
              id="role"
              className="select-team-dropdown"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {error && (
            <div style={{ color: "#ef4444", fontSize: 13, background: "#fef2f2", padding: "8px 12px", borderRadius: 8 }}>
              {error}
            </div>
          )}

          <button className="btn btn-primary" type="submit" disabled={busy} style={{ width: "100%", padding: "12px 18px", marginTop: 6 }}>
            {busy ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: "center", fontSize: 13, color: "#64748b" }}>
          Already have an account? <Link to="/login" style={{ color: "#2563eb", font: 600 }}>Sign in</Link>
        </div>
      </div>
    </div>
  );
}
