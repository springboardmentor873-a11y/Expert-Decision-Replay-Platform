import { useState } from "react";
import { ArrowRight, BrainCircuit, LockKeyhole } from "lucide-react";
import "../styles/Register.css";

function Register({ onLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Employee");

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:4000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
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

      onLogin();
    } catch (error) {
      console.error("Registration error:", error);
      alert("Unable to connect to the server.");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-background-grid" />
      <div className="auth-glow auth-glow-left" />
      <div className="auth-glow auth-glow-right" />

      <div className="auth-layout">
        {/* LEFT */}

        <section className="auth-visual">
          <div className="auth-brand">
            <div className="auth-brand-icon">
              <LockKeyhole size={17} />
            </div>

            <span>
              Decision<span>Vault</span>
            </span>
          </div>

          <div className="visual-copy">
            <div className="visual-eyebrow">
              <span />
              Build institutional memory
            </div>

            <h2>
              Capture
              <br />
              <span>why.</span>
            </h2>

            <p>
              Create a workspace where important decisions don't disappear into
              documents, chats and forgotten conversations.
            </p>
          </div>

          {/* SAME VAULT GRAPHIC */}

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
                    <LockKeyhole size={33} />
                  </div>
                </div>

                <div className="graphic-label">DECISION / 01</div>
              </div>

              <div className="graphic-vault-side" />
              <div className="graphic-vault-bottom" />
            </div>

            <div className="graphic-node node-1">
              <BrainCircuit size={15} />
              <span>Knowledge</span>
            </div>

            <div className="graphic-node node-2">
              <span className="node-dot" />
              Context
            </div>

            <div className="graphic-node node-3">
              <span className="node-dot" />
              Outcomes
            </div>
          </div>

          <div className="visual-footer">
            <span>Secure by design</span>
            <span />
            <span>Decisions, preserved.</span>
          </div>
        </section>

        {/* RIGHT */}

        <section className="auth-panel">
          <div className="auth-card">
            <div className="auth-mobile-brand">
              <div className="auth-brand-icon">
                <LockKeyhole size={16} />
              </div>

              <span>
                Decision<span>Vault</span>
              </span>
            </div>

            <div className="auth-heading">
              <span className="auth-label">GET STARTED</span>

              <h1>Create account.</h1>

              <p>Start building your team's decision memory.</p>
            </div>

            <form onSubmit={handleRegister}>
              <div className="auth-form-group">
                <label htmlFor="register-name">Full name</label>

                <input
                  id="register-name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                />
              </div>

              <div className="auth-form-group">
                <label htmlFor="register-email">Email</label>

                <input
                  id="register-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="auth-form-group">
                <label htmlFor="register-password">Password</label>

                <input
                  id="register-password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>

              <div className="auth-form-group">
                <label htmlFor="register-role">Role</label>

                <select
                  id="register-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="Employee">Employee</option>

                  <option value="Manager">Manager</option>

                  <option value="Admin">Admin</option>
                </select>
              </div>

              <button type="submit" className="auth-submit">
                <span>Create account</span>
                <ArrowRight size={16} />
              </button>
            </form>

            <div className="auth-divider">
              <span />
              <small>OR</small>
              <span />
            </div>

            <div className="auth-switch">
              <span>Already have an account?</span>

              <button onClick={onLogin}>
                Sign in
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

export default Register;
