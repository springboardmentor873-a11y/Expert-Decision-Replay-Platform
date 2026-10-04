import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";

export function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    employee_id: "",
    department: "",
    designation: "",
    phone_number: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/auth/register", form);
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <h1>Create your account</h1>
        <p className="auth-subtitle">
          New accounts are created with the Employee role. An administrator can
          grant Manager or Reviewer access afterwards.
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="full_name">Full name</label>
            <input id="full_name" required value={form.full_name} onChange={update("full_name")} />
          </div>
          <div className="field">
            <label htmlFor="email">Work email</label>
            <input id="email" type="email" required value={form.email} onChange={update("email")} />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={update("password")}
            />
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="employee_id">Employee ID</label>
              <input id="employee_id" required value={form.employee_id} onChange={update("employee_id")} />
            </div>
            <div className="field">
              <label htmlFor="department">Department</label>
              <input id="department" required value={form.department} onChange={update("department")} />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="designation">Designation</label>
              <input id="designation" required value={form.designation} onChange={update("designation")} />
            </div>
            <div className="field">
              <label htmlFor="phone_number">Phone number</label>
              <input id="phone_number" required value={form.phone_number} onChange={update("phone_number")} />
            </div>
          </div>
          <button className="btn btn-primary btn-full" type="submit" disabled={submitting}>
            {submitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <div className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
