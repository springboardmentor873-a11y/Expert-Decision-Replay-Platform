import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE } from "../api";
import "./Register.css";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    if (!role) {
      setMessage("Please select a role");
      return;
    }

    setMessage("Creating account...");

    try {
      const response = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.detail || "Registration failed");
        return;
      }

      setMessage("Account created! Redirecting to login...");

      setTimeout(() => {
        navigate("/login");
      }, 800);
    } catch (error) {
      console.error(error);
      setMessage("Cannot connect to backend");
    }
  };

  return (
    <div className="register-page">
      <div className="register-left">
        <div className="register-brand">
          <div className="register-brand-logo">ED</div>
          <div>
            <h3>Expert Decision</h3>
            <p>Replay Platform</p>
          </div>
        </div>

        <div className="register-intro">
          <span className="register-badge">
            Join the Decision Intelligence Platform
          </span>

          <h1>Create Your Account</h1>

          <p>
            Create an account to manage, review and replay important business
            decisions.
          </p>

          <div className="role-info">
            <div>✓</div>
            <span>Role-based access</span>
          </div>

          <div className="role-info">
            <div>✓</div>
            <span>Secure decision management</span>
          </div>

          <div className="role-info">
            <div>✓</div>
            <span>Centralized decision history</span>
          </div>
        </div>
      </div>

      <div className="register-right">
        <div className="register-card">
          <div className="register-logo">
            <div className="register-logo-icon">ED</div>
            <h1>Expert Decision</h1>
            <p>Replay Platform</p>
          </div>

          <div className="register-content">
            <h2>Create Account</h2>
            <p className="register-subtitle">Enter your details to get started</p>

            <form onSubmit={handleRegister}>
              <div className="register-input">
                <label>Full Name</label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="register-input">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="register-input">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="register-input">
                <label>Confirm Password</label>
                <input
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <div className="register-input">
                <label>Select Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value)} required>
                  <option value="" disabled>
                    Select your role
                  </option>
                  <option value="employee">Employee</option>
                  <option value="reviewer">Reviewer</option>
                  <option value="manager">Manager</option>
                  <option value="administrator">Administrator</option>
                </select>
              </div>

              <button type="submit" className="register-button">
                Create Account
              </button>

              {message && <p className="login-link">{message}</p>}
            </form>

            <p className="login-link">
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;