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
    <div style={styles.authLayout}>
      <div style={styles.authHeroPanel}>
        <div style={styles.networkBackground} />
        <div style={styles.brandRow}>
          <div style={styles.brandMark}>ED</div>
          <div>
            <div style={styles.brandName}>Expert Decision</div>
            <div style={styles.brandSubName}>Replay Platform</div>
          </div>
        </div>

        <div style={styles.heroContent}>
          <div style={styles.heroBadge}>Decision intelligence</div>
          <h1 style={styles.heroTitle}>Replay the reasoning behind every critical choice.</h1>
          <p style={styles.heroQuote}>
            “The best decisions are not just made once — they are reviewed, learned from, and replayed with clarity.”
          </p>

          <div style={styles.heroStats}>
            <div style={styles.statBox}>
              <span style={styles.statValue}>98%</span>
              <span style={styles.statLabel}>Traceable decisions</span>
            </div>
            <div style={styles.statBox}>
              <span style={styles.statValue}>24/7</span>
              <span style={styles.statLabel}>Team visibility</span>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.authFormPanel}>
        <div style={styles.authCard}>
          <div style={styles.authHeader}>
            <span style={styles.authEyebrow}>Welcome back</span>
            <h2 style={styles.authHeading}>Sign in</h2>
          </div>

          <form onSubmit={handleLogin} style={styles.authForm}>
            <label style={styles.label}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" required style={styles.input} />

            <label style={styles.label}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required style={styles.input} />

            <div style={styles.helperRow}>
              <span style={styles.helperText}>Secure decision workspace</span>
              <button type="button" style={styles.linkButton}>Forgot password?</button>
            </div>

            <button type="submit" disabled={loading} style={styles.button}>{loading ? "Logging in..." : "Login"}</button>
          </form>

          <div style={styles.authFooter}>
            <p style={{ margin: 0, color: "#64748b" }}>Don&apos;t have an account?</p>
            <button onClick={() => navigate("/register")} style={styles.linkButton}>Create account</button>
          </div>
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
    <div style={styles.authLayout}>
      <div style={styles.authHeroPanel}>
        <div style={styles.networkBackground} />
        <div style={styles.brandRow}>
          <div style={styles.brandMark}>ED</div>
          <div>
            <div style={styles.brandName}>Expert Decision</div>
            <div style={styles.brandSubName}>Replay Platform</div>
          </div>
        </div>

        <div style={styles.heroContent}>
          <div style={styles.heroBadge}>Decision replay</div>
          <h1 style={styles.heroTitle}>Create a clearer record of every expert judgment.</h1>
          <p style={styles.heroQuote}>
            “When the path to a decision matters as much as the result, replaying context becomes a strategic advantage.”
          </p>

          <div style={styles.heroStats}>
            <div style={styles.statBox}>
              <span style={styles.statValue}>14k+</span>
              <span style={styles.statLabel}>Decision traces</span>
            </div>
            <div style={styles.statBox}>
              <span style={styles.statValue}>4x</span>
              <span style={styles.statLabel}>Faster review cycles</span>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.authFormPanel}>
        <div style={styles.authCard}>
          <div style={styles.authHeader}>
            <span style={styles.authEyebrow}>New account</span>
            <h2 style={styles.authHeading}>Register</h2>
          </div>

          <form onSubmit={handleRegister} style={styles.authForm}>
            <label style={styles.label}>Full name</label>
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

          <div style={styles.authFooter}>
            <p style={{ margin: 0, color: "#64748b" }}>Already have an account?</p>
            <button onClick={() => navigate("/login")} style={styles.linkButton}>Login here</button>
          </div>
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

function KnowledgeRepositoryPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [tag, setTag] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [newTag, setNewTag] = useState("");
  const [tagDrafts, setTagDrafts] = useState({});
  const [loading, setLoading] = useState(true);

  const loadRepository = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/knowledge/repository?search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}&tag=${encodeURIComponent(tag)}`);
      setItems(response.data || []);
    } catch (error) {
      alert(error.message || "Unable to load the knowledge repository.");
    } finally {
      setLoading(false);
    }
  };

  const loadFilters = async () => {
    try {
      const [categoryResponse, tagResponse] = await Promise.all([api.get("/knowledge/categories"), api.get("/knowledge/tags")]);
      setCategories(categoryResponse.data || []);
      setTags(tagResponse.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadFilters();
    loadRepository();
  }, []);

  const toggleDecision = async (decision) => {
    if (expandedId === decision.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(decision.id);
    try {
      const response = await api.get(`/decisions/${decision.id}/files`);
      setDocuments(response.data || []);
    } catch {
      setDocuments([]);
    }
  };

  const createTag = async (event) => {
    event.preventDefault();
    if (!newTag.trim()) return;
    try {
      await api.post("/knowledge/tags", { name: newTag.trim() });
      setNewTag("");
      await loadFilters();
    } catch (error) {
      alert(error.message || "Unable to create tag.");
    }
  };

  const saveTags = async (decision) => {
    try {
      const names = (tagDrafts[decision.id] ?? decision.tags ?? []).join(",").split(",").map((value) => value.trim()).filter(Boolean);
      await api.put(`/decisions/${decision.id}/tags`, { tags: names });
      await loadRepository();
      await loadFilters();
    } catch (error) {
      alert(error.message || "Unable to update tags.");
    }
  };

  const archiveDocument = async (fileId) => {
    try {
      await api.put(`/knowledge/documents/${fileId}/archive`, {});
      setDocuments((current) => current.map((file) => file.id === fileId ? { ...file, archived: true } : file));
      await loadRepository();
    } catch (error) {
      alert(error.message || "Unable to archive document.");
    }
  };
  const viewDocument = async (document) => {
    try {
      await api.openDocument(`/knowledge/documents/${document.id}/view`);
    } catch (error) {
      setRepositoryError(error.message || "Unable to open this document.");
    }
  };

  return (
    <ShellLayout title="Knowledge Repository" navigate={navigate}>
      <div style={styles.repositoryToolbar}>
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search decisions, rationale, or objectives" style={{ ...styles.input, flex: 2 }} />
        <select value={category} onChange={(event) => setCategory(event.target.value)} style={styles.input}>
          <option value="">All categories</option>
          {categories.map((value) => <option key={value}>{value}</option>)}
        </select>
        <select value={tag} onChange={(event) => setTag(event.target.value)} style={styles.input}>
          <option value="">All tags</option>
          {tags.map((value) => <option key={value.id}>{value.name}</option>)}
        </select>
        <button type="button" style={styles.button} onClick={loadRepository}>Search</button>
      </div>

      <div style={styles.repositoryLayout}>
        <section style={styles.card}>
          <div style={styles.repositoryHeader}>
            <div><h3>Decision library</h3><p style={styles.mutedText}>{items.length} matching decisions</p></div>
            <button type="button" style={styles.secondaryButton} onClick={() => { setSearch(""); setCategory(""); setTag(""); loadRepository(); }}>Clear filters</button>
          </div>
          {loading ? <p>Loading repository...</p> : items.length === 0 ? <p>No knowledge entries match these filters.</p> : (
            <div style={styles.repositoryList}>
              {items.map((decision) => (
                <article key={decision.id} style={styles.repositoryItem}>
                  <button type="button" style={styles.repositoryItemButton} onClick={() => toggleDecision(decision)}>
                    <span><strong>{decision.title}</strong><small>{decision.category || "General"} · {decision.status}</small></span>
                    <span style={styles.repositoryMeta}>{decision.document_count} docs {expandedId === decision.id ? "−" : "+"}</span>
                  </button>
                  <div style={styles.tagRow}>{(decision.tags || []).map((value) => <span key={value} style={styles.tagBadge}>{value}</span>)}</div>
                  {expandedId === decision.id && (
                    <div style={styles.repositoryDetail}>
                      <p>{decision.problem_statement}</p>
                      <label style={styles.label}>Tags (comma separated)</label>
                      <div style={styles.inlineForm}>
                        <input style={styles.input} value={(tagDrafts[decision.id] || decision.tags || []).join(", ")} onChange={(event) => setTagDrafts({ ...tagDrafts, [decision.id]: event.target.value.split(",") })} />
                        <button type="button" style={styles.secondaryButton} onClick={() => saveTags(decision)}>Save tags</button>
                      </div>
                      <h4>Timeline</h4>
                      <div style={styles.timeline}>{(decision.timeline || []).map((event, index) => <div key={`${event.type}-${index}`} style={styles.timelineRow}><span style={styles.timelineDot} /><span><strong>{event.label}</strong><small>{new Date(event.date).toLocaleString()}</small></span></div>)}</div>
                      <h4>Documents</h4>
                      {documents.length === 0 ? <p style={styles.mutedText}>No documents attached.</p> : documents.map((file) => <div key={file.id} style={styles.documentRow}><span>{file.original_name}{file.archived ? " · Archived" : ""}</span>{!file.archived && <button type="button" style={styles.textButton} onClick={() => archiveDocument(file.id)}>Archive</button>}</div>)}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        <aside style={styles.card}>
          <h3>Tag management</h3>
          <p style={styles.mutedText}>Create reusable labels for decision knowledge.</p>
          <form onSubmit={createTag} style={styles.inlineForm}>
            <input value={newTag} onChange={(event) => setNewTag(event.target.value)} placeholder="New tag" style={styles.input} />
            <button type="submit" style={styles.button}>Add</button>
          </form>
          <div style={styles.tagCloud}>{tags.map((value) => <span key={value.id} style={styles.tagBadge}>{value.name} <small>{value.usage_count}</small></span>)}</div>
        </aside>
      </div>
    </ShellLayout>
  );
}

function KnowledgeRepositoryWorkspace() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [previewDocument, setPreviewDocument] = useState(null);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [tag, setTag] = useState("");
  const [tab, setTab] = useState("Documents");
  const [sort, setSort] = useState("latest");
  const [selectedDecision, setSelectedDecision] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [repositoryError, setRepositoryError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [selectedGraphNode, setSelectedGraphNode] = useState(null);

  const loadRepository = async (filters = {}) => {
    const activeSearch = filters.search ?? search;
    const activeCategory = filters.category ?? category;
    const activeTag = filters.tag ?? tag;
    try {
      setRepositoryError("");
      const response = await api.get(`/knowledge/repository?search=${encodeURIComponent(activeSearch)}&category=${encodeURIComponent(activeCategory)}&tag=${encodeURIComponent(activeTag)}`);
      setItems(response.data || []);
    } catch (error) {
      setRepositoryError(error.message || "Unable to load the knowledge repository.");
    }
  };

  useEffect(() => {
    Promise.all([api.get("/knowledge/categories"), api.get("/knowledge/tags"), api.get("/decisions")]).then(([categoryResponse, tagResponse, decisionResponse]) => {
      setCategories(categoryResponse.data || []);
      setTags(tagResponse.data || []);
      const availableDecisions = decisionResponse.data || [];
      setDecisions(availableDecisions);
      if (availableDecisions[0]) setSelectedDecision(String(availableDecisions[0].id));
    }).catch((error) => setRepositoryError(error.message || "Unable to load repository filters."));
    loadRepository();
  }, []);

  const documents = items.flatMap((decision) => (decision.documents || []).map((document) => ({ ...document, decision }))).sort((left, right) => sort === "latest" ? new Date(right.created_at) - new Date(left.created_at) : left.name.localeCompare(right.name));
  const topics = [...new Set(items.flatMap((item) => [item.category, ...(item.tags || [])]).filter(Boolean))];
  const teamCount = new Set(items.map((item) => item.team_name).filter(Boolean)).size;
  const uploadDocument = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !selectedDecision) {
      setUploadMessage("Select a decision before uploading a document.");
      return;
    }
    setUploading(true);
    setUploadMessage("");
    try {
      const body = new FormData();
      body.append("file", file);
      await api.upload(`/decisions/${selectedDecision}/files`, body);
      setSearch("");
      setCategory("");
      setTag("");
      setTab("Documents");
      await loadRepository({ search: "", category: "", tag: "" });
      setUploadMessage(`${file.name} uploaded successfully.`);
      event.target.value = "";
    } catch (error) {
      alert(error.message || "Unable to upload document.");
    } finally {
      setUploading(false);
    }
  };
  const viewDocument = (document) => {
    setRepositoryError("");
    setPreviewDocument(document);
  };
  const archiveDocument = async (fileId) => {
    try {
      await api.put(`/knowledge/documents/${fileId}/archive`, {});
      await loadRepository();
    } catch (error) {
      alert(error.message || "Unable to archive document.");
    }
  };
  const activeDocuments = documents.filter((document) => !document.archived);
  const visibleDocuments = tab === "Documents" ? activeDocuments : tab === "Past Decisions" ? documents.filter((document) => document.decision.status === "Approved" || document.decision.status === "Archived") : documents;
  const graphDecision = items.find((item) => String(item.id) === String(selectedDecision)) || items[0] || decisions.find((item) => String(item.id) === String(selectedDecision)) || decisions[0];

  return (
    <ShellLayout title="Knowledge Repository" navigate={navigate}>
      <div style={styles.knowledgePage}>
        <div style={styles.knowledgeHero}>
          <div><div style={styles.knowledgeTitleRow}><span style={styles.bookIcon}>▮▮</span><div><h1 style={styles.knowledgeHeading}>Knowledge Repository</h1><p style={styles.knowledgeSubtitle}>A centralized repository of documents, past decisions, discussions and insights to support better decision-making.</p></div></div></div>
          <div style={styles.uploadControls}><select value={selectedDecision} onChange={(event) => setSelectedDecision(event.target.value)} style={styles.uploadDecisionSelect} disabled={decisions.length === 0}><option value="">Upload to decision...</option>{decisions.map((decision) => <option key={decision.id} value={decision.id}>{decision.title}</option>)}</select><label style={{ ...styles.uploadDocumentButton, opacity: selectedDecision && !uploading ? 1 : 0.55 }}>＋ {uploading ? "Uploading..." : "Upload Document"}<input type="file" onChange={uploadDocument} disabled={uploading || !selectedDecision} style={{ display: "none" }} /></label></div>
        </div>
        {uploadMessage && <div style={styles.uploadMessage}>{uploadMessage}</div>}
        {repositoryError && <div style={styles.repositoryError}>{repositoryError} <button type="button" style={styles.inlineRetry} onClick={() => loadRepository()}>Retry</button></div>}
        <div style={styles.knowledgeTabs}>{["All", "Documents", "Past Decisions", "Topics", "People", "Insights"].map((value) => <button type="button" key={value} onClick={() => setTab(value)} style={tab === value ? styles.knowledgeTabActive : styles.knowledgeTab}>{value}</button>)}</div>
        <div className="knowledge-stats" style={styles.knowledgeStats}><KnowledgeStat icon="▤" value={documents.length} label="Total Documents" tone="blue" /><KnowledgeStat icon="✓" value={items.length} label="Decision Documents" tone="green" /><KnowledgeStat icon="♟" value={teamCount || "-"} label="Teams Contributed" tone="blue" /><KnowledgeStat icon="◷" value={documents.filter((document) => Date.now() - new Date(document.created_at).getTime() < 2592000000).length} label="Recently Added" tone="purple" /></div>
        <div className="knowledge-main-grid" style={styles.knowledgeMainGrid}>
          <section style={styles.knowledgeDocumentsPanel}>
            <div style={styles.knowledgePanelHeader}><div><h2>Documents</h2><p>Browse and search all documents in the knowledge repository.</p></div><select value={sort} onChange={(event) => setSort(event.target.value)} style={styles.knowledgeSort}><option value="latest">Sort by: Latest</option><option value="name">Sort by: Name</option></select></div>
            <div style={styles.knowledgeFilters}><input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === "Enter" && loadRepository()} placeholder="⌕  Search documents..." style={styles.knowledgeSearch} /><select value={category} onChange={(event) => { setCategory(event.target.value); loadRepository({ category: event.target.value }); }} style={styles.knowledgeFilter}><option value="">All Teams</option>{categories.map((value) => <option key={value}>{value}</option>)}</select><select value={tag} onChange={(event) => { setTag(event.target.value); loadRepository({ tag: event.target.value }); }} style={styles.knowledgeFilter}><option value="">All Tags</option>{tags.map((value) => <option key={value.id}>{value.name}</option>)}</select><button type="button" style={styles.knowledgeSearchButton} onClick={() => loadRepository()}>Search</button></div>
            <div style={styles.documentRows}>{visibleDocuments.length === 0 ? items.length > 0 ? <div style={styles.decisionRecordList}><div style={styles.emptyKnowledge}><strong>No uploaded documents yet.</strong><span>These decisions are ready for supporting documents.</span></div>{items.slice(0, 8).map((decision) => <div key={`decision-${decision.id}`} style={styles.decisionRecord}><span style={styles.decisionRecordIcon}>▤</span><span style={styles.documentName}><strong>{decision.title}</strong><small>{decision.category || "General"} · {decision.status}</small></span><button type="button" style={styles.viewDocumentButton} onClick={() => setSelectedDecision(String(decision.id))}>Select</button></div>)}</div> : <div style={styles.emptyKnowledge}><strong>No decisions or documents yet.</strong><span>Create a decision first, then upload its supporting document.</span><button type="button" style={styles.createDecisionButton} onClick={() => navigate("/decisions/create")}>＋ Create Decision</button></div> : visibleDocuments.slice(0, 8).map((document) => <div key={document.id} style={styles.documentLibraryRow}><span style={{ ...styles.documentTypeIcon, background: document.content_type?.includes("pdf") ? "#ffe8e7" : "#e8efff", color: document.content_type?.includes("pdf") ? "#bd302a" : "#2d60ce" }}>{document.content_type?.includes("pdf") ? "PDF" : "DOC"}</span><span style={styles.documentName}><strong>{document.name}</strong><small>From {document.decision.title} · {new Date(document.created_at).toLocaleDateString()}</small></span><span style={styles.documentTags}>{(document.decision.tags || []).slice(0, 3).map((value) => <span key={value} style={styles.knowledgeChip}>{value}</span>)}</span><button type="button" style={styles.viewDocumentButton} onClick={() => viewDocument(document)}>View</button><button type="button" style={styles.documentMenu} onClick={() => archiveDocument(document.id)} title="Archive document">⋮</button></div>)}</div>
            <div style={styles.documentFooter}>Showing 1-{Math.min(visibleDocuments.length, 8)} of {visibleDocuments.length} documents <span>‹　<strong>1</strong>　2　3　4　5　›</span></div>
          </section>
          <aside style={styles.knowledgeAside}><KnowledgeGraph decision={graphDecision} selectedNode={selectedGraphNode} onSelectNode={setSelectedGraphNode} onReset={() => setSelectedGraphNode(null)} onDecisionChange={(decisionId) => { setSelectedDecision(String(decisionId)); setSelectedGraphNode(null); }} decisions={items.length ? items : decisions} /><section style={styles.insightsPanel}><h2>Related Insights</h2>{["Similar Decision Found", "Common Factors", "Recommended Reading"].map((value, index) => <div key={value} style={styles.insightRow}><span style={styles.insightIcon}>{index === 0 ? "!" : index === 1 ? "▥" : "▤"}</span><span><strong>{value}</strong><small>{index === 0 ? "3 previous decisions on this topic" : index === 1 ? "Performance and scalability were key factors" : "Review related repository documents"}</small></span></div>)}</section></aside>
        </div>
        <div className="knowledge-bottom-grid" style={styles.knowledgeBottomGrid}><section style={styles.bottomKnowledgePanel}><div style={styles.knowledgePanelHeader}><h2>Popular Topics</h2><button type="button" style={styles.textButton}>View all →</button></div><div style={styles.topicCloud}>{topics.length ? topics.map((topic) => <button type="button" key={topic} style={styles.knowledgeChip}>{topic}</button>) : <span style={styles.mutedText}>Topics appear as decisions are categorized.</span>}</div></section><section style={styles.bottomKnowledgePanel}><div style={styles.knowledgePanelHeader}><h2>Recent Activity</h2><button type="button" style={styles.textButton}>View all →</button></div>{documents.slice(0, 2).map((document) => <div key={`activity-${document.id}`} style={styles.insightRow}><span style={styles.insightIcon}>↥</span><span><strong>{document.name}</strong><small>Added to {document.decision.title}</small></span></div>)}</section></div>
      </div>
      {previewDocument && <DocumentPreview document={previewDocument} onClose={() => setPreviewDocument(null)} />}
    </ShellLayout>
  );
}

function DocumentPreview({ document, onClose }) {
  const [preview, setPreview] = useState({ loading: true, kind: "", url: "", text: "", html: "", slides: [], error: "" });

  useEffect(() => {
    let cancelled = false;
    let objectUrl = "";
    const loadPreview = async () => {
      try {
        const response = await api.getDocumentBlob(`/knowledge/documents/${document.id}/view`);
        objectUrl = URL.createObjectURL(response.blob);
        const extension = document.name.split(".").pop()?.toLowerCase();
        let nextPreview;
        if (extension === "docx") {
          const { default: mammoth } = await import("mammoth/mammoth.browser");
          const result = await mammoth.convertToHtml({ arrayBuffer: await response.blob.arrayBuffer() });
          nextPreview = { loading: false, kind: "docx", url: objectUrl, text: "", html: sanitizePreviewHtml(result.value), slides: [], error: "" };
        } else if (extension === "pptx") {
          const { default: JSZip } = await import("jszip");
          const archive = await JSZip.loadAsync(await response.blob.arrayBuffer());
          const slideNames = Object.keys(archive.files)
            .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
            .sort((left, right) => Number(left.match(/slide(\d+)/)?.[1]) - Number(right.match(/slide(\d+)/)?.[1]));
          const slides = await Promise.all(slideNames.map(async (name) => {
            const xml = new DOMParser().parseFromString(await archive.files[name].async("text"), "application/xml");
            return Array.from(xml.getElementsByTagNameNS("http://schemas.openxmlformats.org/drawingml/2006/main", "t"))
              .map((node) => node.textContent)
              .filter(Boolean)
              .join(" ");
          }));
          nextPreview = { loading: false, kind: "pptx", url: objectUrl, text: "", html: "", slides, error: "" };
        } else if (response.contentType.startsWith("image/")) {
          nextPreview = { loading: false, kind: "image", url: objectUrl, text: "", html: "", slides: [], error: "" };
        } else if (response.contentType === "application/pdf" || extension === "pdf") {
          nextPreview = { loading: false, kind: "pdf", url: objectUrl, text: "", html: "", slides: [], error: "" };
        } else if (response.contentType.startsWith("text/") || ["txt", "csv", "md", "json", "xml"].includes(extension)) {
          nextPreview = { loading: false, kind: "text", url: objectUrl, text: await response.blob.text(), html: "", slides: [], error: "" };
        } else {
          nextPreview = { loading: false, kind: "download", url: objectUrl, text: "", html: "", slides: [], error: "Preview is not available for this format. Download the file to open it in its associated application." };
        }
        if (cancelled) URL.revokeObjectURL(objectUrl);
        else setPreview(nextPreview);
      } catch (error) {
        if (!cancelled) setPreview({ loading: false, kind: "", url: "", text: "", html: "", slides: [], error: error.message || "Unable to open this document." });
      }
    };
    loadPreview();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [document]);

  return (
    <div style={styles.previewOverlay} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section style={styles.previewDialog} role="dialog" aria-modal="true" aria-label={`Preview ${document.name}`}>
        <header style={styles.previewHeader}>
          <div><strong>{document.name}</strong><small>From {document.decision.title}</small></div>
          <div style={styles.previewActions}>
            {preview.url && <a href={preview.url} download={document.name} style={styles.previewDownload}>Download</a>}
            <button type="button" onClick={onClose} style={styles.previewClose} aria-label="Close preview">×</button>
          </div>
        </header>
        <div style={styles.previewBody}>
          {preview.loading && <div style={styles.previewState}>Loading document…</div>}
          {preview.error && <div style={styles.previewState}>{preview.error}{preview.url && <a href={preview.url} download={document.name} style={styles.previewDownload}>Download {document.name}</a>}</div>}
          {!preview.loading && preview.kind === "pdf" && <iframe title={document.name} src={preview.url} style={styles.previewFrame} />}
          {!preview.loading && preview.kind === "image" && <img src={preview.url} alt={document.name} style={styles.previewImage} />}
          {!preview.loading && preview.kind === "text" && <pre style={styles.previewText}>{preview.text}</pre>}
          {!preview.loading && preview.kind === "docx" && <article style={styles.previewDocx} dangerouslySetInnerHTML={{ __html: preview.html }} />}
          {!preview.loading && preview.kind === "pptx" && <div style={styles.previewSlides}>{preview.slides.map((text, index) => <article key={index} style={styles.previewSlide}><strong>Slide {index + 1}</strong><p>{text || "(No text content on this slide)"}</p></article>)}</div>}
        </div>
      </section>
    </div>
  );
}

function sanitizePreviewHtml(html) {
  const parsed = new DOMParser().parseFromString(html, "text/html");
  parsed.querySelectorAll("script, iframe, object, embed, form, input, button, video, audio").forEach((element) => element.remove());
  parsed.body.querySelectorAll("*").forEach((element) => {
    Array.from(element.attributes).forEach((attribute) => {
      const safeLink = element.tagName === "A" && attribute.name === "href" && /^(https?:|mailto:)/i.test(attribute.value);
      if (!safeLink) element.removeAttribute(attribute.name);
    });
  });
  return parsed.body.innerHTML;
}

function KnowledgeStat({ icon, value, label, tone }) {
  return <div style={styles.knowledgeStat}><span style={{ ...styles.knowledgeStatIcon, background: tone === "green" ? "#e3f6eb" : tone === "purple" ? "#f0e7ff" : "#e7f0ff", color: tone === "green" ? "#26945a" : tone === "purple" ? "#7444cb" : "#3679df" }}>{icon}</span><span><strong>{value}</strong><small>{label}</small></span></div>;
}

function KnowledgeGraph({ decision, decisions, selectedNode, onSelectNode, onReset, onDecisionChange }) {
  const tags = decision?.tags || [];
  const document = decision?.documents?.[0];
  const nodes = [
    { id: "team", type: "TEAM", label: decision?.team_name || "Decision Team", detail: "Department", x: 170, y: 62, color: "#913fee" },
    { id: "person", type: "USER", label: "Decision owner", detail: "People", x: 320, y: 118, color: "#07956d" },
    { id: "document", type: "DOC", label: document?.name || "Supporting document", detail: document ? "Document" : "No document yet", x: 360, y: 255, color: "#1299b8" },
    { id: "topic", type: "TOPIC", label: tags[0] || decision?.category || "Topic", detail: "Topic", x: 80, y: 255, color: "#ef9514" },
    { id: "status", type: "STATE", label: decision?.status || "Draft", detail: "Decision state", x: 220, y: 330, color: "#e88a0a" },
  ];
  const selected = nodes.find((node) => node.id === selectedNode);
  return (
    <section style={styles.graphPanel}>
      <div style={styles.graphHeader}><div><h2>✧ Interactive Knowledge Graph</h2><p>{decision?.title || "Select a decision to explore its knowledge graph."}</p></div><button type="button" style={styles.graphResetButton} onClick={onReset} title="Reset graph">↶</button></div>
      <label style={styles.graphSelectLabel}>Focal Decision Node:</label>
      <select value={decision?.id || ""} onChange={(event) => onDecisionChange(event.target.value)} style={styles.graphSelect} disabled={!decisions.length}>
        {!decisions.length && <option value="">No decisions available</option>}
        {decisions.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
      </select>
      <div style={styles.graphCanvas}>
        <svg viewBox="0 0 440 380" role="img" aria-label="Interactive decision knowledge graph" style={styles.graphSvg}>
          <circle cx="220" cy="190" r="128" fill="none" stroke="#e4eaf5" strokeDasharray="4 5" />
          {nodes.map((node) => <g key={`line-${node.id}`}><line x1="220" y1="190" x2={node.x} y2={node.y} stroke="#cbd8ed" strokeWidth="2" /><rect x={(220 + node.x) / 2 - 33} y={(190 + node.y) / 2 - 9} width="66" height="18" rx="7" fill="white" stroke="#e5ebf4" /><text x={(220 + node.x) / 2} y={(190 + node.y) / 2 + 3} textAnchor="middle" fontSize="8" fill="#7c8ba0">{node.id === "team" ? "created by" : node.id === "person" ? "discussed by" : node.id === "document" ? "supported by" : node.id === "topic" ? "related to" : "resulted in"}</text></g>)}
          <GraphSvgNode node={{ id: "decision", type: "ADR", label: decision?.title || "Decision", detail: "Focal decision", x: 220, y: 190, color: "#286ce4", center: true }} selected={selectedNode === "decision"} onClick={() => onSelectNode("decision")} />
          {nodes.map((node) => <GraphSvgNode key={node.id} node={node} selected={selectedNode === node.id} onClick={() => onSelectNode(node.id)} />)}
        </svg>
      </div>
      <div style={styles.graphLegend}>{[["#286ce4", "Decision"], ["#913fee", "Team"], ["#07956d", "People"], ["#1299b8", "Docs"], ["#ef9514", "Topic"]].map(([color, label]) => <span key={label}><i style={{ ...styles.graphLegendDot, background: color }} />{label}</span>)}</div>
      {selected && <div style={styles.graphSelection}><strong>{selected.label}</strong><span>{selected.detail}</span></div>}
    </section>
  );
}

function GraphSvgNode({ node, selected, onClick }) {
  const radius = node.center ? 34 : 25;
  return <g onClick={onClick} style={{ cursor: "pointer" }}><circle cx={node.x} cy={node.y} r={radius + 5} fill="none" stroke={node.color} strokeOpacity={selected ? 0.45 : 0.14} strokeWidth="3" /><circle cx={node.x} cy={node.y} r={radius} fill={node.color} stroke="white" strokeWidth="3" /><text x={node.x} y={node.y - 2} textAnchor="middle" fontSize={node.center ? "12" : "9"} fontWeight="800" fill="white">{node.type}</text><text x={node.x} y={node.y + radius + 15} textAnchor="middle" fontSize="10" fontWeight="700" fill="#30405b">{node.label.slice(0, 20)}</text><text x={node.x} y={node.y + radius + 27} textAnchor="middle" fontSize="8" fill="#8290a4">{node.detail}</text></g>;
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
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [profile, setProfile] = useState(null);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [view, setView] = useState("active");
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const loadTeams = async () => {
    try {
      const [profileResponse, teamsResponse] = await Promise.all([api.get("/me"), api.get("/teams")]);
      setProfile(profileResponse.data);
      setTeams(teamsResponse.data || []);
    } catch (requestError) {
      setError(requestError?.message || "Unable to load teams.");
    }
  };

  useEffect(() => { loadTeams(); }, []);

  const joinTeam = async (teamId) => {
    try {
      await api.post(`/teams/${teamId}/join`, {});
      await loadTeams();
    } catch (requestError) {
      setError(requestError?.message || "Unable to join team.");
    }
  };

  const createTeam = async (event) => {
    event.preventDefault();
    if (!name.trim()) return;
    try {
      await api.post("/teams", { name: name.trim(), description: description.trim() || null });
      setName("");
      setDescription("");
      setShowCreate(false);
      await loadTeams();
    } catch (requestError) {
      setError(requestError?.message || "Unable to create team.");
    }
  };

  const visibleTeams = teams
    .filter((team) => team.name.toLowerCase().includes(query.toLowerCase()) || (team.description || "").toLowerCase().includes(query.toLowerCase()))
    .filter((team) => view === "active" || team.is_archived)
    .sort((left, right) => sortBy === "members" ? right.member_count - left.member_count : left.name.localeCompare(right.name));

  const activity = teams.flatMap((team) => (team.recent_decisions || []).map((decision) => ({ ...decision, team: team.name }))).slice(0, 3);

  return (
    <ShellLayout title="Teams" navigate={navigate}>
      <div style={styles.teamsPage}>
        <div style={styles.teamsHero}>
          <div><h1 style={styles.teamsHeading}>My Teams</h1><p style={styles.teamsIntro}>Your teams are a part of Collaborate, contribute and make better decisions together.</p></div>
          <button type="button" style={styles.joinTeamButton} onClick={() => setShowCreate((current) => !current)}>＋ {profile?.permissions?.can_create_team ? "Create Team" : "Join a Team"}</button>
        </div>
        <div style={styles.teamsCallout}>👥 <span>Your teams give you access to team<br />decisions, discussions and shared knowledge.</span></div>
        {error && <div style={styles.error}>{error}</div>}
        <div style={styles.teamControls}>
          <div style={styles.teamTabs}><button type="button" style={view === "active" ? styles.teamTabActive : styles.teamTab} onClick={() => setView("active")}>Active Teams</button><button type="button" style={view === "archived" ? styles.teamTabActive : styles.teamTab} onClick={() => setView("archived")}>Archived Teams</button></div>
          <div style={styles.teamFilters}><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="⌕  Search teams..." style={styles.teamSearch} /><select value={sortBy} onChange={(event) => setSortBy(event.target.value)} style={styles.teamSort}><option value="name">Sort by: Name</option><option value="members">Sort by: Members</option></select></div>
        </div>
        {showCreate && <form onSubmit={createTeam} style={styles.createTeamBar}><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Team name" style={styles.input} required /><input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What does this team work on?" style={styles.input} /><button type="submit" style={styles.button}>Save team</button></form>}
        <div className="team-cards-grid" style={styles.teamCardsGrid}>
          {visibleTeams.map((team, index) => <TeamCard key={team.id} team={team} accent={index % 5} onJoin={joinTeam} onView={() => navigate(`/decisions?team=${team.id}`)} />)}
          {view === "active" && <button type="button" style={styles.joinCard} onClick={() => profile?.permissions?.can_create_team ? setShowCreate(true) : (visibleTeams[0] && joinTeam(visibleTeams[0].id))}><span style={styles.plusCircle}>＋</span><strong>{profile?.permissions?.can_create_team ? "Create a Team" : "Request to Join a Team"}</strong><small>{profile?.permissions?.can_create_team ? "Bring your collaborators together." : "You can join an existing team."}</small><span style={styles.browseButton}>Browse Teams</span></button>}
        </div>
        <div className="team-bottom-grid" style={styles.teamBottomGrid}><div style={styles.activityPanel}><div style={styles.bottomPanelHeader}><h3>My Team Activity</h3><button type="button" style={styles.textButton}>View all →</button></div>{activity.length === 0 ? <p style={styles.mutedText}>No team activity yet.</p> : activity.map((item) => <div key={`${item.team}-${item.id}`} style={styles.activityRow}><span style={styles.activityIcon}>●</span><span><strong>{item.title}</strong><small>{item.team} · {item.status}</small></span></div>)}</div><div style={styles.teamsQuote}><strong>“Great decisions are never made alone.”</strong><span>Collaborate with your team and turn ideas into impact.</span><span style={styles.quotePeople}>♟♟♟</span></div></div>
      </div>
    </ShellLayout>
  );
}

function TeamCard({ team, accent, onJoin, onView }) {
  const colors = [["#e8f1ff", "#1670e8"], ["#f0e9ff", "#7135d9"], ["#fff3df", "#cf8400"], ["#ffe8f0", "#d63062"], ["#e1f7ec", "#07945e"]];
  const [softColor, color] = colors[accent];
  return <article style={styles.teamCard}><div style={styles.teamCardTop}><div style={{ ...styles.teamAvatarLarge, background: softColor, color }}>♟</div><div style={styles.teamCardIdentity}><strong>{team.name}</strong><p>{team.description || "A collaborative decision-making team."}</p><span style={styles.activePill}>● Active</span></div><button type="button" style={styles.moreButton}>•••</button></div><div style={styles.teamMemberLine}><span>{team.member_count} members</span>{team.is_member && <span style={styles.memberLabel}>You are a member</span>}</div><div style={styles.recentDecisionHeader}>Recent Decisions</div><div style={styles.recentDecisions}>{(team.recent_decisions || []).slice(0, 2).map((decision) => <button type="button" key={decision.id} style={styles.recentDecision} onClick={onView}><span style={{ ...styles.fileIcon, color }}>▣</span><span>{decision.title}</span><small>{decision.status}</small><b>›</b></button>)}{(team.recent_decisions || []).length === 0 && <span style={styles.mutedText}>No decisions yet.</span>}</div><div style={styles.teamCardActions}>{team.is_member ? <button type="button" style={styles.viewTeamButton} onClick={onView}>View Team</button> : <button type="button" style={styles.viewTeamButton} onClick={() => onJoin(team.id)}>Join Team</button>}</div></article>;
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
        <button style={{ ...styles.navButton, ...(location.pathname === "/knowledge" ? styles.navButtonActive : {}) }} onClick={() => navigate("/knowledge")}>▦ Knowledge Repository</button>
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
      <Route path="/knowledge" element={token ? <KnowledgeRepositoryWorkspace /> : <Navigate to="/login" replace />} />
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
  authLayout: { minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr", background: "#050b13", color: "#e5eefb", overflow: "hidden", padding: 0 },
  authHeroPanel: { position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "48px 52px", background: "linear-gradient(135deg, #07162a 0%, #081a2d 42%, #081d36 100%)", borderRight: "1px solid rgba(148, 163, 184, 0.16)" },
  networkBackground: { position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 20% 25%, rgba(96,165,250,0.55) 0 3px, transparent 4px), radial-gradient(circle at 28% 34%, rgba(96,165,250,0.45) 0 3px, transparent 4px), radial-gradient(circle at 38% 26%, rgba(96,165,250,0.55) 0 3px, transparent 4px), radial-gradient(circle at 54% 34%, rgba(96,165,250,0.45) 0 3px, transparent 4px), radial-gradient(circle at 65% 24%, rgba(59,130,246,0.7) 0 5px, transparent 6px), radial-gradient(circle at 74% 44%, rgba(96,165,250,0.45) 0 3px, transparent 4px), radial-gradient(circle at 68% 60%, rgba(96,165,250,0.52) 0 3px, transparent 4px), radial-gradient(circle at 38% 58%, rgba(96,165,250,0.5) 0 3px, transparent 4px), linear-gradient(rgba(96,165,250,0.08), rgba(96,165,250,0.02)), linear-gradient(120deg, transparent 0%, rgba(59,130,246,0.09) 45%, transparent 100%)", backgroundSize: "100% 100%", opacity: 0.9, pointerEvents: "none" },
  brandRow: { position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 12 },
  brandMark: { width: 42, height: 42, display: "grid", placeItems: "center", borderRadius: 12, background: "linear-gradient(135deg, #5aa3ff, #4f46e5)", color: "#fff", fontWeight: 800, letterSpacing: "0.08em", boxShadow: "0 10px 18px rgba(79,70,229,0.35)" },
  brandName: { fontSize: 15, fontWeight: 700, color: "#edf6ff" },
  brandSubName: { fontSize: 12, color: "#a7b8d6" },
  heroContent: { position: "relative", zIndex: 1, display: "grid", gap: 18, maxWidth: 530, marginTop: 32 },
  heroBadge: { alignSelf: "flex-start", background: "rgba(96, 165, 250, 0.12)", border: "1px solid rgba(148, 163, 184, 0.25)", borderRadius: 999, padding: "8px 12px", color: "#dbeafe", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700 },
  heroTitle: { margin: 0, fontSize: 58, lineHeight: 0.96, letterSpacing: "-0.06em", color: "#f8fbff", fontWeight: 800, maxWidth: 590 },
  heroQuote: { margin: 0, fontSize: 22, lineHeight: 1.55, color: "#c4d4f1", maxWidth: 560 },
  heroStats: { display: "flex", gap: 18, flexWrap: "wrap", marginTop: 12 },
  statBox: { minWidth: 140, background: "rgba(11, 18, 29, 0.42)", border: "1px solid rgba(148, 163, 184, 0.18)", borderRadius: 16, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 6 },
  statValue: { fontSize: 26, fontWeight: 800, color: "#fff" },
  statLabel: { fontSize: 12, color: "#d0def8" },
  authFormPanel: { display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #08172b 0%, #0a1c31 50%, #091e30 100%)", padding: 32 },
  authCard: { width: "100%", maxWidth: 470, background: "linear-gradient(180deg, rgba(12, 19, 28, 0.92) 0%, rgba(9, 15, 22, 0.92) 100%)", borderRadius: 28, boxShadow: "0 18px 36px rgba(0, 0, 0, 0.22)", border: "1px solid rgba(148, 163, 184, 0.16)", padding: "28px 30px 26px", boxSizing: "border-box" },
  authHeader: { marginBottom: 18 },
  authEyebrow: { display: "inline-block", background: "rgba(133, 166, 255, 0.12)", color: "#dfeaff", borderRadius: 999, padding: "6px 10px", fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", border: "1px solid rgba(147, 197, 253, 0.18)" },
  authHeading: { textAlign: "left", fontSize: 34, margin: "12px 0 0", color: "#f8fbff", letterSpacing: "-0.05em", fontWeight: 800 },
  authForm: { display: "grid", gap: 12 },
  helperRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 2, marginBottom: 4 },
  helperText: { color: "#bfd2ff", fontSize: 12 },
  linkButton: { border: "none", background: "none", color: "#9bc0ff", cursor: "pointer", fontWeight: 700, fontSize: 13, padding: 0 },
  authFooter: { display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 24, color: "#dfe8f8" },
  pageShell: { minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "transparent", position: "relative", overflow: "hidden", fontFamily: "Inter, 'Segoe UI', sans-serif" },
  card: { background: "#fff", padding: "18px 16px", border: "1px solid #e4ebf3", borderRadius: 16, boxShadow: "none", display: "grid", gap: 12, width: "100%", maxWidth: 430 },
  panelHeading: { margin: 0, fontSize: 20, color: "#202a3a", fontWeight: 700 },
  title: { textAlign: "center", marginBottom: "4px", fontSize: 40, fontWeight: 700, color: "#111827", letterSpacing: "-0.04em" },
  subtitle: { textAlign: "center", color: "#5b6472", marginBottom: "22px", fontSize: 18 },
  authHeading: { textAlign: "left", fontSize: 24, margin: "0 0 10px", color: "#111827" },
  authForm: { display: "grid", gap: 14 },
  label: { display: "block", marginBottom: "6px", fontWeight: 700, fontSize: 15, color: "#eaf4ff", letterSpacing: "-0.01em" },
  input: { width: "100%", padding: "13px 14px", borderRadius: 12, border: "1px solid rgba(148, 163, 184, 0.28)", boxSizing: "border-box", background: "rgba(226, 232, 240, 0.08)", color: "#f1f5f9", fontSize: 14, fontFamily: "inherit", outline: "none", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)" },
  button: { background: "linear-gradient(180deg, #6977ff 0%, #4f46e5 100%)", color: "white", border: "none", borderRadius: "12px", padding: "13px 18px", fontWeight: 700, cursor: "pointer", marginTop: 8, boxShadow: "0 10px 20px rgba(79, 70, 229, 0.28)" },
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
  ,teamsPage: { maxWidth: 1240, margin: "0 auto", color: "#1d2c45" }
  ,teamsHero: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, marginBottom: 18 }
  ,teamsHeading: { margin: 0, fontSize: 28, letterSpacing: "-0.04em", color: "#13233d" }
  ,teamsIntro: { marginTop: 6, color: "#71819a", fontSize: 13 }
  ,joinTeamButton: { border: 0, borderRadius: 6, padding: "12px 17px", background: "#176bea", color: "white", fontWeight: 700, cursor: "pointer", boxShadow: "0 5px 12px rgba(23,107,234,.18)" }
  ,teamsCallout: { display: "flex", alignItems: "center", gap: 12, width: "fit-content", marginLeft: "auto", marginBottom: 12, padding: "9px 13px", borderRadius: 7, background: "#eef4ff", color: "#7290ba", fontSize: 11, lineHeight: 1.4 }
  ,teamControls: { display: "flex", justifyContent: "space-between", alignItems: "end", gap: 18, borderBottom: "1px solid #dce5f1", marginBottom: 12 }
  ,teamTabs: { display: "flex", gap: 22 }
  ,teamTab: { border: 0, background: "transparent", color: "#8190a7", padding: "11px 2px", cursor: "pointer", fontSize: 12 }
  ,teamTabActive: { border: 0, borderBottom: "2px solid #176bea", background: "transparent", color: "#176bea", padding: "11px 2px", cursor: "pointer", fontSize: 12, fontWeight: 700 }
  ,teamFilters: { display: "flex", gap: 10, paddingBottom: 7 }
  ,teamSearch: { width: 240, border: "1px solid #dce5f1", borderRadius: 6, padding: "9px 11px", background: "white", color: "#23324a" }
  ,teamSort: { border: "1px solid #dce5f1", borderRadius: 6, padding: "9px 11px", background: "white", color: "#51627c" }
  ,createTeamBar: { display: "grid", gridTemplateColumns: "1fr 1.6fr auto", gap: 10, background: "white", border: "1px solid #e1e8f2", borderRadius: 8, padding: 12, marginBottom: 14 }
  ,teamCardsGrid: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14 }
  ,teamCard: { minWidth: 0, background: "white", border: "1px solid #e1e8f2", borderRadius: 8, padding: "14px 12px 11px", boxShadow: "0 2px 8px rgba(39,69,112,.04)" }
  ,teamCardTop: { display: "flex", gap: 10, minHeight: 73, alignItems: "flex-start" }
  ,teamAvatarLarge: { width: 45, height: 45, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 25, flex: "0 0 auto" }
  ,teamCardIdentity: { minWidth: 0, flex: 1 }
  ,teamCardIdentityStrong: { display: "block" }
  ,teamCardIdentityP: { margin: "4px 0 7px", fontSize: 11, color: "#75849a", lineHeight: 1.3 }
  ,activePill: { display: "inline-block", borderRadius: 99, padding: "3px 7px", background: "#dff7e9", color: "#1a9b5c", fontSize: 10, fontWeight: 700 }
  ,moreButton: { border: 0, background: "transparent", color: "#71819a", cursor: "pointer", letterSpacing: 1 }
  ,teamMemberLine: { display: "flex", justifyContent: "space-between", borderBottom: "1px solid #edf1f6", padding: "4px 0 10px", color: "#697a93", fontSize: 11 }
  ,memberLabel: { color: "#1670e8", fontWeight: 700 }
  ,recentDecisionHeader: { margin: "10px 0 5px", color: "#253650", fontSize: 11, fontWeight: 800 }
  ,recentDecisions: { display: "grid", gap: 4, minHeight: 43 }
  ,recentDecision: { display: "grid", gridTemplateColumns: "18px minmax(0, 1fr) auto 12px", gap: 5, alignItems: "center", border: 0, background: "transparent", padding: "3px 0", textAlign: "left", color: "#33445e", cursor: "pointer", fontSize: 10 }
  ,recentDecisionSmall: { color: "#8290a3", whiteSpace: "nowrap" }
  ,fileIcon: { width: 16, height: 16, display: "grid", placeItems: "center", borderRadius: 4, background: "#eef4ff", fontSize: 11 }
  ,teamCardActions: { borderTop: "1px solid #edf1f6", marginTop: 9, paddingTop: 9 }
  ,viewTeamButton: { width: "100%", border: "1px solid #e3eaf4", borderRadius: 5, padding: "7px", color: "#176bea", background: "white", cursor: "pointer", fontSize: 11, fontWeight: 700 }
  ,joinCard: { minHeight: 250, display: "grid", placeItems: "center", alignContent: "center", gap: 9, border: "1px dashed #cbd9eb", borderRadius: 8, background: "rgba(255,255,255,.55)", color: "#23324a", cursor: "pointer", textAlign: "center" }
  ,plusCircle: { width: 50, height: 50, display: "grid", placeItems: "center", borderRadius: "50%", background: "#e9f2ff", color: "#176bea", fontSize: 29 }
  ,browseButton: { marginTop: 5, border: "1px solid #cdddf3", borderRadius: 5, padding: "7px 30px", color: "#176bea", fontSize: 11, fontWeight: 700 }
  ,teamBottomGrid: { display: "grid", gridTemplateColumns: "1.35fr .9fr", gap: 14, marginTop: 14 }
  ,activityPanel: { minHeight: 132, padding: "12px 13px", background: "white", border: "1px solid #e1e8f2", borderRadius: 8 }
  ,bottomPanelHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9 }
  ,activityRow: { display: "flex", gap: 9, alignItems: "center", padding: "5px 0", fontSize: 11 }
  ,activityRowStrong: { display: "block" }
  ,activityRowSmall: { display: "block", color: "#8090a7", marginTop: 2, fontSize: 10 }
  ,activityIcon: { width: 22, height: 22, display: "grid", placeItems: "center", borderRadius: "50%", color: "#2678ec", background: "#e8f1ff", fontSize: 10 }
  ,calendarIcon: { width: 22, height: 22, display: "grid", placeItems: "center", borderRadius: 5, color: "#2678ec", background: "#e8f1ff", fontSize: 12 }
  ,teamsQuote: { display: "grid", alignContent: "center", gap: 7, padding: "16px", borderRadius: 8, background: "linear-gradient(135deg, #f0f3ff, #e9efff)", color: "#40518d", fontSize: 12, lineHeight: 1.4 }
  ,quotePeople: { color: "#7a9bf0", fontSize: 27, letterSpacing: 3, justifySelf: "end" }
  ,error: { background: "#fff0f0", color: "#b62d2d", border: "1px solid #efc7c7", borderRadius: 10, padding: "10px 12px", marginBottom: 14 }
  ,repositoryToolbar: { display: "flex", gap: 10, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }
  ,repositoryLayout: { display: "grid", gridTemplateColumns: "minmax(0, 1fr) 300px", gap: 18, alignItems: "start" }
  ,repositoryHeader: { display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12 }
  ,repositoryList: { display: "grid", gap: 10 }
  ,repositoryItem: { border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, background: "#fbfcfe" }
  ,repositoryItemButton: { width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, border: 0, background: "transparent", textAlign: "left", cursor: "pointer", color: "#1e293b", fontSize: 15 }
  ,repositoryItemButtonSmall: { display: "block" }
  ,repositoryItemButtonSpan: { display: "grid", gap: 4 }
  ,repositoryMeta: { color: "#64748b", fontSize: 12, whiteSpace: "nowrap" }
  ,tagRow: { display: "flex", gap: 6, flexWrap: "wrap", marginTop: 9 }
  ,tagBadge: { display: "inline-flex", gap: 4, alignItems: "center", borderRadius: 999, padding: "4px 9px", background: "#e7f4f0", color: "#176b5c", fontSize: 12 }
  ,repositoryDetail: { borderTop: "1px solid #e5e7eb", marginTop: 12, paddingTop: 12, display: "grid", gap: 9, color: "#475569", lineHeight: 1.5 }
  ,inlineForm: { display: "flex", gap: 8, alignItems: "center" }
  ,secondaryButton: { border: "1px solid #cbd5e1", background: "white", color: "#334155", borderRadius: 8, padding: "10px 12px", cursor: "pointer", whiteSpace: "nowrap" }
  ,textButton: { border: 0, background: "transparent", color: "#4338ca", cursor: "pointer", fontWeight: 700 }
  ,mutedText: { color: "#64748b", fontSize: 13 }
  ,tagCloud: { display: "flex", gap: 7, flexWrap: "wrap" }
  ,timeline: { display: "grid", gap: 8 }
  ,timelineRow: { display: "flex", gap: 9, alignItems: "flex-start" }
  ,timelineDot: { width: 8, height: 8, borderRadius: "50%", background: "#4f46e5", marginTop: 7, flex: "0 0 auto" }
  ,documentRow: { display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #edf2f7", paddingTop: 8, fontSize: 13 }
  ,knowledgePage: { maxWidth: 1250, margin: "0 auto", color: "#23324a" }
  ,knowledgeHero: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, marginBottom: 14 }
  ,uploadControls: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }
  ,uploadDecisionSelect: { maxWidth: 220, border: "1px solid #d5e0ef", borderRadius: 6, padding: "10px 9px", background: "white", color: "#53647c", fontSize: 11 }
  ,uploadMessage: { marginBottom: 12, padding: "9px 12px", borderRadius: 6, border: "1px solid #bde5cc", background: "#effbf3", color: "#237348", fontSize: 12 }
  ,repositoryError: { marginBottom: 12, padding: "10px 12px", borderRadius: 6, border: "1px solid #f1c6c6", background: "#fff4f4", color: "#a02d2d", fontSize: 12 }
  ,inlineRetry: { marginLeft: 8, border: 0, background: "transparent", color: "#286ce4", fontWeight: 700, cursor: "pointer" }
  ,createDecisionButton: { marginTop: 12, border: 0, borderRadius: 5, padding: "8px 12px", background: "#286ce4", color: "white", fontWeight: 700, cursor: "pointer" }
  ,decisionRecordList: { display: "grid", gap: 0 }
  ,decisionRecord: { display: "grid", gridTemplateColumns: "30px minmax(0, 1fr) auto", gap: 9, alignItems: "center", borderTop: "1px solid #edf1f6", padding: "10px 0", fontSize: 11 }
  ,decisionRecordIcon: { width: 25, height: 27, display: "grid", placeItems: "center", borderRadius: 4, background: "#e8f0ff", color: "#286ce4", fontWeight: 800 }
  ,knowledgeTitleRow: { display: "flex", gap: 12, alignItems: "center" }
  ,bookIcon: { color: "#243d6d", fontSize: 28, letterSpacing: -5 }
  ,knowledgeHeading: { margin: 0, fontSize: 27, letterSpacing: "-0.04em", color: "#142642" }
  ,knowledgeSubtitle: { color: "#75849b", fontSize: 12, marginTop: 4 }
  ,uploadDocumentButton: { background: "#286ce4", color: "white", borderRadius: 6, padding: "11px 15px", fontWeight: 700, fontSize: 12, cursor: "pointer", boxShadow: "0 5px 12px rgba(40,108,228,.18)" }
  ,knowledgeTabs: { display: "flex", gap: 28, borderBottom: "1px solid #dfe7f2", marginBottom: 14 }
  ,knowledgeTab: { border: 0, background: "transparent", color: "#728198", padding: "9px 0", fontSize: 12, cursor: "pointer" }
  ,knowledgeTabActive: { border: 0, borderBottom: "2px solid #286ce4", background: "transparent", color: "#286ce4", padding: "9px 0", fontSize: 12, fontWeight: 700, cursor: "pointer" }
  ,knowledgeStats: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 13, marginBottom: 14 }
  ,knowledgeStat: { display: "flex", alignItems: "center", gap: 10, padding: "10px 13px", background: "white", border: "1px solid #e3e9f2", borderRadius: 7 }
  ,knowledgeStatIcon: { width: 32, height: 32, display: "grid", placeItems: "center", borderRadius: 8, fontWeight: 700 }
  ,knowledgeStatStrong: { display: "block", fontSize: 19, lineHeight: 1 }
  ,knowledgeStatSmall: { display: "block", color: "#7d8ba0", fontSize: 10, marginTop: 4 }
  ,knowledgeMainGrid: { display: "grid", gridTemplateColumns: "minmax(0, 1.45fr) minmax(340px, .95fr)", gap: 16, alignItems: "stretch" }
  ,knowledgeDocumentsPanel: { background: "white", border: "1px solid #e1e8f2", borderRadius: 8, padding: "12px 13px" }
  ,knowledgePanelHeader: { display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12, marginBottom: 10 }
  ,knowledgePanelHeaderH2: { margin: 0, fontSize: 15, color: "#253650" }
  ,knowledgePanelHeaderP: { color: "#8390a4", fontSize: 10, marginTop: 3 }
  ,knowledgeSort: { border: "1px solid #dce5f1", borderRadius: 5, background: "white", padding: "7px 9px", fontSize: 11, color: "#66768f" }
  ,knowledgeFilters: { display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr auto", gap: 7, marginBottom: 8 }
  ,knowledgeSearch: { minWidth: 0, border: "1px solid #dce5f1", borderRadius: 5, padding: "8px 9px", fontSize: 11 }
  ,knowledgeFilter: { minWidth: 0, border: "1px solid #dce5f1", borderRadius: 5, padding: "8px 7px", background: "white", color: "#63738b", fontSize: 11 }
  ,knowledgeSearchButton: { border: 0, borderRadius: 5, background: "#edf3ff", color: "#286ce4", padding: "0 12px", cursor: "pointer", fontWeight: 700 }
  ,documentRows: { borderTop: "1px solid #edf1f6" }
  ,documentLibraryRow: { display: "grid", gridTemplateColumns: "30px minmax(160px, 1fr) minmax(120px, 1fr) 45px 20px", gap: 9, alignItems: "center", borderBottom: "1px solid #edf1f6", padding: "9px 0", fontSize: 11 }
  ,documentTypeIcon: { width: 25, height: 27, display: "grid", placeItems: "center", borderRadius: 4, fontSize: 8, fontWeight: 800 }
  ,documentName: { minWidth: 0 }
  ,documentNameStrong: { display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#2c3d57" }
  ,documentNameSmall: { display: "block", color: "#8b98aa", fontSize: 9, marginTop: 3 }
  ,documentTags: { display: "flex", gap: 4, flexWrap: "wrap" }
  ,knowledgeChip: { border: 0, borderRadius: 99, padding: "4px 7px", background: "#eaf1ff", color: "#4774cd", fontSize: 9, cursor: "pointer" }
  ,viewDocumentButton: { border: "1px solid #d9e4f4", borderRadius: 4, background: "white", color: "#286ce4", padding: "5px 7px", fontSize: 10, cursor: "pointer" }
  ,documentMenu: { border: 0, background: "transparent", color: "#728198", cursor: "pointer", fontSize: 16 }
  ,documentFooter: { display: "flex", justifyContent: "space-between", color: "#8290a3", fontSize: 10, paddingTop: 10 }
  ,emptyKnowledge: { padding: 30, textAlign: "center", color: "#8290a3", fontSize: 12 }
  ,knowledgeAside: { display: "grid", gap: 14 }
  ,graphPanel: { minHeight: 520, background: "white", border: "1px solid #dbe5f2", borderRadius: 10, overflow: "hidden", boxShadow: "0 8px 20px rgba(36,61,109,.06)" }
  ,graphHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, padding: "15px 16px 12px", background: "linear-gradient(135deg, #fbfdff, #f5f8fd)", borderBottom: "1px solid #e5ebf4" }
  ,graphHeaderH2: { margin: 0, fontSize: 15, color: "#253650" }
  ,graphHeaderP: { color: "#8390a4", fontSize: 10, marginTop: 4, maxWidth: 250, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }
  ,graphResetButton: { border: 0, background: "transparent", color: "#91a0b4", fontSize: 22, cursor: "pointer", lineHeight: 1 }
  ,graphSelectLabel: { display: "block", padding: "12px 16px 5px", color: "#40516b", fontSize: 11, fontWeight: 700 }
  ,graphSelect: { display: "block", width: "calc(100% - 32px)", margin: "0 16px", border: "1px solid #dbe5f2", borderRadius: 7, padding: "10px 11px", background: "#f8fafd", color: "#40516b", fontSize: 12 }
  ,graphCanvas: { display: "grid", placeItems: "center", minHeight: 350, padding: "4px 8px 0", background: "linear-gradient(180deg, #ffffff, #fbfcff)" }
  ,graphSvg: { display: "block", width: "100%", maxWidth: 460, height: "auto", overflow: "visible" }
  ,graphLegend: { display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 14, padding: "12px 14px", borderTop: "1px solid #e8eef6", background: "#f8fafd", color: "#52627b", fontSize: 10 }
  ,graphLegendDot: { display: "inline-block", width: 10, height: 10, borderRadius: "50%", marginRight: 5, verticalAlign: "-1px" }
  ,graphSelection: { display: "flex", justifyContent: "space-between", gap: 10, padding: "9px 16px", borderTop: "1px solid #e8eef6", color: "#33445d", fontSize: 11 }
  ,graphSelectionSpan: { color: "#8290a4" }
  ,insightsPanel: { background: "white", border: "1px solid #e1e8f2", borderRadius: 8, padding: "12px 13px" }
  ,insightRow: { display: "flex", gap: 9, alignItems: "center", padding: "8px 0", borderTop: "1px solid #edf1f6", fontSize: 10 }
  ,insightIcon: { width: 24, height: 24, display: "grid", placeItems: "center", borderRadius: "50%", background: "#e8f0ff", color: "#3975d9", fontWeight: 800 }
  ,insightRowStrong: { display: "block", color: "#34455f" }
  ,insightRowSmall: { display: "block", color: "#8995a6", marginTop: 2, fontSize: 9 }
  ,knowledgeBottomGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }
  ,bottomKnowledgePanel: { minHeight: 130, background: "white", border: "1px solid #e1e8f2", borderRadius: 8, padding: "12px 13px" }
  ,topicCloud: { display: "flex", gap: 7, flexWrap: "wrap" }
  ,previewOverlay: { position: "fixed", inset: 0, zIndex: 1000, display: "grid", placeItems: "center", padding: 20, background: "rgba(15, 28, 48, .58)" }
  ,previewDialog: { display: "grid", gridTemplateRows: "auto minmax(0, 1fr)", width: "min(1100px, 96vw)", height: "min(850px, 92vh)", background: "#f7f9fc", borderRadius: 10, overflow: "hidden", boxShadow: "0 24px 80px rgba(5, 20, 40, .3)" }
  ,previewHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, padding: "12px 16px", borderBottom: "1px solid #dce5f0", background: "white" }
  ,previewHeaderSmall: { display: "block", color: "#7e8da3", marginTop: 4, fontSize: 11 }
  ,previewActions: { display: "flex", alignItems: "center", gap: 10 }
  ,previewDownload: { color: "#286ce4", border: "1px solid #d7e2f0", borderRadius: 5, padding: "7px 10px", textDecoration: "none", fontSize: 12, fontWeight: 700 }
  ,previewClose: { width: 32, height: 32, border: 0, borderRadius: 5, background: "#eff3f8", color: "#47566d", cursor: "pointer", fontSize: 22 }
  ,previewBody: { minHeight: 0, overflow: "auto", display: "grid", placeItems: "center", padding: 18 }
  ,previewFrame: { width: "100%", height: "100%", border: 0, background: "white" }
  ,previewImage: { maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }
  ,previewText: { width: "100%", height: "100%", margin: 0, padding: 22, overflow: "auto", whiteSpace: "pre-wrap", overflowWrap: "anywhere", background: "white", color: "#26364f", lineHeight: 1.55 }
  ,previewDocx: { width: "min(850px, 100%)", minHeight: "100%", padding: "42px 56px", background: "white", color: "#26364f", lineHeight: 1.65, boxShadow: "0 2px 14px rgba(25,50,80,.08)" }
  ,previewSlides: { width: "min(900px, 100%)", display: "grid", gap: 14, alignSelf: "start" }
  ,previewSlide: { minHeight: 180, padding: 24, background: "white", border: "1px solid #dce5f0", borderRadius: 6, color: "#26364f", boxShadow: "0 3px 12px rgba(25,50,80,.06)" }
  ,previewState: { display: "grid", justifyItems: "center", gap: 12, textAlign: "center", color: "#53647c", padding: 24 }
};

export default App;