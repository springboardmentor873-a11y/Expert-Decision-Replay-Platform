import { useState } from "react";
import "../styles/Login.css";

function Login({ onRegister, onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();

    console.log("Email:", email);
    console.log("Password:", password);

    // For now, just go to the dashboard
    onLogin();
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <h1>DecisionVault</h1>

        <p className="login-subtitle">Decision Intelligence Platform</p>

        <form onSubmit={handleLogin}>
          <div className="login-form-group">
            <label>Email</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="login-form-group">
            <label>Password</label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="login-button">
            Sign in
          </button>
        </form>

        <div className="login-register">
          <span>Don't have an account?</span>

          <button onClick={onRegister}>Register</button>
        </div>
      </div>
    </div>
  );
}

export default Login;
