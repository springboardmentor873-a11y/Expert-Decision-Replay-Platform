import { useState } from "react";
import Dashboard from "./Dashboard";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      // Login
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
        alert(data.detail || "Invalid email or password");
        return;
      }

      // Save JWT token
      localStorage.setItem("token", data.access_token);

      console.log("Login successful!");
      console.log("Token:", data.access_token);

      // Get current user
      const meResponse = await fetch(
        "http://127.0.0.1:8000/me",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${data.access_token}`,
          },
        }
      );

      const meData = await meResponse.json();

      if (!meResponse.ok) {
        alert(meData.detail || "Authentication failed");
        return;
      }

      console.log("User:", meData);

      // Store user information
      setUser(meData);
      setLoggedIn(true);

    } catch (error) {
      console.error(error);
      alert("Could not connect to backend");
    }
  };

  // LOGOUT
  const handleLogout = () => {
    localStorage.removeItem("token");
    setLoggedIn(false);
    setUser(null);
    setEmail("");
    setPassword("");
  };

  // DASHBOARD
  if (loggedIn) {
    return (
      <Dashboard
        user={user}
        onLogout={handleLogout}
      />
    );
  }

  // LOGIN PAGE
  return (
    <div style={styles.container}>
      <div style={styles.card}>

        <h1 style={styles.title}>
          Sign in to continue
        </h1>

        <form onSubmit={handleLogin}>

          {/* EMAIL */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Email
            </label>

            <input
              style={styles.input}
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* PASSWORD */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Password
            </label>

            <input
              style={styles.input}
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* LOGIN BUTTON */}
          <button
            type="submit"
            style={styles.button}
          >
            Login
          </button>

        </form>

        <p style={styles.register}>
          Don't have an account?{" "}
          <span style={styles.registerLink}>
            Register
          </span>
        </p>

      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f7fb",
    padding: "20px",
    boxSizing: "border-box",
  },

  card: {
    width: "100%",
    maxWidth: "500px",
    padding: "45px",
    backgroundColor: "#ffffff",
    borderRadius: "18px",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
    boxSizing: "border-box",
  },

  title: {
    textAlign: "center",
    fontSize: "36px",
    marginBottom: "40px",
    color: "#111827",
  },

  formGroup: {
    width: "100%",
    marginBottom: "25px",
  },

  label: {
    display: "block",
    fontSize: "17px",
    fontWeight: "600",
    marginBottom: "8px",
    color: "#111827",
  },

  input: {
    width: "100%",
    padding: "15px",
    fontSize: "16px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    boxSizing: "border-box",
    outline: "none",
  },

  button: {
    width: "100%",
    padding: "15px",
    marginTop: "10px",
    backgroundColor: "#4c63e8",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "18px",
    fontWeight: "600",
    cursor: "pointer",
  },

  register: {
    marginTop: "25px",
    textAlign: "center",
    fontSize: "16px",
    color: "#4b5563",
  },

  registerLink: {
    color: "#4c63e8",
    fontWeight: "600",
    cursor: "pointer",
  },
};

export default App;