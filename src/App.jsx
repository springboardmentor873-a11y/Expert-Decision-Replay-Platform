import { useState } from "react";
import "./App.css";

function App() {
  const [isRegister, setIsRegister] = useState(false);

  const [name, setName] = useState("");
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");

  const [teams, setTeams] = useState([]);
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [teamMessage, setTeamMessage] = useState("");

  const [selectedTeam, setSelectedTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [memberUserId, setMemberUserId] = useState("");
  const [memberMessage, setMemberMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = isRegister
        ? "http://127.0.0.1:8000/users"
        : "http://127.0.0.1:8000/login";

      const body = isRegister
        ? {
            name: name,
            email: email,
            password: password,
          }
        : {
            email: email,
            password: password,
          };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        if (isRegister) {
          setMessage("Registration successful! You can now login.");
          setIsRegister(false);
          setName("");
          setEmail("");
          setPassword("");
        } else {
          setUser(data);
          setMessage("");

          if (data.role === "MANAGER") {
            loadTeams();
          }
        }
      } else {
        setMessage(data.detail || "Something went wrong");
      }
    } catch (error) {
      setMessage("Unable to connect to backend");
    }
  };

  const loadTeams = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/teams");

      const data = await response.json();

      if (response.ok) {
        setTeams(data);
      }
    } catch (error) {
      setTeamMessage("Unable to load teams");
    }
  };

  const createTeam = async (e) => {
    e.preventDefault();

    setTeamMessage("");

    try {
      const response = await fetch("http://127.0.0.1:8000/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: teamName,
          description: teamDescription,
          manager_id: user.id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setTeams((previousTeams) => [...previousTeams, data]);
        setTeamName("");
        setTeamDescription("");
        setTeamMessage("Team created successfully!");
      } else {
        setTeamMessage(data.detail || "Unable to create team");
      }
    } catch (error) {
      setTeamMessage("Unable to connect to backend");
    }
  };

  const viewMembers = async (teamId) => {
    setMemberMessage("");

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/teams/${teamId}/members`
      );

      const data = await response.json();

      if (response.ok) {
        setSelectedTeam(teamId);
        setMembers(data);
      } else {
        setMemberMessage(data.detail || "Unable to load members");
      }
    } catch (error) {
      setMemberMessage("Unable to connect to backend");
    }
  };

  const addMember = async (teamId) => {
    if (!memberUserId) {
      setMemberMessage("Enter a User ID");
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/teams/${teamId}/members?user_id=${memberUserId}`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMemberMessage("Member added successfully!");
        setMemberUserId("");
        viewMembers(teamId);
      } else {
        setMemberMessage(data.detail || "Unable to add member");
      }
    } catch (error) {
      setMemberMessage("Unable to connect to backend");
    }
  };

  const removeMember = async (teamId, userId) => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/teams/${teamId}/members/${userId}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMemberMessage("Member removed successfully!");
        viewMembers(teamId);
      } else {
        setMemberMessage(data.detail || "Unable to remove member");
      }
    } catch (error) {
      setMemberMessage("Unable to connect to backend");
    }
  };

  const logout = () => {
    setUser(null);
    setTeams([]);
    setMembers([]);
    setSelectedTeam(null);
    setTeamMessage("");
    setMemberMessage("");
  };

  if (user) {
    return (
      <div className="login-container">
        <div className="login-box dashboard-box">

          <h1>Expert Decision Replay</h1>

          <h2>Welcome, {user.name}</h2>

          <p>Your Role:</p>

          <h3>{user.role}</h3>

          {user.role === "EMPLOYEE" && (
            <div className="dashboard-section">
              <h3>Employee Dashboard</h3>
              <p>
                View and manage your assigned decisions.
              </p>
            </div>
          )}

          {user.role === "REVIEWER" && (
            <div className="dashboard-section">
              <h3>Reviewer Dashboard</h3>
              <p>
                Review employee decisions and provide feedback.
              </p>
            </div>
          )}

          {user.role === "MANAGER" && (
            <div className="dashboard-section">

              <h3>Manager Dashboard</h3>

              <p>
                Manage teams and monitor decision activities.
              </p>

              <div className="team-management">

                <h4>Create New Team</h4>

                <form onSubmit={createTeam}>

                  <input
                    type="text"
                    placeholder="Team Name"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    required
                  />

                  <input
                    type="text"
                    placeholder="Team Description"
                    value={teamDescription}
                    onChange={(e) =>
                      setTeamDescription(e.target.value)
                    }
                  />

                  <button type="submit">
                    Create Team
                  </button>

                </form>

                {teamMessage && (
                  <p className="message">
                    {teamMessage}
                  </p>
                )}

                <div className="team-list">

                  <h4>Teams</h4>

                  {teams.length === 0 ? (
                    <p>No teams found.</p>
                  ) : (
                    teams.map((team) => (
                      <div
                        className="team-card"
                        key={team.id}
                      >

                        <h4>{team.name}</h4>

                        <p>
                          {team.description ||
                            "No description"}
                        </p>

                        <p>
                          Team ID: {team.id}
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            viewMembers(team.id)
                          }
                        >
                          View Members
                        </button>

                        {selectedTeam === team.id && (
                          <div className="members-section">

                            <h4>Team Members</h4>

                            {members.length === 0 ? (
                              <p>
                                No members in this team.
                              </p>
                            ) : (
                              members.map((member) => (
                                <div
                                  className="member-card"
                                  key={member.id}
                                >
                                  <span>
                                    User ID: {member.user_id}
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeMember(
                                        team.id,
                                        member.user_id
                                      )
                                    }
                                  >
                                    Remove
                                  </button>
                                </div>
                              ))
                            )}

                            <div className="add-member">

                              <input
                                type="number"
                                placeholder="Enter User ID"
                                value={memberUserId}
                                onChange={(e) =>
                                  setMemberUserId(
                                    e.target.value
                                  )
                                }
                              />

                              <button
                                type="button"
                                onClick={() =>
                                  addMember(team.id)
                                }
                              >
                                Add Member
                              </button>

                            </div>

                            {memberMessage && (
                              <p className="message">
                                {memberMessage}
                              </p>
                            )}

                          </div>
                        )}

                      </div>
                    ))
                  )}

                </div>

              </div>

            </div>
          )}

          {user.role === "ADMINISTRATOR" && (
            <div className="dashboard-section">

              <h3>Administrator Dashboard</h3>

              <p>
                Manage users, roles, teams, and the platform.
              </p>

              <div className="admin-info">
                <h4>Platform Administration</h4>

                <p>
                  User management and advanced team
                  administration will be available here.
                </p>
              </div>

            </div>
          )}

          <p className="success-message">
            You are successfully logged in.
          </p>

          <button
            type="button"
            onClick={logout}
          >
            Logout
          </button>

        </div>
      </div>
    );
  }

  return (
    <div className="login-container">

      <div className="login-box">

        <h1>Expert Decision Replay</h1>

        <h2>
          {isRegister ? "Register" : "Login"}
        </h2>

        <form onSubmit={handleSubmit}>

          {isRegister && (
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              required
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            required
          />

          <button type="submit">
            {isRegister ? "Register" : "Login"}
          </button>

        </form>

        {message && (
          <p className="message">
            {message}
          </p>
        )}

        <button
          type="button"
          className="switch-button"
          onClick={() => {
            setIsRegister(!isRegister);
            setMessage("");
            setName("");
            setEmail("");
            setPassword("");
          }}
        >
          {isRegister
            ? "Already have an account? Login"
            : "Create an account"}
        </button>

      </div>

    </div>
  );
}

export default App;

