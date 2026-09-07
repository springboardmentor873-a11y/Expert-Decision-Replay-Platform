import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Dashboard from "./dashboard.jsx";
import api from "./services/api";

const authBackendUrl = "http://127.0.0.1:8000";

function setAuthToken(token) {
  localStorage.setItem("token", token);
  window.dispatchEvent(new Event("auth-changed"));
}

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${authBackendUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.detail || "Invalid email or password");
        return;
      }

      setAuthToken(data.access_token);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.error("Login error:", error);
      alert("Cannot connect to backend. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" style={styles.pageShell}>
      <div className="auth-card" style={styles.card}>
        <h1 style={styles.title}>Expert Decision</h1>
        <p style={styles.subtitle}>Replay Platform</p>
        <h2 style={styles.authHeading}>Login</h2>

        <form onSubmit={handleLogin} style={styles.authForm}>
          <label style={styles.label}>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" required style={styles.input} />

          <label style={styles.label}>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required style={styles.input} />

          <button type="submit" disabled={loading} style={styles.button}>{loading ? "Logging in..." : "Login"}</button>
        </form>

        <div style={{ marginTop: 20, textAlign: "center" }}>
          <p style={{ color: "#666" }}>Don't have an account? <button onClick={() => navigate("/register")} style={{ background: "none", border: "none", color: "#4338ca", cursor: "pointer", textDecoration: "underline", fontSize: 14 }}>Register here</button></p>
        </div>
      </div>
    </div>
  );
}

function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState("");
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/roles")
      .then((response) => {
        const availableRoles = response.data || [];
        setRoles(availableRoles);
        if (availableRoles[0]) setRoleId(String(availableRoles[0].id));
      })
      .catch(() => alert("Unable to load roles. Please make sure the backend is running."));
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${authBackendUrl}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role_id: Number(roleId) }),
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.detail || "Registration failed");
        return;
      }

      const loginResponse = await fetch(`${authBackendUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const loginData = await loginResponse.json();

      if (!loginResponse.ok) {
        alert("Account created. Please login.");
        navigate("/login", { replace: true });
        return;
      }

      setAuthToken(loginData.access_token);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.error("Register error:", error);
      alert("Cannot connect to backend. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" style={styles.pageShell}>
      <div className="auth-card" style={styles.card}>
        <h1 style={styles.title}>Expert Decision</h1>
        <p style={styles.subtitle}>Replay Platform</p>
        <h2 style={styles.authHeading}>Create Account</h2>

        <form onSubmit={handleRegister} style={styles.authForm}>
          <label style={styles.label}>Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" required style={styles.input} />

          <label style={styles.label}>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" required style={styles.input} />

          <label style={styles.label}>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required style={styles.input} />

          <label style={styles.label}>Choose your role</label>
          <select value={roleId} onChange={(e) => setRoleId(e.target.value)} required style={styles.input} disabled={roles.length === 0}>
            <option value="">Select a role</option>
            {roles.map((role) => <option key={role.id} value={role.id}>{role.name} - {role.description}</option>)}
          </select>

          <button type="submit" disabled={loading || !roleId} style={styles.button}>{loading ? "Creating account..." : "Register"}</button>
        </form>

        <div style={{ marginTop: 20, textAlign: "center" }}>
          <p style={{ color: "#666" }}>Already have an account? <button onClick={() => navigate("/login")} style={{ background: "none", border: "none", color: "#4338ca", cursor: "pointer", textDecoration: "underline", fontSize: 14 }}>Login here</button></p>
        </div>
      </div>
    </div>
  );
}

function DecisionPage() {
  const navigate = useNavigate();
  const [decisions, setDecisions] = useState([]);
  const [title, setTitle] = useState("");
  const [problemStatement, setProblemStatement] = useState("");
  const [objective, setObjective] = useState("");
  const [category, setCategory] = useState("General");
  const [status, setStatus] = useState("Draft");
  const [rationale, setRationale] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchDecisions = async () => {
    try {
      const response = await api.get("/decisions");
      setDecisions(response.data || []);
    } catch (error) {
      console.error("Failed to load decisions:", error);
      alert("Unable to load decisions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecisions();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await api.post("/decisions", {
        title,
        problem_statement: problemStatement,
        objective,
        category,
        status,
        rationale,
      });

      setTitle("");
      setProblemStatement("");
      setObjective("");
      setCategory("General");
      setStatus("Draft");
      setRationale("");
      await fetchDecisions();
    } catch (error) {
      alert(error?.response?.data?.detail || "Unable to create decision.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ShellLayout title="Decision management" navigate={navigate}>
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 20 }}>
        <div style={{ ...styles.card, maxWidth: "none" }}>
          <h3>Decision List</h3>
          {loading ? <p>Loading decisions...</p> : decisions.length === 0 ? <p>No decisions yet.</p> : (
            <div style={{ display: "grid", gap: 12 }}>
              {decisions.map((decision) => (
                <div key={decision.id} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <strong>{decision.title}</strong>
                    <span style={{ background: "#eef2ff", color: "#4338ca", borderRadius: 999, padding: "4px 8px", fontSize: 12 }}>{decision.status}</span>
                  </div>
                  <p style={{ margin: "8px 0", color: "#4b5563" }}>{decision.problem_statement}</p>
                  <small style={{ color: "#6b7280" }}>{decision.category || "General"} • {decision.objective || "No objective provided"}</small>
                </div>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleSave} style={styles.card}>
          <h3>Create Decision</h3>
          <input placeholder="Decision title" value={title} onChange={(e) => setTitle(e.target.value)} style={styles.input} required />
          <textarea placeholder="Problem statement" value={problemStatement} onChange={(e) => setProblemStatement(e.target.value)} style={{ ...styles.input, minHeight: 90 }} required />
          <input placeholder="Objective" value={objective} onChange={(e) => setObjective(e.target.value)} style={styles.input} />
          <input placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} style={styles.input} />
          <select value={status} onChange={(e) => setStatus(e.target.value)} style={styles.input}>
            <option>Draft</option>
            <option>Under Review</option>
            <option>Approved</option>
            <option>Rejected</option>
            <option>Archived</option>
          </select>
          <textarea placeholder="Rationale" value={rationale} onChange={(e) => setRationale(e.target.value)} style={{ ...styles.input, minHeight: 90 }} />
          <button type="submit" style={styles.button} disabled={saving}>{saving ? "Saving..." : "Create decision"}</button>
        </form>
      </div>
    </ShellLayout>
  );
}

function CreateDecisionPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", problem_statement: "", objective: "", category: "General", status: "Draft", rationale: "" });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/decisions", form);
      navigate("/decisions");
    } catch (error) {
      alert(error?.response?.data?.detail || "Unable to create decision.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ShellLayout title="Create decision" navigate={navigate}>
      <form onSubmit={handleSubmit} style={{ ...styles.card, maxWidth: 650 }}>
        <h3>Decision form</h3>
        <input placeholder="Decision title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={styles.input} required />
        <textarea placeholder="Problem statement" value={form.problem_statement} onChange={(e) => setForm({ ...form, problem_statement: e.target.value })} style={{ ...styles.input, minHeight: 100 }} required />
        <input placeholder="Objective" value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })} style={styles.input} />
        <input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={styles.input} />
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={styles.input}>
          <option>Draft</option>
          <option>Under Review</option>
          <option>Approved</option>
          <option>Rejected</option>
          <option>Archived</option>
        </select>
        <textarea placeholder="Add context and rationale" value={form.rationale} onChange={(e) => setForm({ ...form, rationale: e.target.value })} style={{ ...styles.input, minHeight: 100 }} />
        <button type="submit" style={styles.button} disabled={saving}>{saving ? "Creating..." : "Create decision"}</button>
      </form>
    </ShellLayout>
  );
}

function DiscussionPage() {
  const navigate = useNavigate();
  const [decisions, setDecisions] = useState([]);
  const [selectedDecisionId, setSelectedDecisionId] = useState("");
  const [discussionText, setDiscussionText] = useState("");
  const [noteType, setNoteType] = useState("Comment");
  const [posts, setPosts] = useState([]);

  const loadDecisions = async () => {
    try {
      const response = await api.get("/decisions");
      setDecisions(response.data || []);
      if (response.data?.[0]) setSelectedDecisionId(String(response.data[0].id));
    } catch (error) {
      console.error(error);
    }
  };

  const loadDiscussions = async (decisionId) => {
    if (!decisionId) return;
    try {
      const response = await api.get(`/decisions/${decisionId}/discussions`);
      setPosts(response.data || []);
    } catch (error) {
      console.error(error);
      setPosts([]);
    }
  };

  useEffect(() => {
    loadDecisions();
  }, []);

  useEffect(() => {
    if (selectedDecisionId) loadDiscussions(selectedDecisionId);
  }, [selectedDecisionId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDecisionId || !discussionText.trim()) return;
    try {
      await api.post(`/decisions/${selectedDecisionId}/discussions`, { content: discussionText, note_type: noteType });
      setDiscussionText("");
      await loadDiscussions(selectedDecisionId);
    } catch (error) {
      alert(error?.response?.data?.detail || "Unable to add discussion.");
    }
  };

  return (
    <ShellLayout title="Discussion module" navigate={navigate}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.2fr) minmax(320px, 0.8fr)", gap: 18, alignItems: "start" }}>
        <div style={styles.card}>
          <h3 style={styles.panelHeading}>Decision thread</h3>
          <select style={styles.input} value={selectedDecisionId} onChange={(e) => setSelectedDecisionId(e.target.value)}>
            {decisions.map((decision) => <option key={decision.id} value={decision.id}>{decision.title}</option>)}
          </select>
          <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
            {posts.length === 0 ? <p>No comments yet.</p> : posts.map((post) => (
              <div key={post.id} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 10 }}>
                <strong>{post.user_name}</strong>
                <div style={{ fontSize: 12, color: "#6b7280", margin: "4px 0" }}>{post.note_type}</div>
                <div>{post.content}</div>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ ...styles.card, maxWidth: "none" }}>
          <h3 style={styles.panelHeading}>New comment</h3>
          <select style={styles.input} value={noteType} onChange={(e) => setNoteType(e.target.value)}>
            <option>Comment</option>
            <option>Review</option>
            <option>Risk</option>
            <option>Decision</option>
          </select>
          <textarea placeholder="Share your update" value={discussionText} onChange={(e) => setDiscussionText(e.target.value)} style={{ ...styles.input, minHeight: 120 }} required />
          <button type="submit" style={styles.button}>Post comment</button>
        </form>
      </div>
    </ShellLayout>
  );
}

function FilesPage() {
  const navigate = useNavigate();
  const [decisions, setDecisions] = useState([]);
  const [selectedDecisionId, setSelectedDecisionId] = useState("");
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const loadFiles = async (decisionId) => {
    if (!decisionId) return;
    try {
      const response = await api.get(`/decisions/${decisionId}/files`);
      setFiles(response.data || []);
    } catch (error) {
      alert(error.message || "Unable to load documents.");
    }
  };

  useEffect(() => {
    api.get("/decisions").then((response) => {
      const availableDecisions = response.data || [];
      setDecisions(availableDecisions);
      if (availableDecisions[0]) setSelectedDecisionId(String(availableDecisions[0].id));
    }).catch((error) => alert(error.message || "Unable to load decisions."));
  }, []);

  useEffect(() => {
    loadFiles(selectedDecisionId);
  }, [selectedDecisionId]);

  const uploadFiles = async (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (!selectedDecisionId || selectedFiles.length === 0) return;
    setUploading(true);
    try {
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("file", file);
        await api.upload(`/decisions/${selectedDecisionId}/files`, formData);
      }
      await loadFiles(selectedDecisionId);
      event.target.value = "";
    } catch (error) {
      alert(error.message || "Unable to upload document.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <ShellLayout title="Document management" navigate={navigate}>
      <div style={styles.card}>
        <h3>Uploaded files</h3>
        <select value={selectedDecisionId} onChange={(event) => setSelectedDecisionId(event.target.value)} style={styles.input} disabled={decisions.length === 0}>
          <option value="">Select a decision</option>
          {decisions.map((decision) => <option key={decision.id} value={decision.id}>{decision.title}</option>)}
        </select>
        <label style={{ ...styles.uploadButton, opacity: selectedDecisionId && !uploading ? 1 : 0.5 }}>
          <input type="file" multiple onChange={uploadFiles} style={{ display: "none" }} disabled={!selectedDecisionId || uploading} />
          {uploading ? "Uploading..." : "Upload documents"}
        </label>
        {files.length === 0 ? <p>No files uploaded for this decision.</p> : <ul style={{ paddingLeft: 18 }}>{files.map((file) => <li key={file.id}>{file.original_name} ({Math.max(1, Math.round(file.size / 1024))} KB)</li>)}</ul>}
      </div>
    </ShellLayout>
  );
}

function VersionsPage() {
  const navigate = useNavigate();
  const [decisions, setDecisions] = useState([]);
  const [selectedDecisionId, setSelectedDecisionId] = useState("");
  const [versions, setVersions] = useState([]);

  const loadDecisions = async () => {
    try {
      const response = await api.get("/decisions");
      setDecisions(response.data || []);
      if (response.data?.[0]) setSelectedDecisionId(String(response.data[0].id));
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadDecisions();
  }, []);

  useEffect(() => {
    if (!selectedDecisionId) return;
    api.get(`/decisions/${selectedDecisionId}/versions`)
      .then((res) => setVersions(res.data || []))
      .catch(() => setVersions([]));
  }, [selectedDecisionId]);

  return (
    <ShellLayout title="Version tracking" navigate={navigate}>
      <div style={styles.card}>
        <h3>Decision history</h3>
        <select style={styles.input} value={selectedDecisionId} onChange={(e) => setSelectedDecisionId(e.target.value)}>
          {decisions.map((decision) => <option key={decision.id} value={decision.id}>{decision.title}</option>)}
        </select>
        <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
          {versions.length === 0 ? <p>No versions tracked yet.</p> : versions.map((version) => (
            <div key={version.id} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12 }}>
              <strong>v{version.version_number}</strong>
              <div style={{ color: "#6b7280", marginTop: 4 }}>{version.status} • {version.category || "General"}</div>
              <div style={{ marginTop: 6 }}>{version.title}</div>
            </div>
          ))}
        </div>
      </div>
    </ShellLayout>
  );
}

function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    api.get("/me").then((response) => setProfile(response.data)).catch(() => setProfile(null));
  }, []);

  return (
    <ShellLayout title="Profile" navigate={navigate}>
      <div style={styles.card}>
        <h3>Account details</h3>
        <ul style={{ lineHeight: 1.8, paddingLeft: 18 }}>
          <li>Name: {profile?.name || "User"}</li>
          <li>Email: {profile?.email || "-"}</li>
          <li>Role ID: {profile?.role_id || "-"}</li>
          <li>Role: {profile?.role_name || "Employee"}</li>
          <li>Team ID: {profile?.team_id || "-"}</li>
        </ul>
      </div>
    </ShellLayout>
  );
}

function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const loadTeams = async () => {
    try {
      const response = await api.get("/teams");
      setTeams(response.data || []);
    } catch (requestError) {
      setError(requestError?.response?.data?.detail || "Unable to load teams.");
    }
  };

  useEffect(() => {
    Promise.all([api.get("/me"), api.get("/teams")])
      .then(([profileResponse, teamsResponse]) => {
        setProfile(profileResponse.data);
        setTeams(teamsResponse.data || []);
      })
      .catch(() => setError("Unable to load teams."));
  }, []);

  const createTeam = async (event) => {
    event.preventDefault();
    if (!name.trim()) return;
    try {
      await api.post("/teams", { name: name.trim(), description: description.trim() || null });
      setName("");
      setDescription("");
      await loadTeams();
    } catch (requestError) {
      setError(requestError?.response?.data?.detail || "Unable to create team.");
    }
  };

  return (
    <ShellLayout title="Teams" navigate={useNavigate()}>
      {error && <div style={styles.error}>{error}</div>}
      <div style={styles.teamPageGrid}>
        {teams.length === 0 ? <div style={styles.card}><p>No teams created yet.</p></div> : teams.map((team) => (
          <div key={team.id} style={styles.card}>
            <h3>{team.name}</h3>
            <p>{team.description || "No description provided."}</p>
            <span style={styles.teamCount}>{team.member_count} members</span>
          </div>
        ))}
      </div>
      {profile?.permissions?.can_manage_users && (
        <form onSubmit={createTeam} style={{ ...styles.card, maxWidth: 650, marginTop: 18 }}>
          <h3>Create team</h3>
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Team name" style={styles.input} required />
          <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description (optional)" style={styles.input} />
          <button type="submit" style={styles.button}>Create team</button>
        </form>
      )}
    </ShellLayout>
  );
}

function UserManagementPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [teams, setTeams] = useState([]);
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    try {
      const [usersResponse, rolesResponse, teamsResponse] = await Promise.all([
        api.get("/users"),
        api.get("/roles"),
        api.get("/teams"),
      ]);
      setUsers(usersResponse.data || []);
      setRoles(rolesResponse.data || []);
      setTeams(teamsResponse.data || []);
    } catch (error) {
      alert(error.message || "Unable to load user roles.");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const createTeam = async (event) => {
    event.preventDefault();
    if (!teamName.trim()) return;
    try {
      await api.post("/teams", { name: teamName.trim(), description: teamDescription.trim() || null });
      setTeamName("");
      setTeamDescription("");
      await loadUsers();
    } catch (error) {
      alert(error?.response?.data?.detail || error.message || "Unable to create team.");
    }
  };

  const assignTeam = async (userId, teamId) => {
    try {
      await api.put(`/users/${userId}/team`, { team_id: Number(teamId) });
      await loadUsers();
    } catch (error) {
      alert(error?.response?.data?.detail || error.message || "Unable to assign team.");
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const changeRole = async (userId, roleId) => {
    try {
      await api.put(`/users/${userId}/role`, { role_id: Number(roleId) });
      await loadUsers();
    } catch (error) {
      alert(error.message || "Unable to update role.");
    }
  };

  return (
    <ShellLayout title="User and role management" navigate={navigate}>
      <div style={styles.card}>
        <h3>Organization access</h3>
        <p>Assign the responsibilities each team member needs.</p>
        {loading ? <p>Loading users...</p> : users.map((user) => (
          <div key={user.id} style={styles.userRow}>
            <div>
              <strong>{user.name}</strong>
              <div style={{ color: "#6b7280", fontSize: 13 }}>{user.email}</div>
            </div>
            <select value={user.role_id} onChange={(event) => changeRole(user.id, event.target.value)} style={styles.roleSelect}>
              {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
            </select>
            <select value={user.team_id || ""} onChange={(event) => assignTeam(user.id, event.target.value)} style={styles.roleSelect}>
              <option value="">No team</option>
              {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
            </select>
          </div>
        ))}
      </div>
      <form onSubmit={createTeam} style={{ ...styles.card, maxWidth: 650 }}>
        <h3>Create team</h3>
        <input value={teamName} onChange={(event) => setTeamName(event.target.value)} placeholder="Team name" style={styles.input} required />
        <input value={teamDescription} onChange={(event) => setTeamDescription(event.target.value)} placeholder="Description (optional)" style={styles.input} />
        <button type="submit" style={styles.button}>Create team</button>
      </form>
    </ShellLayout>
  );
}

function ShellLayout({ title, navigate, children }) {
  const [profile, setProfile] = useState(null);
  const location = useLocation();

  useEffect(() => {
    api.get("/me").then((response) => setProfile(response.data)).catch(() => setProfile(null));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("auth-changed"));
    navigate("/login", { replace: true });
  };

  return (
    <div style={styles.shell}>
      <aside style={styles.sidebar}>
        <div style={styles.brand}>Expert Decision<span style={styles.brandSmall}>Replay Platform</span></div>
        <button style={{ ...styles.navButton, ...(location.pathname === "/dashboard" ? styles.navButtonActive : {}) }} onClick={() => navigate("/dashboard")}>⌂ Dashboard</button>
        <button style={{ ...styles.navButton, ...(location.pathname.startsWith("/decisions") ? styles.navButtonActive : {}) }} onClick={() => navigate("/decisions")}>✓ Decisions</button>
        <button style={styles.navButton} onClick={() => navigate("/decisions/create")}>＋ Create Decision</button>
        <button style={{ ...styles.navButton, ...(location.pathname === "/teams" ? styles.navButtonActive : {}) }} onClick={() => navigate("/teams")}>◎ Teams</button>
        <button style={{ ...styles.navButton, ...(location.pathname === "/discussions" ? styles.navButtonActive : {}) }} onClick={() => navigate("/discussions")}>◌ My Discussions</button>
        <button style={styles.navButton} onClick={() => navigate("/dashboard")}>▦ Knowledge Repository</button>
        <button style={{ ...styles.navButton, ...(location.pathname === "/files" ? styles.navButtonActive : {}) }} onClick={() => navigate("/files")}>▣ Documents</button>
        <button style={{ ...styles.navButton, ...(location.pathname === "/versions" ? styles.navButtonActive : {}) }} onClick={() => navigate("/versions")}>▤ Analytics</button>
        <button style={{ ...styles.navButton, ...(location.pathname === "/profile" ? styles.navButtonActive : {}) }} onClick={() => navigate("/profile")}>◍ Profile</button>
        <button style={styles.navButton} onClick={() => navigate("/profile")}>⚙ Settings</button>
        <button style={styles.logoutButton} onClick={handleLogout}>🚪 Logout</button>
      </aside>

      <main style={styles.mainPanel}>
        <h2 style={styles.pageTitle}>{title}</h2>
        {children}
      </main>
    </div>
  );
}

function AppRoutes() {
  const location = useLocation();
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  useEffect(() => {
    const refreshAuth = () => setToken(localStorage.getItem("token"));
    window.addEventListener("auth-changed", refreshAuth);
    window.addEventListener("storage", refreshAuth);
    return () => {
      window.removeEventListener("auth-changed", refreshAuth);
      window.removeEventListener("storage", refreshAuth);
    };
  }, []);

  useEffect(() => {
    setToken(localStorage.getItem("token"));
  }, [location.pathname]);

  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/register" element={token ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
      <Route path="/dashboard" element={token ? <Dashboard /> : <Navigate to="/login" replace />} />
      <Route path="/decisions" element={token ? <DecisionPage /> : <Navigate to="/login" replace />} />
      <Route path="/decisions/create" element={token ? <CreateDecisionPage /> : <Navigate to="/login" replace />} />
      <Route path="/discussions" element={token ? <DiscussionPage /> : <Navigate to="/login" replace />} />
      <Route path="/files" element={token ? <FilesPage /> : <Navigate to="/login" replace />} />
      <Route path="/versions" element={token ? <VersionsPage /> : <Navigate to="/login" replace />} />
      <Route path="/profile" element={token ? <ProfilePage /> : <Navigate to="/login" replace />} />
      <Route path="/users" element={token ? <UserManagementPage /> : <Navigate to="/login" replace />} />
      <Route path="/teams" element={token ? <TeamsPage /> : <Navigate to="/login" replace />} />
      <Route path="/" element={<Navigate to={token ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

const styles = {
  pageShell: { minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "transparent", position: "relative", overflow: "hidden", fontFamily: "Inter, 'Segoe UI', sans-serif" },
  card: { background: "#fff", padding: "18px 16px", border: "1px solid #e4ebf3", borderRadius: 16, boxShadow: "none", display: "grid", gap: 12, width: "100%", maxWidth: 430 },
  panelHeading: { margin: 0, fontSize: 20, color: "#202a3a", fontWeight: 700 },
  title: { textAlign: "center", marginBottom: "4px", fontSize: 40, fontWeight: 700, color: "#111827", letterSpacing: "-0.04em" },
  subtitle: { textAlign: "center", color: "#5b6472", marginBottom: "22px", fontSize: 18 },
  authHeading: { textAlign: "left", fontSize: 24, margin: "0 0 10px", color: "#111827" },
  authForm: { display: "grid", gap: 14 },
  label: { display: "block", marginBottom: "6px", fontWeight: 600, fontSize: 16, color: "#1f2937" },
  input: { width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #dfe7f1", boxSizing: "border-box", background: "#fafbfd", color: "#24334a", fontSize: 14, fontFamily: "inherit" },
  button: { background: "linear-gradient(180deg, #5f52d8 0%, #4f46e5 100%)", color: "white", border: "none", borderRadius: "10px", padding: "13px 18px", fontWeight: 700, cursor: "pointer", marginTop: 8, boxShadow: "0 8px 18px rgba(79, 70, 229, 0.2)" },
  shell: { display: "flex", minHeight: "100vh", background: "#f3f5f8", color: "#1e2430", fontFamily: "Inter, 'Segoe UI', sans-serif" },
  sidebar: { width: 188, flex: "0 0 188px", background: "#1d2f44", color: "#edf3ff", padding: "18px 10px 16px", display: "flex", flexDirection: "column", boxSizing: "border-box" },
  brand: { fontSize: 14, lineHeight: 1.2, letterSpacing: "-0.03em", fontWeight: 700, marginBottom: 18, padding: "0 6px 16px" },
  brandSmall: { display: "block", fontSize: 14, opacity: 1 },
  navButton: { width: "100%", padding: "10px 9px", marginBottom: "4px", border: "none", borderRadius: 10, background: "transparent", color: "#d9e3f2", textAlign: "left", cursor: "pointer", fontSize: 13, fontWeight: 500 },
  navButtonActive: { background: "#eff4ff", color: "#1f2c47", fontWeight: 600 },
  logoutButton: { width: "100%", padding: "11px 12px", border: "none", borderRadius: 10, background: "#243b53", color: "#edf2ff", cursor: "pointer", fontSize: 15, marginTop: "auto" },
  mainPanel: { flex: 1, minWidth: 0, padding: "26px 26px 28px", boxSizing: "border-box" },
  pageTitle: { margin: "0 0 20px 0", fontSize: 26, letterSpacing: "-0.04em", color: "#202a3a", fontWeight: 800 },
  uploadButton: { display: "inline-block", background: "#eef2ff", color: "#4338ca", borderRadius: 8, padding: "12px 16px", cursor: "pointer", marginTop: 8, width: "fit-content" }
  ,reviewButton: { background: "#dcfce7", color: "#166534", border: "1px solid #86efac", borderRadius: 6, padding: "7px 12px", cursor: "pointer" }
  ,rejectButton: { background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5", borderRadius: 6, padding: "7px 12px", cursor: "pointer" }
  ,userRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: "14px 0", borderBottom: "1px solid #e5e7eb" }
  ,roleSelect: { minWidth: 160, padding: "9px 10px", border: "1px solid #d1d5db", borderRadius: 7, background: "white" }
  ,teamPageGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 14 }
  ,teamCount: { color: "#68788d", fontSize: 13 }
  ,error: { background: "#fff0f0", color: "#b62d2d", border: "1px solid #efc7c7", borderRadius: 10, padding: "10px 12px", marginBottom: 14 }
};

export default App;