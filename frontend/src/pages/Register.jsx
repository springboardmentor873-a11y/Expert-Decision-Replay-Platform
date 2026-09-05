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
      showToast("Account created. Sign in to continue.");
      navigate("/login");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-wrap">
        <div className="eyebrow-title">Create your account</div>
        <p className="subtitle">Join your team's decision record.</p>

        <form className="form-card" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="fullName">Full name</label>
            <input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jordan Rivera" />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
          </div>
          <div className="field">
            <label htmlFor="role">Role</label>
            <select id="role" value={roleName} onChange={(e) => setRoleName(e.target.value)}>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          {error && <div className="error-text">{error}</div>}
          <button className="btn btn-primary" type="submit" disabled={busy} style={{ width: "100%", justifyContent: "center" }}>
            {busy ? "Creating…" : "Create account"}
          </button>
        </form>

        <div className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
