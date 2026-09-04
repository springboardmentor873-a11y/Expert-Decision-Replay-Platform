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
    <div style={styles.pageShell}>
      <div style={styles.card}>
        <h1 style={styles.title}>Expert Decision</h1>
        <p style={styles.subtitle}>Replay Platform</p>
        <h2>Login</h2>

        <form onSubmit={handleLogin}>
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
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${authBackendUrl}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role_id: 1, team_id: 1 }),
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
    <div style={styles.pageShell}>
      <div style={styles.card}>
        <h1 style={styles.title}>Expert Decision</h1>
        <p style={styles.subtitle}>Replay Platform</p>
        <h2>Create Account</h2>

        <form onSubmit={handleRegister}>
          <label style={styles.label}>Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" required style={styles.input} />

          <label style={styles.label}>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" required style={styles.input} />

          <label style={styles.label}>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required style={styles.input} />

          <button type="submit" disabled={loading} style={styles.button}>{loading ? "Creating account..." : "Register"}</button>
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
        <div style={styles.card}>
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
      <div style={{ display: "grid", gridTemplateColumns: "0.8fr 1.2fr", gap: 20 }}>
        <div style={styles.card}>
          <h3>Decision thread</h3>
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

        <form onSubmit={handleSubmit} style={styles.card}>
          <h3>New comment</h3>
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
  return (
    <ShellLayout title="Document management" navigate={navigate}>
      <div style={styles.card}>
        <h3>Uploaded files</h3>
        <ul style={{ paddingLeft: 18 }}>
          <li>candidate_filtering_policy.pdf</li>
          <li>ethics_checklist.docx</li>
          <li>vendor_matrix.xlsx</li>
          <li>security_review.pdf</li>
        </ul>
        <label style={styles.uploadButton}><input type="file" multiple style={{ display: "none" }} />Upload documents</label>
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
          <li>Team ID: {profile?.team_id || "-"}</li>
        </ul>
      </div>
    </ShellLayout>
  );
}

function ShellLayout({ title, navigate, children }) {
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("auth-changed"));
    navigate("/login", { replace: true });
  };

  return (
    <div style={styles.shell}>
      <aside style={styles.sidebar}>
        <div style={styles.brand}>Expert Decision<span style={styles.brandSmall}>Replay Platform</span></div>
        <button style={styles.navButton} onClick={() => navigate("/dashboard")}>🏠 Dashboard</button>
        <button style={styles.navButton} onClick={() => navigate("/decisions")}>📋 Decisions</button>
        <button style={styles.navButton} onClick={() => navigate("/decisions/create")}>➕ Create Decision</button>
        <button style={styles.navButton} onClick={() => navigate("/discussions")}>💬 Discussions</button>
        <button style={styles.navButton} onClick={() => navigate("/files")}>📁 Files</button>
        <button style={styles.navButton} onClick={() => navigate("/versions")}>🔄 Versions</button>
        <button style={styles.navButton} onClick={() => navigate("/profile")}>👤 Profile</button>
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
  pageShell: { minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#f5f7fb", fontFamily: "Arial, sans-serif" },
  card: { background: "#fff", padding: "28px", borderRadius: "15px", boxShadow: "0 8px 30px rgba(0,0,0,0.08)", display: "grid", gap: 12 },
  title: { textAlign: "center", marginBottom: "8px" },
  subtitle: { textAlign: "center", color: "#6b7280", marginBottom: "28px" },
  label: { display: "block", marginBottom: "8px", fontWeight: 600 },
  input: { width: "100%", padding: "12px 14px", borderRadius: "8px", border: "1px solid #d1d5db", boxSizing: "border-box" },
  button: { background: "#4f46e5", color: "white", border: "none", borderRadius: "8px", padding: "12px 18px", fontWeight: 600, cursor: "pointer" },
  shell: { display: "flex", minHeight: "100vh", background: "#f5f7fb" },
  sidebar: { width: 250, background: "#111827", color: "white", padding: "24px 16px", display: "flex", flexDirection: "column", boxSizing: "border-box" },
  brand: { fontSize: 22, fontWeight: 700, marginBottom: 28, padding: "0 10px" },
  brandSmall: { display: "block", fontSize: 13, opacity: 0.7 },
  navButton: { width: "100%", padding: "12px 14px", marginBottom: "8px", border: "none", borderRadius: 8, background: "transparent", color: "#d1d5db", textAlign: "left", cursor: "pointer" },
  logoutButton: { width: "100%", padding: "12px 14px", border: "none", borderRadius: 8, background: "#374151", color: "white", cursor: "pointer" },
  mainPanel: { flex: 1, padding: "26px 30px", boxSizing: "border-box" },
  pageTitle: { margin: "0 0 20px 0", fontSize: 32 },
  uploadButton: { display: "inline-block", background: "#eef2ff", color: "#4338ca", borderRadius: 8, padding: "12px 16px", cursor: "pointer", marginTop: 8, width: "fit-content" }
};

export default App;