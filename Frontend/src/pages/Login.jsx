import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE, setCurrentUser } from "../api";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    setMessage("Checking login...");

    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.detail || "Login failed");
        return;
      }

      setCurrentUser({
        id: data.user_id,
        name: data.name,
        email: data.email,
        role: data.role,
      });

      setMessage("Login successful!");

      setTimeout(() => {
        navigate("/dashboard");
      }, 500);
    } catch (error) {
      console.error(error);
      setMessage("Cannot connect to backend");
    }
  };

  const handleGoogleLogin = () => {
    alert("Google login will be connected later.");
  };

  const handleMicrosoftLogin = () => {
    alert("Microsoft login will be connected later.");
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="brand">
          <div className="brand-logo">ED</div>
          <div>
            <h2>Expert Decision</h2>
            <p>Replay Platform</p>
          </div>
        </div>

        <div className="left-content">
          <span className="tag">AI-Powered Decision Intelligence</span>
          <h1>Welcome Back!</h1>
          <p className="description">
            Sign in to continue to your dashboard and access your decision
            intelligence platform.
          </p>

          <div className="feature">
            <div className="feature-icon">✓</div>
            <div>
              <h3>Secure & Reliable</h3>
              <p>Enterprise-grade security for your data</p>
            </div>
          </div>

          <div className="feature">
            <div className="feature-icon">↗</div>
            <div>
              <h3>Smart Analytics</h3>
              <p>AI-powered insights and decision recommendations</p>
            </div>
          </div>

          <div className="feature">
            <div className="feature-icon">⚡</div>
            <div>
              <h3>Real-time Processing</h3>
              <p>Fast decision replay and analysis</p>
            </div>
          </div>
        </div>

        <div className="background-shape"></div>
      </div>

      <div className="login-right">
        <div className="login-card">
          <p className="card-brand">Replay Platform</p>
          <h2>Welcome Back</h2>
          <p className="card-subtitle">Sign in to continue to your dashboard</p>

          <form className="login-form" onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="login-options">
              <label className="remember">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                className="forgot-password"
                onClick={() => {
                  const email = prompt("Enter your registered email:");
                  if (email) {
                    alert(
                      "Password reset request received for " +
                        email +
                        ". Please contact the administrator to reset your password."
                    );
                  }
                }}
              >
                Forgot Password?
              </button>
            </div>

            <button className="signin-btn" type="submit">
              Sign In
            </button>

            {message && <p className="login-message">{message}</p>}
          </form>

          <div className="divider">
            <span>or continue with</span>
          </div>

          <div className="social-buttons">
            <button type="button" onClick={handleGoogleLogin}>
              🌐 Google
            </button>
            <button type="button" onClick={handleMicrosoftLogin}>
              ▦ Microsoft
            </button>
          </div>

          <p className="register-text">
            Don't have an account? <Link to="/register">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;