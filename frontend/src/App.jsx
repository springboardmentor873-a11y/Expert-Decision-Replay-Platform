import { useState, useEffect, useMemo } from "react";
import "./App.css";

const BrainIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04z" />
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04z" />
  </svg>
);

const HomeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const CheckSquareIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 11 12 14 22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);

const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const UsersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const MessageSquareIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const FileTextIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const BarChartIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
  </svg>
);

const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

const PencilIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </svg>
);

const ClockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const INITIAL_TEAMS = [
  { id: 1, name: "Development Team", members: 5 },
  { id: 2, name: "AI Development", members: 4 },
  { id: 3, name: "Engineering Team", members: 6 },
  { id: 4, name: "Security Team", members: 4 },
];

const INITIAL_DISCUSSIONS = [
  {
    id: 1,
    title: "Choosing the right AI framework",
    context: "AI Model Selection",
    time: "2 hours ago",
  },
  {
    id: 2,
    title: "Database performance comparison",
    context: "Select Database for Platform",
    time: "5 hours ago",
  },
  {
    id: 3,
    title: "Security considerations",
    context: "Data Privacy Compliance",
    time: "1 day ago",
  },
];

const INITIAL_ACTIVITIES = [
  {
    id: 1,
    avatar: "SP",
    color: "purple",
    user: "Sarah",
    action: "posted a new discussion",
    ref: "Choose Project Architecture",
    time: "2 hours ago",
  },
  {
    id: 2,
    avatar: "RK",
    color: "slate",
    user: "Rahul",
    action: "uploaded a document",
    ref: "Select Database for Platform",
    time: "5 hours ago",
  },
  {
    id: 3,
    avatar: "AP",
    color: "amber",
    user: "Anita",
    action: "commented on a decision",
    ref: "AI Model Selection",
    time: "1 day ago",
  },
  {
    id: 4,
    avatar: "VM",
    color: "indigo",
    user: "Vikram",
    action: "submitted a decision for review",
    ref: "Cloud Deployment Strategy",
    time: "1 day ago",
  },
];

function App() {
  const API_URL = "http://127.0.0.1:8000";

  const [user, setUser] = useState(null);
  const [authTab, setAuthTab] = useState("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authRole, setAuthRole] = useState("EMPLOYEE");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const [activeTab, setActiveTab] = useState("Dashboard");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [decisions, setDecisions] = useState([]);
  const [teams, setTeams] = useState(INITIAL_TEAMS);
  const [discussions] = useState(INITIAL_DISCUSSIONS);
  const [activities] = useState(INITIAL_ACTIVITIES);

  const currentDateFormatted = useMemo(() => {
    return new Date().toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, []);

  const todayShortFormatted = useMemo(() => {
    return new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, []);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedUploadFile, setSelectedUploadFile] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formType, setFormType] = useState("");
  const [formTeamId, setFormTeamId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 3500);
  };

  const getBackendData = async () => {
    try {
      let loadedTeams = INITIAL_TEAMS;
      try {
        const teamsRes = await fetch(`${API_URL}/teams`);
        if (teamsRes.ok) {
          const tData = await teamsRes.json();
          if (Array.isArray(tData) && tData.length > 0) {
            loadedTeams = tData.map((t, idx) => ({
              id: t.id,
              name: t.name,
              members: 4 + ((idx * 2) % 5),
            }));
            setTeams(loadedTeams);
          }
        }
      } catch {
      }

      const decisionsRes = await fetch(`${API_URL}/decisions`);
      if (decisionsRes.ok) {
        const dData = await decisionsRes.json();
        if (Array.isArray(dData)) {
          const formatted = dData.map((d) => {
            const dateObj = d.created_at ? new Date(d.created_at) : new Date();
            const formattedDate = dateObj.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });
            const teamFound = loadedTeams.find((t) => t.id === d.team_id);
            return {
              ...d,
              team: teamFound ? teamFound.name : d.team_id ? `Team #${d.team_id}` : "Core Team",
              created_date_formatted: formattedDate,
            };
          });
          setDecisions(formatted);
        }
      }
    } catch (err) {
      console.error("Could not load backend data:", err);
    }
  };

  useEffect(() => {
    if (user) {
      getBackendData();
    }
  }, [user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    setIsAuthLoading(true);

    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail, password: authPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setUser(data);
        triggerToast(`Welcome back, ${data.name}!`);
      } else {
        setAuthError(data.detail || "Invalid email or password");
      }
    } catch {
      setAuthError("Unable to connect to backend at " + API_URL);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    setIsAuthLoading(true);

    try {
      const res = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: authName,
          email: authEmail,
          password: authPassword,
          role: authRole,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setAuthSuccess(`Registration successful as ${authRole}! Please sign in.`);
        setAuthTab("login");
        setAuthPassword("");
      } else {
        setAuthError(data.detail || "Registration failed. Try again.");
      }
    } catch {
      setAuthError("Unable to connect to backend at " + API_URL);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleDemoLogin = (role = "EMPLOYEE", name = "John Doe") => {
    setUser({
      user_id: 1,
      name: name,
      email: `${name.toLowerCase().replace(" ", ".")}@example.com`,
      role: role,
    });
    triggerToast(`Signed in as ${name} (${role})`);
  };

  const handleLogout = () => {
    setUser(null);
    setDecisions([]);
    setShowProfileMenu(false);
    setSelectedDecision(null);
    triggerToast("Logged out successfully");
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const body = {
        title: formTitle,
        description: formDescription,
        decision_type: formType || "General",
        created_by: user.user_id || 1,
        team_id: formTeamId ? Number(formTeamId) : null,
      };

      const res = await fetch(`${API_URL}/decisions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        triggerToast("Decision created successfully!");
        setFormTitle("");
        setFormDescription("");
        setFormType("");
        setFormTeamId("");
        setIsCreateModalOpen(false);
        await getBackendData();
      } else {
        const errData = await res.json();
        triggerToast(errData.detail || "Unable to create decision");
      }
    } catch {
      triggerToast("Network error creating decision");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (decisionId, newStatus) => {
    const userRole = (user?.role || "").toUpperCase();
    const isManagerOrAdmin = userRole === "MANAGER" || userRole === "ADMINISTRATOR";

    if (!isManagerOrAdmin) {
      triggerToast("Access denied: Only Managers can update decision status.");
      return;
    }

    try {
      const roleParam = encodeURIComponent(user?.role || "");
      const userIdParam = encodeURIComponent(user?.id || user?.user_id || "");
      const res = await fetch(
        `${API_URL}/decisions/${decisionId}/status?status=${encodeURIComponent(newStatus)}&user_role=${roleParam}&user_id=${userIdParam}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-user-role": user?.role || "",
          },
        }
      );

      if (res.ok) {
        triggerToast(`Status updated to ${newStatus}`);
        await getBackendData();
        if (selectedDecision && selectedDecision.id === decisionId) {
          setSelectedDecision((prev) => ({ ...prev, status: newStatus }));
        }
      } else {
        const err = await res.json();
        triggerToast(err.detail || "Status update failed");
      }
    } catch {
      triggerToast("Connection failed to update status");
    }
  };

  const handleDeleteDecision = async (decisionId) => {
    if (!window.confirm("Are you sure you want to delete this decision?")) return;

    try {
      const res = await fetch(`${API_URL}/decisions/${decisionId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        triggerToast("Decision deleted successfully");
        if (selectedDecision && selectedDecision.id === decisionId) {
          setSelectedDecision(null);
        }
        await getBackendData();
      } else {
        triggerToast("Could not delete decision");
      }
    } catch {
      triggerToast("Network error during delete");
    }
  };

  const loadDecisionFiles = async (decisionId) => {
    try {
      const res = await fetch(`${API_URL}/decisions/${decisionId}/files`);
      if (res.ok) {
        const data = await res.json();
        setUploadedFiles(data);
      } else {
        setUploadedFiles([]);
      }
    } catch {
      setUploadedFiles([]);
    }
  };

  const handleViewDetails = async (decision) => {
    setSelectedDecision(decision);
    await loadDecisionFiles(decision.id);
  };

  const handleFileUpload = async (decisionId) => {
    if (!selectedUploadFile) {
      triggerToast("Please choose a file first");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", selectedUploadFile);

      const res = await fetch(`${API_URL}/decisions/${decisionId}/upload`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        triggerToast("File uploaded successfully");
        setSelectedUploadFile(null);
        await loadDecisionFiles(decisionId);
      } else {
        const err = await res.json();
        triggerToast(err.detail || "Upload failed");
      }
    } catch {
      triggerToast("Error connecting to upload endpoint");
    }
  };

  const stats = useMemo(() => {
    let draft = 0;
    let review = 0;
    let approved = 0;
    let rejected = 0;

    decisions.forEach((d) => {
      const st = (d.status || "").toUpperCase();
      if (st === "DRAFT") draft++;
      else if (st === "IN_REVIEW" || st === "UNDER REVIEW") review++;
      else if (st === "APPROVED") approved++;
      else if (st === "REJECTED") rejected++;
    });

    const total = decisions.length;
    const draftPct = total ? Math.round((draft / total) * 100) : 0;
    const reviewPct = total ? Math.round((review / total) * 100) : 0;
    const approvedPct = total ? Math.round((approved / total) * 100) : 0;
    const rejectedPct = total ? Math.max(0, 100 - (draftPct + reviewPct + approvedPct)) : 0;

    return {
      total,
      draft,
      review,
      approved,
      rejected,
      draftPct,
      reviewPct,
      approvedPct,
      rejectedPct,
    };
  }, [decisions]);

  const donutData = useMemo(() => {
    const radius = 45;
    const circumference = 2 * Math.PI * radius;

    if (stats.total === 0) {
      return {
        circumference,
        lenDraft: 0,
        lenReview: 0,
        lenApproved: 0,
        lenRejected: 0,
        offsetDraft: 0,
        offsetReview: 0,
        offsetApproved: 0,
        offsetRejected: 0,
      };
    }

    const pDraft = stats.draftPct / 100;
    const pReview = stats.reviewPct / 100;
    const pApproved = stats.approvedPct / 100;
    const pRejected = stats.rejectedPct / 100;

    const lenDraft = circumference * pDraft;
    const lenReview = circumference * pReview;
    const lenApproved = circumference * pApproved;
    const lenRejected = circumference * pRejected;

    return {
      circumference,
      lenDraft,
      lenReview,
      lenApproved,
      lenRejected,
      offsetDraft: 0,
      offsetReview: -lenDraft,
      offsetApproved: -(lenDraft + lenReview),
      offsetRejected: -(lenDraft + lenReview + lenApproved),
    };
  }, [stats]);

  const renderStatusBadge = (status) => {
    const s = (status || "").toUpperCase();
    if (s === "IN_REVIEW" || s === "UNDER REVIEW") {
      return <span className="status-pill review">Under Review</span>;
    }
    if (s === "DRAFT") {
      return <span className="status-pill draft">Draft</span>;
    }
    if (s === "APPROVED") {
      return <span className="status-pill approved">Approved</span>;
    }
    if (s === "REJECTED") {
      return <span className="status-pill rejected">Rejected</span>;
    }
    return <span className="status-pill draft">{status || "Draft"}</span>;
  };

  if (!user) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card-container">
          
          <div className="auth-hero-pane">
            <div>
              <div className="auth-hero-brand">
                <div className="auth-hero-logo">
                  <BrainIcon />
                </div>
                <div className="auth-hero-title">
                  Expert Decision<br />Replay Platform
                </div>
              </div>

              
              <div className="auth-quote-card">
                <div className="auth-quote-icon">“</div>
                <div className="auth-quote-text">
                  Good decisions come from experience, and experience comes from making decisions.
                </div>
                <div className="auth-quote-author">
                  — <strong>Mark Twain</strong> <span>• Decision Wisdom</span>
                </div>
              </div>

              
              <div className="auth-project-features">
                <div className="auth-feature-row">
                  <div className="auth-feature-bullet">🎯</div>
                  <div className="auth-feature-info">
                    <div className="auth-feature-title">Trace Decision Rationale</div>
                    <div className="auth-feature-desc">Capture why choices were made, alternatives considered, and engineering trade-offs.</div>
                  </div>
                </div>

                <div className="auth-feature-row">
                  <div className="auth-feature-bullet">🔄</div>
                  <div className="auth-feature-info">
                    <div className="auth-feature-title">Replay & Audit Timeline</div>
                    <div className="auth-feature-desc">Revisit historical milestones, file attachments, and team discussions effortlessly.</div>
                  </div>
                </div>

                <div className="auth-feature-row">
                  <div className="auth-feature-bullet">🛡️</div>
                  <div className="auth-feature-info">
                    <div className="auth-feature-title">Role-Based Multi-Stakeholder Governance</div>
                    <div className="auth-feature-desc">Tailored interfaces for Employees, Reviewers, Managers, and Administrators.</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: "24px", fontSize: "11px", color: "#64748b" }}>
              © 2025 Expert Decision Replay Platform. Enterprise Edition.
            </div>
          </div>

          
          <div className="auth-form-pane">
            <div className="auth-header">
              <h1 className="auth-title">
                {authTab === "login" ? "Welcome Back" : "Create Account"}
              </h1>
              <p className="auth-subtitle">
                {authTab === "login"
                  ? "Sign in to access your decisions and team dashboard"
                  : "Register to join teams and manage expert decisions"}
              </p>
            </div>

            <div className="auth-tabs">
              <button
                className={`auth-tab-btn ${authTab === "login" ? "active" : ""}`}
                onClick={() => {
                  setAuthTab("login");
                  setAuthError("");
                  setAuthSuccess("");
                }}
              >
                Sign In
              </button>
              <button
                className={`auth-tab-btn ${authTab === "register" ? "active" : ""}`}
                onClick={() => {
                  setAuthTab("register");
                  setAuthError("");
                  setAuthSuccess("");
                }}
              >
                Register
              </button>
            </div>

            <div className="auth-body">
              {authError && <div className="auth-error-banner">{authError}</div>}
              {authSuccess && <div className="auth-success-banner">{authSuccess}</div>}

              {authTab === "login" ? (
                <form className="auth-form" onSubmit={handleLogin}>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="name@company.com"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Password</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="••••••••"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="auth-submit-btn"
                    disabled={isAuthLoading}
                  >
                    {isAuthLoading ? "Signing in..." : "Sign In to Dashboard"}
                  </button>
                </form>
              ) : (
                <form className="auth-form" onSubmit={handleRegister}>
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. John Doe"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="name@company.com"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Password</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Create a password"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Select Role</label>
                    <select
                      className="form-select"
                      value={authRole}
                      onChange={(e) => setAuthRole(e.target.value)}
                    >
                      <option value="EMPLOYEE">EMPLOYEE</option>
                      <option value="REVIEWER">REVIEWER</option>
                      <option value="MANAGER">MANAGER</option>
                      <option value="ADMINISTRATOR">ADMINISTRATOR</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="auth-submit-btn"
                    disabled={isAuthLoading}
                  >
                    {isAuthLoading ? "Registering..." : "Create Account"}
                  </button>
                </form>
              )}

              <div className="auth-demo-hint">
                <div className="auth-demo-hint-title">Quick Demo Login (1-Click)</div>
                <div className="auth-demo-btn-group">
                  <button
                    type="button"
                    className="auth-demo-btn"
                    onClick={() => handleDemoLogin("EMPLOYEE", "John Doe")}
                  >
                    Employee
                  </button>
                  <button
                    type="button"
                    className="auth-demo-btn"
                    onClick={() => handleDemoLogin("REVIEWER", "Sarah Miller")}
                  >
                    Reviewer
                  </button>
                  <button
                    type="button"
                    className="auth-demo-btn"
                    onClick={() => handleDemoLogin("MANAGER", "Alex Chen")}
                  >
                    Manager
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo-icon">
            <BrainIcon />
          </div>
          <div className="sidebar-brand-text">
            Expert Decision<br />Replay Platform
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`sidebar-link ${activeTab === "Dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("Dashboard")}
          >
            <HomeIcon />
            <span>Dashboard</span>
          </button>

          <button
            className={`sidebar-link ${activeTab === "Decisions" ? "active" : ""}`}
            onClick={() => setActiveTab("Decisions")}
          >
            <CheckSquareIcon />
            <span>Decisions</span>
          </button>

          <button
            className="sidebar-link"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <PlusIcon />
            <span>Create Decision</span>
          </button>

          <button
            className={`sidebar-link ${activeTab === "Teams" ? "active" : ""}`}
            onClick={() => setActiveTab("Teams")}
          >
            <UsersIcon />
            <span>Teams</span>
          </button>

          <button
            className={`sidebar-link ${activeTab === "My Discussions" ? "active" : ""}`}
            onClick={() => setActiveTab("My Discussions")}
          >
            <MessageSquareIcon />
            <span>My Discussions</span>
          </button>

          <button
            className={`sidebar-link ${activeTab === "Documents" ? "active" : ""}`}
            onClick={() => setActiveTab("Documents")}
          >
            <FileTextIcon />
            <span>Documents</span>
          </button>

          <button
            className={`sidebar-link ${activeTab === "Analytics" ? "active" : ""}`}
            onClick={() => setActiveTab("Analytics")}
          >
            <BarChartIcon />
            <span>Analytics</span>
          </button>

          <button
            className={`sidebar-link ${activeTab === "Profile" ? "active" : ""}`}
            onClick={() => setActiveTab("Profile")}
          >
            <UserIcon />
            <span>Profile</span>
          </button>

          <button
            className={`sidebar-link ${activeTab === "Settings" ? "active" : ""}`}
            onClick={() => setActiveTab("Settings")}
          >
            <SettingsIcon />
            <span>Settings</span>
          </button>
        </nav>
      </aside>

      
      <main className="main-wrapper">
        
        <header className="top-header">
          <div className="header-greeting">
            <h1>Welcome back, {user.name ? user.name.split(" ")[0] : "John"}!</h1>
            <p>Here's an overview of your decisions and team activity.</p>
          </div>

          <div className="header-actions">
            <div className="header-date">
              {currentDateFormatted}
            </div>

            <button
              className="notification-btn"
              title="Notifications"
              onClick={() => triggerToast("You have 3 unread activity updates")}
            >
              <BellIcon />
              <span className="notification-dot"></span>
            </button>

            <div className="user-profile-menu">
              <button
                className="user-profile-capsule"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                <div className="user-avatar-circle">
                  {(user.name || "JD")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <div className="user-meta-name">{user.name || "John Doe"}</div>
                  <div className="user-meta-role">{(user.role || "EMPLOYEE").toLowerCase()}</div>
                </div>
                <div className="dropdown-chevron">
                  <ChevronDownIcon />
                </div>
              </button>

              {showProfileMenu && (
                <div className="user-dropdown-popover">
                  <div className="dropdown-section-title">Active Role: {user.role}</div>
                  <button
                    className={`dropdown-item ${user.role === "EMPLOYEE" ? "active-role" : ""}`}
                    onClick={() => {
                      setUser((u) => ({ ...u, role: "EMPLOYEE" }));
                      setShowProfileMenu(false);
                      triggerToast("Switched role to EMPLOYEE");
                    }}
                  >
                    Employee {user.role === "EMPLOYEE" && "✓"}
                  </button>

                  <button
                    className={`dropdown-item ${user.role === "REVIEWER" ? "active-role" : ""}`}
                    onClick={() => {
                      setUser((u) => ({ ...u, role: "REVIEWER" }));
                      setShowProfileMenu(false);
                      triggerToast("Switched role to REVIEWER");
                    }}
                  >
                    Reviewer {user.role === "REVIEWER" && "✓"}
                  </button>

                  <button
                    className={`dropdown-item ${user.role === "MANAGER" ? "active-role" : ""}`}
                    onClick={() => {
                      setUser((u) => ({ ...u, role: "MANAGER" }));
                      setShowProfileMenu(false);
                      triggerToast("Switched role to MANAGER (Approval Authority Active)");
                    }}
                  >
                    Manager {user.role === "MANAGER" && "✓"}
                  </button>

                  <button
                    className={`dropdown-item ${user.role === "ADMINISTRATOR" ? "active-role" : ""}`}
                    onClick={() => {
                      setUser((u) => ({ ...u, role: "ADMINISTRATOR" }));
                      setShowProfileMenu(false);
                      triggerToast("Switched role to ADMINISTRATOR");
                    }}
                  >
                    Administrator {user.role === "ADMINISTRATOR" && "✓"}
                  </button>

                  <div className="dropdown-divider"></div>

                  <button
                    className="dropdown-item dropdown-logout"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        
        <section className="metrics-grid">
          
          <div className="metric-card total">
            <div className="metric-icon-circle">
              <FileTextIcon />
            </div>
            <div className="metric-body">
              <div className="metric-value">{stats.total}</div>
              <div className="metric-label">Total Decisions</div>
              <button
                className="metric-action-link"
                onClick={() => setActiveTab("Decisions")}
              >
                View all →
              </button>
            </div>
          </div>

          
          <div className="metric-card draft">
            <div className="metric-icon-circle">
              <PencilIcon />
            </div>
            <div className="metric-body">
              <div className="metric-value">{stats.draft}</div>
              <div className="metric-label">Draft</div>
              <button
                className="metric-action-link"
                onClick={() => triggerToast(`Found ${stats.draft} Draft decisions`)}
              >
                View →
              </button>
            </div>
          </div>

          
          <div className="metric-card review">
            <div className="metric-icon-circle">
              <ClockIcon />
            </div>
            <div className="metric-body">
              <div className="metric-value">{stats.review}</div>
              <div className="metric-label">Under Review</div>
              <button
                className="metric-action-link"
                onClick={() => triggerToast(`Found ${stats.review} Under Review decisions`)}
              >
                View →
              </button>
            </div>
          </div>

          
          <div className="metric-card approved">
            <div className="metric-icon-circle">
              <CheckIcon />
            </div>
            <div className="metric-body">
              <div className="metric-value">{stats.approved}</div>
              <div className="metric-label">Approved</div>
              <button
                className="metric-action-link"
                onClick={() => triggerToast(`Found ${stats.approved} Approved decisions`)}
              >
                View →
              </button>
            </div>
          </div>

          
          <div className="metric-card rejected">
            <div className="metric-icon-circle">
              <XIcon />
            </div>
            <div className="metric-body">
              <div className="metric-value">{stats.rejected}</div>
              <div className="metric-label">Rejected</div>
              <button
                className="metric-action-link"
                onClick={() => triggerToast(`Found ${stats.rejected} Rejected decisions`)}
              >
                View →
              </button>
            </div>
          </div>
        </section>

        
        <div className="dashboard-grid">
          
          <div className="left-column">
            
            <div className="dash-card">
              <div className="card-header-row">
                <h2 className="card-title">Recent Decisions</h2>
                <button
                  className="btn-primary-action"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  <PlusIcon />
                  <span>Create Decision</span>
                </button>
              </div>

              <div className="table-wrapper">
                <table className="decisions-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Team</th>
                      <th>Status</th>
                      <th>Created On</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {decisions.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: "center", padding: "24px", color: "#64748b" }}>
                          No decisions found in database. Click <strong>+ Create Decision</strong> to create your first decision!
                        </td>
                      </tr>
                    ) : (
                      decisions.slice(0, 5).map((item) => (
                        <tr key={item.id}>
                          <td className="decision-title-cell" title={item.title}>
                            {item.title}
                          </td>
                          <td>{item.team}</td>
                          <td>{renderStatusBadge(item.status)}</td>
                          <td>{item.created_date_formatted || todayShortFormatted}</td>
                          <td>
                            <div className="table-actions-cell">
                              <button
                                className="btn-table-view"
                                onClick={() => handleViewDetails(item)}
                              >
                                View
                              </button>
                              <button
                                className="btn-table-more"
                                title="Delete decision"
                                onClick={() => handleDeleteDecision(item.id)}
                              >
                                •••
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="view-all-footer">
                <button onClick={() => setActiveTab("Decisions")}>
                  View all decisions →
                </button>
              </div>
            </div>

            
            <div className="sub-grid">
              
              <div className="dash-card">
                <h2 className="card-title">Decisions by Status</h2>

                <div className="donut-chart-container">
                  <div className="donut-svg-wrapper">
                    <svg width="130" height="130" viewBox="0 0 120 120">
                      
                      <circle
                        cx="60"
                        cy="60"
                        r="45"
                        fill="transparent"
                        stroke="#f1f5f9"
                        strokeWidth="16"
                      />

                      {stats.total > 0 && (
                        <>
                          
                          <circle
                            cx="60"
                            cy="60"
                            r="45"
                            fill="transparent"
                            stroke="#fbbf24"
                            strokeWidth="16"
                            strokeDasharray={`${donutData.lenDraft} ${donutData.circumference}`}
                            strokeDashoffset={donutData.offsetDraft}
                            transform="rotate(-90 60 60)"
                          />

                          
                          <circle
                            cx="60"
                            cy="60"
                            r="45"
                            fill="transparent"
                            stroke="#3b82f6"
                            strokeWidth="16"
                            strokeDasharray={`${donutData.lenReview} ${donutData.circumference}`}
                            strokeDashoffset={donutData.offsetReview}
                            transform="rotate(-90 60 60)"
                          />

                          
                          <circle
                            cx="60"
                            cy="60"
                            r="45"
                            fill="transparent"
                            stroke="#34d399"
                            strokeWidth="16"
                            strokeDasharray={`${donutData.lenApproved} ${donutData.circumference}`}
                            strokeDashoffset={donutData.offsetApproved}
                            transform="rotate(-90 60 60)"
                          />

                          
                          <circle
                            cx="60"
                            cy="60"
                            r="45"
                            fill="transparent"
                            stroke="#f87171"
                            strokeWidth="16"
                            strokeDasharray={`${donutData.lenRejected} ${donutData.circumference}`}
                            strokeDashoffset={donutData.offsetRejected}
                            transform="rotate(-90 60 60)"
                          />
                        </>
                      )}
                    </svg>

                    <div className="donut-center-text">
                      <div className="donut-center-number">{stats.total}</div>
                      <div className="donut-center-sub">Total</div>
                    </div>
                  </div>

                  
                  <div className="status-legend-list">
                    <div className="legend-item">
                      <div className="legend-label-group">
                        <span className="legend-color-dot" style={{ backgroundColor: "#fbbf24" }}></span>
                        <span>Draft</span>
                      </div>
                      <div className="legend-count">{stats.draft} ({stats.draftPct}%)</div>
                    </div>

                    <div className="legend-item">
                      <div className="legend-label-group">
                        <span className="legend-color-dot" style={{ backgroundColor: "#3b82f6" }}></span>
                        <span>Under Review</span>
                      </div>
                      <div className="legend-count">{stats.review} ({stats.reviewPct}%)</div>
                    </div>

                    <div className="legend-item">
                      <div className="legend-label-group">
                        <span className="legend-color-dot" style={{ backgroundColor: "#34d399" }}></span>
                        <span>Approved</span>
                      </div>
                      <div className="legend-count">{stats.approved} ({stats.approvedPct}%)</div>
                    </div>

                    <div className="legend-item">
                      <div className="legend-label-group">
                        <span className="legend-color-dot" style={{ backgroundColor: "#f87171" }}></span>
                        <span>Rejected</span>
                      </div>
                      <div className="legend-count">{stats.rejected} ({stats.rejectedPct}%)</div>
                    </div>
                  </div>
                </div>
              </div>

              
              <div className="dash-card">
                <div className="card-header-row">
                  <h2 className="card-title">Recent Discussions</h2>
                  <button
                    className="card-header-link"
                    onClick={() => setActiveTab("My Discussions")}
                  >
                    View all →
                  </button>
                </div>

                <div className="discussions-list">
                  {discussions.map((d) => (
                    <div className="discussion-item" key={d.id}>
                      <div className="discussion-icon-badge">
                        <MessageSquareIcon />
                      </div>
                      <div className="discussion-content">
                        <div className="discussion-title">{d.title}</div>
                        <div className="discussion-context">{d.context}</div>
                      </div>
                      <div className="discussion-time">{d.time}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          
          <div className="right-column">
            
            <div className="dash-card">
              <h2 className="card-title">Team Activity</h2>

              <div className="activity-feed">
                {activities.map((act) => (
                  <div className="activity-item" key={act.id}>
                    <div className={`activity-avatar ${act.color}`}>
                      {act.avatar}
                    </div>
                    <div className="activity-details">
                      <div className="activity-text">
                        <strong>{act.user}</strong> {act.action}
                      </div>
                      <div className="activity-ref">{act.ref}</div>
                    </div>
                    <div className="activity-time">{act.time}</div>
                  </div>
                ))}
              </div>
            </div>

            
            <div className="dash-card">
              <div className="card-header-row">
                <h2 className="card-title">My Teams</h2>
                <button
                  className="card-header-link"
                  onClick={() => setActiveTab("Teams")}
                >
                  View all →
                </button>
              </div>

              <div className="teams-list">
                {teams.map((t) => (
                  <div className="team-row-item" key={t.id}>
                    <div className="team-icon-badge">
                      <UsersIcon />
                    </div>
                    <div className="team-info">
                      <div className="team-name">{t.name}</div>
                      <div className="team-members-count">{t.members || 4} members</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      
      {isCreateModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Decision</h2>
              <button
                className="modal-close-btn"
                onClick={() => setIsCreateModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form className="modal-form" onSubmit={handleCreateSubmit}>
              <div className="form-group">
                <label>Decision Title *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Select Database Architecture"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description & Context *</label>
                <textarea
                  className="form-textarea"
                  placeholder="Explain background, options evaluated, trade-offs..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Decision Type *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Architecture, Security, Database"
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Assigned Team (Optional)</label>
                <select
                  className="form-select"
                  value={formTeamId}
                  onChange={(e) => setFormTeamId(e.target.value)}
                >
                  <option value="">Select Team...</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-action"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating..." : "Create Decision"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      
      {selectedDecision && (
        <div className="modal-overlay" onClick={() => setSelectedDecision(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Decision Details</h2>
              <button
                className="modal-close-btn"
                onClick={() => setSelectedDecision(null)}
              >
                ✕
              </button>
            </div>

            <div className="detail-row">
              <span className="detail-label">Title:</span>
              <span className="detail-value" style={{ fontWeight: 700 }}>
                {selectedDecision.title}
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Team:</span>
              <span className="detail-value">{selectedDecision.team}</span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Status:</span>
              <span className="detail-value">
                {renderStatusBadge(selectedDecision.status)}
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Decision Type:</span>
              <span className="detail-value">{selectedDecision.decision_type}</span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Created On:</span>
              <span className="detail-value">
                {selectedDecision.created_date_formatted || todayShortFormatted}
              </span>
            </div>

            <div style={{ marginTop: "14px" }}>
              <span className="detail-label" style={{ display: "block", marginBottom: "4px" }}>
                Description:
              </span>
              <div className="detail-description-box">
                {selectedDecision.description || "No description provided."}
              </div>
            </div>

            
            <div className="reviewer-actions-box">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <div className="reviewer-actions-title" style={{ margin: 0 }}>
                  Decision Status Management
                </div>
                <div>
                  {renderStatusBadge(selectedDecision.status)}
                </div>
              </div>

              {((user?.role || "").toUpperCase() === "MANAGER" || (user?.role || "").toUpperCase() === "ADMINISTRATOR") ? (
                <div className="manager-access-note allowed">
                  <span>✓</span> Manager Authority Active: You can update decision status.
                </div>
              ) : (
                <div className="manager-access-note restricted">
                  <span>🔒</span> Restricted: Only Managers can update decision status. (Current role: {user?.role || "EMPLOYEE"})
                </div>
              )}

              <div className="reviewer-buttons-group" style={{ marginTop: "10px" }}>
                <button
                  className="btn-review-status draft"
                  disabled={selectedDecision.status === "DRAFT" || !((user?.role || "").toUpperCase() === "MANAGER" || (user?.role || "").toUpperCase() === "ADMINISTRATOR")}
                  onClick={() => handleUpdateStatus(selectedDecision.id, "DRAFT")}
                  title={((user?.role || "").toUpperCase() === "MANAGER" || (user?.role || "").toUpperCase() === "ADMINISTRATOR") ? "Reset to Draft" : "Only Manager can update status"}
                >
                  Set to Draft
                </button>
                <button
                  className="btn-review-status in-review"
                  disabled={selectedDecision.status === "IN_REVIEW" || !((user?.role || "").toUpperCase() === "MANAGER" || (user?.role || "").toUpperCase() === "ADMINISTRATOR")}
                  onClick={() => handleUpdateStatus(selectedDecision.id, "IN_REVIEW")}
                  title={((user?.role || "").toUpperCase() === "MANAGER" || (user?.role || "").toUpperCase() === "ADMINISTRATOR") ? "Mark Under Review" : "Only Manager can update status"}
                >
                  Mark Under Review
                </button>
                <button
                  className="btn-review-status approve"
                  disabled={selectedDecision.status === "APPROVED" || !((user?.role || "").toUpperCase() === "MANAGER" || (user?.role || "").toUpperCase() === "ADMINISTRATOR")}
                  onClick={() => handleUpdateStatus(selectedDecision.id, "APPROVED")}
                  title={((user?.role || "").toUpperCase() === "MANAGER" || (user?.role || "").toUpperCase() === "ADMINISTRATOR") ? "Approve Decision" : "Only Manager can update status"}
                >
                  Approve Decision
                </button>
                <button
                  className="btn-review-status reject"
                  disabled={selectedDecision.status === "REJECTED" || !((user?.role || "").toUpperCase() === "MANAGER" || (user?.role || "").toUpperCase() === "ADMINISTRATOR")}
                  onClick={() => handleUpdateStatus(selectedDecision.id, "REJECTED")}
                  title={((user?.role || "").toUpperCase() === "MANAGER" || (user?.role || "").toUpperCase() === "ADMINISTRATOR") ? "Reject Decision" : "Only Manager can update status"}
                >
                  Reject Decision
                </button>
              </div>
            </div>

            
            <div className="files-section">
              <h4>Supporting Documents & Files</h4>
              <div className="file-upload-row">
                <input
                  type="file"
                  onChange={(e) => setSelectedUploadFile(e.target.files[0])}
                />
                <button
                  className="btn-secondary"
                  onClick={() => handleFileUpload(selectedDecision.id)}
                >
                  Upload File
                </button>
              </div>

              {uploadedFiles.length > 0 ? (
                <div>
                  {uploadedFiles.map((f) => (
                    <div className="file-list-item" key={f.id}>
                      <span>📄 {f.filename}</span>
                      <button
                        className="btn-table-view"
                        onClick={() =>
                          window.open(`${API_URL}/files/${f.id}/download`, "_blank")
                        }
                      >
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                  No files uploaded for this decision yet.
                </div>
              )}
            </div>

            <div className="modal-actions-row">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setSelectedDecision(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      
      {toastMessage && (
        <div className="toast-banner">
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default App;
