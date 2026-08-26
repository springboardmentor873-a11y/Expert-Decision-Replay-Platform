import { useState } from "react";
import "./App.css";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Registration states
  const [showRegister, setShowRegister] = useState(false);
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);

  // LOGIN
  const handleLogin = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");
    setUser(null);
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.detail ||
            data.message ||
            "Invalid email or password"
        );
        return;
      }

      setMessage(data.message || "Login successful");
      setUser(data);
    } catch (error) {
      setError(
        "Unable to connect to the server. Please make sure the FastAPI backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  // REGISTER
  const handleRegister = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    // Check passwords
    if (registerPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (registerPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setRegisterLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: registerName,
          email: registerEmail,
          password: registerPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.detail ||
            data.message ||
            "Registration failed."
        );
        return;
      }

      setMessage(
        data.message ||
          "Registration successful! You can now login."
      );

      // Clear registration form
      setRegisterName("");
      setRegisterEmail("");
      setRegisterPassword("");
      setConfirmPassword("");

      // Go back to login
      setShowRegister(false);

      // Put registered email into login
      setEmail(registerEmail);
    } catch (error) {
      setError(
        "Unable to connect to the server. Please make sure the FastAPI backend is running."
      );
    } finally {
      setRegisterLoading(false);
    }
  };

  // LOGOUT
  const handleLogout = () => {
    setUser(null);
    setMessage("");
    setError("");
    setEmail("");
    setPassword("");
  };

  // REGISTER PAGE
  if (showRegister) {
    return (
      <div className="app-shell">
        <div className="background-decoration decoration-one"></div>
        <div className="background-decoration decoration-two"></div>

        <main className="main-container">
          <section className="login-card">

            {/* Logo / Branding */}
            <div className="brand-section">
              <div className="brand-icon">
                ↯
              </div>

              <h1>Expert Decision</h1>

              <h1 className="brand-title-second">
                Replay Platform
              </h1>

              <p className="brand-subtitle">
                Reconstruct • Analyze • Replay Decisions
              </p>
            </div>

            {/* Register Header */}
            <div className="login-header">
              <h2>Create Account</h2>

              <p>
                Register as a new user to continue
              </p>
            </div>

            {/* Register Form */}
            <form
              onSubmit={handleRegister}
              className="login-form"
            >

              {/* Name */}
              <div className="form-group">
                <label htmlFor="register-name">
                  Full Name
                </label>

                <input
                  id="register-name"
                  type="text"
                  value={registerName}
                  onChange={(event) =>
                    setRegisterName(event.target.value)
                  }
                  placeholder="Enter your name"
                  required
                />
              </div>

              {/* Email */}
              <div className="form-group">
                <label htmlFor="register-email">
                  Email Address
                </label>

                <input
                  id="register-email"
                  type="email"
                  value={registerEmail}
                  onChange={(event) =>
                    setRegisterEmail(event.target.value)
                  }
                  placeholder="Enter your email"
                  required
                />
              </div>

              {/* Password */}
              <div className="form-group">
                <label htmlFor="register-password">
                  Password
                </label>

                <input
                  id="register-password"
                  type="password"
                  value={registerPassword}
                  onChange={(event) =>
                    setRegisterPassword(event.target.value)
                  }
                  placeholder="Create a password"
                  required
                />
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <label htmlFor="confirm-password">
                  Confirm Password
                </label>

                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  placeholder="Confirm your password"
                  required
                />
              </div>

              {/* Register Button */}
              <button
                type="submit"
                className="login-button"
                disabled={registerLoading}
              >
                {registerLoading
                  ? "Registering..."
                  : "Register"}
              </button>
            </form>

            {/* Back to Login */}
            <p className="register-text">
              Already have an account?{" "}
              <button
                type="button"
                className="register-link"
                onClick={() => {
                  setShowRegister(false);
                  setMessage("");
                  setError("");
                }}
              >
                Login here
              </button>
            </p>

            {/* Messages */}
            {message && (
              <div className="success-message">
                <span className="message-icon">
                  ✓
                </span>

                <span>{message}</span>
              </div>
            )}

            {error && (
              <div className="error-message">
                <span className="message-icon">
                  !
                </span>

                <span>{error}</span>
              </div>
            )}

            <div className="login-footer">
              <span>
                Expert Decision Replay Platform
              </span>
            </div>

          </section>

          <footer className="page-footer">
            <span>
              Expert Decision Replay Platform
            </span>

            <span>•</span>

            <span>
              Secure Workspace
            </span>
          </footer>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="background-decoration decoration-one"></div>
      <div className="background-decoration decoration-two"></div>

      <main className="main-container">
        <section className="login-card">

          {/* Logo / Branding */}
          <div className="brand-section">
            <div className="brand-icon">
              ↯
            </div>

            <h1>Expert Decision</h1>

            <h1 className="brand-title-second">
              Replay Platform
            </h1>

            <p className="brand-subtitle">
              Reconstruct • Analyze • Replay Decisions
            </p>
          </div>

          {!user ? (
            <>
              {/* Login Header */}
              <div className="login-header">
                <h2>Welcome Back</h2>

                <p>
                  Sign in to continue to your workspace
                </p>
              </div>

              {/* Login Form */}
              <form
                onSubmit={handleLogin}
                className="login-form"
              >

                {/* Email */}
                <div className="form-group">
                  <label htmlFor="email">
                    Email Address
                  </label>

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="Enter your email"
                    required
                  />
                </div>

                {/* Password */}
                <div className="form-group">
                  <label htmlFor="password">
                    Password
                  </label>

                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder="Enter your password"
                    required
                  />
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  className="login-button"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Logging in...
                    </>
                  ) : (
                    <>
                      Login
                      <span className="button-arrow">
                        →
                      </span>
                    </>
                  )}
                </button>
              </form>

              {/* NEW USER */}
              <p className="register-text">
                New user?{" "}
                <button
                  type="button"
                  className="register-link"
                  onClick={() => {
                    setShowRegister(true);
                    setMessage("");
                    setError("");
                  }}
                >
                  Register here
                </button>
              </p>

              {/* Messages */}
              {message && (
                <div className="success-message">
                  <span className="message-icon">
                    ✓
                  </span>

                  <span>{message}</span>
                </div>
              )}

              {error && (
                <div className="error-message">
                  <span className="message-icon">
                    !
                  </span>

                  <span>{error}</span>
                </div>
              )}

              <div className="login-footer">
                <span>
                  Expert Decision Replay Platform
                </span>
              </div>
            </>
          ) : (
            /* Logged-in Dashboard */
            <div className="dashboard">

              <div className="success-icon">
                ✓
              </div>

              <h2>
                Login Successful!
              </h2>

              <p className="welcome-text">
                Welcome to your workspace, {user.name}.
              </p>

              <div className="user-card">

                <div className="user-card-header">

                  <div className="avatar">
                    {user.name
                      ? user.name
                          .charAt(0)
                          .toUpperCase()
                      : "U"}
                  </div>

                  <div>
                    <h3>{user.name}</h3>
                    <span>{user.role}</span>
                  </div>

                </div>

                <div className="user-details">

                  <div className="detail-row">
                    <span className="detail-label">
                      Email
                    </span>

                    <span className="detail-value">
                      {user.email}
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">
                      Role
                    </span>

                    <span className="detail-value">
                      {user.role}
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">
                      Team
                    </span>

                    <span className="detail-value">
                      {user.team || "Not assigned"}
                    </span>
                  </div>

                </div>
              </div>

              <button
                onClick={handleLogout}
                className="logout-button"
              >
                Logout
              </button>

            </div>
          )}
        </section>

        <footer className="page-footer">
          <span>
            Expert Decision Replay Platform
          </span>

          <span>•</span>

          <span>
            Secure Workspace
          </span>
        </footer>
      </main>
    </div>
  );
}

export default App;