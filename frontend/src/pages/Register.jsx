import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const initialForm = { full_name: "", email: "", password: "", confirm_password: "", job_title: "", department: "" };

export default function Register() {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (form.password !== form.confirm_password) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const { confirm_password, ...payload } = form;
      await register(payload);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed. Please review the form and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="auth-brand">
          <span className="brand-mark">DR</span>
          <h1>Create your account</h1>
        </div>
        {error && <p className="error" role="alert">{error}</p>}
        {success && <p className="success" role="status">Account created — redirecting to sign in...</p>}
        <label>
          Full name
          <input value={form.full_name} onChange={update("full_name")} required minLength={2} />
        </label>
        <label>
          Email
          <input type="email" value={form.email} onChange={update("email")} autoComplete="email" required />
        </label>
        <label>
          Password
          <input
            type="password"
            value={form.password}
            onChange={update("password")}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        <label>
          Confirm password
          <input
            type="password"
            value={form.confirm_password}
            onChange={update("confirm_password")}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        <label>
          Job title (optional)
          <input value={form.job_title} onChange={update("job_title")} />
        </label>
        <label>
          Department (optional)
          <input value={form.department} onChange={update("department")} />
        </label>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Creating account..." : "Register"}
        </button>
        <p className="auth-footnote">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
