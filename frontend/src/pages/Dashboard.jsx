import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  BarChart3,
  Bell,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Database,
  FileText,
  GitBranch,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  X,
  Zap,
} from "lucide-react";

import "../styles/Dashboard.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

const EMPTY_DECISION_FORM = {
  title: "",
  problemStatement: "",
  status: "Draft",
};

const EMPTY_ALTERNATIVE_FORM = {
  name: "",
  pros: "",
  cons: "",
  cost: "",
  feasibility: "",
  risk: "",
};

function Dashboard() {
  const navigate = useNavigate();
  const modalRef = useRef(null);

  const [activePage, setActivePage] = useState("Overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [modal, setModal] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [moreMenu, setMoreMenu] = useState(null);

  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentUser, setCurrentUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  const [decisionForm, setDecisionForm] = useState(EMPTY_DECISION_FORM);
  const [alternativeForm, setAlternativeForm] = useState(
    EMPTY_ALTERNATIVE_FORM,
  );
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [discussionForm, setDiscussionForm] = useState({
    type: "Comment",
    content: "",
    parentId: "",
  });
  const [savingDiscussion, setSavingDiscussion] = useState(false);
  const [deletingDiscussionId, setDeletingDiscussionId] = useState(null);
  const [editingDiscussion, setEditingDiscussion] = useState(null);
  const [selectedDiscussionFile, setSelectedDiscussionFile] = useState(null);
  const [uploadingDiscussionFile, setUploadingDiscussionFile] = useState(false);

  const [creatingDecision, setCreatingDecision] = useState(false);
  const [savingDecision, setSavingDecision] = useState(false);
  const [deletingDecision, setDeletingDecision] = useState(false);
  const [savingAlternative, setSavingAlternative] = useState(false);
  const [deletingAlternativeId, setDeletingAlternativeId] = useState(null);

  const [selectedDecision, setSelectedDecision] = useState(null);
  const [editingAlternative, setEditingAlternative] = useState(null);
  const [decisionTab, setDecisionTab] = useState("overview");
  const [selectedAlternative, setSelectedAlternative] = useState(null);

  const normalizedRole = (currentUser?.role || "Employee").trim().toLowerCase();

  const role = normalizedRole === "admin" ? "administrator" : normalizedRole;

  const isEmployee = role === "employee";
  const isReviewer = role === "reviewer";
  const isManager = role === "manager";
  const isAdministrator = role === "administrator";
  const canReview = isReviewer || isManager || isAdministrator;

  const navigation = [
    { label: "Overview", icon: LayoutDashboard, show: true },
    { label: "Decisions", icon: FileText, show: true },
    { label: "Reviews", icon: Clock3, show: canReview },
    { label: "Knowledge", icon: BookOpen, show: true },
    { label: "Teams", icon: Users, show: true },
    { label: "Discussions", icon: MessageCircle, show: true },
    { label: "Documents", icon: FileText, show: true },
    { label: "Analytics", icon: BarChart3, show: isManager || isAdministrator },
    { label: "Users", icon: Users, show: isAdministrator },
    { label: "Audit & Compliance", icon: ShieldCheck, show: isAdministrator },
  ].filter((item) => item.show);

  const getToken = () => {
    return localStorage.getItem("token");
  };

  const handleUnauthorized = () => {
    localStorage.removeItem("token");
    navigate("/login", {
      replace: true,
    });
  };

  const apiRequest = async (path, options = {}) => {
    const token = getToken();

    if (!token) {
      handleUnauthorized();
      throw new Error("Authentication required");
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body && !(options.body instanceof FormData)
          ? {
              "Content-Type": "application/json",
            }
          : {}),
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });

    let data = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (response.status === 401) {
      handleUnauthorized();

      throw new Error("Your session has expired. Please sign in again.");
    }

    if (!response.ok) {
      throw new Error(data?.message || "Something went wrong.");
    }

    return data;
  };

  const getDecisionIcon = (title = "") => {
    const value = title.toLowerCase();

    if (value.includes("database")) {
      return Database;
    }

    if (value.includes("architecture")) {
      return GitBranch;
    }

    if (value.includes("ai") || value.includes("model")) {
      return Sparkles;
    }

    if (value.includes("security") || value.includes("privacy")) {
      return ShieldCheck;
    }

    return Zap;
  };

  const displayStatus = (status = "Draft") => {
    const statusMap = {
      Draft: "Draft",
      UnderReview: "Under Review",
      Approved: "Approved",
      Rejected: "Rejected",
      Archived: "Archived",
    };

    return statusMap[status] || status;
  };

  const statusApiValue = (status) => {
    const statusMap = {
      Draft: "Draft",
      "Under Review": "UnderReview",
      UnderReview: "UnderReview",
      Approved: "Approved",
      Rejected: "Rejected",
      Archived: "Archived",
    };

    return statusMap[status] || "Draft";
  };

  const formatDecisionDate = (date) => {
    if (!date) {
      return "—";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(parsedDate);
  };

  const formatRelativeTime = (date) => {
    if (!date) {
      return "—";
    }

    const timestamp = new Date(date).getTime();

    if (Number.isNaN(timestamp)) {
      return "—";
    }

    const difference = Date.now() - timestamp;
    const minutes = Math.max(0, Math.floor(difference / 60000));

    if (minutes < 1) {
      return "Just now";
    }

    if (minutes < 60) {
      return `${minutes} min ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
      return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    }

    const days = Math.floor(hours / 24);

    return `${days} day${days === 1 ? "" : "s"} ago`;
  };

  const fetchDecisions = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await apiRequest("/api/decisions");

      setDecisions(Array.isArray(data?.decisions) ? data.decisions : []);
    } catch (fetchError) {
      console.error("Fetch decisions error:", fetchError);

      if (fetchError.message !== "Authentication required") {
        setError(fetchError.message || "Unable to load decisions.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      setUserLoading(true);

      const data = await apiRequest("/api/auth/me");

      setCurrentUser(data?.user || null);
    } catch (userError) {
      console.error("Fetch user error:", userError);
    } finally {
      setUserLoading(false);
    }
  };

  useEffect(() => {
    fetchDecisions();
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (modalRef.current) {
      modalRef.current.scrollTop = 0;
    }
  }, [modal]);

  const dashboardDecisions = useMemo(() => {
    return decisions.map((decision) => ({
      ...decision,
      name: decision.title,
      team: decision.createdBy?.team || "My Workspace",
      status: displayStatus(decision.status),
      created: formatDecisionDate(decision.createdAt),
      relativeCreated: formatRelativeTime(decision.createdAt),
      icon: getDecisionIcon(decision.title),
    }));
  }, [decisions]);

  const filteredDecisions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return dashboardDecisions;
    }

    return dashboardDecisions.filter((decision) =>
      [
        decision.name,
        decision.team,
        decision.status,
        decision.created,
        decision.problemStatement,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [dashboardDecisions, searchQuery]);

  const recentDecisions = filteredDecisions.slice(0, 5);

  const totalDecisions = decisions.length;

  const draftCount = decisions.filter(
    (decision) => decision.status === "Draft",
  ).length;

  const reviewCount = decisions.filter(
    (decision) => decision.status === "UnderReview",
  ).length;

  const approvedCount = decisions.filter(
    (decision) => decision.status === "Approved",
  ).length;

  const rejectedCount = decisions.filter(
    (decision) => decision.status === "Rejected",
  ).length;

  const approvalRate = totalDecisions
    ? Math.round((approvedCount / totalDecisions) * 100)
    : 0;

  const statusPercent = (count) => {
    if (!totalDecisions) {
      return 0;
    }

    return Math.round((count / totalDecisions) * 100);
  };

  const getStatusClass = (status) => {
    return status.toLowerCase().replaceAll(" ", "-");
  };

  const handlePageChange = (page) => {
    setActivePage(page);
    setMobileOpen(false);
    setProfileOpen(false);
    setNotificationsOpen(false);
    setMoreMenu(null);
  };

  const openCreateDecision = () => {
    setDecisionForm(EMPTY_DECISION_FORM);

    setModal({
      type: "create-decision",
    });

    setMoreMenu(null);
  };

  const openEditDecision = (decision) => {
    setDecisionForm({
      title: decision.title || "",
      problemStatement: decision.problemStatement || "",
      status: decision.status || "Draft",
    });

    setModal({
      type: "edit-decision",
      decision,
    });

    setMoreMenu(null);
  };

  const openDecision = async (decision) => {
    try {
      const data = await apiRequest(`/api/decisions/${decision.id}`);

      const alternatives = await apiRequest(
        `/api/decisions/${decision.id}/alternatives`,
      );

      const documents = await apiRequest(
        `/api/decisions/${decision.id}/documents`,
      );

      const discussions = await apiRequest(
        `/api/decisions/${decision.id}/discussions`,
      );

      setSelectedDecision({
        ...(data?.decision || decision),
        alternatives: Array.isArray(alternatives)
          ? alternatives
          : alternatives?.alternatives || [],
        documents: Array.isArray(documents)
          ? documents
          : documents?.documents || [],
        discussions: Array.isArray(discussions)
          ? discussions
          : discussions?.discussions || [],
      });

      setAlternativeForm(EMPTY_ALTERNATIVE_FORM);
      setEditingAlternative(null);
      setSelectedFile(null);
      setDiscussionForm({ type: "Comment", content: "", parentId: "" });
      setEditingDiscussion(null);
      setSelectedDiscussionFile(null);
      setDecisionTab("overview");

      setModal({
        type: "view-decision",
      });
    } catch (viewError) {
      console.error("Open decision error:", viewError);

      alert(viewError.message || "Unable to open decision.");
    }
  };

  const handleCreateDecision = async (event) => {
    event.preventDefault();

    if (!decisionForm.title.trim() || !decisionForm.problemStatement.trim()) {
      alert("Please fill in both the decision title and problem statement.");

      return;
    }

    try {
      setCreatingDecision(true);

      await apiRequest("/api/decisions", {
        method: "POST",
        body: JSON.stringify({
          title: decisionForm.title.trim(),
          problemStatement: decisionForm.problemStatement.trim(),
        }),
      });

      setDecisionForm(EMPTY_DECISION_FORM);

      setModal(null);

      await fetchDecisions();
    } catch (createError) {
      console.error("Create decision error:", createError);

      alert(createError.message || "Unable to create decision.");
    } finally {
      setCreatingDecision(false);
    }
  };

  const handleUpdateDecision = async (event) => {
    event.preventDefault();

    if (!decisionForm.title.trim() || !decisionForm.problemStatement.trim()) {
      alert("Please fill in both the decision title and problem statement.");

      return;
    }

    if (!modal?.decision?.id) {
      return;
    }

    try {
      setSavingDecision(true);

      const data = await apiRequest(`/api/decisions/${modal.decision.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: decisionForm.title.trim(),
          problemStatement: decisionForm.problemStatement.trim(),
          status: statusApiValue(decisionForm.status),
        }),
      });

      setModal(null);

      setSelectedDecision(data?.decision || null);

      await fetchDecisions();
    } catch (updateError) {
      console.error("Update decision error:", updateError);

      alert(updateError.message || "Unable to update decision.");
    } finally {
      setSavingDecision(false);
    }
  };

  const handleDeleteDecision = async (decision) => {
    const confirmed = window.confirm(
      `Delete "${decision.title}"? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingDecision(true);

      await apiRequest(`/api/decisions/${decision.id}`, {
        method: "DELETE",
      });

      setModal(null);
      setSelectedDecision(null);

      await fetchDecisions();
    } catch (deleteError) {
      console.error("Delete decision error:", deleteError);

      alert(deleteError.message || "Unable to delete decision.");
    } finally {
      setDeletingDecision(false);
    }
  };

  const handleSaveAlternative = async (event) => {
    event.preventDefault();

    if (!selectedDecision?.id || !alternativeForm.name.trim()) {
      alert("Alternative name is required.");

      return;
    }

    try {
      setSavingAlternative(true);

      let responseData;

      if (editingAlternative?.id) {
        responseData = await apiRequest(
          `/api/decisions/${selectedDecision.id}/alternatives/${editingAlternative.id}`,
          {
            method: "PATCH",
            body: JSON.stringify(alternativeForm),
          },
        );
      } else {
        responseData = await apiRequest(
          `/api/decisions/${selectedDecision.id}/alternatives`,
          {
            method: "POST",
            body: JSON.stringify(alternativeForm),
          },
        );
      }

      const savedAlternative = responseData?.alternative || responseData;

      const alternatives = editingAlternative?.id
        ? (selectedDecision.alternatives || []).map((alternative) =>
            alternative.id === editingAlternative.id
              ? savedAlternative
              : alternative,
          )
        : [...(selectedDecision.alternatives || []), savedAlternative];

      setSelectedDecision({
        ...selectedDecision,
        alternatives,
      });

      setAlternativeForm(EMPTY_ALTERNATIVE_FORM);

      setEditingAlternative(null);
    } catch (alternativeError) {
      console.error("Save alternative error:", alternativeError);

      alert(alternativeError.message || "Unable to save alternative.");
    } finally {
      setSavingAlternative(false);
    }
  };

  const handleEditAlternative = (alternative) => {
    setEditingAlternative(alternative);

    setAlternativeForm({
      name: alternative.name || "",
      pros: alternative.pros || "",
      cons: alternative.cons || "",
      cost: alternative.cost || "",
      feasibility: alternative.feasibility || "",
      risk: alternative.risk || "",
    });
  };

  const handleDeleteAlternative = async (alternative) => {
    if (!selectedDecision?.id) {
      return;
    }

    const confirmed = window.confirm(
      `Delete alternative "${alternative.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingAlternativeId(alternative.id);

      await apiRequest(
        `/api/decisions/${selectedDecision.id}/alternatives/${alternative.id}`,
        {
          method: "DELETE",
        },
      );

      setSelectedDecision({
        ...selectedDecision,
        alternatives: (selectedDecision.alternatives || []).filter(
          (item) => item.id !== alternative.id,
        ),
      });
    } catch (alternativeError) {
      console.error("Delete alternative error:", alternativeError);

      alert(alternativeError.message || "Unable to delete alternative.");
    } finally {
      setDeletingAlternativeId(null);
    }
  };

  const handleUploadDocument = async () => {
    if (!selectedDecision?.id || !selectedFile) {
      alert("Please select a file first.");
      return;
    }

    try {
      setUploadingDocument(true);

      const formData = new FormData();
      formData.append("file", selectedFile);

      const responseData = await apiRequest(
        `/api/decisions/${selectedDecision.id}/documents`,
        {
          method: "POST",
          body: formData,
        },
      );

      const savedDocument = responseData?.document || responseData;

      setSelectedDecision({
        ...selectedDecision,
        documents: [...(selectedDecision.documents || []), savedDocument],
      });

      setSelectedFile(null);
    } catch (documentError) {
      console.error("Upload document error:", documentError);
      alert(documentError.message || "Unable to upload document.");
    } finally {
      setUploadingDocument(false);
    }
  };

  const getDocumentUrl = (document) => {
    const rawPath = document?.url || document?.filePath || document?.path || "";

    if (!rawPath) {
      return "";
    }

    if (/^https?:\/\//i.test(rawPath)) {
      return rawPath;
    }

    const normalizedPath = rawPath.replace(/\\/g, "/").replace(/^\.\//, "");

    if (normalizedPath.startsWith("/")) {
      return `${API_BASE_URL}${normalizedPath}`;
    }

    if (normalizedPath.startsWith("uploads/")) {
      return `${API_BASE_URL}/${normalizedPath}`;
    }

    return `${API_BASE_URL}/uploads/${normalizedPath.split("/").pop()}`;
  };

  const handleOpenDocument = (document) => {
    const url = getDocumentUrl(document);

    if (!url) {
      alert("This document does not have a stored file path.");
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleSaveDiscussion = async (event) => {
    event.preventDefault();

    if (!selectedDecision?.id || !discussionForm.content.trim()) {
      alert("Discussion content is required.");
      return;
    }

    try {
      setSavingDiscussion(true);

      const path = editingDiscussion?.id
        ? `/api/decisions/${selectedDecision.id}/discussions/${editingDiscussion.id}`
        : `/api/decisions/${selectedDecision.id}/discussions`;

      const responseData = await apiRequest(path, {
        method: editingDiscussion?.id ? "PATCH" : "POST",
        body: JSON.stringify({
          type: discussionForm.type,
          content: discussionForm.content.trim(),
          parentId: discussionForm.parentId
            ? Number(discussionForm.parentId)
            : null,
        }),
      });

      const savedDiscussion = responseData?.discussion || responseData;
      const discussions = editingDiscussion?.id
        ? (selectedDecision.discussions || []).map((item) =>
            item.id === editingDiscussion.id ? savedDiscussion : item,
          )
        : [...(selectedDecision.discussions || []), savedDiscussion];

      setSelectedDecision({ ...selectedDecision, discussions });
      setDiscussionForm({ type: "Comment", content: "", parentId: "" });
      setEditingDiscussion(null);
    } catch (discussionError) {
      console.error("Save discussion error:", discussionError);
      alert(discussionError.message || "Unable to save discussion.");
    } finally {
      setSavingDiscussion(false);
    }
  };

  const handleEditDiscussion = (discussion) => {
    setEditingDiscussion(discussion);
    setDiscussionForm({
      type: discussion.type || "Comment",
      content: discussion.content || "",
      parentId: discussion.parentId ? String(discussion.parentId) : "",
    });
  };

  const handleUploadDiscussionAttachment = async (discussion) => {
    if (!selectedDiscussionFile) {
      alert("Please select a file first.");
      return;
    }

    try {
      setUploadingDiscussionFile(true);

      const formData = new FormData();
      formData.append("file", selectedDiscussionFile);

      const responseData = await apiRequest(
        `/api/discussions/${discussion.id}/attachments`,
        { method: "POST", body: formData },
      );

      const savedAttachment = responseData?.attachment || responseData;
      const discussions = (selectedDecision.discussions || []).map((item) =>
        item.id === discussion.id
          ? {
              ...item,
              attachments: [...(item.attachments || []), savedAttachment],
            }
          : item,
      );

      setSelectedDecision({ ...selectedDecision, discussions });
      setSelectedDiscussionFile(null);
    } catch (attachmentError) {
      console.error("Upload discussion attachment error:", attachmentError);
      alert(attachmentError.message || "Unable to upload attachment.");
    } finally {
      setUploadingDiscussionFile(false);
    }
  };

  const handleDeleteDiscussion = async (discussion) => {
    if (!selectedDecision?.id) return;

    const confirmed = window.confirm(
      "Delete this discussion entry? This cannot be undone.",
    );

    if (!confirmed) return;

    try {
      setDeletingDiscussionId(discussion.id);

      await apiRequest(
        `/api/decisions/${selectedDecision.id}/discussions/${discussion.id}`,
        { method: "DELETE" },
      );

      setSelectedDecision({
        ...selectedDecision,
        discussions: (selectedDecision.discussions || []).filter(
          (item) => item.id !== discussion.id,
        ),
      });
    } catch (discussionError) {
      console.error("Delete discussion error:", discussionError);
      alert(discussionError.message || "Unable to delete discussion.");
    } finally {
      setDeletingDiscussionId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");

    navigate("/login", {
      replace: true,
    });
  };

  const firstName = currentUser?.name?.split(" ")[0] || "there";

  const initials = currentUser?.name
    ? currentUser.name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase()
    : "DV";

  const showOverview = activePage === "Overview";

  const showDecisionsPage = activePage === "Decisions";

  const roleDashboardCopy =
    {
      employee:
        "Manage your decisions, activity and team knowledge from one workspace.",
      reviewer: "Review assigned decisions and keep approval workflows moving.",
      manager: "Monitor team decisions, approvals and decision performance.",
      administrator:
        "Monitor the organization’s decisions, activity and governance.",
    }[role] || "Manage decisions and reviews from one intelligent workspace.";

  const donutStyle = totalDecisions
    ? {
        background: `conic-gradient(
          #6f7b74 0% ${statusPercent(draftCount)}%,
          #d3a83b ${statusPercent(draftCount)}% ${
            statusPercent(draftCount) + statusPercent(reviewCount)
          }%,
          #2b8a57 ${statusPercent(draftCount) + statusPercent(reviewCount)}% ${
            statusPercent(draftCount) +
            statusPercent(reviewCount) +
            statusPercent(approvedCount)
          }%,
          #d27663 ${
            statusPercent(draftCount) +
            statusPercent(reviewCount) +
            statusPercent(approvedCount)
          }% 100%
        )`,
      }
    : undefined;

  return (
    <div className="dashboard">
      <div className="dashboard-grid" />

      <div className="dashboard-glow dashboard-glow-1" />

      <div className="dashboard-glow dashboard-glow-2" />

      <header className="mobile-header">
        <div className="dashboard-brand">
          <div className="brand-mark">
            <LockKeyhole size={16} strokeWidth={2.2} />
          </div>

          <span>
            Decision<span>Vault</span>
          </span>
        </div>

        <button
          className="mobile-menu-button"
          onClick={() => setMobileOpen((value) => !value)}
          aria-label="Toggle navigation"
          type="button"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div>
          <div className="sidebar-brand">
            <div className="brand-mark">
              <LockKeyhole size={16} strokeWidth={2.2} />
            </div>

            <span>
              Decision<span>Vault</span>
            </span>
          </div>

          <div className="sidebar-section">
            <span className="sidebar-label">Workspace</span>

            <nav className="dashboard-nav">
              {navigation.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.label}
                    className={
                      activePage === item.label ? "nav-item active" : "nav-item"
                    }
                    onClick={() => handlePageChange(item.label)}
                    type="button"
                  >
                    <Icon size={17} />

                    <span>{item.label}</span>

                    {activePage === item.label && (
                      <span className="nav-indicator" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="sidebar-bottom">
          <button
            className={
              activePage === "Settings" ? "nav-item active" : "nav-item"
            }
            onClick={() => handlePageChange("Settings")}
            type="button"
          >
            <Settings size={17} />

            <span>Settings</span>

            {activePage === "Settings" && <span className="nav-indicator" />}
          </button>

          <button
            className="sidebar-profile"
            type="button"
            onClick={() => setProfileOpen((value) => !value)}
          >
            <div className="profile-avatar">{initials[0]}</div>

            <div className="profile-info">
              <strong>
                {userLoading
                  ? "Loading account"
                  : currentUser?.name || "Decision Workspace"}
              </strong>

              <span>{currentUser?.role || "Personal space"}</span>
            </div>
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <div className="dashboard-content">
          <header className="dashboard-topbar">
            <div className="dashboard-search">
              <Search size={17} />

              <input
                type="search"
                placeholder="Search decisions, teams, documents..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                aria-label="Search decisions, teams, documents"
              />

              {searchQuery && (
                <button
                  type="button"
                  className="search-clear"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="topbar-actions">
              <button
                className="icon-button"
                type="button"
                aria-label="Notifications"
                onClick={() => {
                  setNotificationsOpen((value) => !value);

                  setProfileOpen(false);
                }}
              >
                <Bell size={17} />

                {(reviewCount > 0 || error) && (
                  <span className="notification-dot" />
                )}
              </button>

              <button
                className="topbar-profile"
                type="button"
                onClick={() => {
                  setProfileOpen((value) => !value);

                  setNotificationsOpen(false);
                }}
              >
                <span className="topbar-avatar">{initials[0]}</span>

                <span className="topbar-profile-copy">
                  <strong>{currentUser?.name || "Decision Workspace"}</strong>

                  <small>{currentUser?.role || "Employee"}</small>
                </span>

                <ChevronRight size={15} className="profile-chevron" />
              </button>
            </div>

            {notificationsOpen && (
              <div className="topbar-popover notification-popover">
                <span className="popover-label">NOTIFICATIONS</span>

                <strong>
                  {reviewCount > 0
                    ? `${reviewCount} decision${
                        reviewCount === 1 ? "" : "s"
                      } under review`
                    : error
                      ? "Dashboard needs attention"
                      : "Workspace is up to date"}
                </strong>

                {canReview && (
                  <button
                    type="button"
                    onClick={() => handlePageChange("Reviews")}
                  >
                    Open reviews
                    <ArrowUpRight size={13} />
                  </button>
                )}

                <button type="button" onClick={fetchDecisions}>
                  Refresh decisions
                  <ArrowUpRight size={13} />
                </button>
              </div>
            )}

            {profileOpen && (
              <div className="topbar-popover profile-popover">
                <span className="popover-label">ACCOUNT</span>

                <strong>{currentUser?.name || "Decision Workspace"}</strong>

                <button
                  type="button"
                  onClick={() => handlePageChange("Settings")}
                >
                  Settings
                  <ArrowUpRight size={13} />
                </button>

                <button type="button" onClick={handleLogout}>
                  Sign out
                  <ArrowUpRight size={13} />
                </button>
              </div>
            )}
          </header>

          {showOverview && (
            <>
              <section className="welcome-section">
                <div>
                  <div className="welcome-eyebrow">
                    <Sparkles size={13} />
                    Decision intelligence
                  </div>

                  <h1>
                    Welcome back
                    {firstName !== "there" ? `, ${firstName}` : ""}.
                  </h1>

                  <p>{roleDashboardCopy}</p>
                </div>

                <div className="welcome-actions">
                  <span className="dashboard-date">
                    {new Intl.DateTimeFormat("en-IN", {
                      weekday: "long",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }).format(new Date())}
                  </span>

                  <button
                    className="new-decision-button"
                    type="button"
                    onClick={openCreateDecision}
                  >
                    <span>+</span>
                    New decision
                  </button>
                </div>
              </section>

              <section className="stats-grid stats-grid-five">
                <button
                  className="stat-card stat-button-card"
                  type="button"
                  onClick={() => handlePageChange("Decisions")}
                >
                  <div className="stat-top">
                    <div className="stat-icon">
                      <BarChart3 size={18} />
                    </div>

                    <span className="stat-period">All time</span>
                  </div>

                  <p>Total decisions</p>

                  <div className="stat-value">{totalDecisions}</div>

                  <div className="stat-footer">
                    <span>{dashboardDecisions.length}</span>

                    <span>tracked now</span>
                  </div>
                </button>

                <button
                  className="stat-card stat-button-card"
                  type="button"
                  onClick={() => setSearchQuery("Draft")}
                >
                  <div className="stat-top">
                    <div className="stat-icon draft-stat-icon">
                      <FileText size={18} />
                    </div>

                    <span className="stat-period">Active</span>
                  </div>

                  <p>Draft</p>

                  <div className="stat-value">{draftCount}</div>

                  <div className="stat-footer">
                    <span>Needs attention</span>
                  </div>
                </button>

                <button
                  className="stat-card stat-button-card"
                  type="button"
                  onClick={() => setSearchQuery("Under Review")}
                >
                  <div className="stat-top">
                    <div className="stat-icon review-stat-icon">
                      <Clock3 size={18} />
                    </div>

                    <span className="stat-period">Active</span>
                  </div>

                  <p>Under review</p>

                  <div className="stat-value">{reviewCount}</div>

                  <div className="stat-footer">
                    <span>In progress</span>
                  </div>
                </button>

                <button
                  className="stat-card stat-button-card"
                  type="button"
                  onClick={() => setSearchQuery("Approved")}
                >
                  <div className="stat-top">
                    <div className="stat-icon success-icon">
                      <CheckCircle2 size={18} />
                    </div>

                    <span className="stat-period">Completed</span>
                  </div>

                  <p>Approved</p>

                  <div className="stat-value">{approvedCount}</div>

                  <div className="stat-footer">
                    <span className="positive">{approvalRate}%</span>

                    <span>approval rate</span>
                  </div>
                </button>

                <button
                  className="stat-card stat-button-card"
                  type="button"
                  onClick={() => setSearchQuery("Rejected")}
                >
                  <div className="stat-top">
                    <div className="stat-icon rejected-stat-icon">
                      <X size={18} />
                    </div>

                    <span className="stat-period">Action</span>
                  </div>

                  <p>Rejected</p>

                  <div className="stat-value">{rejectedCount}</div>

                  <div className="stat-footer">
                    <span>Requires changes</span>
                  </div>
                </button>
              </section>

              <section className="dashboard-primary-grid">
                <section className="recent-section">
                  <div className="recent-header">
                    <div>
                      <span className="section-label">DECISION LOG</span>

                      <h2>Recent decisions</h2>
                    </div>

                    <div className="recent-actions">
                      <button
                        className="view-all"
                        type="button"
                        onClick={() => handlePageChange("Decisions")}
                      >
                        View all
                        <ChevronRight size={15} />
                      </button>

                      <button
                        className="compact-action"
                        type="button"
                        onClick={openCreateDecision}
                      >
                        <span>+</span>
                        Create decision
                      </button>
                    </div>
                  </div>

                  <div className="decision-table-head">
                    <span>Title</span>
                    <span>Team</span>
                    <span>Status</span>
                    <span>Created on</span>
                    <span>Actions</span>
                  </div>

                  <div className="decision-list">
                    {loading ? (
                      <div className="empty-search-state">
                        <Clock3 size={18} />

                        <strong>Loading decisions</strong>

                        <span>Fetching your workspace data.</span>
                      </div>
                    ) : error ? (
                      <div className="empty-search-state">
                        <X size={18} />

                        <strong>Unable to load decisions</strong>

                        <span>{error}</span>

                        <button type="button" onClick={fetchDecisions}>
                          Try again
                        </button>
                      </div>
                    ) : recentDecisions.length > 0 ? (
                      recentDecisions.map((decision) => {
                        const Icon = decision.icon;

                        const statusClass = getStatusClass(decision.status);

                        return (
                          <div
                            className="decision-row decision-table-row"
                            key={decision.id}
                          >
                            <div className="decision-left">
                              <div className="decision-icon">
                                <Icon size={17} />
                              </div>

                              <div className="decision-info">
                                <strong>{decision.name}</strong>

                                <span>{decision.team}</span>
                              </div>
                            </div>

                            <span className="decision-team">
                              {decision.team}
                            </span>

                            <span className={`status status-${statusClass}`}>
                              <span />
                              {decision.status}
                            </span>

                            <span className="decision-date">
                              {decision.created}
                            </span>

                            <div className="decision-actions">
                              <button
                                className="decision-view-button"
                                type="button"
                                onClick={() => openDecision(decision)}
                                aria-label={`View ${decision.name}`}
                              >
                                View
                              </button>

                              <button
                                className="decision-more"
                                type="button"
                                onClick={() =>
                                  setMoreMenu(
                                    moreMenu === decision.name
                                      ? null
                                      : decision.name,
                                  )
                                }
                                aria-label={`More options for ${decision.name}`}
                              >
                                <MoreHorizontal size={16} />
                              </button>

                              {moreMenu === decision.name && (
                                <div className="decision-more-menu">
                                  <button
                                    type="button"
                                    onClick={() => openDecision(decision)}
                                  >
                                    Open
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => openEditDecision(decision)}
                                  >
                                    Edit
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeleteDecision(decision)
                                    }
                                  >
                                    Delete
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setMoreMenu(null)}
                                  >
                                    Close menu
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="empty-search-state">
                        <Search size={18} />

                        <strong>No decisions found</strong>

                        <span>
                          {searchQuery
                            ? "Try a different search term."
                            : "Create your first decision to get started."}
                        </span>

                        {!searchQuery && (
                          <button type="button" onClick={openCreateDecision}>
                            Create decision
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    className="decision-list-footer"
                    type="button"
                    onClick={() => handlePageChange("Decisions")}
                  >
                    View all decisions
                    <ChevronRight size={15} />
                  </button>
                </section>

                <section className="activity-column team-activity-column">
                  <div className="activity-heading">
                    <div>
                      <span className="section-label">TEAM ACTIVITY</span>

                      <h2>What’s happening</h2>
                    </div>

                    <button
                      className="view-all"
                      type="button"
                      onClick={() => handlePageChange("Discussions")}
                    >
                      View all
                      <ChevronRight size={15} />
                    </button>
                  </div>

                  <div className="team-activity-list">
                    <div className="dashboard-empty-state">
                      <div className="dashboard-empty-icon">
                        <Users size={18} />
                      </div>

                      <strong>No team activity yet</strong>

                      <span>
                        Team activity will appear here once collaboration
                        features are connected.
                      </span>
                    </div>
                  </div>
                </section>
              </section>

              <section className="dashboard-lower-grid">
                <section className="status-card-panel">
                  <div className="lower-card-header">
                    <div>
                      <span className="section-label">OVERVIEW</span>

                      <h2>Decisions by status</h2>
                    </div>
                  </div>

                  <div className="status-chart-layout">
                    <div className="decision-donut" style={donutStyle}>
                      <div className="decision-donut-center">
                        <strong>{totalDecisions}</strong>

                        <span>Total</span>
                      </div>
                    </div>

                    <div className="status-legend">
                      <div>
                        <span className="legend-dot legend-draft" />
                        <span>Draft</span>

                        <strong>
                          {draftCount} ({statusPercent(draftCount)}
                          %)
                        </strong>
                      </div>

                      <div>
                        <span className="legend-dot legend-review" />
                        <span>Under review</span>

                        <strong>
                          {reviewCount} ({statusPercent(reviewCount)}
                          %)
                        </strong>
                      </div>

                      <div>
                        <span className="legend-dot legend-approved" />
                        <span>Approved</span>

                        <strong>
                          {approvedCount} ({statusPercent(approvedCount)}
                          %)
                        </strong>
                      </div>

                      <div>
                        <span className="legend-dot legend-rejected" />
                        <span>Rejected</span>

                        <strong>
                          {rejectedCount} ({statusPercent(rejectedCount)}
                          %)
                        </strong>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="lower-panel">
                  <div className="lower-card-header">
                    <div>
                      <span className="section-label">TEAM CONVERSATIONS</span>

                      <h2>Recent discussions</h2>
                    </div>

                    <button
                      className="view-all"
                      type="button"
                      onClick={() => handlePageChange("Discussions")}
                    >
                      View all
                      <ChevronRight size={15} />
                    </button>
                  </div>

                  <div className="discussion-list">
                    <div className="dashboard-empty-state">
                      <div className="dashboard-empty-icon">
                        <MessageCircle size={18} />
                      </div>

                      <strong>No discussions yet</strong>

                      <span>
                        Discussions will appear here when a decision has an
                        active conversation.
                      </span>
                    </div>
                  </div>
                </section>

                <section className="lower-panel">
                  <div className="lower-card-header">
                    <div>
                      <span className="section-label">WORKSPACES</span>

                      <h2>My teams</h2>
                    </div>

                    <button
                      className="view-all"
                      type="button"
                      onClick={() => handlePageChange("Teams")}
                    >
                      View all
                      <ChevronRight size={15} />
                    </button>
                  </div>

                  <div className="team-list">
                    <div className="dashboard-empty-state">
                      <div className="dashboard-empty-icon">
                        <Users size={18} />
                      </div>

                      <strong>No teams yet</strong>

                      <span>
                        Teams will appear here when team management is
                        connected.
                      </span>
                    </div>
                  </div>
                </section>
              </section>

              {isEmployee ? (
                <section className="activity-section employee-activity-section">
                  <div className="activity-column">
                    <div className="activity-heading">
                      <div>
                        <span className="section-label">MY ACTIVITY</span>
                        <h2>Recent activity</h2>
                      </div>

                      <span className="activity-count">
                        {totalDecisions} item{totalDecisions === 1 ? "" : "s"}
                      </span>
                    </div>

                    <div className="activity-list">
                      {totalDecisions > 0 ? (
                        <>
                          <div className="activity-row">
                            <div className="activity-status draft" />

                            <div className="activity-info">
                              <strong>My draft decisions</strong>
                              <span>{draftCount} currently in progress</span>
                            </div>

                            <span className="activity-time">
                              {draftCount} item{draftCount === 1 ? "" : "s"}
                            </span>
                          </div>

                          <div className="activity-row">
                            <div className="activity-status approved" />

                            <div className="activity-info">
                              <strong>Approved decisions</strong>
                              <span>Decisions completed successfully</span>
                            </div>

                            <span className="activity-time">
                              {approvedCount} item
                              {approvedCount === 1 ? "" : "s"}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="activity-row">
                          <div className="activity-status approved" />

                          <div className="activity-info">
                            <strong>No recent activity</strong>
                            <span>
                              Create a decision to start building your
                              workspace.
                            </span>
                          </div>

                          <span className="activity-time">Ready</span>
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              ) : (
                <section className="activity-section">
                  <div className="activity-column">
                    <div className="activity-heading">
                      <div>
                        <span className="section-label">NEEDS ATTENTION</span>
                        <h2>Decision activity</h2>
                      </div>

                      <span className="activity-count">
                        {reviewCount + draftCount} items
                      </span>
                    </div>

                    <div className="activity-list">
                      {reviewCount > 0 && (
                        <div className="activity-row">
                          <div className="activity-status review" />

                          <div className="activity-info">
                            <strong>Decisions under review</strong>
                            <span>Review required</span>
                          </div>

                          <span className="activity-time">
                            {reviewCount} item
                            {reviewCount === 1 ? "" : "s"}
                          </span>
                        </div>
                      )}

                      {draftCount > 0 && (
                        <div className="activity-row">
                          <div className="activity-status draft" />

                          <div className="activity-info">
                            <strong>Draft decisions</strong>
                            <span>Still in development</span>
                          </div>

                          <span className="activity-time">
                            {draftCount} item
                            {draftCount === 1 ? "" : "s"}
                          </span>
                        </div>
                      )}

                      {reviewCount === 0 && draftCount === 0 && (
                        <div className="activity-row">
                          <div className="activity-status approved" />

                          <div className="activity-info">
                            <strong>Workspace is clear</strong>
                            <span>No pending decision actions</span>
                          </div>

                          <span className="activity-time">Done</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="activity-column">
                    <div className="activity-heading">
                      <div>
                        <span className="section-label">UPCOMING</span>
                        <h2>
                          {isReviewer
                            ? "Pending reviews"
                            : isManager
                              ? "Pending approvals"
                              : "Review oversight"}
                        </h2>
                      </div>

                      <button
                        className="view-all"
                        type="button"
                        onClick={() => handlePageChange("Reviews")}
                      >
                        View all
                        <ChevronRight size={15} />
                      </button>
                    </div>

                    <div className="activity-list">
                      {reviewCount > 0 ? (
                        <div className="activity-row">
                          <div className="review-date">
                            <strong>{reviewCount}</strong>
                            <span>OPEN</span>
                          </div>

                          <div className="activity-info">
                            <strong>
                              {isManager
                                ? "Pending decision approvals"
                                : "Pending decision reviews"}
                            </strong>
                            <span>
                              {isAdministrator
                                ? "Organization review oversight"
                                : "Review workflow"}
                            </span>
                          </div>

                          <span className="activity-time">Now</span>
                        </div>
                      ) : (
                        <div className="activity-row">
                          <div className="review-date">
                            <strong>—</strong>
                            <span>CLEAR</span>
                          </div>

                          <div className="activity-info">
                            <strong>No pending reviews</strong>
                            <span>
                              {isManager
                                ? "No approvals currently waiting"
                                : "You're all caught up"}
                            </span>
                          </div>

                          <span className="activity-time">Done</span>
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              )}

              <section className="insight-card">
                <div className="insight-icon">
                  <Sparkles size={20} />
                </div>

                <div className="insight-content">
                  <span>DECISIONVAULT INSIGHT</span>

                  <h3>Your decisions are becoming a knowledge graph.</h3>

                  <p>
                    Connect assumptions, evidence and outcomes to make future
                    decisions easier to understand.
                  </p>
                </div>

                <button
                  className="insight-button"
                  type="button"
                  onClick={() => handlePageChange("Knowledge")}
                >
                  Explore knowledge
                  <ChevronRight size={16} />
                </button>
              </section>
            </>
          )}

          {showDecisionsPage && (
            <section className="workspace-page">
              <div className="workspace-page-header">
                <div>
                  <span className="section-label">DECISION WORKSPACE</span>

                  <h1>All decisions</h1>

                  <p>Manage every decision stored in your workspace.</p>
                </div>

                <button
                  className="new-decision-button"
                  type="button"
                  onClick={openCreateDecision}
                >
                  <span>+</span>
                  New decision
                </button>
              </div>

              <div className="workspace-toolbar">
                <span>
                  {filteredDecisions.length} result
                  {filteredDecisions.length === 1 ? "" : "s"}
                </span>

                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery("")}>
                    Clear search
                  </button>
                )}
              </div>

              <div className="workspace-decisions-list">
                {loading ? (
                  <div className="empty-search-state">
                    <Clock3 size={18} />

                    <strong>Loading decisions</strong>

                    <span>Fetching your workspace data.</span>
                  </div>
                ) : error ? (
                  <div className="empty-search-state">
                    <X size={18} />

                    <strong>Unable to load decisions</strong>

                    <span>{error}</span>

                    <button type="button" onClick={fetchDecisions}>
                      Try again
                    </button>
                  </div>
                ) : filteredDecisions.length > 0 ? (
                  filteredDecisions.map((decision) => {
                    const Icon = decision.icon;

                    const statusClass = getStatusClass(decision.status);

                    return (
                      <div
                        className="workspace-decision-card"
                        key={decision.id}
                      >
                        <div className="decision-left">
                          <div className="decision-icon">
                            <Icon size={17} />
                          </div>

                          <div className="decision-info">
                            <strong>{decision.name}</strong>

                            <span>{decision.problemStatement}</span>
                          </div>
                        </div>

                        <span className={`status status-${statusClass}`}>
                          <span />
                          {decision.status}
                        </span>

                        <span className="decision-date">
                          {decision.created}
                        </span>

                        <div className="decision-actions">
                          <button
                            className="decision-view-button"
                            type="button"
                            onClick={() => openDecision(decision)}
                          >
                            View
                          </button>

                          <button
                            className="decision-more"
                            type="button"
                            onClick={() => openEditDecision(decision)}
                            aria-label={`Edit ${decision.name}`}
                          >
                            <MoreHorizontal size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="empty-search-state">
                    <Search size={18} />

                    <strong>No decisions found</strong>

                    <span>Create a new decision or adjust your search.</span>

                    <button type="button" onClick={openCreateDecision}>
                      Create decision
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}

          {!showOverview && !showDecisionsPage && (
            <section className="placeholder-page">
              <span className="section-label">WORKSPACE</span>

              <h1>{activePage}</h1>

              <p>
                This workspace is ready for its dedicated DecisionVault module.
              </p>
            </section>
          )}

          <footer className="dashboard-footer">
            <span>DecisionVault</span>

            <span>Decisions, preserved.</span>
          </footer>
        </div>
      </main>

      {modal && (
        <div
          className="dashboard-modal-backdrop"
          onClick={() => setModal(null)}
        >
          <div
            ref={modalRef}
            className="dashboard-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="dashboard-modal-close"
              type="button"
              onClick={() => setModal(null)}
              aria-label="Close"
            >
              <X size={17} />
            </button>

            {modal.type === "create-decision" && (
              <>
                <span className="modal-eyebrow">DECISION WORKSPACE</span>

                <h2>Create a new decision</h2>

                <p>Capture the problem before deciding on the solution.</p>

                <form
                  className="decision-create-form"
                  onSubmit={handleCreateDecision}
                >
                  <div className="form-group">
                    <label htmlFor="decision-title">Decision title</label>

                    <input
                      id="decision-title"
                      type="text"
                      placeholder="e.g. Choose database for DecisionVault"
                      value={decisionForm.title}
                      onChange={(event) =>
                        setDecisionForm({
                          ...decisionForm,
                          title: event.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="decision-problem">Problem statement</label>

                    <textarea
                      id="decision-problem"
                      rows="5"
                      placeholder="Describe the problem this decision needs to solve..."
                      value={decisionForm.problemStatement}
                      onChange={(event) =>
                        setDecisionForm({
                          ...decisionForm,
                          problemStatement: event.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="modal-actions">
                    <button
                      className="modal-secondary"
                      type="button"
                      onClick={() => setModal(null)}
                    >
                      Cancel
                    </button>

                    <button
                      className="modal-primary"
                      type="submit"
                      disabled={creatingDecision}
                    >
                      {creatingDecision ? "Creating..." : "Create decision"}

                      <ArrowUpRight size={14} />
                    </button>
                  </div>
                </form>
              </>
            )}

            {modal.type === "edit-decision" && (
              <>
                <span className="modal-eyebrow">EDIT DECISION</span>

                <h2>Edit decision</h2>

                <p>Update the decision information and current status.</p>

                <form
                  className="decision-create-form"
                  onSubmit={handleUpdateDecision}
                >
                  <div className="form-group">
                    <label htmlFor="edit-decision-title">Decision title</label>

                    <input
                      id="edit-decision-title"
                      type="text"
                      value={decisionForm.title}
                      onChange={(event) =>
                        setDecisionForm({
                          ...decisionForm,
                          title: event.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="edit-decision-problem">
                      Problem statement
                    </label>

                    <textarea
                      id="edit-decision-problem"
                      rows="5"
                      value={decisionForm.problemStatement}
                      onChange={(event) =>
                        setDecisionForm({
                          ...decisionForm,
                          problemStatement: event.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="decision-status">Status</label>

                    <select
                      id="decision-status"
                      value={decisionForm.status}
                      onChange={(event) =>
                        setDecisionForm({
                          ...decisionForm,
                          status: event.target.value,
                        })
                      }
                    >
                      <option value="Draft">Draft</option>

                      <option value="Under Review">Under Review</option>

                      <option value="Approved">Approved</option>

                      <option value="Rejected">Rejected</option>

                      <option value="Archived">Archived</option>
                    </select>
                  </div>

                  <div className="modal-actions">
                    <button
                      className="modal-secondary"
                      type="button"
                      onClick={() => setModal(null)}
                    >
                      Cancel
                    </button>

                    <button
                      className="modal-primary"
                      type="submit"
                      disabled={savingDecision}
                    >
                      {savingDecision ? "Saving..." : "Save changes"}

                      <ArrowUpRight size={14} />
                    </button>
                  </div>
                </form>
              </>
            )}

            {modal.type === "view-decision" && selectedDecision && (
              <>
                <div className="decision-modal-hero">
                  <div className="decision-modal-heading">
                    <span className="modal-eyebrow">
                      {displayStatus(selectedDecision.status).toUpperCase()}
                    </span>
                    <h2>{selectedDecision.title}</h2>
                    <p className="decision-detail-copy">
                      {selectedDecision.problemStatement}
                    </p>

                    <div className="decision-modal-meta-line">
                      <span>
                        Created {formatDecisionDate(selectedDecision.createdAt)}
                      </span>
                      <span>•</span>
                      <span>
                        {selectedDecision.createdBy?.name ||
                          currentUser?.name ||
                          "You"}
                      </span>
                      <span
                        className={`status status-${getStatusClass(displayStatus(selectedDecision.status))}`}
                      >
                        <span />
                        {displayStatus(selectedDecision.status)}
                      </span>
                    </div>
                  </div>

                  <div className="decision-modal-top-actions">
                    <button
                      className="modal-secondary"
                      type="button"
                      onClick={() => openEditDecision(selectedDecision)}
                    >
                      Edit
                    </button>
                    <button
                      className="modal-danger"
                      type="button"
                      onClick={() => handleDeleteDecision(selectedDecision)}
                      disabled={deletingDecision}
                    >
                      {deletingDecision ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>

                <div className="decision-summary-strip">
                  <div>
                    <span>Alternatives</span>
                    <strong>
                      {(selectedDecision.alternatives || []).length}
                    </strong>
                  </div>
                  <div>
                    <span>Documents</span>
                    <strong>{(selectedDecision.documents || []).length}</strong>
                  </div>
                  <div>
                    <span>Discussion</span>
                    <strong>
                      {(selectedDecision.discussions || []).length}
                    </strong>
                  </div>
                </div>

                <div
                  className="decision-tabs"
                  role="tablist"
                  aria-label="Decision details"
                >
                  {[
                    ["overview", "Overview", LayoutDashboard],
                    ["alternatives", "Alternatives", Database],
                    ["documents", "Documents", FileText],
                    ["discussion", "Discussion", MessageCircle],
                  ].map(([value, label, Icon]) => (
                    <button
                      key={value}
                      className={
                        decisionTab === value
                          ? "decision-tab active"
                          : "decision-tab"
                      }
                      type="button"
                      role="tab"
                      aria-selected={decisionTab === value}
                      onClick={() => setDecisionTab(value)}
                    >
                      <Icon size={15} />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>

                <div className="decision-tab-panel" key={decisionTab}>
                  {decisionTab === "overview" && (
                    <div className="decision-tab-content decision-tab-content-overview">
                      <div className="tab-scroll-area overview-scroll-area">
                        <div className="decision-overview-panel">
                          <div className="decision-overview-card">
                            <div className="panel-kicker">DECISION DETAILS</div>
                            <h3>Why this decision exists</h3>
                            <p>
                              {selectedDecision.problemStatement ||
                                "No problem statement has been added yet."}
                            </p>

                            <div className="overview-detail-list">
                              <div>
                                <span>Created on</span>
                                <strong>
                                  {formatDecisionDate(
                                    selectedDecision.createdAt,
                                  )}
                                </strong>
                              </div>
                              <div>
                                <span>Created by</span>
                                <strong>
                                  {selectedDecision.createdBy?.name ||
                                    currentUser?.name ||
                                    "You"}
                                </strong>
                              </div>
                              <div>
                                <span>Status</span>
                                <strong>
                                  {displayStatus(selectedDecision.status)}
                                </strong>
                              </div>
                            </div>
                          </div>

                          <div className="decision-overview-card">
                            <div className="panel-kicker">QUICK ACTIONS</div>
                            <h3>Keep building the decision</h3>

                            <div className="quick-action-grid">
                              <button
                                type="button"
                                onClick={() => setDecisionTab("alternatives")}
                              >
                                <span className="quick-action-icon">
                                  <Database size={16} />
                                </span>
                                <span>
                                  <strong>Add alternative</strong>
                                  <small>Compare more options</small>
                                </span>
                                <ChevronRight size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDecisionTab("documents")}
                              >
                                <span className="quick-action-icon">
                                  <FileText size={16} />
                                </span>
                                <span>
                                  <strong>Upload document</strong>
                                  <small>Add supporting evidence</small>
                                </span>
                                <ChevronRight size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDecisionTab("discussion")}
                              >
                                <span className="quick-action-icon">
                                  <MessageCircle size={16} />
                                </span>
                                <span>
                                  <strong>Start discussion</strong>
                                  <small>Capture team reasoning</small>
                                </span>
                                <ChevronRight size={15} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {decisionTab === "alternatives" && (
                    <div className="decision-tab-content">
                      <div className="tab-content-header">
                        <div>
                          <div className="panel-kicker">
                            ALTERNATIVE ANALYSIS
                          </div>
                          <h3>Compare the available options</h3>
                        </div>
                        <span className="count-pill">
                          {(selectedDecision.alternatives || []).length}
                        </span>
                      </div>

                      <form
                        className="alternative-form"
                        onSubmit={handleSaveAlternative}
                      >
                        <input
                          type="text"
                          placeholder="Alternative name"
                          value={alternativeForm.name}
                          onChange={(event) =>
                            setAlternativeForm({
                              ...alternativeForm,
                              name: event.target.value,
                            })
                          }
                        />
                        <input
                          type="text"
                          placeholder="Pros"
                          value={alternativeForm.pros}
                          onChange={(event) =>
                            setAlternativeForm({
                              ...alternativeForm,
                              pros: event.target.value,
                            })
                          }
                        />
                        <input
                          type="text"
                          placeholder="Cons"
                          value={alternativeForm.cons}
                          onChange={(event) =>
                            setAlternativeForm({
                              ...alternativeForm,
                              cons: event.target.value,
                            })
                          }
                        />
                        <input
                          type="text"
                          placeholder="Cost"
                          value={alternativeForm.cost}
                          onChange={(event) =>
                            setAlternativeForm({
                              ...alternativeForm,
                              cost: event.target.value,
                            })
                          }
                        />
                        <input
                          type="text"
                          placeholder="Feasibility"
                          value={alternativeForm.feasibility}
                          onChange={(event) =>
                            setAlternativeForm({
                              ...alternativeForm,
                              feasibility: event.target.value,
                            })
                          }
                        />
                        <input
                          type="text"
                          placeholder="Risk"
                          value={alternativeForm.risk}
                          onChange={(event) =>
                            setAlternativeForm({
                              ...alternativeForm,
                              risk: event.target.value,
                            })
                          }
                        />
                        <div className="modal-actions">
                          <button
                            className="modal-primary"
                            type="submit"
                            disabled={savingAlternative}
                          >
                            {savingAlternative
                              ? "Saving..."
                              : editingAlternative
                                ? "Update alternative"
                                : "Add alternative"}
                            <ArrowUpRight size={14} />
                          </button>
                          {editingAlternative && (
                            <button
                              className="modal-secondary"
                              type="button"
                              onClick={() => {
                                setEditingAlternative(null);
                                setAlternativeForm(EMPTY_ALTERNATIVE_FORM);
                              }}
                            >
                              Cancel edit
                            </button>
                          )}
                        </div>
                      </form>

                      <div className="tab-scroll-area alternatives-scroll-area">
                        {(selectedDecision.alternatives || []).length > 0 ? (
                          (selectedDecision.alternatives || []).map(
                            (alternative) => (
                              <div
                                className="alternative-card"
                                key={alternative.id}
                              >
                                <div className="alternative-card-header">
                                  <div>
                                    <strong>{alternative.name}</strong>
                                    <span>Option</span>
                                  </div>
                                  <div className="alternative-actions">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleEditAlternative(alternative)
                                      }
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDeleteAlternative(alternative)
                                      }
                                      disabled={
                                        deletingAlternativeId === alternative.id
                                      }
                                    >
                                      {deletingAlternativeId === alternative.id
                                        ? "Deleting..."
                                        : "Delete"}
                                    </button>
                                  </div>
                                </div>
                                <div className="alternative-grid">
                                  <div>
                                    <span>Pros</span>
                                    <strong>{alternative.pros || "—"}</strong>
                                  </div>
                                  <div>
                                    <span>Cons</span>
                                    <strong>{alternative.cons || "—"}</strong>
                                  </div>
                                  <div>
                                    <span>Cost</span>
                                    <strong>{alternative.cost || "—"}</strong>
                                  </div>
                                  <div>
                                    <span>Feasibility</span>
                                    <strong>
                                      {alternative.feasibility || "—"}
                                    </strong>
                                  </div>
                                  <div>
                                    <span>Risk</span>
                                    <strong>{alternative.risk || "—"}</strong>
                                  </div>
                                </div>
                                <button
                                  className="alternative-view-more"
                                  type="button"
                                  onClick={() => {
                                    setSelectedAlternative(alternative);
                                    setModal({ type: "view-alternative" });
                                  }}
                                >
                                  View more
                                  <ChevronRight size={14} />
                                </button>
                              </div>
                            ),
                          )
                        ) : (
                          <div className="empty-module-state">
                            <Database size={18} />
                            <strong>No alternatives yet</strong>
                            <span>
                              Add options here to compare them without expanding
                              the whole decision view.
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {decisionTab === "documents" && (
                    <div className="decision-tab-content">
                      <div className="tab-content-header">
                        <div>
                          <div className="panel-kicker">DOCUMENTS</div>
                          <h3>Supporting files</h3>
                        </div>
                        <span className="count-pill">
                          {(selectedDecision.documents || []).length}
                        </span>
                      </div>

                      <div className="document-upload-panel">
                        <label
                          className="file-picker"
                          htmlFor="decision-document-upload"
                        >
                          <input
                            id="decision-document-upload"
                            type="file"
                            onChange={(event) =>
                              setSelectedFile(event.target.files?.[0] || null)
                            }
                          />
                          <span className="file-picker-icon">
                            <FileText size={17} />
                          </span>
                          <span className="file-picker-copy">
                            <strong>
                              {selectedFile
                                ? selectedFile.name
                                : "Choose a supporting file"}
                            </strong>
                            <small>
                              PDF, DOCX, PPTX, XLSX or other project files
                            </small>
                          </span>
                        </label>
                        <button
                          className="modal-primary"
                          type="button"
                          onClick={handleUploadDocument}
                          disabled={!selectedFile || uploadingDocument}
                        >
                          {uploadingDocument
                            ? "Uploading..."
                            : "Upload document"}
                          <ArrowUpRight size={14} />
                        </button>
                      </div>

                      <div className="tab-scroll-area documents-scroll-area">
                        {(selectedDecision.documents || []).length > 0 ? (
                          (selectedDecision.documents || []).map((document) => (
                            <div className="document-card" key={document.id}>
                              <span className="document-card-icon">
                                <FileText size={17} />
                              </span>
                              <div className="document-card-main">
                                <strong title={document.filename}>
                                  {document.filename}
                                </strong>
                                <span>
                                  Supporting document · Uploaded{" "}
                                  {formatDecisionDate(document.createdAt)}
                                </span>
                              </div>
                              <div className="document-card-actions">
                                <span className="document-status">Stored</span>
                                <button
                                  className="document-open-button"
                                  type="button"
                                  onClick={() => handleOpenDocument(document)}
                                >
                                  Open
                                  <ArrowUpRight size={13} />
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="empty-module-state">
                            <FileText size={18} />
                            <strong>No documents yet</strong>
                            <span>
                              Attach supporting files to this decision.
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {decisionTab === "discussion" && (
                    <div className="decision-tab-content">
                      <div className="tab-content-header">
                        <div>
                          <div className="panel-kicker">DISCUSSIONS</div>
                          <h3>Decision conversation</h3>
                        </div>
                        <span className="count-pill">
                          {(selectedDecision.discussions || []).length}
                        </span>
                      </div>

                      <form
                        className="discussion-compose"
                        onSubmit={handleSaveDiscussion}
                      >
                        <div className="discussion-compose-head">
                          <div className="discussion-field">
                            <span className="discussion-field-label">TYPE</span>
                            <select
                              value={discussionForm.type}
                              onChange={(event) =>
                                setDiscussionForm({
                                  ...discussionForm,
                                  type: event.target.value,
                                })
                              }
                            >
                              <option value="Comment">Comment</option>
                              <option value="MeetingNote">Meeting note</option>
                              <option value="Rationale">
                                Decision rationale
                              </option>
                            </select>
                          </div>
                          <div className="discussion-field">
                            <span className="discussion-field-label">
                              THREAD
                            </span>
                            <select
                              value={discussionForm.parentId}
                              onChange={(event) =>
                                setDiscussionForm({
                                  ...discussionForm,
                                  parentId: event.target.value,
                                })
                              }
                            >
                              <option value="">New thread</option>
                              {(selectedDecision.discussions || []).map(
                                (discussion) => (
                                  <option
                                    key={discussion.id}
                                    value={discussion.id}
                                  >
                                    Reply to #{discussion.id}
                                  </option>
                                ),
                              )}
                            </select>
                          </div>
                        </div>
                        <textarea
                          className="discussion-composer-input"
                          rows="4"
                          placeholder="Share a comment, capture a meeting note, or record the reasoning behind this decision..."
                          value={discussionForm.content}
                          onChange={(event) =>
                            setDiscussionForm({
                              ...discussionForm,
                              content: event.target.value,
                            })
                          }
                        />
                        <div className="discussion-compose-footer">
                          <div className="discussion-compose-hint">
                            <MessageCircle size={14} />
                            <span>
                              {discussionForm.parentId
                                ? `Replying to discussion #${discussionForm.parentId}`
                                : "Start a new conversation thread"}
                            </span>
                          </div>
                          <div className="modal-actions">
                            {editingDiscussion && (
                              <button
                                className="modal-secondary"
                                type="button"
                                onClick={() => {
                                  setEditingDiscussion(null);
                                  setDiscussionForm({
                                    type: "Comment",
                                    content: "",
                                    parentId: "",
                                  });
                                }}
                              >
                                Cancel edit
                              </button>
                            )}
                            <button
                              className="modal-primary"
                              type="submit"
                              disabled={savingDiscussion}
                            >
                              {savingDiscussion
                                ? "Saving..."
                                : editingDiscussion
                                  ? "Update discussion"
                                  : "Post to discussion"}
                              <ArrowUpRight size={14} />
                            </button>
                          </div>
                        </div>
                      </form>

                      <div className="tab-scroll-area discussion-scroll-area">
                        {(selectedDecision.discussions || []).length > 0 ? (
                          (selectedDecision.discussions || []).map(
                            (discussion) => {
                              const discussionType =
                                discussion.type === "MeetingNote"
                                  ? "Meeting note"
                                  : discussion.type === "Rationale"
                                    ? "Decision rationale"
                                    : "Comment";
                              const authorName =
                                discussion.createdBy?.name ||
                                "Workspace member";
                              return (
                                <article
                                  className={`discussion-card ${discussion.parentId ? "discussion-reply" : ""}`}
                                  key={discussion.id}
                                >
                                  <div className="discussion-card-header">
                                    <div className="discussion-author">
                                      <div className="discussion-avatar">
                                        {authorName.charAt(0).toUpperCase()}
                                      </div>
                                      <div className="discussion-author-copy">
                                        <div className="discussion-author-line">
                                          <strong>{authorName}</strong>
                                          <span className="discussion-type-badge">
                                            {discussionType}
                                          </span>
                                        </div>
                                        <span>
                                          {formatRelativeTime(
                                            discussion.createdAt,
                                          )}{" "}
                                          · #{discussion.id}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="discussion-actions">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setDiscussionForm({
                                            type: "Comment",
                                            content: "",
                                            parentId: String(discussion.id),
                                          })
                                        }
                                      >
                                        Reply
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleEditDiscussion(discussion)
                                        }
                                      >
                                        Edit
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleDeleteDiscussion(discussion)
                                        }
                                        disabled={
                                          deletingDiscussionId === discussion.id
                                        }
                                      >
                                        {deletingDiscussionId === discussion.id
                                          ? "Deleting..."
                                          : "Delete"}
                                      </button>
                                    </div>
                                  </div>
                                  {discussion.parentId && (
                                    <div className="discussion-thread-label">
                                      Replying to discussion #
                                      {discussion.parentId}
                                    </div>
                                  )}
                                  <div className="discussion-content">
                                    {discussion.content}
                                  </div>
                                  {(discussion.attachments || []).length >
                                    0 && (
                                    <div className="discussion-attachments">
                                      <span className="discussion-sub-label">
                                        Supporting files
                                      </span>
                                      <div className="discussion-attachment-list">
                                        {(discussion.attachments || []).map(
                                          (attachment) => (
                                            <span
                                              className="discussion-attachment-chip"
                                              key={attachment.id}
                                            >
                                              <FileText size={13} />
                                              {attachment.filename}
                                            </span>
                                          ),
                                        )}
                                      </div>
                                    </div>
                                  )}
                                  <div className="discussion-attachment-row">
                                    <label
                                      className="discussion-file-picker"
                                      htmlFor={`discussion-file-${discussion.id}`}
                                    >
                                      <input
                                        id={`discussion-file-${discussion.id}`}
                                        type="file"
                                        onChange={(event) =>
                                          setSelectedDiscussionFile(
                                            event.target.files?.[0] || null,
                                          )
                                        }
                                      />
                                      <FileText size={14} />
                                      <span>
                                        {selectedDiscussionFile
                                          ? selectedDiscussionFile.name
                                          : "Attach supporting file"}
                                      </span>
                                    </label>
                                    <button
                                      className="modal-secondary"
                                      type="button"
                                      onClick={() =>
                                        handleUploadDiscussionAttachment(
                                          discussion,
                                        )
                                      }
                                      disabled={
                                        !selectedDiscussionFile ||
                                        uploadingDiscussionFile
                                      }
                                    >
                                      {uploadingDiscussionFile
                                        ? "Uploading..."
                                        : "Attach file"}
                                    </button>
                                  </div>
                                </article>
                              );
                            },
                          )
                        ) : (
                          <div className="empty-module-state">
                            <MessageCircle size={18} />
                            <strong>No discussions yet</strong>
                            <span>
                              Start the first conversation around this decision.
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="modal-actions decision-detail-actions">
                  <button
                    className="modal-secondary"
                    type="button"
                    onClick={() => setModal(null)}
                  >
                    Close
                  </button>
                </div>
              </>
            )}

            {modal.type === "view-alternative" && selectedAlternative && (
              <>
                <div className="alternative-detail-modal-content">
                  <div className="alternative-detail-topline">
                    <div>
                      <span className="modal-eyebrow">ALTERNATIVE DETAIL</span>
                      <h2>{selectedAlternative.name}</h2>
                      <p>Full comparison details for this option.</p>
                    </div>
                    <span className="count-pill">OPTION</span>
                  </div>

                  <div className="alternative-detail-grid">
                    <section>
                      <span>Pros</span>
                      <p>{selectedAlternative.pros || "No pros recorded."}</p>
                    </section>
                    <section>
                      <span>Cons</span>
                      <p>{selectedAlternative.cons || "No cons recorded."}</p>
                    </section>
                    <section>
                      <span>Cost</span>
                      <p>
                        {selectedAlternative.cost ||
                          "No cost information recorded."}
                      </p>
                    </section>
                    <section>
                      <span>Feasibility</span>
                      <p>
                        {selectedAlternative.feasibility ||
                          "No feasibility assessment recorded."}
                      </p>
                    </section>
                    <section>
                      <span>Risk</span>
                      <p>
                        {selectedAlternative.risk ||
                          "No risk assessment recorded."}
                      </p>
                    </section>
                  </div>
                </div>

                <div className="modal-actions decision-detail-actions alternative-detail-actions">
                  <button
                    className="modal-secondary"
                    type="button"
                    onClick={() => {
                      setSelectedAlternative(null);
                      setModal({ type: "view-decision" });
                      setDecisionTab("alternatives");
                    }}
                  >
                    Back to alternatives
                  </button>
                </div>
              </>
            )}

            {modal.type === "info" && (
              <>
                <span className="modal-eyebrow">WORKSPACE</span>

                <h2>{modal.title}</h2>

                <p>{modal.body}</p>

                <div className="modal-actions">
                  <button
                    className="modal-primary"
                    type="button"
                    onClick={() => setModal(null)}
                  >
                    Close
                    <ArrowUpRight size={14} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
