import { useEffect, useState } from "react";
import "./App.css";

const API_BASE_URL = "http://127.0.0.1:8000";

function App() {
  // ==========================================
  // PAGE
  // ==========================================

  const [page, setPage] = useState(() => {
    return localStorage.getItem("access_token")
      ? "home"
      : "login";
  });

  // ==========================================
  // LOGIN
  // ==========================================

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // ==========================================
  // REGISTER
  // ==========================================

  const [name, setName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [roleId, setRoleId] = useState("");
  const [teamId, setTeamId] = useState("");

  // ==========================================
  // DATA
  // ==========================================

  const [roles, setRoles] = useState([]);
  const [teams, setTeams] = useState([]);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");

    return saved ? JSON.parse(saved) : null;
  });

  // ==========================================
  // MESSAGE
  // ==========================================

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const [loading, setLoading] = useState(false);

  // ==========================================
  // LOAD ROLES / TEAMS
  // ==========================================

  useEffect(() => {
    loadRoles();
    loadTeams();
  }, []);

  // ==========================================
  // LOAD ROLES
  // ==========================================

  const loadRoles = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/roles/`
      );

      if (!response.ok) return;

      const data = await response.json();

      setRoles(data);
    } catch (error) {
      console.error("Roles error:", error);
    }
  };

  // ==========================================
  // LOAD TEAMS
  // ==========================================

  const loadTeams = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/teams/`
      );

      if (!response.ok) return;

      const data = await response.json();

      setTeams(data);
    } catch (error) {
      console.error("Teams error:", error);
    }
  };

  // ==========================================
  // GET ROLE NAME
  // ==========================================

  const getRoleName = (roleId) => {
    const role = roles.find(
      (r) => Number(r.role_id) === Number(roleId)
    );

    return role ? role.role_name : "Not assigned";
  };

  // ==========================================
  // GET TEAM NAME
  // ==========================================

  const getTeamName = (teamId) => {
    const team = teams.find(
      (t) => Number(t.team_id) === Number(teamId)
    );

    return team ? team.team_name : "Not assigned";
  };

  // ==========================================
  // REGISTER
  // ==========================================

  const handleRegister = async (e) => {
    e.preventDefault();

    setMessage("");
    setMessageType("");

    if (!name.trim()) {
      setMessage("Please enter your name.");
      setMessageType("error");
      return;
    }

    if (!registerEmail.trim()) {
      setMessage("Please enter your email.");
      setMessageType("error");
      return;
    }

    if (!registerPassword) {
      setMessage("Please enter your password.");
      setMessageType("error");
      return;
    }

    if (!roleId) {
      setMessage("Please select a role.");
      setMessageType("error");
      return;
    }

    if (!teamId) {
      setMessage("Please select a team.");
      setMessageType("error");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: name.trim(),
            email: registerEmail.trim(),
            password: registerPassword,
            role_id: Number(roleId),
            team_id: Number(teamId)
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.detail || "Registration failed"
        );

        setMessageType("error");
        return;
      }

      setMessage(
        "Registration successful! Please login."
      );

      setMessageType("success");

      setName("");
      setRegisterEmail("");
      setRegisterPassword("");
      setRoleId("");
      setTeamId("");

      setTimeout(() => {
        setPage("login");
        setMessage("");
        setMessageType("");
      }, 1500);

    } catch (error) {
      console.error(error);

      setMessage(
        "Unable to connect to server."
      );

      setMessageType("error");

    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // LOGIN
  // ==========================================

  const handleLogin = async (e) => {
    e.preventDefault();

    setMessage("");
    setMessageType("");

    if (!loginEmail.trim()) {
      setMessage("Please enter your email.");
      setMessageType("error");
      return;
    }

    if (!loginPassword) {
      setMessage("Please enter your password.");
      setMessageType("error");
      return;
    }

    try {
      setLoading(true);

      const formData = new URLSearchParams();

      formData.append(
        "username",
        loginEmail.trim()
      );

      formData.append(
        "password",
        loginPassword
      );

      const response = await fetch(
        `${API_BASE_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded"
          },
          body: formData
        }
      );

      const data = await response.json();

      // ======================================
      // INVALID LOGIN
      // ======================================

      if (!response.ok) {
        setMessage(
          data.detail ||
          "Invalid email or password"
        );

        setMessageType("error");
        return;
      }

      // ======================================
      // SAVE LOGIN
      // ======================================

      localStorage.setItem(
        "access_token",
        data.access_token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      setUser(data.user);

      setLoginPassword("");

      setMessage("");

      // ======================================
      // GO TO MILESTONE 1 HOME
      // ======================================

      setPage("home");

    } catch (error) {
      console.error(error);

      setMessage(
        "Unable to connect to server."
      );

      setMessageType("error");

    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");

    setUser(null);

    setLoginEmail("");
    setLoginPassword("");

    setPage("login");
  };

  // ==========================================
  // HOME / PROFILE AFTER LOGIN
  // ==========================================

  if (page === "home") {
    return (
      <div className="app-page">

        <div className="home-container">

          {/* HEADER */}

          <header className="top-header">

            <div>
              <h1>
                Expert Decision Replay
              </h1>

              <p>
                Decision Intelligence Platform
              </p>
            </div>

            <button
              className="logout-button"
              onClick={handleLogout}
            >
              Logout
            </button>

          </header>


          {/* LINE */}

          <div className="header-line"></div>


          {/* WELCOME */}

          <section className="welcome-section">

            <h2>
              Welcome!
            </h2>

            <p>
              You are successfully logged in.
            </p>

            <strong>
              {user?.email}
            </strong>

          </section>


          {/* USER INFORMATION */}

          <section className="section">

            <h3>
              User Information
            </h3>

            <div className="section-line"></div>


            <div className="info-grid">

              <div className="info-card">

                <span>
                  Name
                </span>

                <strong>
                  {user?.name || "Not available"}
                </strong>

              </div>


              <div className="info-card">

                <span>
                  Email
                </span>

                <strong>
                  {user?.email || "Not available"}
                </strong>

              </div>


              <div className="info-card">

                <span>
                  Role
                </span>

                <strong>
                  {getRoleName(user?.role_id)}
                </strong>

              </div>


              <div className="info-card">

                <span>
                  Team
                </span>

                <strong>
                  {getTeamName(user?.team_id)}
                </strong>

              </div>

            </div>

          </section>


          {/* MY PROFILE */}

          


          {/* AVAILABLE ROLES */}

          <section className="section">

            <h3>
              Available Roles
            </h3>

            <div className="section-line"></div>


            <div className="available-grid">

              {roles.map((role) => (

                <div
                  className="available-card"
                  key={role.role_id}
                >
                  {role.role_name}
                </div>

              ))}

            </div>

          </section>


          {/* AVAILABLE TEAMS */}

          <section className="section">

            <h3>
              Available Teams
            </h3>

            <div className="section-line"></div>


            <div className="available-grid">

              {teams.map((team) => (

                <div
                  className="available-card"
                  key={team.team_id}
                >
                  {team.team_name}
                </div>

              ))}

            </div>

          </section>

        </div>

      </div>
    );
  }


  // ==========================================
  // LOGIN PAGE
  // ==========================================

  if (page === "login") {
    return (
      <div className="page-container">

        <div className="auth-card">

          <div className="header">

            <h1>
              Expert Decision Replay
            </h1>

            <p>
              Decision Intelligence Platform
            </p>

          </div>


          <h2>
            Login
          </h2>


          <form onSubmit={handleLogin}>

            <div className="form-group">

              <label>
                Email
              </label>

              <input
                type="email"
                placeholder="Enter your email"
                value={loginEmail}
                onChange={(e) =>
                  setLoginEmail(e.target.value)
                }
              />

            </div>


            <div className="form-group">

              <label>
                Password
              </label>

              <input
                type="password"
                placeholder="Enter your password"
                value={loginPassword}
                onChange={(e) =>
                  setLoginPassword(e.target.value)
                }
              />

            </div>


            {message && (
              <div
                className={`message ${messageType}`}
              >
                {message}
              </div>
            )}


            <button
              type="submit"
              className="primary-button"
              disabled={loading}
            >
              {loading
                ? "Logging in..."
                : "Login"}
            </button>

          </form>


          <div className="bottom-text">
            Don't have an account?
          </div>


          <button
            className="secondary-button"
            onClick={() => {
              setPage("register");
              setMessage("");
              setMessageType("");
            }}
          >
            Go to Register
          </button>

        </div>

      </div>
    );
  }


  // ==========================================
  // REGISTER PAGE
  // ==========================================

  return (
    <div className="page-container">

      <div className="auth-card">

        <div className="header">

          <h1>
            Expert Decision Replay
          </h1>

          <p>
            Decision Intelligence Platform
          </p>

        </div>


        <h2>
          Register
        </h2>


        <form onSubmit={handleRegister}>

          <div className="form-group">

            <label>
              Name
            </label>

            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
            />

          </div>


          <div className="form-group">

            <label>
              Email
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              value={registerEmail}
              onChange={(e) =>
                setRegisterEmail(e.target.value)
              }
            />

          </div>


          <div className="form-group">

            <label>
              Password
            </label>

            <input
              type="password"
              placeholder="Enter your password"
              value={registerPassword}
              onChange={(e) =>
                setRegisterPassword(e.target.value)
              }
            />

          </div>


          <div className="form-group">

            <label>
              Role
            </label>

            <select
              value={roleId}
              onChange={(e) =>
                setRoleId(e.target.value)
              }
            >

              <option value="">
                Select Role
              </option>

              {roles.map((role) => (

                <option
                  key={role.role_id}
                  value={role.role_id}
                >
                  {role.role_name}
                </option>

              ))}

            </select>

          </div>


          <div className="form-group">

            <label>
              Team
            </label>

            <select
              value={teamId}
              onChange={(e) =>
                setTeamId(e.target.value)
              }
            >

              <option value="">
                Select Team
              </option>

              {teams.map((team) => (

                <option
                  key={team.team_id}
                  value={team.team_id}
                >
                  {team.team_name}
                </option>

              ))}

            </select>

          </div>


          {message && (
            <div
              className={`message ${messageType}`}
            >
              {message}
            </div>
          )}


          <button
            type="submit"
            className="primary-button"
            disabled={loading}
          >
            {loading
              ? "Registering..."
              : "Register"}
          </button>

        </form>


        <div className="bottom-text">
          Already have an account?
        </div>


        <button
          className="secondary-button"
          onClick={() => {
            setPage("login");
            setMessage("");
            setMessageType("");
          }}
        >
          Go to Login
        </button>

      </div>

    </div>
  );
}

export default App;