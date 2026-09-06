import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { ArrowRight, LockKeyhole } from "lucide-react";
import "../styles/Register.css";

function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Employee");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);

      const response = await fetch("http://localhost:4000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Registration failed");
        return;
      }

      alert("Registration successful! Please sign in.");

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error("Registration error:", error);
      alert("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <main className="register-shell">
        <div className="register-brand">
          <div className="register-brand-icon">
            <LockKeyhole size={18} strokeWidth={2.1} />
          </div>

          <span>
            Decision<span>Vault</span>
          </span>
        </div>

        <section className="register-card">
          <div className="register-heading">
            <span className="register-label">GET STARTED</span>

            <h1>Create account.</h1>

            <p>Start building your team's decision memory.</p>
          </div>

          <form onSubmit={handleRegister}>
            <div className="register-form-group">
              <label htmlFor="register-name">Full name</label>

              <input
                id="register-name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                required
              />
            </div>

            <div className="register-form-group">
              <label htmlFor="register-email">Email</label>

              <input
                id="register-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="register-form-group">
              <label htmlFor="register-password">Password</label>

              <input
                id="register-password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                required
              />
            </div>

            <div className="register-form-group">
              <label htmlFor="register-role">Role</label>

              <select
                id="register-role"
                value={role}
                onChange={(event) => setRole(event.target.value)}
              >
                <option value="Employee">Employee</option>
                <option value="Manager">Manager</option>
                <option value="Reviewer">Reviewer</option>
                <option value="Administrator">Administrator</option>
              </select>
            </div>

            <button
              type="submit"
              className="register-submit"
              disabled={loading}
            >
              <span>
                {loading ? "Creating account..." : "Create account"}
              </span>

              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <div className="register-divider">
            <span />
            <small>OR</small>
            <span />
          </div>

          <div className="register-switch">
            <span>Already have an account?</span>

            <button
              type="button"
              onClick={() => navigate("/login")}
            >
              Sign in
              <ArrowRight size={14} />
            </button>
          </div>
        </section>

        <div className="register-legal">
          <span>© 2026 DecisionVault</span>
          <span>Private workspace</span>
        </div>
      </main>
    </div>
  );
}

export default Register;
