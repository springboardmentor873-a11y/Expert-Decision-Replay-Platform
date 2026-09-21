import { useEffect, useState, useCallback, useRef } from "react";
import "./App.css";
import translations, { LANGUAGES } from "./translations";
import { API_BASE_URL, AppSidebar, NotificationBell } from "./shared";
import {
  MyTeamsPage,
  MyDecisionsPage,
  TeamDecisionsPage
} from "./TempComponents1.jsx";
import { DashboardPage } from "./DashboardPage.jsx";
import { MeetingsPage } from "./MeetingsPage.jsx";
import {
  KnowledgeRepositoryPage,
  DiscussionsPage,
  SearchPage
} from "./TempComponents2.jsx";
import { ReportsPage } from "./ReportsPage.jsx";

const routeToPage = (path) => {
  if (/^\/decisions\/\d+\/edit/.test(path)) return "decision-edit";
  if (/^\/decisions\/\d+\/?$/.test(path)) return "decision-view";
  if (path === "/decisions") return "decisions";
  if (path === "/decisions/create") return "decision-create";
  if (path === "/documents") return "documents";
  if (path === "/notifications") return "notifications";
  if (path === "/audit-logs") return "audit-logs";
  if (/^\/teams\/\d+\/?$/.test(path)) return "team-view";
  if (path === "/teams") return "teams";
  if (path === "/my-teams") return "my-teams";
  if (path === "/my-decisions") return "my-decisions";
  if (path === "/team-decisions") return "team-decisions";
  if (path === "/knowledge") return "knowledge";
  if (path === "/discussions") return "discussions";
  if (path === "/search") return "search";
  if (path === "/reports") return "reports";
  if (path === "/profile") return "profile";
  if (path === "/settings") return "settings";
  return "home";
};

function App() {
  // ==========================================
  // PAGE
  // ==========================================

  const [page, setPage] = useState(() => {
    if (!localStorage.getItem("access_token")) return "login";
    return routeToPage(window.location.pathname);
  });

  const [pendingDecisionId, setPendingDecisionId] = useState(() => {
    const path = window.location.pathname;
    const m = path.match(/\/decisions\/(\d+)/);
    return m ? Number(m[1]) : null;
  });

  const [pendingTeamId, setPendingTeamId] = useState(() => {
    const path = window.location.pathname;
    const m = path.match(/\/teams\/(\d+)/);
    return m ? Number(m[1]) : null;
  });

  // ==========================================
  // LOGIN
  // ==========================================

  const [loginEmail, setLoginEmail] = useState(
    () => localStorage.getItem("remembered_email") || ""
  );
  const [loginPassword, setLoginPassword] = useState("");
  const [loginShowPassword, setLoginShowPassword] = useState(false);
  const [loginRememberMe, setLoginRememberMe] = useState(
    () => !!localStorage.getItem("remembered_email")
  );

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
  // DECISIONS
  // ==========================================

  const [decisions, setDecisions] = useState([]);
  const [selectedDecision, setSelectedDecision] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamLoadFailed, setTeamLoadFailed] = useState(false);

  const [decisionTitle, setDecisionTitle] = useState("");
  const [decisionDescription, setDecisionDescription] = useState("");
  const [decisionContext, setDecisionContext] = useState("");
  const [decisionProblem, setDecisionProblem] = useState("");
  const [decisionObjective, setDecisionObjective] = useState("");
  const [decisionCriteria, setDecisionCriteria] = useState("");
  const [decisionRisks, setDecisionRisks] = useState("");
  const [decisionStakeholders, setDecisionStakeholders] = useState("");
  const [decisionRationale, setDecisionRationale] = useState("");
  const [decisionOutcome, setDecisionOutcome] = useState("");
  const [decisionImplementationStatus, setDecisionImplementationStatus] =
    useState("Not Started");
  const [decisionPriority, setDecisionPriority] = useState("Medium");
  const [decisionDate, setDecisionDate] = useState("");
  const [decisionAlternatives, setDecisionAlternatives] = useState([]);
  const [decisionAssignedTo, setDecisionAssignedTo] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [teamFilter, setTeamFilter] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [submitTarget, setSubmitTarget] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [reviewTarget, setReviewTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [reviewStep, setReviewStep] = useState("reviewer");
  const [isReviewing, setIsReviewing] = useState(false);

  const [archiveTarget, setArchiveTarget] = useState(null);
  const [isArchiving, setIsArchiving] = useState(false);

  const [createdConfirmTarget, setCreatedConfirmTarget] = useState(null);
  const createdConfirmRef = useRef(null);

  const [altModalMode, setAltModalMode] = useState(null);
  const [altForm, setAltForm] = useState({
    alternative_id: null,
    title: "",
    description: "",
    pros: "",
    cons: "",
    estimated_cost: "",
    feasibility: "Medium",
    risk_level: "Medium",
    risk_explanation: ""
  });
  const [altSaving, setAltSaving] = useState(false);
  const [altWorking, setAltWorking] = useState(false);
  const [altDeleteTarget, setAltDeleteTarget] = useState(null);
  const [altIsDeleting, setAltIsDeleting] = useState(false);
  const [altMessage, setAltMessage] = useState("");
  const [altMessageType, setAltMessageType] = useState("");

  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [docUploading, setDocUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [docDeleteTarget, setDocDeleteTarget] = useState(null);
  const [docDeleting, setDocDeleting] = useState(false);
  const [docMessage, setDocMessage] = useState("");
  const [docMessageType, setDocMessageType] = useState("");

  const [allDocuments, setAllDocuments] = useState([]);
  const [allDocumentsLoading, setAllDocumentsLoading] = useState(false);
  const [allUsers, setAllUsers] = useState([]);

  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentDeleteTarget, setCommentDeleteTarget] = useState(null);
  const [commentDeleting, setCommentDeleting] = useState(false);
  const [commentMessage, setCommentMessage] = useState("");
  const [commentMessageType, setCommentMessageType] = useState("");

  const [decisionMessage, setDecisionMessage] = useState("");
  const [decisionMessageType, setDecisionMessageType] = useState("");

  const [createFile, setCreateFile] = useState(null);
  const [createFileUploading, setCreateFileUploading] = useState(false);
  const [lastCreatedDecisionId, setLastCreatedDecisionId] = useState(null);

  // Section-scoped notifications for the Decision View page.
  // Each notification is shown only inside its own section (Overview / Alternatives).
  // Overview changes (status, priority, description, objective, etc.)
  const [overviewMessage, setOverviewMessage] = useState("");
  const [overviewMessageType, setOverviewMessageType] = useState("");

  // Alternatives changes (select / unselect / add / edit / delete)
  const [altSectionMessage, setAltSectionMessage] = useState("");
  const [altSectionMessageType, setAltSectionMessageType] = useState("");

  const [decisionsLoading, setDecisionsLoading] = useState(false);

  // ==========================================
  // DASHBOARD
  // ==========================================

  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  // ==========================================
  // EMPLOYER HOME / NEW PAGES DATA
  // ==========================================

  const [discussionList, setDiscussionList] = useState([]);
  const [discussionListLoading, setDiscussionListLoading] = useState(false);
  const [knowledgeArticles, setKnowledgeArticles] = useState([]);
  const [knowledgeLoading, setKnowledgeLoading] = useState(false);
  const [insightsData, setInsightsData] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [globalSearchResults, setGlobalSearchResults] = useState(null);
  const [globalSearchLoading, setGlobalSearchLoading] = useState(false);

  // ==========================================
  // MESSAGE
  // ==========================================

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const [loading, setLoading] = useState(false);

  const navigateTo = (targetPage, params = {}) => {
    const decisionId = params.decision_id || null;
    const teamId = params.team_id || null;
    let url = "/";
    switch (targetPage) {
      case "decision-view":
        url = decisionId ? `/decisions/${decisionId}` : "/decisions";
        break;
      case "decision-edit":
        url = decisionId ? `/decisions/${decisionId}/edit` : "/decisions";
        break;
      case "team-view":
        url = teamId ? `/teams/${teamId}` : "/teams";
        break;
      case "my-teams": url = "/my-teams"; break;
      case "my-decisions": url = "/my-decisions"; break;
      case "team-decisions": url = "/team-decisions"; break;
      case "knowledge": url = "/knowledge"; break;
      case "discussions": url = "/discussions"; break;
      case "search": url = "/search"; break;
      case "reports": url = "/reports"; break;
      case "decisions": url = "/decisions"; break;
      case "decision-create": url = "/decisions/create"; break;
      case "documents": url = "/documents"; break;
      case "notifications": url = "/notifications"; break;
      case "audit-logs": url = "/audit-logs"; break;
      case "teams": url = "/teams"; break;
      case "profile": url = "/profile"; break;
      case "settings": url = "/settings"; break;
      default: url = "/";
    }
    window.history.pushState(
      { page: targetPage, decision_id: decisionId, team_id: teamId },
      "",
      url
    );
    setPage(targetPage);
    if (decisionId) setPendingDecisionId(decisionId);
    if (teamId) setPendingTeamId(teamId);
  };

  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state && event.state.page) {
        setPage(event.state.page);
        if (event.state.decision_id) {
          setPendingDecisionId(event.state.decision_id);
        }
        if (event.state.team_id) {
          setPendingTeamId(event.state.team_id);
        }
      } else if (localStorage.getItem("access_token")) {
        const path = window.location.pathname;
        const m = path.match(/\/decisions\/(\d+)/);
        const t = path.match(/\/teams\/(\d+)/);
        if (t) setPendingTeamId(Number(t[1]));
        if (m) setPendingDecisionId(Number(m[1]));
        setPage(routeToPage(path));
      } else {
        setPage("login");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const authedPages = [
      "home",
      "decisions",
      "decision-create",
      "decision-view",
      "decision-edit",
      "documents",
      "teams",
      "team-view",
      "profile",
      "settings",
      "notifications",
      "audit-logs",
      "my-teams",
      "my-decisions",
      "team-decisions",
      "knowledge",
      "discussions",
      "search",
      "reports"
    ];

    if (
      authedPages.includes(page) &&
      !localStorage.getItem("access_token")
    ) {
      setPage("login");
    }
  }, [page]);

  useEffect(() => {
    if (
      (page === "decision-view" || page === "decision-edit") &&
      pendingDecisionId &&
      (!selectedDecision ||
        selectedDecision.decision_id !== pendingDecisionId)
    ) {
      loadSingleDecision(pendingDecisionId).then((full) => {
        if (!full) return;
        setSelectedDecision(full);
        if (page === "decision-view") {
          loadComments(full.decision_id);
          loadDocuments(full.decision_id);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pendingDecisionId, selectedDecision]);

  useEffect(() => {
    if (
      page === "team-view" &&
      pendingTeamId &&
      (!selectedTeam || selectedTeam.team_id !== pendingTeamId)
    ) {
      loadTeamDetail(pendingTeamId).then((team) => {
        if (team) {
          setSelectedTeam(team);
          setTeamLoadFailed(false);
        } else {
          setSelectedTeam(null);
          setTeamLoadFailed(true);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pendingTeamId, selectedTeam]);

  // ==========================================
  // I18N / SETTINGS PERSISTENCE
  // ==========================================

  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("app_language") || "en";
  });

  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const saved = localStorage.getItem("app_notifications_enabled");
    return saved === null ? true : saved === "true";
  });

  const handleSetLanguage = useCallback((code) => {
    setLanguage(code);
    localStorage.setItem("app_language", code);
  }, []);

  const handleSetNotifications = useCallback((enabled) => {
    setNotificationsEnabled(enabled);
    localStorage.setItem("app_notifications_enabled", String(enabled));
  }, []);

  const t = useCallback(
    (key, vars = {}) => {
      const lang = translations[language] || translations.en;
      let text = lang[key] || translations.en[key] || key;
      Object.keys(vars).forEach((k) => {
        text = text.replace(new RegExp(`\\{${k}\\}`, "g"), vars[k]);
      });
      return text;
    },
    [language]
  );

  // ==========================================
  // AUTO-DISMISS SECTION NOTIFICATIONS
  // Temporary section-scoped toasts disappear
  // automatically after exactly 9 seconds.
  // ==========================================

  useEffect(() => {
    if (!notificationsEnabled) return;
    const items = [
      [overviewMessage, setOverviewMessage],
      [docMessage, setDocMessage],
      [commentMessage, setCommentMessage],
      [altSectionMessage, setAltSectionMessage]
    ];

    const timers = items
      .filter(([msg]) => msg)
      .map(([, setter]) => setTimeout(() => setter(""), 9000));

    return () => timers.forEach((t) => clearTimeout(t));
  }, [
    overviewMessage,
    docMessage,
    commentMessage,
    altSectionMessage,
    notificationsEnabled
  ]);

  // ==========================================
  // LOAD ROLES / TEAMS
  // ==========================================

  useEffect(() => {
    loadRoles();
    loadTeams();
  }, []);

  useEffect(() => {
    if (page === "home" && getToken()) {
      loadDecisions();
    }
  }, [page]);

  useEffect(() => {
    if (page === "documents") {
      loadAllDocuments();
    } else if (page === "teams") {
      loadAllUsers();
      loadTeams(true);
    } else if (page === "home") {
      loadDashboard();
      loadDiscussions();
    } else if (page === "knowledge") {
      loadKnowledgeArticles();
      loadAllDocuments();
      loadDecisions();
      loadDiscussions();
      loadAllUsers();
      loadInsights();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

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

  const loadTeams = async (includeArchived = false) => {
    try {
      const suffix = includeArchived
        ? "?include_archived=true"
        : "";
      const token = getToken();
      const response = await fetch(
        `${API_BASE_URL}/teams/${suffix}`,
        {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        }
      );

      if (!response.ok) return;

      const data = await response.json();

      setTeams(data);
    } catch (error) {
      console.error("Teams error:", error);
    }
  };

  const loadTeamDetail = async (teamId) => {
    try {
      const token = getToken();
      const response = await fetch(
        `${API_BASE_URL}/teams/${teamId}`,
        {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        }
      );

      if (!response.ok) return null;

      return await response.json();
    } catch (error) {
      console.error("Team detail error:", error);
      return null;
    }
  };

  // ==========================================
  // DASHBOARD
  // ==========================================

  const loadDashboard = async () => {
    try {
      setDashboardLoading(true);
      const token = getToken();
      const response = await fetch(
        `${API_BASE_URL}/dashboard/`,
        {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        }
      );
      if (!response.ok) return;
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error("Dashboard error:", error);
    } finally {
      setDashboardLoading(false);
    }
  };

  // ==========================================
  // LOAD DISCUSSIONS
  // ==========================================

  const loadDiscussions = async (search = "") => {
    try {
      setDiscussionListLoading(true);
      const token = getToken();
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      const qs = params.toString();
      const response = await fetch(
        `${API_BASE_URL}/discussions/${qs ? `?${qs}` : ""}`,
        {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        }
      );
      if (!response.ok) return;
      const data = await response.json();
      setDiscussionList(data);
    } catch (error) {
      console.error("Discussions error:", error);
    } finally {
      setDiscussionListLoading(false);
    }
  };

  // ==========================================
  // LOAD KNOWLEDGE ARTICLES
  // ==========================================

  const loadKnowledgeArticles = async (search = "") => {
    try {
      setKnowledgeLoading(true);
      const token = getToken();
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      const qs = params.toString();
      const response = await fetch(
        `${API_BASE_URL}/knowledge/${qs ? `?${qs}` : ""}`,
        {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        }
      );
      if (!response.ok) return;
      const data = await response.json();
      setKnowledgeArticles(data);
    } catch (error) {
      console.error("Knowledge error:", error);
    } finally {
      setKnowledgeLoading(false);
    }
  };

  // ==========================================
  // LOAD INSIGHTS
  // ==========================================

  const loadInsights = async () => {
    try {
      setInsightsLoading(true);
      const token = getToken();
      const response = await fetch(
        `${API_BASE_URL}/insights/`,
        {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        }
      );
      if (!response.ok) return;
      const data = await response.json();
      setInsightsData(data);
    } catch (error) {
      console.error("Insights error:", error);
    } finally {
      setInsightsLoading(false);
    }
  };

  // ==========================================
  // RUN GLOBAL SEARCH
  // ==========================================

  const runGlobalSearch = async (q) => {
    const query = (q || "").trim();
    if (!query) {
      setGlobalSearchResults(null);
      return;
    }
    try {
      setGlobalSearchLoading(true);
      const token = getToken();
      const response = await fetch(
        `${API_BASE_URL}/search/?q=${encodeURIComponent(query)}`,
        {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        }
      );
      if (!response.ok) return;
      const data = await response.json();
      setGlobalSearchResults(data);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setGlobalSearchLoading(false);
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
  // GET TOKEN
  // ==========================================

  const getToken = () => {
    return localStorage.getItem("access_token");
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (value) => {
    if (!value) return "Not available";

    const date = new Date(value);

    if (isNaN(date.getTime())) return value;

    return date.toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // ==========================================
  // FORMAT COST
  // ==========================================

  const formatCost = (value) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "Not specified";
    }

    const num = Number(value);

    if (isNaN(num)) return value;

    return `₹${num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // ==========================================
  // LEVEL BADGE CLASS
  // ==========================================

  const levelBadgeClass = (value) => {
    const normalized = (value || "").toLowerCase();

    return `level-badge level-${normalized}`;
  };

  // ==========================================
  // TO DATE TIME LOCAL
  // ==========================================

  const toDateTimeLocal = (value) => {
    if (!value) return "";

    const date = new Date(value);

    if (isNaN(date.getTime())) return "";

    const pad = (n) => String(n).padStart(2, "0");

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  // ==========================================
  // RESET DECISION FORM
  // ==========================================

  const resetDecisionForm = () => {
    setDecisionTitle("");
    setDecisionDescription("");
    setDecisionContext("");
    setDecisionProblem("");
    setDecisionObjective("");
    setDecisionCriteria("");
    setDecisionRisks("");
    setDecisionStakeholders("");
    setDecisionRationale("");
    setDecisionOutcome("");
    setDecisionImplementationStatus("Not Started");
    setDecisionPriority("Medium");
    setDecisionDate("");
    setDecisionAlternatives([]);
  };

  // ==========================================
  // LOAD DECISIONS
  // ==========================================

  const loadDecisions = async (filters = {}) => {
    try {
      setDecisionsLoading(true);

      const params = new URLSearchParams();

      if (filters.search) {
        params.append("search", filters.search);
      }

      if (filters.status) {
        params.append("status", filters.status);
      }

      if (filters.team) {
        params.append("team", filters.team);
      }

      const queryString = params.toString();

      const url = `${API_BASE_URL}/decisions/${
        queryString ? `?${queryString}` : ""
      }`;

      const response = await fetch(
        url,
        {
          headers: {
            "Authorization": `Bearer ${getToken()}`
          }
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          setDecisionMessage(
            "Session expired. Please login again."
          );

          setDecisionMessageType("error");

          handleLogout();
          return;
        }

        setDecisionMessage(
          "Failed to load decisions."
        );

        setDecisionMessageType("error");
        return;
      }

      const data = await response.json();

      setDecisions(data);

    } catch (error) {
      console.error("Decisions error:", error);

      setDecisionMessage(
        "Unable to connect to server."
      );

      setDecisionMessageType("error");

    } finally {
      setDecisionsLoading(false);
    }
  };

  // ==========================================
  // LOAD SINGLE DECISION
  // ==========================================

  const loadSingleDecision = async (decisionId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/decisions/${decisionId}`,
        {
          headers: {
            "Authorization": `Bearer ${getToken()}`
          }
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          handleLogout();
          return null;
        }

        if (response.status === 404) {
          setDecisionMessage(
            "Decision not found."
          );

          setDecisionMessageType("error");
          return null;
        }

        setDecisionMessage(
          "Failed to load decision."
        );

        setDecisionMessageType("error");
        return null;
      }

      const data = await response.json();

      return data;

    } catch (error) {
      console.error("Load single decision error:", error);

      setDecisionMessage(
        "Unable to connect to server."
      );

      setDecisionMessageType("error");

      return null;
    }
  };

  // ==========================================
  // OPEN CREATE DECISION
  // ==========================================

  const openCreateDecision = () => {
    resetDecisionForm();

    const today = new Date();

    const pad = (n) => String(n).padStart(2, "0");

    setDecisionDate(
      `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}T${pad(today.getHours())}:${pad(today.getMinutes())}`
    );

    setDecisionMessage("");
    setDecisionMessageType("");
    navigateTo("decision-create");
  };

  // ==========================================
  // OPEN VIEW DECISION
  // ==========================================

  const openViewDecision = async (decision) => {
    setDecisionMessage("");
    setDecisionMessageType("");
    setDocMessage("");
    setDocMessageType("");
    setCommentMessage("");
    setCommentMessageType("");

    const full = await loadSingleDecision(
      decision.decision_id
    );

    if (full) {
      setSelectedDecision(full);
      setPendingDecisionId(full.decision_id);
      navigateTo("decision-view", { decision_id: full.decision_id });

      await loadComments(full.decision_id);
      await loadDocuments(full.decision_id);
    }
  };

  // ==========================================
  // OPEN VIEW TEAM
  // ==========================================

  const openViewTeam = async (team) => {
    const teamId = team.team_id;
    setTeamLoadFailed(false);
    const full = await loadTeamDetail(teamId);
    if (full) {
      setSelectedTeam(full);
      setPendingTeamId(full.team_id);
      navigateTo("team-view", { team_id: full.team_id });
    } else {
      setSelectedTeam(null);
      setTeamLoadFailed(true);
      navigateTo("team-view", { team_id: teamId });
    }
  };

  // ==========================================
  // OPEN EDIT DECISION
  // ==========================================

  const openEditDecision = async (decision) => {
    setDecisionMessage("");
    setDecisionMessageType("");

    const full = await loadSingleDecision(
      decision.decision_id
    );

    if (!full) return;

    setSelectedDecision(full);
    setDecisionTitle(full.title || "");
    setDecisionDescription(full.description || "");
    setDecisionContext(full.decision_context || "");
    setDecisionProblem(full.problem_statement || "");
    setDecisionObjective(full.objective || "");
    setDecisionCriteria(full.evaluation_criteria || "");
    setDecisionRisks(full.risks || "");
    setDecisionStakeholders(full.stakeholders || "");
    setDecisionRationale(full.rationale || "");
    setDecisionOutcome(full.final_outcome || "");
    setDecisionImplementationStatus(
      full.implementation_status || "Not Started"
    );
    setDecisionPriority(full.priority || "Medium");
    setDecisionDate(
      toDateTimeLocal(full.decision_date)
    );
    setDecisionAlternatives(
      (full.alternatives || []).map((a) => ({
        title: a.title || "",
        description: a.description || "",
        pros: a.pros || "",
        cons: a.cons || "",
        estimated_cost:
          a.estimated_cost !== null &&
          a.estimated_cost !== undefined
            ? String(a.estimated_cost)
            : "",
        feasibility: a.feasibility || "Medium",
        risk_level: a.risk_level || "Medium",
        risk_explanation: a.risk_explanation || ""
      }))
    );

    await loadDocuments(full.decision_id);

    navigateTo("decision-edit", { decision_id: full.decision_id });
  };

  // ==========================================
  // OPEN DECISIONS LIST
  // ==========================================

  const openDecisions = async () => {
    setDecisionMessage("");
    setDecisionMessageType("");

    navigateTo("decisions");

    await loadDecisions({
      search: searchQuery,
      status: statusFilter,
      team: teamFilter
    });
  };

  // ==========================================
  // APPLY FILTERS
  // ==========================================

  const applyFilters = () => {
    setDecisionMessage("");
    setDecisionMessageType("");

    loadDecisions({
      search: searchQuery,
      status: statusFilter,
      team: teamFilter
    });
  };

  // ==========================================
  // LOAD ALL DOCUMENTS (ACROSS DECISIONS)
  // ==========================================

  const loadAllDocuments = async () => {
    try {
      setAllDocumentsLoading(true);
      setAllDocuments([]);

      const token = getToken();
      const collected = [];

      let decisionList = decisions;

      if (!decisionList || decisionList.length === 0) {
        const resp = await fetch(
          `${API_BASE_URL}/decisions/`,
          {
            headers: {
              "Authorization": `Bearer ${token}`
            }
          }
        );

        if (resp.ok) {
          decisionList = await resp.json();
        }
      }

      for (const decision of (decisionList || [])) {
        const response = await fetch(
          `${API_BASE_URL}/decisions/${decision.decision_id}/documents`,
          {
            headers: {
              "Authorization": `Bearer ${token}`
            }
          }
        );

        if (!response.ok) continue;

        const data = await response.json();

        (data || []).forEach((doc) => {
          collected.push({
            ...doc,
            decision_id: decision.decision_id,
            decision_title: decision.title
          });
        });
      }

      setAllDocuments(collected);
    } catch (error) {
      console.error("All documents error:", error);
    } finally {
      setAllDocumentsLoading(false);
    }
  };

  // ==========================================
  // LOAD ALL USERS (TEAM MEMBERS)
  // ==========================================

  const loadAllUsers = async () => {
    try {
      const token = getToken();

      const response = await fetch(
        `${API_BASE_URL}/users/`,
        {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        setAllUsers([]);
        return;
      }

      const data = await response.json();

      setAllUsers(data || []);
    } catch (error) {
      console.error("All users error:", error);
      setAllUsers([]);
    }
  };

  // ==========================================
  // CREATE DECISION
  // ==========================================

  const handleCreateDecision = async (e) => {
    e.preventDefault();

    setDecisionMessage("");
    setDecisionMessageType("");

    if (!decisionTitle.trim()) {
      setDecisionMessage("Please enter a decision title.");
      setDecisionMessageType("error");
      return;
    }

    if (!decisionProblem.trim()) {
      setDecisionMessage("Please enter a problem statement.");
      setDecisionMessageType("error");
      return;
    }

    const alternatives = decisionAlternatives
      .filter((a) => a.title && a.title.trim())
      .map((a) => ({
        title: a.title.trim(),
        description: a.description
          ? a.description.trim()
          : null,
        pros: a.pros ? a.pros.trim() : null,
        cons: a.cons ? a.cons.trim() : null,
        estimated_cost:
          a.estimated_cost !== null &&
          a.estimated_cost !== undefined &&
          a.estimated_cost !== ""
            ? Number(a.estimated_cost)
            : null,
        feasibility: a.feasibility || null,
        risk_level: a.risk_level || null,
        risk_explanation: a.risk_explanation
          ? a.risk_explanation.trim()
          : null
      }));

    if (!createFile) {
      setDecisionMessage("Supporting document is required. Please upload a document.");
      setDecisionMessageType("error");
      return;
    }

    const allowedCreateExts = [
      ".pdf", ".doc", ".docx", ".xls", ".xlsx",
      ".ppt", ".pptx", ".jpg", ".jpeg", ".png"
    ];

    const createFileName = (createFile.name || "").toLowerCase();
    const createFileExt = createFile.name.includes(".")
      ? createFile.name.slice(createFile.name.lastIndexOf(".")).toLowerCase()
      : "";

    if (!allowedCreateExts.includes(createFileExt)) {
      setDecisionMessage(
        "Invalid file type. Please upload a PDF, DOC/DOCX, XLS/XLSX, PPT/PPTX, JPG/JPEG, or PNG file."
      );
      setDecisionMessageType("error");
      return;
    }

    try {
      setDecisionsLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/decisions/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${getToken()}`
          },
          body: JSON.stringify({
            title: decisionTitle.trim(),
            description: decisionDescription.trim()
              ? decisionDescription.trim()
              : null,
            decision_context: decisionContext.trim()
              ? decisionContext.trim()
              : null,
            problem_statement: decisionProblem.trim(),
            objective: decisionObjective.trim()
              ? decisionObjective.trim()
              : null,
            evaluation_criteria: decisionCriteria.trim()
              ? decisionCriteria.trim()
              : null,
            risks: decisionRisks.trim()
              ? decisionRisks.trim()
              : null,
            stakeholders: decisionStakeholders.trim()
              ? decisionStakeholders.trim()
              : null,
            rationale: decisionRationale.trim()
              ? decisionRationale.trim()
              : null,
            final_outcome: decisionOutcome.trim()
              ? decisionOutcome.trim()
              : null,
            implementation_status:
              decisionImplementationStatus,
            priority: decisionPriority,
            decision_date: decisionDate
              ? `${decisionDate}:00`
              : null,
            alternatives
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setDecisionMessage(
            "Session expired. Please login again."
          );

          setDecisionMessageType("error");

          handleLogout();
          return;
        }

        if (response.status === 422) {
          setDecisionMessage(
            data.detail || "Please check the required fields."
          );

          setDecisionMessageType("error");
          return;
        }

        setDecisionMessage(
          data.detail || "Failed to create decision."
        );

        setDecisionMessageType("error");
        return;
      }

      setDecisionMessage(
        "Decision created successfully."
      );

      setDecisionMessageType("success");

      resetDecisionForm();

      if (createFile) {
        setLastCreatedDecisionId(data.decision_id);

        if (typeof handleCreateFileUpload === "function") {
          handleCreateFileUpload(data.decision_id, createFile);
        }
      } else {
        setCreateFile(null);
        setLastCreatedDecisionId(null);

        await loadDecisions({
          search: searchQuery,
          status: statusFilter,
          team: teamFilter
        });
      }

      setCreatedConfirmTarget(data);
      createdConfirmRef.current = data;

    } catch (error) {
      console.error(error);

      setDecisionMessage(
        "Unable to connect to server."
      );

      setDecisionMessageType("error");

    } finally {
      setDecisionsLoading(false);
    }
  };

  // ==========================================
  // CREATE DOCUMENT UPLOAD (after decision creation)
  // ==========================================

  const handleCreateFileUpload = async (decisionId, file) => {
    const targetId = decisionId ?? lastCreatedDecisionId;
    const targetFile = file ?? createFile;

    if (!targetFile || !targetId) return;

    setCreateFileUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", targetFile);

      const response = await fetch(
        `${API_BASE_URL}/decisions/${targetId}/documents`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getToken()}`
          },
          body: formData
        }
      );

      if (response.ok) {
        setDecisionMessage(
          "Decision created and document uploaded."
        );

        setDecisionMessageType("success");
      } else {
        setDecisionMessage(
          "Decision created but document upload failed."
        );

        setDecisionMessageType("error");
      }
    } catch (error) {
      setDecisionMessage(
        "Decision created but document upload failed."
      );

      setDecisionMessageType("error");
    } finally {
      setCreateFileUploading(false);
      setCreateFile(null);
      setLastCreatedDecisionId(null);

      await loadDecisions({
        search: searchQuery,
        status: statusFilter,
        team: teamFilter
      });

      if (createdConfirmRef.current) return;

      setTimeout(() => {
        navigateTo("decisions");
        setDecisionMessage("");
        setDecisionMessageType("");
      }, 1500);
    }
  };

  // ==========================================
  // UPDATE DECISION
  // ==========================================

  const handleUpdateDecision = async (e) => {
    e.preventDefault();

    setDecisionMessage("");
    setDecisionMessageType("");

    if (!decisionTitle.trim()) {
      setDecisionMessage("Please enter a decision title.");
      setDecisionMessageType("error");
      return;
    }

    if (!decisionProblem.trim()) {
      setDecisionMessage("Please enter a problem statement.");
      setDecisionMessageType("error");
      return;
    }

    const alternatives = decisionAlternatives
      .filter((a) => a.title && a.title.trim())
      .map((a) => ({
        title: a.title.trim(),
        description: a.description
          ? a.description.trim()
          : null,
        pros: a.pros ? a.pros.trim() : null,
        cons: a.cons ? a.cons.trim() : null,
        estimated_cost:
          a.estimated_cost !== null &&
          a.estimated_cost !== undefined &&
          a.estimated_cost !== ""
            ? Number(a.estimated_cost)
            : null,
        feasibility: a.feasibility || null,
        risk_level: a.risk_level || null,
        risk_explanation: a.risk_explanation
          ? a.risk_explanation.trim()
          : null
      }));

    try {
      setDecisionsLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/decisions/${selectedDecision.decision_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${getToken()}`
          },
          body: JSON.stringify({
            title: decisionTitle.trim(),
            description: decisionDescription.trim()
              ? decisionDescription.trim()
              : null,
            decision_context: decisionContext.trim()
              ? decisionContext.trim()
              : null,
            problem_statement: decisionProblem.trim(),
            objective: decisionObjective.trim()
              ? decisionObjective.trim()
              : null,
            evaluation_criteria: decisionCriteria.trim()
              ? decisionCriteria.trim()
              : null,
            risks: decisionRisks.trim()
              ? decisionRisks.trim()
              : null,
            stakeholders: decisionStakeholders.trim()
              ? decisionStakeholders.trim()
              : null,
            rationale: decisionRationale.trim()
              ? decisionRationale.trim()
              : null,
            final_outcome: decisionOutcome.trim()
              ? decisionOutcome.trim()
              : null,
            implementation_status:
              decisionImplementationStatus,
            priority: decisionPriority,
            decision_date: decisionDate
              ? `${decisionDate}:00`
              : null,
            alternatives
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setDecisionMessage(
            "Session expired. Please login again."
          );

          setDecisionMessageType("error");

          handleLogout();
          return;
        }

        if (response.status === 404) {
          setDecisionMessage(
            "Decision not found."
          );

          setDecisionMessageType("error");
          return;
        }

        if (response.status === 422) {
          setDecisionMessage(
            data.detail || "Please check the required fields."
          );

          setDecisionMessageType("error");
          return;
        }

        setDecisionMessage(
          data.detail || "Failed to update decision."
        );

        setDecisionMessageType("error");
        return;
      }

      const original = selectedDecision || {};

      const normalizeDate = (val) =>
        val ? String(val).slice(0, 16) : "";

      const changedCount = [
        decisionTitle.trim() !== (original.title || ""),
        decisionDescription.trim() !== (original.description || ""),
        decisionContext.trim() !== (original.decision_context || ""),
        decisionProblem.trim() !== (original.problem_statement || ""),
        decisionObjective.trim() !== (original.objective || ""),
        decisionCriteria.trim() !== (original.evaluation_criteria || ""),
        decisionRisks.trim() !== (original.risks || ""),
        decisionStakeholders.trim() !== (original.stakeholders || ""),
        decisionRationale.trim() !== (original.rationale || ""),
        decisionOutcome.trim() !== (original.final_outcome || ""),
        decisionImplementationStatus !== (original.implementation_status || "Not Started"),
        decisionPriority !== (original.priority || "Medium"),
        normalizeDate(decisionDate) !== normalizeDate(original.decision_date),
      ].filter(Boolean).length;

      const who = user?.name || "the user";

      setDecisionMessage(
        `Decision updated: "${decisionTitle.trim()}" was updated by ${who}. ${changedCount} ${changedCount === 1 ? "field" : "fields"} changed.`
      );

      setDecisionMessageType("success");

      setSelectedDecision(data);

      await loadDecisions({
        search: searchQuery,
        status: statusFilter,
        team: teamFilter
      });

      setTimeout(() => {
        navigateTo("decisions");
        setDecisionMessage("");
        setDecisionMessageType("");
      }, 1000);

    } catch (error) {
      console.error(error);

      setDecisionMessage(
        "Unable to connect to server."
      );

      setDecisionMessageType("error");

    } finally {
      setDecisionsLoading(false);
    }
  };

  // ==========================================
  // CONFIRM DELETE / ARCHIVE
  // ==========================================

  const cancelDelete = () => {
    setDeleteTarget(null);
  };

  const handleDeleteDecision = async (decision) => {
    try {
      setIsDeleting(true);

      const response = await fetch(
        `${API_BASE_URL}/decisions/${decision.decision_id}`,
        {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${getToken()}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setDecisionMessage(
            "Session expired. Please login again."
          );

          setDecisionMessageType("error");

          handleLogout();
          return;
        }

        if (response.status === 404) {
          setDecisionMessage(
            "Decision not found."
          );

          setDecisionMessageType("error");
          return;
        }

        setDecisionMessage(
          data.detail || "Failed to archive decision."
        );

        setDecisionMessageType("error");
        return;
      }

      setDecisionMessage(
        data.message ||
          (decision.status === "Draft" ||
          decision.status === "Under Review" ||
          decision.status === "Reviewer Approved" ||
          decision.status === "Rejected"
            ? "Decision deleted successfully."
            : "Decision archived successfully.")
      );

      setDecisionMessageType("success");

      await loadDecisions({
        search: searchQuery,
        status: statusFilter,
        team: teamFilter
      });

    } catch (error) {
      console.error(error);

      setDecisionMessage(
        "Unable to connect to server."
      );

      setDecisionMessageType("error");

    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  // ==========================================
  // APPROVAL WORKFLOW ACTIONS
  // ==========================================

  const applyDecisionUpdate = (decision, data) => {
    setDecisions((prev) =>
      prev.map((d) =>
        d.decision_id === decision.decision_id ? data : d
      )
    );

    if (
      selectedDecision &&
      selectedDecision.decision_id === decision.decision_id
    ) {
      setSelectedDecision(data);
    }
  };

  const performWorkflowAction = async (
    decision,
    endpoint,
    body,
    successMessage
  ) => {
    setOverviewMessage("");
    setOverviewMessageType("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/decisions/${decision.decision_id}${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${getToken()}`
          },
          ...(body ? { body: JSON.stringify(body) } : {})
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setOverviewMessage(
            "Session expired. Please login again."
          );

          setOverviewMessageType("error");

          handleLogout();
          return null;
        }

        const detail = data.detail || "Action failed.";

        setOverviewMessage(detail);
        setOverviewMessageType("error");
        setDecisionMessage(detail);
        setDecisionMessageType("error");
        return null;
      }

      setOverviewMessage(successMessage);
      setOverviewMessageType("success");
      setDecisionMessage(successMessage);
      setDecisionMessageType("success");

      applyDecisionUpdate(decision, data);

      return data;

    } catch (error) {
      console.error(error);

      const detail = "Unable to connect to server.";

      setOverviewMessage(detail);
      setOverviewMessageType("error");
      setDecisionMessage(detail);
      setDecisionMessageType("error");
      return null;
    }
  };

  const handleSubmitForReview = async (decision) => {
    if (!decision) return;

    setIsSubmitting(true);

    const result = await performWorkflowAction(
      decision,
      "/submit",
      null,
      "Decision submitted for review successfully."
    );

    if (result) {
      setSubmitTarget(null);
    }

    setIsSubmitting(false);
  };

  const handleReviewDecision = async (decision, action, reason) => {
    if (!decision) return;

    setIsReviewing(true);

    const result = await performWorkflowAction(
      decision,
      "/review",
      { action, reason: reason || null },
      action === "approve"
        ? "Decision approved by reviewer."
        : "Decision rejected by reviewer."
    );

    if (result) {
      setReviewTarget(null);
      setRejectReason("");
    }

    setIsReviewing(false);
  };

  const handleManagerReviewDecision = async (
    decision,
    action,
    reason
  ) => {
    if (!decision) return;

    setIsReviewing(true);

    const result = await performWorkflowAction(
      decision,
      "/manager-review",
      { action, reason: reason || null },
      action === "approve"
        ? "Decision finally approved."
        : "Decision rejected by manager."
    );

    if (result) {
      setReviewTarget(null);
      setRejectReason("");
    }

    setIsReviewing(false);
  };

  const handleArchiveDecision = async (decision) => {
    if (!decision) return;

    setIsArchiving(true);

    const result = await performWorkflowAction(
      decision,
      "/archive",
      null,
      "Decision archived successfully."
    );

    if (result) {
      setArchiveTarget(null);
    }

    setIsArchiving(false);
  };

  const handleCreatedReviewSkip = () => {
    setCreatedConfirmTarget(null);
    createdConfirmRef.current = null;

    setTimeout(() => {
      navigateTo("decisions");
      setDecisionMessage("");
      setDecisionMessageType("");
    }, 1000);
  };

  const handleCreatedReviewSubmit = async () => {
    const created =
      createdConfirmTarget || createdConfirmRef.current;

    if (!created) return;

    setIsSubmitting(true);

    try {
      const result = await performWorkflowAction(
        created,
        "/submit",
        null,
        "Decision submitted for review successfully."
      );

      if (!result) return;

      setCreatedConfirmTarget(null);
      createdConfirmRef.current = null;

      navigateTo("decisions");
    } finally {
      setIsSubmitting(false);
    }
  };

  const refreshSelectedDecision = async (decisionId) => {
    const full = await loadSingleDecision(decisionId);

    if (full) {
      setSelectedDecision(full);

      setDecisions((prev) =>
        prev.map((d) =>
          d.decision_id === decisionId ? full : d
        )
      );
    }
  };

  // ==========================================
  // OPEN ADD ALTERNATIVE
  // ==========================================

  const openAddAlternative = () => {
    setAltMessage("");
    setAltMessageType("");

    setAltForm({
      alternative_id: null,
      title: "",
      description: "",
      pros: "",
      cons: "",
      estimated_cost: "",
      feasibility: "Medium",
      risk_level: "Medium",
      risk_explanation: ""
    });

    setAltModalMode("create");
  };

  // ==========================================
  // OPEN EDIT ALTERNATIVE
  // ==========================================

  const openEditAlternative = (alt) => {
    setAltMessage("");
    setAltMessageType("");

    setAltForm({
      alternative_id: alt.alternative_id,
      title: alt.title || "",
      description: alt.description || "",
      pros: alt.pros || "",
      cons: alt.cons || "",
      estimated_cost:
        alt.estimated_cost !== null &&
        alt.estimated_cost !== undefined
          ? String(alt.estimated_cost)
          : "",
      feasibility: alt.feasibility || "Medium",
      risk_level: alt.risk_level || "Medium",
      risk_explanation: alt.risk_explanation || ""
    });

    setAltModalMode("edit");
  };

  // ==========================================
  // OPEN VIEW ALTERNATIVE
  // ==========================================

  const openViewAlternative = (alt) => {
    setAltMessage("");
    setAltMessageType("");

    setAltForm({
      alternative_id: alt.alternative_id,
      title: alt.title || "",
      description: alt.description || "",
      pros: alt.pros || "",
      cons: alt.cons || "",
      estimated_cost:
        alt.estimated_cost !== null &&
        alt.estimated_cost !== undefined
          ? String(alt.estimated_cost)
          : "",
      feasibility: alt.feasibility || "",
      risk_level: alt.risk_level || "",
      risk_explanation: alt.risk_explanation || ""
    });

    setAltModalMode("view");
  };

// ==========================================

  const closeAltModal = () => {
    setAltModalMode(null);
    setAltMessage("");
    setAltMessageType("");
  };

  // ==========================================
  // SET ALTERNATIVE FORM FIELD
  // ==========================================

  const setAltField = (field, value) => {
    setAltForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  // ==========================================
  // SAVE ALTERNATIVE
  // ==========================================

  const handleSaveAlternative = async (e) => {
    e.preventDefault();

    setAltMessage("");
    setAltMessageType("");

    if (!altForm.title.trim()) {
      setAltMessage("Please enter an alternative title.");
      setAltMessageType("error");
      return;
    }

    let costValue = null;

    if (
      altForm.estimated_cost !== null &&
      altForm.estimated_cost !== ""
    ) {
      costValue = Number(altForm.estimated_cost);

      if (isNaN(costValue)) {
        setAltMessage(
          "Estimated cost must be a valid number."
        );

        setAltMessageType("error");
        return;
      }
    }

    const payload = {
      title: altForm.title.trim(),
      description: altForm.description.trim()
        ? altForm.description.trim()
        : null,
      pros: altForm.pros.trim() ? altForm.pros.trim() : null,
      cons: altForm.cons.trim() ? altForm.cons.trim() : null,
      estimated_cost: costValue,
      feasibility: altForm.feasibility,
      risk_level: altForm.risk_level,
      risk_explanation: altForm.risk_explanation.trim()
        ? altForm.risk_explanation.trim()
        : null
    };

    const isEdit = altModalMode === "edit";

    try {
      setAltSaving(true);

      const response = await fetch(
        isEdit
          ? `${API_BASE_URL}/decisions/${selectedDecision.decision_id}/alternatives/${altForm.alternative_id}`
          : `${API_BASE_URL}/decisions/${selectedDecision.decision_id}/alternatives`,
        {
          method: isEdit ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${getToken()}`
          },
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setAltSectionMessage(
            "Session expired. Please login again."
          );

          setAltSectionMessageType("error");

          handleLogout();
          return;
        }

        if (response.status === 403) {
          setAltMessage(
            data.detail ||
              "You do not have permission to modify this alternative."
          );

          setAltMessageType("error");
          return;
        }

        setAltMessage(
          data.detail || "Failed to save alternative."
        );

        setAltMessageType("error");
        return;
      }

      setAltModalMode(null);
      setAltMessage("");
      setAltMessageType("");

      setAltSectionMessage(
        isEdit
          ? "Alternative updated successfully."
          : "Alternative created successfully."
      );

      setAltSectionMessageType("success");

      await refreshSelectedDecision(
        selectedDecision.decision_id
      );

    } catch (error) {
      console.error(error);

      setAltMessage("Unable to connect to server.");
      setAltMessageType("error");

    } finally {
      setAltSaving(false);
    }
  };

  // ==========================================
  // CANCEL ALTERNATIVE DELETE
  // ==========================================

  const cancelAltDelete = () => {
    setAltDeleteTarget(null);
  };

  // ==========================================
  // DELETE ALTERNATIVE
  // ==========================================

  const handleDeleteAlternative = async () => {
    if (!altDeleteTarget) return;

    try {
      setAltIsDeleting(true);

      const response = await fetch(
        `${API_BASE_URL}/decisions/${selectedDecision.decision_id}/alternatives/${altDeleteTarget.alternative_id}`,
        {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${getToken()}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setAltSectionMessage(
            "Session expired. Please login again."
          );

          setAltSectionMessageType("error");

          handleLogout();
          return;
        }

        setAltSectionMessage(
          data.detail || "Failed to delete alternative."
        );

        setAltSectionMessageType("error");
        return;
      }

      setAltDeleteTarget(null);

      setAltSectionMessage(
        data.message || "Alternative deleted successfully."
      );

      setAltSectionMessageType("success");

      await refreshSelectedDecision(
        selectedDecision.decision_id
      );

    } catch (error) {
      console.error(error);

      setAltSectionMessage(
        "Unable to connect to server."
      );

      setAltSectionMessageType("error");

    } finally {
      setAltIsDeleting(false);
    }
  };

  // ==========================================
  // SELECT / RECOMMEND ALTERNATIVE
  // ==========================================

  const handleSelectAlternative = async (alt, recommended) => {
    try {
      setAltWorking(true);

      const response = await fetch(
        `${API_BASE_URL}/decisions/${selectedDecision.decision_id}/alternatives/${alt.alternative_id}/recommend`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${getToken()}`
          },
          body: JSON.stringify({
            is_recommended: recommended
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setAltSectionMessage(
            "Session expired. Please login again."
          );

          setAltSectionMessageType("error");

          handleLogout();
          return;
        }

        setAltSectionMessage(
          data.detail || "Failed to update recommendation."
        );

        setAltSectionMessageType("error");
        return;
      }

      setAltSectionMessage(
        data.message || "Recommendation updated."
      );

      setAltSectionMessageType("success");

      await refreshSelectedDecision(
        selectedDecision.decision_id
      );

    } catch (error) {
      console.error(error);

      setAltSectionMessage(
        "Unable to connect to server."
      );

      setAltSectionMessageType("error");

    } finally {
      setAltWorking(false);
    }
  };

  // ==========================================
  // LOAD DOCUMENTS
  // ==========================================

  const loadDocuments = async (decisionId) => {
    try {
      setDocumentsLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/decisions/${decisionId}/documents`,
        {
          headers: {
            "Authorization": `Bearer ${getToken()}`
          }
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          handleLogout();
          return;
        }

        setDocMessage("Failed to load documents.");
        setDocMessageType("error");
        return;
      }

      const data = await response.json();

      setDocuments(data);

    } catch (error) {
      console.error("Documents error:", error);

      setDocMessage("Unable to connect to server.");
      setDocMessageType("error");

    } finally {
      setDocumentsLoading(false);
    }
  };

  // ==========================================
  // HANDLE DOCUMENT UPLOAD (WITH PROGRESS)
  // ==========================================

  const handleDocumentUpload = (file) => {
    if (!file) return;

    if (!selectedDecision) return;

    setDocMessage("");
    setDocMessageType("");
    setUploadProgress(0);

    const formData = new FormData();

    formData.append("file", file);

    const xhr = new XMLHttpRequest();

    xhr.open(
      "POST",
      `${API_BASE_URL}/decisions/${selectedDecision.decision_id}/documents`
    );

    xhr.setRequestHeader(
      "Authorization",
      `Bearer ${getToken()}`
    );

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const pct = Math.round(
          (e.loaded / e.total) * 100
        );

        setUploadProgress(pct);
      }
    };

    xhr.onload = async () => {
      let data = {};

      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        data = {};
      }

      setDocUploading(false);
      setUploadProgress(0);

      if (xhr.status >= 200 && xhr.status < 300) {
        setDocMessage("Document uploaded successfully.");
        setDocMessageType("success");

        setDocuments((prev) => [
          data,
          ...prev
        ]);

        await refreshSelectedDecision(
          selectedDecision.decision_id
        );

        return;
      }

      if (xhr.status === 401) {
        setDecisionMessage(
          "Session expired. Please login again."
        );

        setDecisionMessageType("error");

        handleLogout();
        return;
      }

      setDocMessage(
        data.detail || "Failed to upload document."
      );

      setDocMessageType("error");
    };

    xhr.onerror = () => {
      setDocUploading(false);
      setUploadProgress(0);

      setDocMessage("Unable to connect to server.");
      setDocMessageType("error");
    };

    xhr.onabort = () => {
      setDocUploading(false);
      setUploadProgress(0);
    };

    setDocUploading(true);

    xhr.send(formData);
  };

  // ==========================================
  // HANDLE FILE SELECT
  // ==========================================

  const handleDocumentFileSelect = (e) => {
    const file = e.target.files && e.target.files[0];

    if (file) {
      handleDocumentUpload(file);
    }

    e.target.value = "";
  };

  // ==========================================
  // FORMAT FILE SIZE
  // ==========================================

  const formatFileSize = (bytes) => {
    if (
      bytes === null ||
      bytes === undefined ||
      isNaN(bytes)
    ) {
      return "Unknown size";
    }

    if (bytes < 1024) return `${bytes} B`;

    const units = ["KB", "MB", "GB"];

    let value = bytes / 1024;

    let unit = units[0];

    for (let i = 1; i < units.length; i++) {
      if (value >= 1024) {
        value /= 1024;
        unit = units[i];
      }
    }

    return `${value.toFixed(value >= 10 ? 0 : 1)} ${unit}`;
  };

  // ==========================================
  // HANDLE DOCUMENT DOWNLOAD / OPEN
  // ==========================================

  const handleDownloadDocument = async (doc, open = false) => {
    try {
      setDocMessage("");
      setDocMessageType("");

      const response = await fetch(
        `${API_BASE_URL}/documents/${doc.document_id}/download`,
        {
          headers: {
            "Authorization": `Bearer ${getToken()}`
          }
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          setDecisionMessage(
            "Session expired. Please login again."
          );

          setDecisionMessageType("error");

          handleLogout();
          return;
        }

        setDocMessage(
          "Failed to open document. It may no longer exist on the server."
        );

        setDocMessageType("error");
        return;
      }

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);

      const isViewable =
        /^(image\/|application\/pdf|text\/)/.test(
          doc.file_type || ""
        );

      if (open && isViewable) {
        window.open(url, "_blank");

        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 60000);

        return;
      }

      const link = document.createElement("a");

      link.href = url;

      link.download =
        doc.original_file_name || "download";

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 60000);

    } catch (error) {
      console.error("Download error:", error);

      setDocMessage("Unable to connect to server.");
      setDocMessageType("error");
    }
  };

  // ==========================================
  // CANCEL DOCUMENT DELETE
  // ==========================================

  const cancelDocDelete = () => {
    setDocDeleteTarget(null);
  };

  // ==========================================
  // DELETE DOCUMENT
  // ==========================================

  const handleDeleteDocument = async () => {
    if (!docDeleteTarget) return;

    try {
      setDocDeleting(true);

      const response = await fetch(
        `${API_BASE_URL}/documents/${docDeleteTarget.document_id}`,
        {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${getToken()}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setDecisionMessage(
            "Session expired. Please login again."
          );

          setDecisionMessageType("error");

          handleLogout();
          return;
        }

        setDocMessage(
          data.detail || "Failed to delete document."
        );

        setDocMessageType("error");
        return;
      }

      setDocDeleteTarget(null);

      setDocMessage(
        data.message || "Document deleted successfully."
      );

      setDocMessageType("success");

      setDocuments((prev) =>
        prev.filter(
          (d) => d.document_id !== docDeleteTarget.document_id
        )
      );

      await refreshSelectedDecision(
        selectedDecision.decision_id
      );

    } catch (error) {
      console.error(error);

      setDocMessage("Unable to connect to server.");
      setDocMessageType("error");

    } finally {
      setDocDeleting(false);
    }
  };

  // ==========================================
  // LOAD COMMENTS (DISCUSSION)
  // ==========================================

  const loadComments = async (decisionId) => {
    try {
      setCommentsLoading(true);
      setCommentMessage("");
      setCommentMessageType("");

      const response = await fetch(
        `${API_BASE_URL}/decisions/${decisionId}/comments`,
        {
          headers: {
            "Authorization": `Bearer ${getToken()}`
          }
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          handleLogout();
          return;
        }

        setCommentMessage("Failed to load discussion.");
        setCommentMessageType("error");
        return;
      }

      const data = await response.json();

      setComments(data || []);

    } catch (error) {
      console.error("Comments error:", error);

      setCommentMessage("Unable to connect to server.");
      setCommentMessageType("error");

    } finally {
      setCommentsLoading(false);
    }
  };

  // ==========================================
  // SUBMIT COMMENT
  // ==========================================

  const handleCommentSubmit = async (e) => {
    e.preventDefault();

    if (!selectedDecision) return;

    const text = commentText.trim();

    if (!text) {
      setCommentMessage("Please enter a comment.");
      setCommentMessageType("error");
      return;
    }

    try {
      setCommentSubmitting(true);
      setCommentMessage("");
      setCommentMessageType("");

      const response = await fetch(
        `${API_BASE_URL}/decisions/${selectedDecision.decision_id}/comments`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${getToken()}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ content: text })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setDecisionMessage(
            "Session expired. Please login again."
          );

          setDecisionMessageType("error");

          handleLogout();
          return;
        }

        setCommentMessage(
          data.detail || "Failed to post comment."
        );

        setCommentMessageType("error");
        return;
      }

      setCommentText("");
      setCommentMessage("Comment posted successfully.");
      setCommentMessageType("success");

      setComments((prev) => [...prev, data]);

      await refreshSelectedDecision(
        selectedDecision.decision_id
      );

    } catch (error) {
      console.error("Comment submit error:", error);

      setCommentMessage("Unable to connect to server.");
      setCommentMessageType("error");

    } finally {
      setCommentSubmitting(false);
    }
  };

  // ==========================================
  // CANCEL COMMENT DELETE
  // ==========================================

  const cancelCommentDelete = () => {
    setCommentDeleteTarget(null);
  };

  // ==========================================
  // DELETE COMMENT
  // ==========================================

  const handleDeleteComment = async () => {
    if (!commentDeleteTarget || !selectedDecision) return;

    try {
      setCommentDeleting(true);

      const response = await fetch(
        `${API_BASE_URL}/decisions/${selectedDecision.decision_id}/comments/${commentDeleteTarget.comment_id}`,
        {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${getToken()}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setDecisionMessage(
            "Session expired. Please login again."
          );

          setDecisionMessageType("error");

          handleLogout();
          return;
        }

        setCommentMessage(
          data.detail || "Failed to delete comment."
        );

        setCommentMessageType("error");
        return;
      }

      setCommentDeleteTarget(null);

      setCommentMessage(
        data.message || "Comment deleted successfully."
      );

      setCommentMessageType("success");

      setComments((prev) =>
        prev.filter(
          (c) =>
            c.comment_id !== commentDeleteTarget.comment_id
        )
      );

      await refreshSelectedDecision(
        selectedDecision.decision_id
      );

    } catch (error) {
      console.error(error);

      setCommentMessage("Unable to connect to server.");
      setCommentMessageType("error");

    } finally {
      setCommentDeleting(false);
    }
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

      if (loginRememberMe) {
        localStorage.setItem("remembered_email", loginEmail.trim());
      } else {
        localStorage.removeItem("remembered_email");
      }

      setUser(data.user);

      setLoginPassword("");

      setMessage("");

      // ======================================
      // GO TO MILESTONE 1 HOME
      // ======================================

      navigateTo("home");

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

    window.history.replaceState(null, "", "");
    setPage("login");
  };

  // ==========================================
  // DECISIONS LIST
  // ==========================================

  if (page === "decisions") {
    return (
      <DecisionsPage
        user={user}
        getRoleName={getRoleName}
        navigateTo={navigateTo}
        navigateBack={() => window.history.back()}
        decisions={decisions}
        decisionsLoading={decisionsLoading}
        decisionMessage={decisionMessage}
        decisionMessageType={decisionMessageType}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        teamFilter={teamFilter}
        setTeamFilter={setTeamFilter}
        teams={teams}
        applyFilters={applyFilters}
        openCreateDecision={openCreateDecision}
        openViewDecision={openViewDecision}
        openEditDecision={openEditDecision}
        deleteTarget={deleteTarget}
        isDeleting={isDeleting}
        setDeleteTarget={setDeleteTarget}
        cancelDelete={cancelDelete}
        handleDeleteDecision={handleDeleteDecision}
        handleSubmitForReview={handleSubmitForReview}
        submitTarget={submitTarget}
        setSubmitTarget={setSubmitTarget}
        isSubmitting={isSubmitting}
        handleLogout={handleLogout}
        formatDate={formatDate}
      />
    );
  }

  // ==========================================
  // CREATE DECISION
  // ==========================================

  if (page === "decision-create") {
    return (
      <CreateDecisionPage
        user={user}
        getRoleName={getRoleName}
        navigateTo={navigateTo}
        navigateBack={() => window.history.back()}
        decisionTitle={decisionTitle}
        decisionDescription={decisionDescription}
        decisionContext={decisionContext}
        decisionProblem={decisionProblem}
        decisionObjective={decisionObjective}
        decisionCriteria={decisionCriteria}
        decisionRisks={decisionRisks}
        decisionStakeholders={decisionStakeholders}
        decisionRationale={decisionRationale}
        decisionOutcome={decisionOutcome}
        decisionImplementationStatus={decisionImplementationStatus}
        decisionPriority={decisionPriority}
        decisionDate={decisionDate}
        decisionAlternatives={decisionAlternatives}
        decisionMessage={decisionMessage}
        decisionMessageType={decisionMessageType}
        decisionsLoading={decisionsLoading}
        setDecisionTitle={setDecisionTitle}
        setDecisionDescription={setDecisionDescription}
        setDecisionContext={setDecisionContext}
        setDecisionProblem={setDecisionProblem}
        setDecisionObjective={setDecisionObjective}
        setDecisionCriteria={setDecisionCriteria}
        setDecisionRisks={setDecisionRisks}
        setDecisionStakeholders={setDecisionStakeholders}
        setDecisionRationale={setDecisionRationale}
        setDecisionOutcome={setDecisionOutcome}
        setDecisionImplementationStatus={setDecisionImplementationStatus}
        setDecisionPriority={setDecisionPriority}
        setDecisionDate={setDecisionDate}
        setDecisionAlternatives={setDecisionAlternatives}
        handleCreateDecision={handleCreateDecision}
        handleLogout={handleLogout}
        openDecisions={openDecisions}
        createFile={createFile}
        setCreateFile={setCreateFile}
        createFileUploading={createFileUploading}
        setCreateFileUploading={setCreateFileUploading}
        lastCreatedDecisionId={lastCreatedDecisionId}
        setLastCreatedDecisionId={setLastCreatedDecisionId}
        handleCreateFileUpload={handleCreateFileUpload}
        createdConfirmTarget={createdConfirmTarget}
        handleCreatedReviewSubmit={handleCreatedReviewSubmit}
        handleCreatedReviewSkip={handleCreatedReviewSkip}
        isSubmitting={isSubmitting}
      />
    );
  }

  // ==========================================
  // VIEW DECISION
  // ==========================================

  if (page === "decision-view" && !selectedDecision) {
    return (
      <div className="dash-layout">
        <AppSidebar
          activePage="decisions"
          navigateTo={navigateTo}
          handleLogout={handleLogout}
        />
        <main className="dash-main">
          <div className="empty-state" style={{ marginTop: "48px" }}>
            {pendingDecisionId
              ? `Loading decision #${pendingDecisionId}...`
              : "No decision selected."}
          </div>
        </main>
      </div>
    );
  }

  if (page === "decision-view") {
    return (
      <ViewDecisionPage
        user={user}
        getRoleName={getRoleName}
        navigateTo={navigateTo}
        navigateBack={() => window.history.back()}
        selectedDecision={selectedDecision}
        overviewMessage={overviewMessage}
        overviewMessageType={overviewMessageType}
        altSectionMessage={altSectionMessage}
        altSectionMessageType={altSectionMessageType}
        handleSubmitForReview={handleSubmitForReview}
        handleReviewDecision={handleReviewDecision}
        handleManagerReviewDecision={handleManagerReviewDecision}
        handleArchiveDecision={handleArchiveDecision}
        
        submitTarget={submitTarget}
        setSubmitTarget={setSubmitTarget}
        isSubmitting={isSubmitting}
        reviewTarget={reviewTarget}
        setReviewTarget={setReviewTarget}
        rejectReason={rejectReason}
        setRejectReason={setRejectReason}
        reviewStep={reviewStep}
        setReviewStep={setReviewStep}
        isReviewing={isReviewing}
        archiveTarget={archiveTarget}
        setArchiveTarget={setArchiveTarget}
        isArchiving={isArchiving}
        handleLogout={handleLogout}
        openEditDecision={openEditDecision}
        deleteTarget={deleteTarget}
        isDeleting={isDeleting}
        setDeleteTarget={setDeleteTarget}
        cancelDelete={cancelDelete}
        handleDeleteDecision={handleDeleteDecision}
        formatDate={formatDate}
        altModalMode={altModalMode}
        altForm={altForm}
        altSaving={altSaving}
        altWorking={altWorking}
        altDeleteTarget={altDeleteTarget}
        altIsDeleting={altIsDeleting}
        altMessage={altMessage}
        altMessageType={altMessageType}
        setAltField={setAltField}
        openAddAlternative={openAddAlternative}
        openEditAlternative={openEditAlternative}
        openViewAlternative={openViewAlternative}
        closeAltModal={closeAltModal}
        handleSaveAlternative={handleSaveAlternative}
        cancelAltDelete={cancelAltDelete}
        handleDeleteAlternative={handleDeleteAlternative}
        handleSelectAlternative={handleSelectAlternative}
        formatCost={formatCost}
        levelBadgeClass={levelBadgeClass}
        documents={documents}
        documentsLoading={documentsLoading}
        docUploading={docUploading}
        uploadProgress={uploadProgress}
        docDeleteTarget={docDeleteTarget}
        docDeleting={docDeleting}
        docMessage={docMessage}
        docMessageType={docMessageType}
        handleDocumentFileSelect={handleDocumentFileSelect}
        handleDownloadDocument={handleDownloadDocument}
        setDocDeleteTarget={setDocDeleteTarget}
        cancelDocDelete={cancelDocDelete}
        handleDeleteDocument={handleDeleteDocument}
        formatFileSize={formatFileSize}
        comments={comments}
        commentsLoading={commentsLoading}
        commentText={commentText}
        setCommentText={setCommentText}
        commentSubmitting={commentSubmitting}
        commentDeleteTarget={commentDeleteTarget}
        commentDeleting={commentDeleting}
        commentMessage={commentMessage}
        commentMessageType={commentMessageType}
        handleCommentSubmit={handleCommentSubmit}
        setCommentDeleteTarget={setCommentDeleteTarget}
        cancelCommentDelete={cancelCommentDelete}
        handleDeleteComment={handleDeleteComment}
      />
    );
  }

  // ==========================================
  // EDIT DECISION
  // ==========================================

  if (page === "decision-edit" && !selectedDecision) {
    return (
      <div className="dash-layout">
        <AppSidebar
          activePage="decisions"
          navigateTo={navigateTo}
          handleLogout={handleLogout}
        />
        <main className="dash-main">
          <div className="empty-state" style={{ marginTop: "48px" }}>
            {pendingDecisionId
              ? `Loading decision #${pendingDecisionId}...`
              : "No decision selected."}
          </div>
        </main>
      </div>
    );
  }

  if (page === "decision-edit") {
    return (
      <EditDecisionPage
        user={user}
        getRoleName={getRoleName}
        navigateTo={navigateTo}
        navigateBack={() => window.history.back()}
        selectedDecision={selectedDecision}
        decisionTitle={decisionTitle}
        decisionDescription={decisionDescription}
        decisionContext={decisionContext}
        decisionProblem={decisionProblem}
        decisionObjective={decisionObjective}
        decisionCriteria={decisionCriteria}
        decisionRisks={decisionRisks}
        decisionStakeholders={decisionStakeholders}
        decisionRationale={decisionRationale}
        decisionOutcome={decisionOutcome}
        decisionImplementationStatus={decisionImplementationStatus}
        decisionPriority={decisionPriority}
        decisionDate={decisionDate}
        decisionAlternatives={decisionAlternatives}
        decisionMessage={decisionMessage}
        decisionMessageType={decisionMessageType}
        decisionsLoading={decisionsLoading}
        setDecisionTitle={setDecisionTitle}
        setDecisionDescription={setDecisionDescription}
        setDecisionContext={setDecisionContext}
        setDecisionProblem={setDecisionProblem}
        setDecisionObjective={setDecisionObjective}
        setDecisionCriteria={setDecisionCriteria}
        setDecisionRisks={setDecisionRisks}
        setDecisionStakeholders={setDecisionStakeholders}
        setDecisionRationale={setDecisionRationale}
        setDecisionOutcome={setDecisionOutcome}
        setDecisionImplementationStatus={setDecisionImplementationStatus}
        setDecisionPriority={setDecisionPriority}
        setDecisionDate={setDecisionDate}
        setDecisionAlternatives={setDecisionAlternatives}
        handleUpdateDecision={handleUpdateDecision}
        handleLogout={handleLogout}
        documents={documents}
        documentsLoading={documentsLoading}
        docUploading={docUploading}
        uploadProgress={uploadProgress}
        docDeleteTarget={docDeleteTarget}
        docDeleting={docDeleting}
        docMessage={docMessage}
        docMessageType={docMessageType}
        handleDocumentFileSelect={handleDocumentFileSelect}
        handleDownloadDocument={handleDownloadDocument}
        setDocDeleteTarget={setDocDeleteTarget}
        cancelDocDelete={cancelDocDelete}
        handleDeleteDocument={handleDeleteDocument}
        formatFileSize={formatFileSize}
      />
    );
  }

  // ==========================================
  // DOCUMENTS PAGE
  // ==========================================

  if (page === "documents") {
    return (
      <DocumentsPage
        user={user}
        getRoleName={getRoleName}
        navigateTo={navigateTo}
        allDocuments={allDocuments}
        allDocumentsLoading={allDocumentsLoading}
        formatFileSize={formatFileSize}
        formatDate={formatDate}
        handleDownloadDocument={handleDownloadDocument}
        handleLogout={handleLogout}
      />
    );
  }

  // ==========================================
  // NOTIFICATIONS PAGE
  // ==========================================

  if (page === "notifications") {
    return (
      <NotificationsPage
        user={user}
        getRoleName={getRoleName}
        navigateTo={navigateTo}
        handleLogout={handleLogout}
      />
    );
  }

  // ==========================================
  // AUDIT LOGS PAGE
  // ==========================================

  if (page === "audit-logs") {
    return (
      <AuditLogsPage
        user={user}
        getRoleName={getRoleName}
        navigateTo={navigateTo}
        formatDate={formatDate}
        handleLogout={handleLogout}
      />
    );
  }

  // ==========================================
  // TEAMS PAGE
  // ==========================================

  if (page === "teams") {
    return (
      <TeamsPage
        user={user}
        getRoleName={getRoleName}
        navigateTo={navigateTo}
        teams={teams}
        allUsers={allUsers}
        loadTeams={loadTeams}
        loadAllUsers={loadAllUsers}
        openViewTeam={openViewTeam}
        openViewDecision={openViewDecision}
        handleLogout={handleLogout}
      />
    );
  }

  // ==========================================
  // TEAM VIEW PAGE
  // ==========================================

  if (page === "team-view") {
    if (teamLoadFailed && !selectedTeam) {
      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            backgroundColor: "#f5f7fb"
          }}
        >
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e3e8f0",
              borderRadius: "12px",
              padding: "32px 40px",
              textAlign: "center"
            }}
          >
            <div style={{ fontSize: "36px", marginBottom: "12px" }}>
              &#128680;
            </div>
            <h3 style={{ margin: "0 0 6px", color: "#0f172a" }}>
              Team not found
            </h3>
            <p style={{ margin: "0 0 18px", color: "#64748b", fontSize: "14px" }}>
              This team may have been removed or is unavailable.
            </p>
            <button
              className="primary-button"
              onClick={() => navigateTo("teams")}
            >
              Back to Teams
            </button>
          </div>
        </div>
      );
    }
    if (!selectedTeam && pendingTeamId) {
      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            backgroundColor: "#f5f7fb"
          }}
        >
          <div className="spin-loader" />
        </div>
      );
    }
    return (
      <TeamDetailsPage
        user={user}
        getRoleName={getRoleName}
        getTeamName={getTeamName}
        team={selectedTeam}
        allUsers={allUsers}
        navigateTo={navigateTo}
        openViewDecision={openViewDecision}
        loadTeamDetail={loadTeamDetail}
        setSelectedTeam={setSelectedTeam}
        handleLogout={handleLogout}
      />
    );
  }

  // ==========================================
  // PROFILE PAGE
  // ==========================================

  if (page === "profile") {
    return (
      <ProfilePage
        user={user}
        getRoleName={getRoleName}
        getTeamName={getTeamName}
        navigateTo={navigateTo}
        handleLogout={handleLogout}
      />
    );
  }

  // ==========================================
  // SETTINGS PAGE
  // ==========================================

  if (page === "settings") {
    return (
      <SettingsPage
        user={user}
        getRoleName={getRoleName}
        navigateTo={navigateTo}
        handleLogout={handleLogout}
      />
    );
  }

  // ==========================================
  // MY TEAMS PAGE
  // ==========================================

  if (page === "my-teams") {
    return (
      <MyTeamsPage
        user={user}
        getRoleName={getRoleName}
        navigateTo={navigateTo}
        formatDate={formatDate}
        openViewDecision={openViewDecision}
        handleLogout={handleLogout}
      />
    );
  }

  // ==========================================
  // MY DECISIONS PAGE
  // ==========================================

  if (page === "my-decisions") {
    return (
      <MyDecisionsPage
        user={user}
        getRoleName={getRoleName}
        getToken={getToken}
        navigateTo={navigateTo}
        formatDate={formatDate}
        handleLogout={handleLogout}
      />
    );
  }

  // ==========================================
  // TEAM DECISIONS PAGE
  // ==========================================

  if (page === "team-decisions") {
    return (
      <TeamDecisionsPage
        user={user}
        getRoleName={getRoleName}
        getToken={getToken}
        navigateTo={navigateTo}
        formatDate={formatDate}
        handleLogout={handleLogout}
      />
    );
  }

  // ==========================================
  // KNOWLEDGE REPOSITORY PAGE
  // ==========================================

  if (page === "knowledge") {
    return (
      <KnowledgeRepositoryPage
        user={user}
        getRoleName={getRoleName}
        getTeamName={getTeamName}
        getToken={getToken}
        navigateTo={navigateTo}
        formatDate={formatDate}
        formatFileSize={formatFileSize}
        allDocuments={allDocuments}
        allDocumentsLoading={allDocumentsLoading}
        handleDownloadDocument={handleDownloadDocument}
        decisions={decisions}
        decisionsLoading={decisionsLoading}
        teams={teams}
        allUsers={allUsers}
        discussionList={discussionList}
        knowledgeArticles={knowledgeArticles}
        insights={insightsData}
        insightsLoading={insightsLoading}
        openViewDecision={openViewDecision}
        openViewTeam={openViewTeam}
        loadAllDocuments={loadAllDocuments}
        handleLogout={handleLogout}
      />
    );
  }

  // ==========================================
  // DISCUSSIONS PAGE
  // ==========================================

  if (page === "discussions") {
    return (
      <DiscussionsPage
        user={user}
        getRoleName={getRoleName}
        getToken={getToken}
        navigateTo={navigateTo}
        formatDate={formatDate}
        handleLogout={handleLogout}
      />
    );
  }

  // ==========================================
  // SEARCH PAGE
  // ==========================================

  if (page === "search") {
    return (
      <SearchPage
        user={user}
        getRoleName={getRoleName}
        getToken={getToken}
        navigateTo={navigateTo}
        formatDate={formatDate}
        results={globalSearchResults}
        loading={globalSearchLoading}
        onSearch={runGlobalSearch}
        handleLogout={handleLogout}
      />
    );
  }

  // ==========================================
  // REPORTS PAGE
  // ==========================================

  if (page === "reports") {
    return (
      <ReportsPage
        user={user}
        getRoleName={getRoleName}
        navigateTo={navigateTo}
        formatDate={formatDate}
        handleLogout={handleLogout}
      />
    );
  }

  // ==========================================
  // HOME / DASHBOARD
  // ==========================================

  // ==========================================
  // HOME / EMPLOYER HOME PAGE
  // ==========================================

  if (page === "home") {
    return (
      <DashboardPage
        user={user}
        getRoleName={getRoleName}
        navigateTo={navigateTo}
        handleLogout={handleLogout}
        formatDate={formatDate}
      />
    );
  }


  // ==========================================
  // MEETINGS PAGE
  // ==========================================

  if (page === "meetings") {
    return (
      <MeetingsPage
        user={user}
        getRoleName={getRoleName}
        navigateTo={navigateTo}
        handleLogout={handleLogout}
        formatDate={formatDate}
      />
    );
  }


  // ==========================================
  // LOGIN PAGE
  // ==========================================

  if (page === "login") {
    return (
      <div className="login-split">

        <div className="login-left">
          <div className="login-left-content">
            <div className="login-brand-icon">ED</div>
            <h1 className="login-brand-title">
              Expert Decision Replay
            </h1>
            <p className="login-brand-tagline">
              Decision Intelligence Platform
            </p>
            <ul className="login-features">
              <li>
                <span className="login-feature-icon">&#9733;</span>
                Capture and replay expert decisions
              </li>
              <li>
                <span className="login-feature-icon">&#9733;</span>
                Compare alternatives side-by-side
              </li>
              <li>
                <span className="login-feature-icon">&#9733;</span>
                Collaborate with your team in real-time
              </li>
              <li>
                <span className="login-feature-icon">&#9733;</span>
                Track decision history and outcomes
              </li>
            </ul>
          </div>
        </div>

        <div className="login-right">
          <div className="login-form-card">

            <div className="login-form-header">
              <h2>Welcome Back</h2>
              <p>Sign in to access your decisions</p>
            </div>

            <form onSubmit={handleLogin} className="login-form">

              <div className="form-group">
                <label htmlFor="login-email">Email</label>
                <div className="login-input-wrap">
                  <span className="login-input-icon">&#9993;</span>
                  <input
                    id="login-email"
                    type="email"
                    placeholder="Enter your email"
                    value={loginEmail}
                    onChange={(e) =>
                      setLoginEmail(e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="login-password">Password</label>
                <div className="login-input-wrap">
                  <span className="login-input-icon">&#128274;</span>
                  <input
                    id="login-password"
                    type={loginShowPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) =>
                      setLoginPassword(e.target.value)
                    }
                  />
                  <button
                    type="button"
                    className="login-eye-btn"
                    onClick={() =>
                      setLoginShowPassword(!loginShowPassword)
                    }
                    tabIndex={-1}
                  >
                    {loginShowPassword ? "\u{1F441}" : "\u{1F441}\u200D\u{1F5E8}"}
                  </button>
                </div>
              </div>

              <div className="login-remember-row">
                <label className="login-checkbox-label">
                  <input
                    type="checkbox"
                    checked={loginRememberMe}
                    onChange={(e) =>
                      setLoginRememberMe(e.target.checked)
                    }
                  />
                  <span className="login-checkmark"></span>
                  Remember me
                </label>
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
                className="primary-button login-submit"
                disabled={loading}
              >
                {loading
                  ? "Signing In..."
                  : "Sign In"}
              </button>

            </form>

            <div className="login-footer-text">
              Don&apos;t have an account?{" "}
              <button
                className="login-link-btn"
                onClick={() => {
                  setPage("register");
                  setMessage("");
                  setMessageType("");
                }}
              >
                Create Account
              </button>
            </div>

          </div>
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
          Create Account
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
              : "Create Account"}
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
          Sign In
        </button>

      </div>

    </div>
  );
}

// ==========================================
// STATUS BADGE HELPER
// ==========================================

const statusBadgeClass = (status) => {
  const normalized = (status || "")
    .toLowerCase()
    .replace(/\s+/g, "-");

  return `status-badge status-${normalized}`;
};

const workflowStatusLabel = (status) => {
  if (status === "Reviewer Approved") {
    return "Manager Review";
  }

  return status;
};

// ==========================================
// CONFIRM DIALOG
// ==========================================

const ConfirmDialog = (props) => {
  const {
    title,
    message,
    confirmLabel,
    cancelLabel,
    isBusy,
    onConfirm,
    onCancel
  } = props;

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="modal-actions">
          <button
            className="secondary-button action-limited"
            onClick={onCancel}
            disabled={isBusy}
          >
            {cancelLabel || "Cancel"}
          </button>
          <button
            className="danger-button action-limited"
            onClick={onConfirm}
            disabled={isBusy}
          >
            {isBusy ? "Working..." : confirmLabel || "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// ALTERNATIVE MODAL
// ==========================================

const AlternativeModal = (props) => {
  const {
    mode,
    form,
    setField,
    onClose,
    onSave,
    saving,
    message,
    messageType,
    formatCost
  } = props;

  if (!mode || !form) {
    return null;
  }

  const isView = mode === "view";

  const levelOptions = ["Low", "Medium", "High"];

  return (
    <div className="modal-overlay">
      <div className="modal-box alt-modal">
        <h3>
          {mode === "create"
            ? "Add Alternative"
            : mode === "edit"
            ? "Edit Alternative"
            : "Alternative Details"}
        </h3>

        {message && (
          <div
            className={`message ${
              messageType || "error"
            }`}
            style={{ marginBottom: "16px" }}
          >
            {message}
          </div>
        )}

        {isView ? (
          <div className="alt-view-details">
            <div className="alt-view-row">
              <span className="alt-view-label">Title</span>
              <span className="alt-view-value">
                {form.title || "—"}
              </span>
            </div>
            <div className="alt-view-row">
              <span className="alt-view-label">Description</span>
              <span className="alt-view-value">
                {form.description || "—"}
              </span>
            </div>
            <div className="alt-view-row">
              <span className="alt-view-label">Pros</span>
              <span className="alt-view-value">
                {form.pros || "—"}
              </span>
            </div>
            <div className="alt-view-row">
              <span className="alt-view-label">Cons</span>
              <span className="alt-view-value">
                {form.cons || "—"}
              </span>
            </div>
            <div className="alt-view-row">
              <span className="alt-view-label">Estimated Cost</span>
              <span className="alt-view-value">
                {form.estimated_cost !== "" &&
                form.estimated_cost !== null &&
                form.estimated_cost !== undefined
                  ? formatCost(Number(form.estimated_cost))
                  : "—"}
              </span>
            </div>
            <div className="alt-view-row">
              <span className="alt-view-label">Feasibility</span>
              <span className="alt-view-value">
                {form.feasibility || "—"}
              </span>
            </div>
            <div className="alt-view-row">
              <span className="alt-view-label">Risk Level</span>
              <span className="alt-view-value">
                {form.risk_level || "—"}
              </span>
            </div>
            <div className="alt-view-row">
              <span className="alt-view-label">
                Risk Explanation
              </span>
              <span className="alt-view-value">
                {form.risk_explanation || "—"}
              </span>
            </div>
          </div>
        ) : (
          <form className="alt-form" onSubmit={onSave}>
            <div className="form-group">
              <label className="form-label">
                Alternative Title *
              </label>
              <input
                className="form-input"
                type="text"
                value={form.title || ""}
                onChange={(e) =>
                  setField("title", e.target.value)
                }
                placeholder="Enter alternative title"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-input"
                rows="2"
                value={form.description || ""}
                onChange={(e) =>
                  setField("description", e.target.value)
                }
                placeholder="Describe the alternative"
              ></textarea>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Pros</label>
                <textarea
                  className="form-input"
                  rows="2"
                  value={form.pros || ""}
                  onChange={(e) =>
                    setField("pros", e.target.value)
                  }
                  placeholder="Strengths"
                ></textarea>
              </div>

              <div className="form-group">
                <label className="form-label">Cons</label>
                <textarea
                  className="form-input"
                  rows="2"
                  value={form.cons || ""}
                  onChange={(e) =>
                    setField("cons", e.target.value)
                  }
                  placeholder="Drawbacks"
                ></textarea>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  Estimated Cost
                </label>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.estimated_cost || ""}
                  onChange={(e) =>
                    setField("estimated_cost", e.target.value)
                  }
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Feasibility
                </label>
                <select
                  className="form-input"
                  value={form.feasibility || "Medium"}
                  onChange={(e) =>
                    setField("feasibility", e.target.value)
                  }
                >
                  {levelOptions.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Risk Level
                </label>
                <select
                  className="form-input"
                  value={form.risk_level || "Medium"}
                  onChange={(e) =>
                    setField("risk_level", e.target.value)
                  }
                >
                  {levelOptions.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Risk Explanation
              </label>
              <textarea
                className="form-input"
                rows="2"
                value={form.risk_explanation || ""}
                onChange={(e) =>
                  setField("risk_explanation", e.target.value)
                }
                placeholder="Explain the risk assessment"
              ></textarea>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button action-limited"
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="primary-button action-limited"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : mode === "create"
                  ? "Create Alternative"
                  : "Save Changes"}
              </button>
            </div>
          </form>
        )}

        {isView && (
          <div className="modal-actions">
            <button
              className="primary-button action-limited"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// NOTIFICATIONS PAGE
// ==========================================

const NotificationsPage = (props) => {
  const {
    user,
    getRoleName,
    navigateTo,
    handleLogout
  } = props;

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const loadNotifications = useCallback(async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setLoading(false);
      return;
    }

    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications/`,
        {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        setError(
          response.status === 401
            ? "Session expired. Please login again."
            : "Failed to load notifications."
        );
        setNotifications([]);
        setLoading(false);
        return;
      }

      const data = await response.json();

      setNotifications(data || []);
    } catch (error) {
      console.error("Notifications error:", error);
      setError("Unable to connect to server.");
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markAsRead = async (notification) => {
    const token = localStorage.getItem("access_token");

    if (!token) return;

    if (!notification.is_read) {
      try {
        await fetch(
          `${API_BASE_URL}/notifications/${notification.notification_id}/read`,
          {
            method: "PATCH",
            headers: {
              "Authorization": `Bearer ${token}`
            }
          }
        );

        setNotifications((prev) =>
          prev.map((n) =>
            Number(n.notification_id) ===
            Number(notification.notification_id)
              ? { ...n, is_read: true }
              : n
          )
        );
      } catch (error) {
        console.error("Mark read error:", error);
      }
    }

    if (notification.decision_id) {
      navigateTo("decision-view", {
        decision_id: notification.decision_id
      });
    }
  };

  const markAllAsRead = async () => {
    const token = localStorage.getItem("access_token");

    if (!token) return;

    setActionMessage("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications/mark-all-read`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        setActionMessage("Failed to mark all notifications as read.");
        return;
      }

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );

      setActionMessage("All notifications marked as read.");
    } catch (error) {
      console.error("Mark all read error:", error);
      setActionMessage("Unable to connect to server.");
    }
  };

  const timeAgoLabel = (value) => {
    if (!value) return "";

    const created = new Date(value);

    if (isNaN(created.getTime())) return "";

    const seconds = Math.floor(
      (Date.now() - created.getTime()) / 1000
    );

    if (seconds < 60) return "Just now";

    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) {
      return minutes === 1
        ? "1 minute ago"
        : `${minutes} minutes ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
      return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
    }

    const days = Math.floor(hours / 24);

    if (days === 1) return "1 day ago";

    if (days < 30) return `${days} days ago`;

    return created.toLocaleDateString();
  };

  const unreadCount = notifications.filter(
    (n) => !n.is_read
  ).length;

  return (
    <div className="dash-layout">

      <AppSidebar
        activePage="notifications"
        navigateTo={navigateTo}
        handleLogout={handleLogout}
      />

      <main className="dash-main">

        <header className="dash-header">

          <div>
            <h2 className="dash-header-title">
              &#128276; Notifications
            </h2>
            <p className="dash-header-sub">
              Updates on your decisions and approvals
            </p>
          </div>

          <div className="dash-header-right">
            <NotificationBell navigateTo={navigateTo} />
            <button
              className="nav-button"
              onClick={() => navigateTo("home")}
            >
              &#8962; Back to Dashboard
            </button>
            <div className="dash-header-user">
              <div className="dash-avatar">
                {(user?.name || "U").charAt(0).toUpperCase()}
              </div>
              <div className="dash-user-info">
                <div className="dash-user-name">
                  {user?.name}
                </div>
                <div className="dash-user-role">
                  {getRoleName(user?.role_id)}
                </div>
              </div>
            </div>
          </div>

        </header>

        <section className="dash-card">

          <div className="dash-card-header">
            <h4>Notifications</h4>
            <span className="team-count-pill">
              {unreadCount > 0
                ? `${unreadCount} unread`
                : "All read"}
            </span>
          </div>

          <div
            style={{
              height: "1px",
              background: "#e5e7eb",
              margin: "12px 0 16px"
            }}
          ></div>

          {actionMessage && (
            <div
              className="message"
              style={{ marginBottom: "16px" }}
            >
              {actionMessage}
            </div>
          )}

          {error && (
            <div
              className="message"
              style={{ marginBottom: "16px" }}
            >
              {error}
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: "12px"
            }}
          >
            <button
              className="secondary-button"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
            >
              Mark all as read
            </button>
          </div>

          {loading ? (

            <div className="empty-state">
              Loading notifications...
            </div>

          ) : notifications.length === 0 ? (

            <div className="empty-state">
              <div
                style={{
                  fontSize: "28px",
                  marginBottom: "10px"
                }}
              >
                &#128276;
              </div>
              <h3
                style={{
                  margin: "0 0 6px",
                  color: "#0f172a"
                }}
              >
                No Notifications
              </h3>
              <p
                style={{
                  margin: "0",
                  color: "#64748b",
                  fontSize: "14px"
                }}
              >
                You have no notifications yet.
              </p>
            </div>

          ) : (

            <div className="notification-list">
              {notifications.map((n) => (
                <button
                  key={n.notification_id}
                  className={
                    "notification-item" +
                    (n.is_read
                      ? " notification-item-read"
                      : " notification-item-unread")
                  }
                  onClick={() => markAsRead(n)}
                >
                  <div className="notification-item-dot">
                    {n.is_read ? "&#10003;" : "&#128309;"}
                  </div>
                  <div className="notification-item-body">
                    <div className="notification-item-title">
                      {n.title}
                    </div>
                    <div className="notification-item-message">
                      {n.message}
                    </div>
                    <div className="notification-item-time">
                      {timeAgoLabel(n.created_at)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

        </section>

      </main>

    </div>
  );
};

// ==========================================
// DOCUMENTS PAGE
// ==========================================

const DocumentsPage = (props) => {
  const {
    user,
    getRoleName,
    navigateTo,
    allDocuments,
    allDocumentsLoading,
    formatFileSize,
    formatDate,
    handleDownloadDocument,
    handleLogout
  } = props;

  const docs = allDocuments || [];

  const fileTypeLabel = (doc) => {
    const name = doc.original_file_name || "";
    const ext = name.split(".").pop().toUpperCase();

    if (ext && ext.length <= 5) {
      return ext;
    }

    const type = (doc.file_type || "");

    if (type) {
      const parts = type.split("/");

      return parts.length === 2
        ? parts[1].toUpperCase()
        : type.toUpperCase();
    }

    return "File";
  };

  const fileIcon = (doc) => {
    const ext = (doc.original_file_name || "")
      .split(".")
      .pop()
      .toLowerCase();

    if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) {
      return "🖼️";
    }

    if (ext === "pdf") {
      return "📄";
    }

    return "📎";
  };

  return (
    <div className="dash-layout">

      <AppSidebar
        activePage="documents"
        navigateTo={navigateTo}
        handleLogout={handleLogout}
      />

      <main className="dash-main">

        <header className="dash-header">

          <div>
            <h2 className="dash-header-title">
              📎 Documents / Knowledge Repository
            </h2>
            <p className="dash-header-sub">
              All supporting documents uploaded for decisions
            </p>
          </div>

          <div className="dash-header-right">
            <NotificationBell navigateTo={navigateTo} />
            <button
              className="nav-button"
              onClick={() => navigateTo("home")}
            >
              &#8962; Back to Dashboard
            </button>
            <div className="dash-header-user">
              <div className="dash-avatar">
                {(user?.name || "U").charAt(0).toUpperCase()}
              </div>
              <div className="dash-user-info">
                <div className="dash-user-name">
                  {user?.name}
                </div>
                <div className="dash-user-role">
                  {getRoleName(user?.role_id)}
                </div>
              </div>
            </div>
          </div>

        </header>

        <section className="dash-card">

          <div className="dash-card-header">
            <h4>All Documents</h4>
            <span className="team-count-pill">
              {docs.length} document(s)
            </span>
          </div>

          <div style={{ height: "1px", background: "#e5e7eb", margin: "12px 0 16px" }}></div>

          {allDocumentsLoading ? (

            <div className="empty-state">
              Loading documents...
            </div>

          ) : docs.length === 0 ? (

            <div className="empty-state">
              <div style={{ fontSize: "28px", marginBottom: "10px" }}>
                📎
              </div>
              <h3 style={{ margin: "0 0 6px", color: "#0f172a" }}>
                No Documents Found
              </h3>
              <p style={{ margin: "0", color: "#64748b", fontSize: "14px" }}>
                No supporting documents have been uploaded yet.
              </p>
            </div>

          ) : (

            <div className="table-wrap">
              <table className="decisions-table">
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Decision</th>
                    <th>File Type</th>
                    <th>Size</th>
                    <th>Uploaded</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map((doc) => (
                    <tr key={doc.document_id}>
                      <td>
                        <div className="doc-info" style={{ maxWidth: "260px" }}>
                          <div className="doc-name">
                            {fileIcon(doc)} {doc.original_file_name || "Untitled file"}
                          </div>
                        </div>
                      </td>
                      <td>
                        {doc.decision_title || (
                          doc.decision_id ? `Decision #${doc.decision_id}` : "—"
                        )}
                      </td>
                      <td>{fileTypeLabel(doc)}</td>
                      <td>{formatFileSize(doc.file_size)}</td>
                      <td>
                        {doc.uploaded_at
                          ? formatDate(doc.uploaded_at)
                          : "—"}
                      </td>
                      <td>
                        <div className="doc-actions">
                          <button
                            className="doc-action-btn"
                            onClick={() =>
                              handleDownloadDocument(doc, true)
                            }
                          >
                            View
                          </button>
                          <button
                            className="doc-action-btn"
                            onClick={() =>
                              handleDownloadDocument(doc, false)
                            }
                          >
                            Download
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </section>

      </main>

    </div>
  );
};

// ==========================================
// AUDIT LOGS PAGE
// ==========================================

const AuditLogsPage = (props) => {
  const {
    user,
    getRoleName,
    navigateTo,
    formatDate,
    handleLogout
  } = props;

  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState("");
  const [meta, setMeta] = useState({
    users: [],
    actions: [],
    entity_types: []
  });
  const [decisions, setDecisions] = useState([]);

  const [filterUser, setFilterUser] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [filterDecision, setFilterDecision] = useState("");
  const [filterEntity, setFilterEntity] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterSearch, setFilterSearch] = useState("");

  const buildQuery = () => {
    const params = new URLSearchParams();
    if (filterUser) params.set("user_id", filterUser);
    if (filterAction) params.set("action", filterAction);
    if (filterDecision) params.set("decision_id", filterDecision);
    if (filterEntity) params.set("entity_type", filterEntity);
    if (filterDateFrom) params.set("date_from", filterDateFrom + "T00:00:00");
    if (filterDateTo) params.set("date_to", filterDateTo + "T23:59:59");
    if (filterSearch.trim()) params.set("search", filterSearch.trim());
    return params.toString();
  };

  const loadLogs = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    setLogsLoading(true);
    setLogsError("");
    try {
      const query = buildQuery();
      const url = `${API_BASE_URL}/audit-logs/?${query}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.detail || "Failed to load audit logs."
        );
      }
      const data = await res.json();
      setLogs(data || []);
    } catch (error) {
      setLogsError(error.message || "Failed to load audit logs.");
    } finally {
      setLogsLoading(false);
    }
  };

  const loadMeta = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/audit-logs/meta`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMeta(data || {
          users: [],
          actions: [],
          entity_types: []
        });
      }
    } catch (error) {
      // meta is optional; page still works
    }
  };

  const loadDecisions = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/decisions/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDecisions(
          Array.isArray(data)
            ? data
            : (data.decisions || data.items || [])
        );
      }
    } catch (error) {
      // decisions list is optional for filtering
    }
  };

  const applyFilters = () => loadLogs();

  const resetFilters = () => {
    setFilterUser("");
    setFilterAction("");
    setFilterDecision("");
    setFilterEntity("");
    setFilterDateFrom("");
    setFilterDateTo("");
    setFilterSearch("");
    setTimeout(loadLogs, 0);
  };

  useEffect(() => {
    loadMeta();
    loadDecisions();
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const entityLabel = (log) => {
    const entity = log.entity_type || "Decision";
    if (entity === "Authentication") return "Auth";
    return entity;
  };

  const detailsText = (log) => {
    let text = log.description || "";
    if (
      log.action === "DECISION_UPDATED" &&
      log.old_value &&
      log.new_value
    ) {
      const olds = String(log.old_value).split("\n");
      const news = String(log.new_value).split("\n");
      const pairs = olds.map((o, i) => {
        const n = news[i] || "";
        const oldPart = o.includes(":") ? o.split(":").slice(1).join(":").trim() : o;
        const newPart = n.includes(":") ? n.split(":").slice(1).join(":").trim() : n;
        return `${o.split(":")[0].trim() || "Field"}: ${oldPart} -> ${newPart}`;
      });
      return `${text}${pairs.length ? ` (${pairs.join("; ")})` : ""}`;
    }
    return text;
  };

  const actionBadgeClass = (action) => {
    if (action.startsWith("LOGIN_FAILED")) return "audit-badge-danger";
    if (action.includes("REJECTED")) return "audit-badge-danger";
    if (action.includes("APPROVED") || action.includes("CREATED"))
      return "audit-badge-success";
    return "audit-badge-info";
  };

  return (
    <div className="dash-layout">

      <AppSidebar
        activePage="audit-logs"
        navigateTo={navigateTo}
        handleLogout={handleLogout}
      />

      <main className="dash-main">

        <header className="dash-header">

          <div>
            <h2 className="dash-header-title">
              🔍 Audit Logs
            </h2>
            <p className="dash-header-sub">
              Complete record of important platform actions
            </p>
          </div>

          <div className="dash-header-right">
            <NotificationBell navigateTo={navigateTo} />
            <button
              className="nav-button"
              onClick={() => navigateTo("home")}
            >
              &#8962; Back to Dashboard
            </button>
            <div className="dash-header-user">
              <div className="dash-avatar">
                {(user?.name || "U").charAt(0).toUpperCase()}
              </div>
              <div className="dash-user-info">
                <div className="dash-user-name">
                  {user?.name}
                </div>
                <div className="dash-user-role">
                  {getRoleName(user?.role_id)}
                </div>
              </div>
            </div>
          </div>

        </header>

        <section className="dash-card">

          <div className="dash-card-header">
            <h4>Audit Logs</h4>
            <span className="team-count-pill">
              {logs.length} record(s)
            </span>
          </div>

          <div style={{ height: "1px", background: "#e5e7eb", margin: "12px 0 16px" }}></div>

          <div className="audit-filter-grid">

            <div className="audit-filter-field">
              <label>User</label>
              <select
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
              >
                <option value="">All Users</option>
                {(meta.users || []).map((u) => (
                  <option key={u.user_id} value={u.user_id}>
                    {u.name || u.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="audit-filter-field">
              <label>Action</label>
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
              >
                <option value="">All Actions</option>
                {(meta.actions || []).map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            <div className="audit-filter-field">
              <label>Decision</label>
              <select
                value={filterDecision}
                onChange={(e) => setFilterDecision(e.target.value)}
              >
                <option value="">All Decisions</option>
                {decisions.map((d) => (
                  <option
                    key={d.decision_id}
                    value={d.decision_id}
                  >
                    {d.title} (#{d.decision_id})
                  </option>
                ))}
              </select>
            </div>

            <div className="audit-filter-field">
              <label>Entity Type</label>
              <select
                value={filterEntity}
                onChange={(e) => setFilterEntity(e.target.value)}
              >
                <option value="">All Entities</option>
                {(meta.entity_types || []).map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>

            <div className="audit-filter-field">
              <label>From Date</label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
              />
            </div>

            <div className="audit-filter-field">
              <label>To Date</label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
              />
            </div>

            <div className="audit-filter-field audit-filter-search">
              <label>Search</label>
              <input
                type="text"
                placeholder="Search description, action, old/new value..."
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") applyFilters();
                }}
              />
            </div>

            <div className="audit-filter-actions">
              <button
                className="audit-filter-btn"
                onClick={applyFilters}
                disabled={logsLoading}
              >
                Apply Filters
              </button>
              <button
                className="audit-filter-btn audit-filter-reset"
                onClick={resetFilters}
                disabled={logsLoading}
              >
                Reset
              </button>
            </div>

          </div>

          {logsError ? (
            <div className="empty-state" style={{ marginTop: "16px" }}>
              <p style={{ color: "#b91c1c" }}>{logsError}</p>
              <button
                className="audit-filter-btn"
                onClick={loadLogs}
              >
                Retry
              </button>
            </div>
          ) : logsLoading ? (
            <div className="empty-state">
              Loading audit logs...
            </div>
          ) : logs.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: "28px", marginBottom: "10px" }}>
                🔍
              </div>
              <h3 style={{ margin: "0 0 6px", color: "#0f172a" }}>
                No Audit Records Found
              </h3>
              <p style={{ margin: "0", color: "#64748b", fontSize: "14px" }}>
                No records match the current filters.
              </p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="decisions-table">
                <thead>
                  <tr>
                    <th>Date/Time</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Decision</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.log_id}>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {log.created_at
                          ? formatDate(log.created_at)
                          : "—"}
                      </td>
                      <td>
                        {log.user_name || log.user_email || (
                          `User #${log.user_id}`
                        )}
                      </td>
                      <td>
                        <span
                          className={`audit-action-badge ${actionBadgeClass(log.action)}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td>{entityLabel(log)}</td>
                      <td>
                        {log.decision_title || (
                          log.decision_id
                            ? `Decision #${log.decision_id}`
                            : "—"
                        )}
                      </td>
                      <td>
                        <div className="audit-details">
                          {detailsText(log)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </section>

      </main>

    </div>
  );
};

// ==========================================
// TEAMS PAGE
// ==========================================

const TeamsPage = (props) => {
  const {
    user,
    getRoleName,
    navigateTo,
    teams,
    allUsers,
    loadTeams,
    loadAllUsers,
    openViewTeam,
    openViewDecision,
    handleLogout
  } = props;

  const isManager =
    [3, 4].includes(Number(user?.role_id));

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [activeTab, setActiveTab] = useState("active");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [busy, setBusy] = useState(false);

  // Create team modal
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createManagerId, setCreateManagerId] = useState("");
  const [createError, setCreateError] = useState("");

  // Join team modal
  const [showJoin, setShowJoin] = useState(false);
  const [joinBusyId, setJoinBusyId] = useState(null);
  const [joinMessage, setJoinMessage] = useState("");
  const [joinMessageType, setJoinMessageType] = useState("");
  const [requestedTeams, setRequestedTeams] = useState([]);

  // Edit / Archive modals
  const [showEdit, setShowEdit] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editManagerId, setEditManagerId] = useState("");
  const [editError, setEditError] = useState("");
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [archiveBusy, setArchiveBusy] = useState(false);

  // Three dot menu
  const [menuOpenFor, setMenuOpenFor] = useState(null);

  const showMsg = (text, type) => {
    setMessage(text);
    setMessageType(type || "");
  };

  const filteredTeams = () => {
    let list = teams.filter((t) =>
      activeTab === "active" ? !t.is_archived : t.is_archived
    );

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (t) =>
          (t.team_name || "").toLowerCase().includes(q) ||
          (t.description || "").toLowerCase().includes(q)
      );
    }

    const copy = [...list];

    if (sortBy === "members") {
      copy.sort((a, b) => (b.member_count || 0) - (a.member_count || 0));
    } else if (sortBy === "activity") {
      copy.sort((a, b) => {
        const aDate = a.recent_decisions?.[0]?.decision_date || a.created_at || "";
        const bDate = b.recent_decisions?.[0]?.decision_date || b.created_at || "";
        return String(bDate).localeCompare(String(aDate));
      });
    } else {
      copy.sort((a, b) =>
        (a.team_name || "").localeCompare(b.team_name || "")
      );
    }

    return copy;
  };

  const managerOptions = allUsers.filter(
    (u) => [3, 4].includes(Number(u.role_id))
  );

  const handleCreate = async () => {
    setCreateError("");
    if (!createName.trim()) {
      setCreateError("Team name is required");
      return;
    }

    setBusy(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${API_BASE_URL}/teams/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            team_name: createName.trim(),
            description: createDescription.trim() || null,
            manager_user_id: createManagerId
              ? Number(createManagerId)
              : null
          })
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setCreateError(
          data.detail || "Unable to create team"
        );
        return;
      }

      setShowCreate(false);
      setCreateName("");
      setCreateDescription("");
      setCreateManagerId("");
      showMsg("Team created successfully", "success");
      loadTeams(true);
      loadAllUsers();
    } catch (error) {
      console.error("Create team error:", error);
      setCreateError("Unable to create team");
    } finally {
      setBusy(false);
    }
  };

  const openEditModal = (team) => {
    setEditTarget(team);
    setEditName(team.team_name || "");
    setEditDescription(team.description || "");
    setEditManagerId(
      team.manager_user_id ? String(team.manager_user_id) : ""
    );
    setEditError("");
    setMenuOpenFor(null);
    setShowEdit(true);
  };

  const handleEdit = async () => {
    setEditError("");
    if (!editName.trim()) {
      setEditError("Team name cannot be empty");
      return;
    }

    setBusy(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${API_BASE_URL}/teams/${editTarget.team_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            team_name: editName.trim(),
            description: editDescription.trim() || null,
            manager_user_id: editManagerId
              ? Number(editManagerId)
              : null
          })
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setEditError(
          data.detail || "Unable to update team"
        );
        return;
      }

      setShowEdit(false);
      showMsg("Team updated successfully", "success");
      loadTeams(true);
    } catch (error) {
      console.error("Edit team error:", error);
      setEditError("Unable to update team");
    } finally {
      setBusy(false);
    }
  };

  const handleArchiveToggle = async (team) => {
    setArchiveBusy(true);
    try {
      const token = localStorage.getItem("access_token");
      const action = team.is_archived ? "unarchive" : "archive";
      const response = await fetch(
        `${API_BASE_URL}/teams/${team.team_id}/${action}`,
        {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        showMsg(data.detail || "Unable to update team", "error");
      } else {
        showMsg(
          team.is_archived
            ? "Team restored successfully"
            : "Team archived successfully",
          "success"
        );
      }
      loadTeams(true);
    } catch (error) {
      console.error("Archive error:", error);
      showMsg("Unable to update team", "error");
    } finally {
      setArchiveBusy(false);
      setArchiveTarget(null);
      setMenuOpenFor(null);
    }
  };

  const openJoinModal = () => {
    setJoinMessage("");
    setJoinMessageType("");
    setRequestedTeams([]);
    fetchRequests();
    setShowJoin(true);
  };

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const teamsList = teams.filter(
        (t) => !t.is_archived
      );

      const requested = [];

      for (const team of teamsList) {
        const response = await fetch(
          `${API_BASE_URL}/teams/${team.team_id}/join-requests`,
          {
            headers: {
              "Authorization": `Bearer ${token}`
            }
          }
        );
        if (response.ok) {
          const requests = await response.json();
          requested.push(
            ...requests
              .filter(
                (r) =>
                  Number(r.user_id) === Number(user?.user_id)
              )
              .map((r) => r.team_id)
          );
        }
      }

      setRequestedTeams([...new Set(requested)]);
    } catch (error) {
      console.error("Join requests error:", error);
    }
  };

  const alreadyMember = (team) =>
    Number(user?.team_id) === Number(team.team_id);

  const handleJoinRequest = async (team) => {
    setJoinBusyId(team.team_id);
    setJoinMessage("");
    setJoinMessageType("");
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${API_BASE_URL}/teams/${team.team_id}/join-request`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            team_id: team.team_id
          })
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setJoinMessage(
          data.detail || "Unable to submit request"
        );
        setJoinMessageType("error");
      } else {
        setJoinMessage("Join request submitted");
        setJoinMessageType("success");
        setRequestedTeams((prev) => [
          ...new Set([...prev, team.team_id])
        ]);
      }
    } catch (error) {
      console.error("Join request error:", error);
      setJoinMessage("Unable to submit request");
      setJoinMessageType("error");
    } finally {
      setJoinBusyId(null);
    }
  };

  const visibleTeams = filteredTeams();

  const memberCountFor = (team) => team.member_count || 0;

  return (
    <div className="dash-layout">

      <AppSidebar
        activePage="teams"
        navigateTo={navigateTo}
        handleLogout={handleLogout}
      />

      <main className="dash-main">

        <header className="dash-header">

          <div>
            <h2 className="dash-header-title">
              My Teams
            </h2>
            <p className="dash-header-sub">
              Collaborate with teams, manage decisions, and share organizational knowledge.
            </p>
          </div>

          <div className="dash-header-right">
            <NotificationBell navigateTo={navigateTo} />
            {isManager && (
              <button
                className="primary-button"
                onClick={() => setShowCreate(true)}
                style={{ marginRight: "10px" }}
              >
                + Create Team
              </button>
            )}
            <button
              className="secondary-button"
              onClick={openJoinModal}
            >
              + Join Team
            </button>
            <div className="dash-header-user">
              <div className="dash-avatar">
                {(user?.name || "U").charAt(0).toUpperCase()}
              </div>
              <div className="dash-user-info">
                <div className="dash-user-name">
                  {user?.name}
                </div>
                <div className="dash-user-role">
                  {getRoleName(user?.role_id)}
                </div>
              </div>
            </div>
          </div>

        </header>

        {message && (
          <div
            className={`message ${messageType === "error" ? "error" : ""} ${messageType === "success" ? "success" : ""}`}
            style={{ marginBottom: "16px" }}
          >
            {message}
          </div>
        )}

        <section className="teams-toolbar">
          <input
            type="text"
            className="teams-search-input"
            placeholder="Search teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            className="teams-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="name">Sort: Name</option>
            <option value="members">Sort: Members</option>
            <option value="activity">Sort: Recent Activity</option>
          </select>
        </section>

        <div className="teams-tabs">
          <button
            className={`teams-tab ${activeTab === "active" ? "active" : ""}`}
            onClick={() => setActiveTab("active")}
          >
            Active Teams
          </button>
          <button
            className={`teams-tab ${activeTab === "archived" ? "active" : ""}`}
            onClick={() => setActiveTab("archived")}
          >
            Archived Teams
          </button>
        </div>

        {visibleTeams.length === 0 ? (
          <div className="dash-card" style={{ marginTop: "16px" }}>
            <div className="message" style={{ margin: "12px 0" }}>
              {searchQuery.trim()
                ? "No teams match your search."
                : "No teams found in this tab."}
            </div>
          </div>
        ) : (
          <div className="teams-grid">
            {visibleTeams.map((team) => {
              const members = memberCountFor(team);
              const recent = team.recent_decisions || [];
              const menuOpen = menuOpenFor === team.team_id;

              return (
                <div
                  key={team.team_id}
                  className="team-card"
                >
                  <div className="team-card-top">
                    <div className="team-avatar">
                      {(team.team_name || "T").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="team-card-name">
                        {team.team_name}
                      </div>
                      <div className="team-card-meta">
                        {members} member(s) &middot;{" "}
                        {team.manager_name
                          ? `Lead: ${team.manager_name}`
                          : "No lead assigned"}
                      </div>
                    </div>
                  </div>

                  <div className="team-card-body">
                    <p className="team-card-desc">
                      {team.description || "No description provided."}
                    </p>

                    <div className="team-card-badges">
                      <span
                        className={`status-badge ${team.is_archived ? "status-archived" : "status-active"}`}
                      >
                        {team.is_archived ? "Archived" : "Active"}
                      </span>
                    </div>

                    {recent.length > 0 && (
                      <div className="team-recent-decisions">
                        <div className="team-recent-label">
                          Recent Decisions
                        </div>
                        {recent.slice(0, 3).map((d) => (
                          <button
                            key={d.decision_id}
                            className="team-recent-item"
                            onClick={() => openViewDecision(d)}
                            title={`Open ${d.title}`}
                          >
                            <span className="team-recent-dot"></span>
                            <span className="team-recent-title">
                              {d.title}
                            </span>
                            <span
                              className={`status-badge status-${(d.status || "").toLowerCase().replace(/\s+/g, "-")}`}
                            >
                              {d.status}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {recent.length === 0 && (
                      <div className="team-recent-empty">
                        No decisions made by this team yet.
                      </div>
                    )}
                  </div>

                  <div className="team-card-footer">
                    <button
                      className="secondary-button team-view-btn"
                      onClick={() => openViewTeam(team)}
                    >
                      View Team
                    </button>
                    <div className="team-dot-menu">
                      <button
                        className="team-dot-btn"
                        onClick={() =>
                          setMenuOpenFor(menuOpen ? null : team.team_id)
                        }
                        title="More options"
                      >
                        &#8942;
                      </button>
                      {menuOpen && (
                        <div className="team-dot-dropdown">
                          <button
                            onClick={() => openViewTeam(team)}
                            className="team-dot-item"
                          >
                            View Team
                          </button>
                          {isManager && (
                            <button
                              onClick={() => openEditModal(team)}
                              className="team-dot-item"
                            >
                              Edit Team
                            </button>
                          )}
                          {isManager && (
                            <button
                              onClick={() =>
                                setArchiveTarget(team)
                              }
                              className="team-dot-item"
                            >
                              {team.is_archived
                                ? "Unarchive Team"
                                : "Archive Team"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showCreate && (
          <div className="modal-overlay">
            <div className="modal-box">
              <h3>Create Team</h3>
              <div>
                <label className="form-label">Team Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. Data Science"
                />
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  rows="3"
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="What does this team do?"
                />
              </div>
              <div>
                <label className="form-label">Manager / Lead</label>
                <select
                  className="form-input"
                  value={createManagerId}
                  onChange={(e) => setCreateManagerId(e.target.value)}
                >
                  <option value="">-- No lead --</option>
                  {managerOptions.map((m) => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.name} ({m.email})
                    </option>
                  ))}
                </select>
              </div>
              {createError && (
                <div className="message error" style={{ margin: "10px 0" }}>
                  {createError}
                </div>
              )}
              <div className="modal-actions">
                <button
                  className="secondary-button"
                  onClick={() => setShowCreate(false)}
                  disabled={busy}
                >
                  Cancel
                </button>
                <button
                  className="primary-button"
                  onClick={handleCreate}
                  disabled={busy}
                >
                  {busy ? "Creating..." : "Create Team"}
                </button>
              </div>
            </div>
          </div>
        )}

        {showJoin && (
          <div className="modal-overlay">
            <div className="modal-box">
              <h3>Join a Team</h3>
              <p style={{ color: "#64748b", fontSize: "13px" }}>
                Select a team to submit a join request. A team lead will
                review and approve it.
              </p>
              {joinMessage && (
                <div
                  className={`message ${joinMessageType === "error" ? "error" : ""} ${joinMessageType === "success" ? "success" : ""}`}
                  style={{ margin: "10px 0" }}
                >
                  {joinMessage}
                </div>
              )}
              <div className="join-team-list">
                {teams
                  .filter((t) => !t.is_archived)
                  .map((team) => {
                    const isMember = alreadyMember(team);
                    const requested = requestedTeams.includes(
                      team.team_id
                    );
                    return (
                      <div key={team.team_id} className="join-team-row">
                        <div>
                          <div className="join-team-name">
                            {team.team_name}
                          </div>
                          <div className="join-team-meta">
                            {team.member_count || 0} member(s)
                          </div>
                        </div>
                        {isMember ? (
                          <span className="status-badge status-active">
                            Member
                          </span>
                        ) : requested ? (
                          <span className="status-badge status-under-review">
                            Pending
                          </span>
                        ) : (
                          <button
                            className="secondary-button"
                            onClick={() => handleJoinRequest(team)}
                            disabled={joinBusyId === team.team_id}
                          >
                            {joinBusyId === team.team_id
                              ? "Requesting..."
                              : "Request to Join"}
                          </button>
                        )}
                      </div>
                    );
                  })}
              </div>
              <div className="modal-actions">
                <button
                  className="secondary-button"
                  onClick={() => setShowJoin(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {showEdit && editTarget && (
          <div className="modal-overlay">
            <div className="modal-box">
              <h3>Edit Team</h3>
              <div>
                <label className="form-label">Team Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  rows="3"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">Manager / Lead</label>
                <select
                  className="form-input"
                  value={editManagerId}
                  onChange={(e) => setEditManagerId(e.target.value)}
                >
                  <option value="">-- No lead --</option>
                  {managerOptions.map((m) => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.name} ({m.email})
                    </option>
                  ))}
                </select>
              </div>
              {editError && (
                <div className="message error" style={{ margin: "10px 0" }}>
                  {editError}
                </div>
              )}
              <div className="modal-actions">
                <button
                  className="secondary-button"
                  onClick={() => setShowEdit(false)}
                  disabled={busy}
                >
                  Cancel
                </button>
                <button
                  className="primary-button"
                  onClick={handleEdit}
                  disabled={busy}
                >
                  {busy ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {archiveTarget && (
          <ConfirmDialog
            title={archiveTarget.is_archived ? "Restore Team" : "Archive Team"}
            message={
              archiveTarget.is_archived
                ? `Restore "${archiveTarget.team_name}" so members can use it again?`
                : `Archive "${archiveTarget.team_name}"? Archived teams are hidden from the active list.`
            }
            confirmLabel={
              archiveBusy
                ? "Working..."
                : archiveTarget.is_archived
                  ? "Restore"
                  : "Archive"
            }
            isBusy={archiveBusy}
            onCancel={() => {
              if (!archiveBusy) {
                setArchiveTarget(null);
                setMenuOpenFor(null);
              }
            }}
            onConfirm={() => handleArchiveToggle(archiveTarget)}
          />
        )}

      </main>

    </div>
  );
};

// ==========================================
// TEAM DETAILS PAGE
// ==========================================

const TeamDetailsPage = (props) => {
  const {
    user,
    getRoleName,
    getTeamName,
    team,
    allUsers,
    navigateTo,
    openViewDecision,
    loadTeamDetail,
    setSelectedTeam,
    handleLogout
  } = props;

  const isManager =
    [3, 4].includes(Number(user?.role_id));
  const isAdmin = Number(user?.role_id) === 4;

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [busy, setBusy] = useState(false);

  const [showAddMember, setShowAddMember] = useState(false);
  const [addUserId, setAddUserId] = useState("");
  const [addError, setAddError] = useState("");

  const [removeTarget, setRemoveTarget] = useState(null);
  const [removeBusy, setRemoveBusy] = useState(false);

  const [roleTarget, setRoleTarget] = useState(null);
  const [roleValue, setRoleValue] = useState("");
  const [roleBusy, setRoleBusy] = useState(false);
  const [roleError, setRoleError] = useState("");

  const [joinRequests, setJoinRequests] = useState([]);
  const [joinRequestsLoading, setJoinRequestsLoading] = useState(false);
  const [requestActionId, setRequestActionId] = useState(null);

  const [teamDecisions, setTeamDecisions] = useState([]);
  const [teamDecisionsLoading, setTeamDecisionsLoading] = useState(false);

  useEffect(() => {
    if (isManager && team) {
      loadJoinRequests(team.team_id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team?.team_id]);

  useEffect(() => {
    if (team) {
      loadTeamDecisions(team.team_id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team?.team_id]);

  const members = team?.members || [];
  const teamActivity = team?.recent_activity || [];

  const refreshTeam = async () => {
    if (!team) return;
    const full = await loadTeamDetail(team.team_id);
    if (full) setSelectedTeam(full);
    await loadTeamDecisions(team.team_id);
  };

  const loadJoinRequests = async (teamId) => {
    setJoinRequestsLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${API_BASE_URL}/teams/${teamId}/join-requests`,
        {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        }
      );
      if (response.ok) {
        const data = await response.json();
        setJoinRequests(data);
      }
    } catch (error) {
      console.error("Join requests error:", error);
    } finally {
      setJoinRequestsLoading(false);
    }
  };

  const loadTeamDecisions = async (teamId) => {
    setTeamDecisionsLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${API_BASE_URL}/teams/${teamId}/decisions`,
        {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        }
      );
      if (response.ok) {
        const data = await response.json();
        setTeamDecisions(data);
      }
    } catch (error) {
      console.error("Team decisions error:", error);
    } finally {
      setTeamDecisionsLoading(false);
    }
  };

  const showMsg = (text, type) => {
    setMessage(text);
    setMessageType(type || "");
  };

  const handleAddMember = async () => {
    setAddError("");
    if (!addUserId) {
      setAddError("Select a user to add");
      return;
    }
    setBusy(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${API_BASE_URL}/teams/${team.team_id}/members`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ user_id: Number(addUserId) })
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setAddError(data.detail || "Unable to add member");
        return;
      }

      setShowAddMember(false);
      setAddUserId("");
      showMsg("Member added successfully", "success");
      await refreshTeam();
    } catch (error) {
      console.error("Add member error:", error);
      setAddError("Unable to add member");
    } finally {
      setBusy(false);
    }
  };

  const handleRemoveMember = async (member) => {
    setRemoveBusy(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${API_BASE_URL}/teams/${team.team_id}/members/${member.user_id}`,
        {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        showMsg(data.detail || "Unable to remove member", "error");
      } else {
        showMsg("Member removed successfully", "success");
        await refreshTeam();
      }
    } catch (error) {
      console.error("Remove member error:", error);
      showMsg("Unable to remove member", "error");
    } finally {
      setRemoveBusy(false);
      setRemoveTarget(null);
    }
  };

  const openRoleModal = (member) => {
    setRoleTarget(member);
    setRoleValue(String(member.role_id));
    setRoleError("");
  };

  const handleAssignRole = async () => {
    setRoleError("");
    setRoleBusy(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${API_BASE_URL}/users/${roleTarget.user_id}?role_id=${Number(roleValue)}`,
        {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setRoleError(data.detail || "Unable to assign role");
        return;
      }

      setRoleTarget(null);
      showMsg("Role updated successfully", "success");
      await refreshTeam();
    } catch (error) {
      console.error("Assign role error:", error);
      setRoleError("Unable to assign role");
    } finally {
      setRoleBusy(false);
    }
  };

  const handleJoinRequestDecision = async (request, action) => {
    setRequestActionId(request.request_id);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${API_BASE_URL}/teams/${team.team_id}/join-requests/${request.request_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ decision: action })
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        showMsg(data.detail || "Unable to process request", "error");
      } else {
        showMsg(
          action === "approve"
            ? "Join request approved"
            : "Join request rejected",
          "success"
        );
        await loadJoinRequests(team.team_id);
        await refreshTeam();
      }
    } catch (error) {
      console.error("Join request decision error:", error);
      showMsg("Unable to process request", "error");
    } finally {
      setRequestActionId(null);
    }
  };

  const pendingRequests = (joinRequests || []).filter(
    (r) => r.status === "Pending"
  );

  const processedRequests = (joinRequests || []).filter(
    (r) => r.status !== "Pending"
  );

  return (
    <div className="dash-layout">

      <AppSidebar
        activePage="teams"
        navigateTo={navigateTo}
        handleLogout={handleLogout}
      />

      <main className="dash-main">

        <header className="dash-header">

          <div>
            <button
              className="nav-button"
              onClick={() => navigateTo("teams")}
              style={{ marginBottom: "8px" }}
            >
              &larr; Back to Teams
            </button>
            <h2 className="dash-header-title">
              {team?.team_name || "Team Details"}
            </h2>
            <p className="dash-header-sub">
              {team?.description || "Team collaboration workspace."}
            </p>
          </div>

          <div className="dash-header-right">
            <NotificationBell navigateTo={navigateTo} />
            <div className="dash-avatar">
              {(user?.name || "U").charAt(0).toUpperCase()}
            </div>
            <div className="dash-user-info">
              <div className="dash-user-name">
                {user?.name}
              </div>
              <div className="dash-user-role">
                {getRoleName(user?.role_id)}
              </div>
            </div>
          </div>

        </header>

        {message && (
          <div
            className={`message ${messageType === "error" ? "error" : ""} ${messageType === "success" ? "success" : ""}`}
            style={{ marginBottom: "16px" }}
          >
            {message}
          </div>
        )}

        {!team ? (
          <div className="dash-card">
            <div className="message" style={{ margin: "12px 0" }}>
              Team not found.
            </div>
          </div>
        ) : (
          <>
            <section className="team-detail-card">
              <div className="team-detail-hero">
                <div className="team-avatar team-avatar-lg">
                  {(team.team_name || "T").charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="team-detail-name">
                    {team.team_name}
                  </div>
                  <div className="team-detail-meta">
                    {team.member_count || 0} member(s) &middot;{" "}
                    {team.decision_count || 0} decision(s) &middot; Lead:{" "}
                    {team.manager_name || "No lead assigned"}
                  </div>
                  <div style={{ marginTop: "10px" }}>
                    <span
                      className={`status-badge ${team.is_archived ? "status-archived" : "status-active"}`}
                    >
                      {team.is_archived ? "Archived" : "Active"}
                    </span>
                  </div>
                </div>
              </div>
              <p className="team-detail-desc">
                {team.description || "No description provided."}
              </p>
            </section>

            {isManager && (
              <div className="team-manager-actions">
                <button
                  className="primary-button"
                  onClick={() => setShowAddMember(true)}
                  disabled={team.is_archived}
                >
                  + Add Member
                </button>
              </div>
            )}

            <section className="dash-card team-section-card">
              <div className="dash-card-header">
                <h4>Team Members</h4>
                <span className="team-count-pill">
                  {team.member_count || 0} member(s)
                </span>
              </div>
              <div style={{ height: "1px", background: "#e5e7eb", margin: "12px 0 16px" }}></div>

              {members.length === 0 ? (
                <div className="message" style={{ margin: "12px 0" }}>
                  No members assigned to this team yet.
                </div>
              ) : (
                <div className="table-wrap">
                  <table className="decisions-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Team</th>
                        {isManager && <th>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((member) => (
                        <tr key={member.user_id}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <div
                                className="dash-avatar"
                                style={{ width: "30px", height: "30px", fontSize: "13px" }}
                              >
                                {(member.name || "U").charAt(0).toUpperCase()}
                              </div>
                              <span style={{ fontWeight: 600, color: "#1e293b" }}>
                                {member.name}
                              </span>
                            </div>
                          </td>
                          <td>{member.email}</td>
                          <td>
                            <span className={`status-badge status-${(member.role_name || "").toLowerCase()}`}>
                              {member.role_name || "Member"}
                            </span>
                          </td>
                          <td>{member.team_name || "Not assigned"}</td>
                          {isManager && (
                            <td>
                              <button
                                className="secondary-button action-limited"
                                onClick={() => openRoleModal(member)}
                                disabled={team.is_archived}
                              >
                                Assign Role
                              </button>
                              <button
                                className="danger-button action-limited"
                                onClick={() => setRemoveTarget(member)}
                                disabled={team.is_archived}
                                style={{ marginLeft: "6px" }}
                              >
                                Remove
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {isManager && (
              <section className="dash-card team-section-card">
                <div className="dash-card-header">
                  <h4>Join Requests</h4>
                  <span className="team-count-pill">
                    {(joinRequests || []).length} request(s)
                  </span>
                </div>
                <div style={{ height: "1px", background: "#e5e7eb", margin: "12px 0 16px" }}></div>

                {joinRequestsLoading ? (
                  <div className="spin-loader" style={{ margin: "12px auto" }} />
                ) : (joinRequests || []).length === 0 ? (
                  <div className="message" style={{ margin: "12px 0" }}>
                    No join requests.
                  </div>
                ) : (
                  <div className="table-wrap">
                    <table className="decisions-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Status</th>
                          <th>Requested</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingRequests.map((request) => (
                          <tr key={request.request_id}>
                            <td>{request.user_name}</td>
                            <td>{request.user_email}</td>
                            <td>
                              <span className="status-badge status-under-review">
                                {request.status}
                              </span>
                            </td>
                            <td>
                              {request.created_at
                                ? new Date(request.created_at).toLocaleDateString()
                                : "—"}
                            </td>
                            <td>
                              <button
                                className="primary-button action-limited"
                                onClick={() =>
                                  handleJoinRequestDecision(request, "approve")
                                }
                                disabled={requestActionId === request.request_id}
                              >
                                Approve
                              </button>
                              <button
                                className="danger-button action-limited"
                                onClick={() =>
                                  handleJoinRequestDecision(request, "reject")
                                }
                                disabled={requestActionId === request.request_id}
                                style={{ marginLeft: "6px" }}
                              >
                                Reject
                              </button>
                            </td>
                          </tr>
                        ))}
                        {processedRequests.map((request) => (
                          <tr key={request.request_id}>
                            <td>{request.user_name}</td>
                            <td>{request.user_email}</td>
                            <td>
                              <span
                                className={`status-badge ${
                                  request.status === "Approved"
                                    ? "status-active"
                                    : "status-archived"
                                }`}
                              >
                                {request.status}
                              </span>
                            </td>
                            <td>
                              {request.created_at
                                ? new Date(request.created_at).toLocaleDateString()
                                : "—"}
                            </td>
                            <td>—</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            <section className="dash-card team-section-card">
              <div className="dash-card-header">
                <h4>Team Decisions</h4>
                <span className="team-count-pill">
                  {teamDecisions.length} decision(s)
                </span>
              </div>
              <div style={{ height: "1px", background: "#e5e7eb", margin: "12px 0 16px" }}></div>

              {teamDecisionsLoading ? (
                <div className="message" style={{ margin: "12px 0" }}>
                  Loading decisions...
                </div>
              ) : teamDecisions.length === 0 ? (
                <div className="message" style={{ margin: "12px 0" }}>
                  No decisions recorded for this team yet.
                </div>
              ) : (
                <div className="table-wrap">
                  <table className="decisions-table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th>Owner</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamDecisions.map((decision) => (
                        <tr key={decision.decision_id}>
                          <td>
                            <button
                              className="link-button"
                              onClick={() => openViewDecision(decision)}
                            >
                              {decision.title}
                            </button>
                          </td>
                          <td>{decision.category_name || "—"}</td>
                          <td>
                            <span
                              className={`status-badge status-${(decision.status || "").toLowerCase().replace(/\s+/g, "-")}`}
                            >
                              {decision.status}
                            </span>
                          </td>
                          <td>{decision.expert_name || "—"}</td>
                          <td>
                            {decision.created_at
                              ? new Date(decision.created_at).toLocaleDateString()
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="dash-card team-section-card">
              <div className="dash-card-header">
                <h4>Recent Team Activity</h4>
                <span className="team-count-pill">
                  {teamActivity.length} event(s)
                </span>
              </div>
              <div style={{ height: "1px", background: "#e5e7eb", margin: "12px 0 16px" }}></div>

              {teamActivity.length === 0 ? (
                <div className="message" style={{ margin: "12px 0" }}>
                  No recent activity for this team yet.
                </div>
              ) : (
                <ul className="team-activity-list">
                  {teamActivity.map((item, index) => (
                    <li
                      key={`${item.decision_id}-${index}`}
                      className="team-activity-item"
                    >
                      <div>
                        <span className="team-activity-action">
                          {item.action}
                        </span>{" "}
                        {item.user_name ? `by ${item.user_name}` : ""}
                      </div>
                      <div className="team-activity-decision">
                        {item.decision_title}
                      </div>
                      <div className="team-activity-date">
                        {item.created_at
                          ? new Date(item.created_at).toLocaleString()
                          : "—"}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}

        {showAddMember && (
          <div className="modal-overlay">
            <div className="modal-box">
              <h3>Add Member</h3>
              <div>
                <label className="form-label">User</label>
                <select
                  className="form-input"
                  value={addUserId}
                  onChange={(e) => setAddUserId(e.target.value)}
                >
                  <option value="">-- Select a user --</option>
                  {(allUsers || [])
                    .filter(
                      (u) =>
                        Number(u.team_id) !== Number(team.team_id)
                    )
                    .map((u) => (
                      <option key={u.user_id} value={u.user_id}>
                        {u.name} ({u.email}) — {u.role_name || "Member"}
                      </option>
                    ))}
                </select>
              </div>
              {addError && (
                <div className="message error" style={{ margin: "10px 0" }}>
                  {addError}
                </div>
              )}
              <div className="modal-actions">
                <button
                  className="secondary-button"
                  onClick={() => setShowAddMember(false)}
                  disabled={busy}
                >
                  Cancel
                </button>
                <button
                  className="primary-button"
                  onClick={handleAddMember}
                  disabled={busy}
                >
                  {busy ? "Adding..." : "Add Member"}
                </button>
              </div>
            </div>
          </div>
        )}

        {removeTarget && (
          <ConfirmDialog
            title="Remove Member"
            message={`Remove ${removeTarget.name} from this team?`}
            confirmLabel={removeBusy ? "Removing..." : "Remove"}
            isBusy={removeBusy}
            onCancel={() => {
              if (!removeBusy) setRemoveTarget(null);
            }}
            onConfirm={() => handleRemoveMember(removeTarget)}
          />
        )}

        {roleTarget && (
          <div className="modal-overlay">
            <div className="modal-box">
              <h3>Assign Team Role</h3>
              <p style={{ color: "#64748b", fontSize: "13px" }}>
                Change the role of {roleTarget.name}.
              </p>
              <div>
                <label className="form-label">Role</label>
                <select
                  className="form-input"
                  value={roleValue}
                  onChange={(e) => setRoleValue(e.target.value)}
                >
                  <option value="1">Employee</option>
                  <option value="2">Reviewer</option>
                  <option value="3">Manager</option>
                  {isAdmin && <option value="4">Administrator</option>}
                </select>
              </div>
              {roleError && (
                <div className="message error" style={{ margin: "10px 0" }}>
                  {roleError}
                </div>
              )}
              <div className="modal-actions">
                <button
                  className="secondary-button"
                  onClick={() => setRoleTarget(null)}
                  disabled={roleBusy}
                >
                  Cancel
                </button>
                <button
                  className="primary-button"
                  onClick={handleAssignRole}
                  disabled={roleBusy}
                >
                  {roleBusy ? "Assigning..." : "Assign Role"}
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

    </div>
  );
};

// ==========================================
// DECISIONS LIST PAGE
// ==========================================

const DecisionsPage = (props) => {
  const {
    user,
    getRoleName,
    navigateTo,
    navigateBack,
    decisions,
    decisionsLoading,
    decisionMessage,
    decisionMessageType,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    teamFilter,
    setTeamFilter,
    teams,
    applyFilters,
    openCreateDecision,
    openViewDecision,
    openEditDecision,
    deleteTarget,
    isDeleting,
    setDeleteTarget,
    cancelDelete,
    handleDeleteDecision,
    handleSubmitForReview,
    submitTarget,
    setSubmitTarget,
    isSubmitting,
    handleLogout,
    formatDate
  } = props;

  const handleSearchKey = (e) => {
    if (e.key === "Enter") {
      applyFilters();
    }
  };

  const openSubmitConfirm = (decision) => {
    setSubmitTarget(decision);
  };

  return (
    <div className="dash-layout">

      <AppSidebar
        activePage="decisions"
        navigateTo={navigateTo}
        handleLogout={handleLogout}
      />

      <main className="dash-main">

        <header className="dash-header">

          <div>
            <h2 className="dash-header-title">
              Decisions
            </h2>
            <p className="dash-header-sub">
              Decision Management
            </p>
          </div>

          <div className="dash-header-right">
            <NotificationBell navigateTo={navigateTo} />
            <button
              className="nav-button"
              onClick={navigateBack}
              title="Go back"
            >
              &larr; Back
            </button>
            <button
              className="nav-button"
              onClick={openCreateDecision}
            >
              + Create Decision
            </button>
            <div className="dash-header-user">
              <div className="dash-avatar">
                {(user?.name || "U").charAt(0).toUpperCase()}
              </div>
              <div className="dash-user-info">
                <div className="dash-user-name">
                  {user?.name}
                </div>
                <div className="dash-user-role">
                  {getRoleName(user?.role_id)}
                </div>
              </div>
            </div>
          </div>

        </header>

        <section className="dash-card" style={{ marginBottom: "20px" }}>

          <div className="dash-card-header" style={{ marginBottom: "0" }}>
            <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
              All Decisions
              <span style={{ marginLeft: "10px", fontSize: "13px", fontWeight: 500, color: "#64748b" }}>
                {decisions.length} record(s)
              </span>
            </h4>
          </div>

          <div style={{ height: "1px", background: "#e5e7eb", margin: "12px 0 16px" }}></div>

          {/* FILTER BAR */}

          <div className="filter-bar" style={{ marginBottom: "0" }}>

            <div className="filter-field grow">

              <input
                type="text"
                placeholder="Search by decision title..."
                value={searchQuery}
                onChange={(e) =>
                  setSearchQuery(e.target.value)
                }
                onKeyDown={handleSearchKey}
              />

            </div>

            <div className="filter-field">

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value)
                }
              >
                <option value="">
                  All Statuses
                </option>
                <option value="Draft">
                  Draft
                </option>
                <option value="Under Review">
                  Under Review
                </option>
                <option value="Reviewer Approved">
                  Reviewer Approved
                </option>
                <option value="Approved">
                  Approved
                </option>
                <option value="Rejected">
                  Rejected
                </option>
                <option value="Archived">
                  Archived
                </option>
              </select>

            </div>

            <div className="filter-field">

              <select
                value={teamFilter}
                onChange={(e) =>
                  setTeamFilter(e.target.value)
                }
              >
                <option value="">
                  All Teams
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

            <button
              className="filter-button"
              onClick={applyFilters}
            >
              Apply
            </button>

          </div>

          {decisionMessage && (
            <div
              className={`message ${decisionMessageType}`}
              style={{ marginTop: "12px" }}
            >
              {decisionMessage}
            </div>
          )}

          {decisionsLoading ? (
            <div className="empty-state" style={{ marginTop: "12px" }}>
              Loading decisions...
            </div>
          ) : decisions.length === 0 ? (
            <div className="empty-state" style={{ marginTop: "12px" }}>
              No decisions found matching your criteria.
              Click "Create Decision" to add one.
            </div>
          ) : (
            <div className="table-wrap" style={{ marginTop: "12px" }}>
              <table className="decisions-table">

                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Owner</th>
                    <th>Team</th>
                    <th>Status</th>
                    <th>Decision Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {decisions.map((decision) => (
                    <tr key={decision.decision_id}>

                      <td>
                        {decision.decision_id}
                      </td>

                      <td>
                        <div className="title-cell">
                          <strong>
                            {decision.title}
                          </strong>

                          {decision.status === "Archived" && (
                            <span className="archived-tag">
                              Archived
                            </span>
                          )}
                        </div>
                      </td>

                      <td>
                        {decision.expert_name ||
                          `User #${decision.expert_id}`}
                      </td>

                      <td>
                        {decision.team_name || "Not assigned"}
                      </td>

                      <td>
                        <span
                          className={statusBadgeClass(
                            decision.status
                          )}
                        >
                          {decision.status}
                        </span>
                      </td>

                      <td>
                        {formatDate(decision.decision_date)}
                      </td>

                      <td>
                        <div className="table-actions">

                          <button
                            className="action-button view-button"
                            onClick={() =>
                              openViewDecision(decision)
                            }
                          >
                            View
                          </button>

                          <button
                            className="action-button edit-button"
                            onClick={() =>
                              openEditDecision(decision)
                            }
                          >
                            Edit
                          </button>

                          {decision.status === "Draft" &&
                          (user?.user_id === decision.expert_id ||
                          [3, 4].includes(user?.role_id)) && (
                          <button
                            className="action-button submit-button"
                            onClick={() =>
                              openSubmitConfirm(decision)
                            }
                          >
                            Submit for Review
                          </button>
                          )}

                          {decision.status !== "Archived" && (
                          <button
                            className="action-button delete-button"
                            onClick={() =>
                              setDeleteTarget(decision)
                            }
                          >
                            {decision.status === "Draft" ||
                            decision.status === "Under Review" ||
                            decision.status === "Reviewer Approved" ||
                            decision.status === "Rejected"
                              ? "Delete"
                              : "Archive"}
                          </button>
                          )}

                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}

        </section>

      </main>

      {deleteTarget && (
        <ConfirmDialog
          title={
            deleteTarget.status === "Draft" ||
            deleteTarget.status === "Under Review" ||
            deleteTarget.status === "Reviewer Approved" ||
            deleteTarget.status === "Rejected"
              ? "Delete Decision"
              : "Archive Decision"
          }
          message={
            deleteTarget.status === "Draft" ||
            deleteTarget.status === "Under Review" ||
            deleteTarget.status === "Reviewer Approved" ||
            deleteTarget.status === "Rejected"
              ? `Are you sure you want to delete "${deleteTarget.title}"? This action cannot be undone.`
              : `Are you sure you want to archive "${deleteTarget.title}"? The decision will be kept in history but no longer appear as an active decision.`
          }
          confirmLabel={
            deleteTarget.status === "Draft" ||
            deleteTarget.status === "Under Review" ||
            deleteTarget.status === "Reviewer Approved" ||
            deleteTarget.status === "Rejected"
              ? "Delete"
              : "Archive"
          }
          cancelLabel="Cancel"
          isBusy={isDeleting}
          onConfirm={() =>
            handleDeleteDecision(deleteTarget)
          }
          onCancel={cancelDelete}
        />
      )}

      {submitTarget && (
        <ConfirmDialog
          title="Submit for Review"
          message={`Are you sure you want to submit "${submitTarget.title}" for review?`}
          confirmLabel="Submit"
          cancelLabel="Cancel"
          isBusy={isSubmitting}
          onConfirm={() =>
            handleSubmitForReview(submitTarget)
          }
          onCancel={() => setSubmitTarget(null)}
        />
      )}

    </div>
  );
};

// ==========================================
// CREATE DECISION PAGE
// ==========================================

const CreateDecisionPage = (props) => {
  const {
    user,
    getRoleName,
    navigateTo,
    navigateBack,
    decisionTitle,
    decisionDescription,
    decisionContext,
    decisionProblem,
    decisionObjective,
    decisionCriteria,
    decisionRisks,
    decisionStakeholders,
    decisionRationale,
    decisionOutcome,
    decisionImplementationStatus,
    decisionPriority,
    decisionDate,
    decisionAlternatives,
    decisionMessage,
    decisionMessageType,
    decisionsLoading,
    setDecisionTitle,
    setDecisionDescription,
    setDecisionContext,
    setDecisionProblem,
    setDecisionObjective,
    setDecisionCriteria,
    setDecisionRisks,
    setDecisionStakeholders,
    setDecisionRationale,
    setDecisionOutcome,
    setDecisionImplementationStatus,
    setDecisionPriority,
    setDecisionDate,
    setDecisionAlternatives,
    handleCreateDecision,
    handleLogout,
    createFile,
    setCreateFile,
    createFileUploading,
    setCreateFileUploading,
    lastCreatedDecisionId,
    setLastCreatedDecisionId,
    handleCreateFileUpload,
    createdConfirmTarget,
    handleCreatedReviewSubmit,
    handleCreatedReviewSkip,
    isSubmitting: isSubmittingProp
  } = props;

  const updateAlternative = (index, field, value) => {
    setDecisionAlternatives((prev) => {
      const next = prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      );

      return next;
    });
  };

  const addAlternative = () => {
    setDecisionAlternatives((prev) => [
      ...prev,
      {
        title: "",
        description: "",
        pros: "",
        cons: "",
        estimated_cost: "",
        feasibility: "Medium",
        risk_level: "Medium",
        risk_explanation: ""
      }
    ]);
  };

  const removeAlternative = (index) => {
    setDecisionAlternatives((prev) =>
      prev.filter((item, i) => i !== index)
    );
  };

  const label = (text, required) => (
    <label>
      {text}

      {required && (
        <span className="required-star">*</span>
      )}
    </label>
  );

  return (
    <div className="dash-layout">

      <AppSidebar
        activePage="create"
        navigateTo={navigateTo}
        handleLogout={handleLogout}
      />

      <main className="dash-main">

        <header className="dash-header">

          <div>
            <h2 className="dash-header-title">
              Create Decision
            </h2>
            <p className="dash-header-sub">
              Decision Management
            </p>
          </div>

          <div className="dash-header-right">
            <NotificationBell navigateTo={navigateTo} />
            <button
              className="nav-button"
              onClick={navigateBack}
            >
              &larr; Back
            </button>
            <div className="dash-header-user">
              <div className="dash-avatar">
                {(user?.name || "U").charAt(0).toUpperCase()}
              </div>
              <div className="dash-user-info">
                <div className="dash-user-name">
                  {user?.name}
                </div>
                <div className="dash-user-role">
                  {getRoleName(user?.role_id)}
                </div>
              </div>
            </div>
          </div>

        </header>

        <section className="dash-card">

          <div className="dash-card-header" style={{ marginBottom: "0" }}>
            <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
              Create New Decision
            </h4>
          </div>

          <div style={{ height: "1px", background: "#e5e7eb", margin: "12px 0 16px" }}></div>

          <div className="decision-form-box">

            <form onSubmit={handleCreateDecision}>

              <div className="form-section-title">
                Basic Information
              </div>

              <div className="form-group">

                {label("Decision Title", true)}

                <input
                  type="text"
                  placeholder="Enter decision title"
                  value={decisionTitle}
                  onChange={(e) =>
                    setDecisionTitle(e.target.value)
                  }
                />

              </div>

              <div className="form-group">

                {label("Problem Statement", true)}

                <textarea
                  rows="4"
                  placeholder="Describe the problem this decision addresses"
                  value={decisionProblem}
                  onChange={(e) =>
                    setDecisionProblem(e.target.value)
                  }
                >
                </textarea>

              </div>

              <div className="form-group">

                {label("Decision Context")}

                <textarea
                  rows="4"
                  placeholder="Background and circumstances around the decision"
                  value={decisionContext}
                  onChange={(e) =>
                    setDecisionContext(e.target.value)
                  }
                >
                </textarea>

              </div>

              <div className="form-group">

                {label("Description")}

                <textarea
                  rows="3"
                  placeholder="Short description"
                  value={decisionDescription}
                  onChange={(e) =>
                    setDecisionDescription(e.target.value)
                  }
                >
                </textarea>

              </div>

              <div className="form-group">

                {label("Objective")}

                <textarea
                  rows="3"
                  placeholder="What the decision aims to achieve"
                  value={decisionObjective}
                  onChange={(e) =>
                    setDecisionObjective(e.target.value)
                  }
                >
                </textarea>

              </div>

              <div className="form-section-title">
                Analysis
              </div>

              <div className="form-group">

                {label("Alternatives Considered")}

                {decisionAlternatives.length === 0 ? (
                  <div className="empty-state small">
                    No alternatives added yet.
                  </div>
                ) : (
                  <div className="alt-list">

                    {decisionAlternatives.map((alt, index) => (
                      <div
                        className="alt-item"
                        key={index}
                      >

                        <div className="alt-item-head">

                          <strong>
                            Alternative {index + 1}
                          </strong>

                          <button
                            type="button"
                            className="alt-remove"
                            onClick={() =>
                              removeAlternative(index)
                            }
                          >
                            Remove
                          </button>

                        </div>

                        <div className="form-group">

                          {label("Title")}

                          <input
                            type="text"
                            placeholder="Alternative title"
                            value={alt.title}
                            onChange={(e) =>
                              updateAlternative(
                                index,
                                "title",
                                e.target.value
                              )
                            }
                          />

                        </div>

                        <div className="form-group">

                          {label("Description")}

                          <textarea
                            rows="2"
                            placeholder="Alternative description"
                            value={alt.description}
                            onChange={(e) =>
                              updateAlternative(
                                index,
                                "description",
                                e.target.value
                              )
                            }
                          >
                          </textarea>

                        </div>

                        <div className="alt-grid">

                          <div className="form-group">

                            {label("Pros")}

                            <textarea
                              rows="2"
                              placeholder="Advantages"
                              value={alt.pros}
                              onChange={(e) =>
                                updateAlternative(
                                  index,
                                  "pros",
                                  e.target.value
                                )
                              }
                            >
                            </textarea>

                          </div>

                          <div className="form-group">

                            {label("Cons")}

                            <textarea
                              rows="2"
                              placeholder="Disadvantages"
                              value={alt.cons}
                              onChange={(e) =>
                                updateAlternative(
                                  index,
                                  "cons",
                                  e.target.value
                                )
                              }
                            >
                            </textarea>

                          </div>

                        </div>

                        <div className="alt-grid">

                          <div className="form-group">

                            {label("Estimated Cost")}

                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="e.g. 25000"
                              value={alt.estimated_cost || ""}
                              onChange={(e) =>
                                updateAlternative(
                                  index,
                                  "estimated_cost",
                                  e.target.value
                                )
                              }
                            />

                          </div>

                          <div className="form-group">

                            {label("Feasibility")}

                            <select
                              value={alt.feasibility || "Medium"}
                              onChange={(e) =>
                                updateAlternative(
                                  index,
                                  "feasibility",
                                  e.target.value
                                )
                              }
                            >
                              <option value="Low">Low</option>
                              <option value="Medium">Medium</option>
                              <option value="High">High</option>
                            </select>

                          </div>

                          <div className="form-group">

                            {label("Risk Assessment")}

                            <select
                              value={alt.risk_level || "Medium"}
                              onChange={(e) =>
                                updateAlternative(
                                  index,
                                  "risk_level",
                                  e.target.value
                                )
                              }
                            >
                              <option value="Low">Low</option>
                              <option value="Medium">Medium</option>
                              <option value="High">High</option>
                            </select>

                          </div>

                        </div>

                        <div className="form-group">

                          {label("Risk Explanation")}

                          <textarea
                            rows="2"
                            placeholder="Explain the identified risks"
                            value={alt.risk_explanation}
                            onChange={(e) =>
                              updateAlternative(
                                index,
                                "risk_explanation",
                                e.target.value
                              )
                            }
                          >
                          </textarea>

                        </div>

                      </div>
                    ))}

                  </div>
                )}

                <button
                  type="button"
                  className="secondary-button action-limited"
                  onClick={addAlternative}
                >
                  Add Alternative
                </button>

              </div>

              <div className="form-group">

                {label("Evaluation Criteria")}

                <textarea
                  rows="3"
                  placeholder="Criteria used to compare alternatives"
                  value={decisionCriteria}
                  onChange={(e) =>
                    setDecisionCriteria(e.target.value)
                  }
                >
                </textarea>

              </div>

              <div className="form-group">

                {label("Risks")}

                <textarea
                  rows="3"
                  placeholder="Potential risks and mitigations"
                  value={decisionRisks}
                  onChange={(e) =>
                    setDecisionRisks(e.target.value)
                  }
                >
                </textarea>

              </div>

              <div className="form-group">

                {label("Stakeholders")}

                <textarea
                  rows="3"
                  placeholder="People or groups affected by this decision"
                  value={decisionStakeholders}
                  onChange={(e) =>
                    setDecisionStakeholders(e.target.value)
                  }
                >
                </textarea>

              </div>

              <div className="form-section-title">
                Decision Details
              </div>

              <div className="form-row">

                <div className="form-group">

                  {label("Decision Date")}

                  <input
                    type="datetime-local"
                    value={decisionDate}
                    onChange={(e) =>
                      setDecisionDate(e.target.value)
                    }
                  />

                </div>

              </div>

              <div className="form-row">

                <div className="form-group">

                  {label("Priority")}

                  <select
                    value={decisionPriority}
                    onChange={(e) =>
                      setDecisionPriority(e.target.value)
                    }
                  >
                    <option value="Low">
                      Low
                    </option>
                    <option value="Medium">
                      Medium
                    </option>
                    <option value="High">
                      High
                    </option>
                  </select>

                </div>

                <div className="form-group">

                  {label("Implementation Status")}

                  <select
                    value={decisionImplementationStatus}
                    onChange={(e) =>
                      setDecisionImplementationStatus(
                        e.target.value
                      )
                    }
                  >
                    <option value="Not Started">
                      Not Started
                    </option>
                    <option value="In Progress">
                      In Progress
                    </option>
                    <option value="Completed">
                      Completed
                    </option>
                  </select>

                </div>

              </div>

              <div className="form-group">

                {label("Decision Owner / Expert")}

                <input
                  type="text"
                  value={
                    user
                      ? `${user.name} (${user.email})`
                      : ""
                  }
                  readOnly
                />

              </div>

              <div className="form-section-title">
                Outcome / Rationale
              </div>

              <div className="form-group">

                {label("Rationale")}

                <textarea
                  rows="3"
                  placeholder="Reasoning behind the final decision"
                  value={decisionRationale}
                  onChange={(e) =>
                    setDecisionRationale(e.target.value)
                  }
                >
                </textarea>

              </div>

              <div className="form-group">

                {label("Final Decision / Outcome")}

                <textarea
                  rows="3"
                  placeholder="What was finally decided and expected outcome"
                  value={decisionOutcome}
                  onChange={(e) =>
                    setDecisionOutcome(e.target.value)
                  }
                >
                </textarea>

              </div>

              {decisionMessage && (
                <div
                  className={`message ${decisionMessageType}`}
                >
                  {decisionMessage}
                </div>
              )}

              {lastCreatedDecisionId ? (
                <div className="form-group">
                  {createFileUploading ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "12px",
                        background: "#f8f9fa",
                        borderRadius: 6,
                        fontSize: 13,
                        color: "#444"
                      }}
                    >
                      Uploading {createFile?.name}...
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="primary-button"
                      disabled={!createFile}
                      onClick={handleCreateFileUpload}
                    >
                      Upload Document
                    </button>
                  )}
                </div>
              ) : (
                <div className="form-group">
                  <label>
                    Upload Supporting Document
                    <span className="required-star">*</span>
                  </label>

                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png"
                    onChange={(e) =>
                      setCreateFile(
                        e.target.files && e.target.files[0]
                          ? e.target.files[0]
                          : null
                      )
                    }
                    style={{ marginBottom: 8 }}
                  />

                  {createFile && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 12px",
                        background: "#f8f9fa",
                        borderRadius: 6,
                        fontSize: 13,
                        color: "#444"
                      }}
                    >
                      <span>{createFile.name}</span>

                      <span style={{ color: "#888" }}>
                        ({createFile.type || "File"} ·{" "}
                        {Math.round(createFile.size / 1024)} KB)
                      </span>

                      <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                        <button
                          type="button"
                          className="link-button"
                          onClick={() => {
                            window.open(
                              URL.createObjectURL(createFile),
                              "_blank"
                            );
                          }}
                        >
                          View
                        </button>

                        <button
                          type="button"
                          className="link-button danger"
                          onClick={() => setCreateFile(null)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                className="primary-button"
                disabled={decisionsLoading}
              >
                {decisionsLoading
                  ? "Creating..."
                  : "Create Decision"}
              </button>

            </form>

          </div>

        </section>

      </main>

      {createdConfirmTarget && (
        <ConfirmDialog
          title="Decision Created"
          message="Do you want to submit this decision for review?"
          confirmLabel="Submit for Review"
          cancelLabel="Not Now"
          isBusy={isSubmittingProp}
          onConfirm={handleCreatedReviewSubmit}
          onCancel={handleCreatedReviewSkip}
        />
      )}

    </div>
  );
};

// ==========================================
// VIEW DECISION PAGE
// ==========================================

const ViewDecisionPage = (props) => {
  const {
    user,
    getRoleName,
    navigateTo,
    navigateBack,
    selectedDecision,
    overviewMessage,
    overviewMessageType,
    altSectionMessage,
    altSectionMessageType,
    handleSubmitForReview,
    handleReviewDecision,
    handleManagerReviewDecision,
    handleArchiveDecision,
    submitTarget,
    setSubmitTarget,
    isSubmitting,
    reviewTarget,
    setReviewTarget,
    rejectReason,
    setRejectReason,
    reviewStep,
    setReviewStep,
    isReviewing,
    archiveTarget,
    setArchiveTarget,
    isArchiving,
    handleLogout,
    openEditDecision,
    deleteTarget,
    isDeleting,
    setDeleteTarget,
    cancelDelete,
    handleDeleteDecision,
    formatDate,
    altModalMode,
    altForm,
    altSaving,
    altWorking,
    altDeleteTarget,
    altIsDeleting,
    altMessage,
    altMessageType,
    setAltField,
    openAddAlternative,
    openEditAlternative,
    openViewAlternative,
    closeAltModal,
    handleSaveAlternative,
    cancelAltDelete,
    handleDeleteAlternative,
    handleSelectAlternative,
    formatCost,
    levelBadgeClass,
    documents,
    documentsLoading,
    docUploading,
    uploadProgress,
    docDeleteTarget,
    docDeleting,
    docMessage,
    docMessageType,
    handleDocumentFileSelect,
    handleDownloadDocument,
    setDocDeleteTarget,
    cancelDocDelete,
    handleDeleteDocument,
    formatFileSize,
    comments,
    commentsLoading,
    commentText,
    setCommentText,
    commentSubmitting,
    commentDeleteTarget,
    commentDeleting,
    commentMessage,
    commentMessageType,
    handleCommentSubmit,
    setCommentDeleteTarget,
    cancelCommentDelete,
    handleDeleteComment
  } = props;

  const [activeModule, setActiveModule] = useState("overview");

  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);

  const decisionIdForAudit =
    selectedDecision?.decision_id || null;

  useEffect(() => {
    if (!decisionIdForAudit) return;
    let cancelled = false;
    const token = localStorage.getItem("access_token");
    if (!token) return undefined;
    setAuditLogsLoading(true);
    fetch(`${API_BASE_URL}/audit-logs/decision/${decisionIdForAudit}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!cancelled) setAuditLogs(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setAuditLogs([]);
      })
      .finally(() => {
        if (!cancelled) setAuditLogsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [decisionIdForAudit]);

  if (!selectedDecision) {
    return null;
  }

  const modules = [
    { key: "overview", label: "Overview", icon: "📋" },
    { key: "alternatives", label: "Alternatives", icon: "⚖️" },
    { key: "documents", label: "Documents", icon: "📎" },
    { key: "discussion", label: "Discussion", icon: "💬" },
    { key: "history", label: "History", icon: "🕓" },
    { key: "audit", label: "Audit History", icon: "🧾" }
  ];

  const d = selectedDecision;

  const history = d.history || [];

  const approvals = d.approvals || [];

  const workflowSteps = [
    { key: "draft", label: "Draft" },
    { key: "submit", label: "Submit for Review" },
    { key: "under-review", label: "Under Review" },
    { key: "reviewer", label: "Reviewer Approval" },
    { key: "manager", label: "Manager Approval" },
    { key: "decision", label: "Approved / Rejected" },
    { key: "archived", label: "Archived" }
  ];

  const statusIndex = {
    "Draft": 0,
    "Under Review": 2,
    "Reviewer Approved": 3,
    "Approved": 5,
    "Rejected": 5,
    "Archived": 6
  };

  const currentStep = typeof statusIndex[d.status] === "number"
    ? statusIndex[d.status]
    : 0;

  const latestRejection =
    approvals.find((a) =>
      (a.action || "").toLowerCase().includes("reject")
    ) || {};

  const rejectionReason =
    latestRejection.reason || null;

  const alternatives = d.alternatives || [];

  const selectedAlt = alternatives.find(
    (a) => a.is_recommended
  );

  const documents2 = documents || [];

  const comments2 = comments || [];

  return (
    <div className="dash-layout">

      <AppSidebar
        activePage="decisions"
        navigateTo={navigateTo}
        handleLogout={handleLogout}
      />

      <main className="dash-main">

        <header className="dash-header">

          <div>
            <h2 className="dash-header-title">
              Decision Details
            </h2>
            <p className="dash-header-sub">
              Decision #{selectedDecision?.decision_id}
            </p>
          </div>

          <div className="dash-header-right">
            <NotificationBell navigateTo={navigateTo} />
            <button
              className="nav-button"
              onClick={() => navigateTo("home")}
            >
              &#8962; Back to Dashboard
            </button>
            <button
              className="nav-button"
              onClick={navigateBack}
            >
              &larr; Back
            </button>
            <div className="dash-header-user">
              <div className="dash-avatar">
                {(user?.name || "U").charAt(0).toUpperCase()}
              </div>
              <div className="dash-user-info">
                <div className="dash-user-name">
                  {user?.name}
                </div>
                <div className="dash-user-role">
                  {getRoleName(user?.role_id)}
                </div>
              </div>
            </div>
          </div>

        </header>

        <section className="dash-card">

          <div className="dash-card-header" style={{ marginBottom: "0" }}>
            <div style={{ minWidth: 0 }}>
              <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                {d.title}
              </h4>
              <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "12px" }}>
                Decision #{d.decision_id}
              </p>
            </div>
          </div>

          <div style={{ height: "1px", background: "#e5e7eb", margin: "12px 0 16px" }}></div>

          <section className="detail-card approval-workflow-card">

            <div className="detail-card-title">
              Approval Workflow
            </div>

            {d.status === "Rejected" && rejectionReason && (
              <div className="wf-reject-reason">
                <strong>Rejection Reason:</strong>{" "}
                {rejectionReason}
              </div>
            )}

            <div className="workflow-steps">
              {workflowSteps.map((s, i) => (
                <>
                  <div
                    className={
                      "wf-step" +
                      (i < currentStep ? " done" : "") +
                      (i === currentStep ? " active" : "") +
                      (i === currentStep && d.status === "Rejected"
                        ? " rejected"
                        : "") +
                      (i > currentStep ? " wait" : "")
                    }
                  >
                    <div className="wf-dot">
                      {i < currentStep ? "✓" : i + 1}
                    </div>
                    <div className="wf-step-label">
                      {s.label}
                    </div>
                  </div>
                  {i < workflowSteps.length - 1 && (
                    <div
                      className={
                        "wf-arrow" +
                        (i < currentStep ? " done" : "")
                      }
                    >
                      →
                    </div>
                  )}
                </>
              ))}
            </div>

            <div className="detail-actions">

              {d.status === "Draft" && (
              (user?.user_id === d.expert_id ||
              [3, 4].includes(user?.role_id)) ? (
              <button
                className="primary-button action-limited submit-for-review-btn"
                onClick={() => setSubmitTarget(d)}
              >
                Submit for Review
              </button>
              ) : (
              <span className="workflow-hint">
                Draft — awaiting submission
              </span>
              )
              )}

              {d.status === "Under Review" && (
              <>
                {user?.role_id === 2 ? (
                  <>
                    <button
                      className="primary-button action-limited approve-btn"
                      onClick={() =>
                        handleReviewDecision(d, "approve")
                      }
                    >
                      Approve
                    </button>

                    <button
                      className="danger-button action-limited"
                      onClick={() => {
                        setReviewTarget(d);
                        setReviewStep("reviewer");
                        setRejectReason("");
                      }}
                    >
                      Reject
                    </button>
                  </>
                ) : (
                  <span className="workflow-hint">
                    Waiting for Reviewer Review
                  </span>
                )}
              </>
              )}

              {d.status === "Reviewer Approved" && (
              <>
                {user?.role_id === 3 ? (
                  <>
                    <button
                      className="primary-button action-limited approve-btn"
                      onClick={() =>
                        handleManagerReviewDecision(d, "approve")
                      }
                    >
                      Approve
                    </button>

                    <button
                      className="danger-button action-limited"
                      onClick={() => {
                        setReviewTarget(d);
                        setReviewStep("manager");
                        setRejectReason("");
                      }}
                    >
                      Reject
                    </button>
                  </>
                ) : (
                  <span className="workflow-hint">
                    Waiting for Manager Approval
                  </span>
                )}
              </>
              )}

              {d.status === "Approved" && (
              <button
                className="primary-button action-limited archive-btn"
                onClick={() => setArchiveTarget(d)}
              >
                Archive Decision
              </button>
              )}

              <button
                className="primary-button action-limited"
                onClick={() => openEditDecision(d)}
              >
                Edit Decision
              </button>

              {d.status !== "Archived" && (
              <button
                className="danger-button action-limited"
                onClick={() => setDeleteTarget(d)}
              >
                {d.status === "Draft" ||
                d.status === "Under Review" ||
                d.status === "Reviewer Approved" ||
                d.status === "Rejected"
                  ? "Delete Decision"
                  : "Archive Decision"}
              </button>
              )}

            </div>

            <div className="detail-card-title workflow-history-title">
              Approval History
            </div>

            {approvals.length === 0 ? (
              <div className="detail-card-body">
                No approval activity recorded.
              </div>
            ) : (
              <div className="table-wrap">
                <table className="decisions-table">
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Role</th>
                      <th>User</th>
                      <th>Date / Time</th>
                      <th>Rejection Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvals.map((entry) => (
                      <tr key={entry.approval_id}>
                        <td>
                          <span
                            className={statusBadgeClass(
                              entry.action
                            )}
                          >
                            {entry.action}
                          </span>
                        </td>
                        <td>
                          {entry.role_name || "—"}
                        </td>
                        <td>
                          {entry.user_name ||
                            `User #${entry.user_id}`}
                        </td>
                        <td>
                          {formatDate(entry.created_at)}
                        </td>
                        <td>
                          {entry.reason || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </section>

          {/* SUPPORTING DOCUMENTS (always visible on view page) */}

          <section className="detail-card documents-card">

            <div className="detail-card-title">
              📎 Supporting Documents
            </div>

            <p className="alt-section-sub">
              Supporting documents / papers uploaded for this decision
            </p>

            {docMessage && (
              <div
                className={`message ${docMessageType}`}
              >
                {docMessage}
              </div>
            )}

            {documentsLoading ? (

              <div className="detail-card-body">
                Loading documents...
              </div>

            ) : documents2.length === 0 ? (

              <div className="detail-card-body">
                No supporting documents attached to this decision.
              </div>

            ) : (

              <div className="doc-list">

                {documents2.map((doc) => {

                  const fileType = (doc.file_type || "")
                    .toLowerCase();

                  const isImage = fileType.startsWith(
                    "image/"
                  );

                  const isPdf = fileType === "application/pdf";

                  const isText = fileType.startsWith("text/");

                  const fileLabel = (doc.original_file_name || "")
                    .split(".")
                    .pop()
                    .toUpperCase();

                  return (
                    <div
                      className="doc-item"
                      key={doc.document_id}
                    >

                      <div className="doc-icon">
                        {isImage ? "🖼️" : isPdf ? "📄" : "📎"}
                      </div>

                      <div className="doc-info">

                        <div className="doc-name">
                          {doc.original_file_name}
                        </div>

                        <div className="doc-meta">
                          <span>
                            {fileLabel || doc.file_type || "File"}
                          </span>
                          <span>·</span>
                          <span>
                            {formatFileSize(doc.file_size)}
                          </span>
                          <span>·</span>
                          <span>
                            {formatDate(doc.uploaded_at)}
                          </span>
                        </div>

                      </div>

                      <div className="doc-actions">

                        <button
                          className="doc-action-btn"
                          onClick={() =>
                            handleDownloadDocument(doc, true)
                          }
                        >
                          {isImage || isPdf || isText
                            ? "View"
                            : "Open"}
                        </button>

                        <button
                          className="doc-action-btn"
                          onClick={() =>
                            handleDownloadDocument(doc, false)
                          }
                        >
                          Download
                        </button>

                      </div>

                    </div>
                  );
                })}

              </div>
            )}

          </section>

          <nav className="module-nav">

            {modules.map((mod) => (
              <button
                key={mod.key}
                className={
                  activeModule === mod.key
                    ? "module-nav-btn active"
                    : "module-nav-btn"
                }
                onClick={() => setActiveModule(mod.key)}
              >
                <span className="module-nav-icon">
                  {mod.icon}
                </span>

                <span>{mod.label}</span>
              </button>
            ))}

          </nav>

          {activeModule === "overview" &&
            overviewMessage && (
            <div className={`message ${overviewMessageType}`}>
              {overviewMessage}
            </div>
          )}

          {activeModule === "overview" && (
          <>
          {/* BASIC INFORMATION */}

          <div className="detail-card">

            <div className="detail-card-title">
              Basic Information
            </div>

            <div className="detail-grid">

              <div className="info-card">

                <span>
                  Decision ID
                </span>

                <strong>
                  {d.decision_id}
                </strong>

              </div>

              <div className="info-card">

                <span>
                  Owner
                </span>

                <strong>
                  {d.expert_name ||
                    `User #${d.expert_id}`}
                </strong>

              </div>

              <div className="info-card">

                <span>
                  Expert
                </span>

                <strong>
                  {d.assigned_name ||
                    d.expert_name ||
                    "Not assigned"}
                </strong>

              </div>

              <div className="info-card">

                <span>
                  Team
                </span>

                <strong>
                  {d.team_name || "Not assigned"}
                </strong>

              </div>

              <div className="info-card">

                <span>
                  Decision Date
                </span>

                <strong>
                  {formatDate(d.decision_date)}
                </strong>

              </div>

              <div className="info-card">

                <span>
                  Priority
                </span>

                <strong>
                  {d.priority || "Medium"}
                </strong>

              </div>

              <div className="info-card">

                <span>
                  Implementation Status
                </span>

                <strong>
                  {d.implementation_status ||
                    "Not Started"}
                </strong>

              </div>

            </div>

          </div>

          {/* PROBLEM STATEMENT */}

          <div className="detail-card">

            <div className="detail-card-title">
              Problem Statement
            </div>

            <div className="detail-card-body">
              {d.problem_statement ||
                "No problem statement provided."}
            </div>

          </div>

          {/* DECISION CONTEXT */}

          <div className="detail-card">

            <div className="detail-card-title">
              Decision Context
            </div>

            <div className="detail-card-body">
              {d.decision_context ||
                "No decision context provided."}
            </div>

          </div>

          {/* DESCRIPTION & OBJECTIVE */}

          {d.description && (
            <div className="detail-card">

              <div className="detail-card-title">
                Description
              </div>

              <div className="detail-card-body">
                {d.description}
              </div>

            </div>
          )}

          {d.objective && (
            <div className="detail-card">

              <div className="detail-card-title">
                Objective
              </div>

              <div className="detail-card-body">
                {d.objective}
              </div>

            </div>
          )}

          {/* ANALYSIS / EVALUATION CRITERIA */}

          {d.evaluation_criteria && (
            <div className="detail-card">

              <div className="detail-card-title">
                Analysis
              </div>

              <div className="detail-card-body">
                {d.evaluation_criteria}
              </div>

            </div>
          )}

          {/* RISKS */}

          {d.risks && (
            <div className="detail-card">

              <div className="detail-card-title">
                Risk
              </div>

              <div className="detail-card-body">
                {d.risks}
              </div>

            </div>
          )}

          {/* STAKEHOLDERS */}

          {d.stakeholders && (
            <div className="detail-card">

              <div className="detail-card-title">
                Stakeholders
              </div>

              <div className="detail-card-body">
                {d.stakeholders}
              </div>

            </div>
          )}

          {/* RATIONALE */}

          {d.rationale && (
            <div className="detail-card">

              <div className="detail-card-title">
                Rationale
              </div>

              <div className="detail-card-body">
                {d.rationale}
              </div>

            </div>
          )}

          {/* OUTCOME */}

          {d.final_outcome && (
            <div className="detail-card">

              <div className="detail-card-title">
                Outcome
              </div>

              <div className="detail-card-body">
                {d.final_outcome}
              </div>

            </div>
          )}

          </>
          )}

          {activeModule === "alternatives" && (
          <div className="detail-card alt-analysis-card">

            <div className="alt-section-head">

              <div className="detail-card-title">
                Alternative Analysis / Comparison
              </div>

              <button
                className="primary-button action-limited"
                onClick={openAddAlternative}
              >
                Add Alternative
              </button>

            </div>

            {altSectionMessage && (
              <div className={`message ${altSectionMessageType}`}>
                {altSectionMessage}
              </div>
            )}

            {selectedAlt ? (
              <div className="selected-alt-banner">
                <span className="selected-alt-check">
                  ✓
                </span>

                <span>
                  <strong>Selected Alternative:</strong>{" "}
                  {selectedAlt.title}
                </span>
              </div>
            ) : (
              <div className="no-selected-alt">
                No alternative selected yet.
              </div>
            )}

            {alternatives.length === 0 ? (

              <div className="detail-card-body">
                No alternatives yet. Add alternatives to compare
                pros, cons, cost, feasibility and risk.
              </div>

            ) : (

              <div className="comparison-wrap">

                <table className="comparison-table">

                  <thead>

                    <tr>

                      <th className="comp-criteria">
                        Criteria
                      </th>

                      {alternatives.map((alt) => (
                        <th
                          key={alt.alternative_id}
                          className={
                            alt.is_recommended
                              ? "comp-rec"
                              : ""
                          }
                        >
                          <div className="comp-alt-title">
                            <span>{alt.title}</span>

                            {alt.is_recommended && (
                              <span className="rec-tag">
                                Recommended
                              </span>
                            )}
                          </div>

                          <div className="comp-alt-meta">
                            by {alt.created_by_name || "Unknown"}
                          </div>
                        </th>
                      ))}

                    </tr>

                  </thead>

                  <tbody>

                    <tr>

                      <td className="comp-criteria">Description</td>

                      {alternatives.map((alt) => (
                        <td key={alt.alternative_id}>
                          {alt.description || "—"}
                        </td>
                      ))}

                    </tr>

                    <tr>

                      <td className="comp-criteria">Pros</td>

                      {alternatives.map((alt) => (
                        <td key={alt.alternative_id}>
                          <span className="comp-pros">
                            {alt.pros || "—"}
                          </span>
                        </td>
                      ))}

                    </tr>

                    <tr>

                      <td className="comp-criteria">Cons</td>

                      {alternatives.map((alt) => (
                        <td key={alt.alternative_id}>
                          <span className="comp-cons">
                            {alt.cons || "—"}
                          </span>
                        </td>
                      ))}

                    </tr>

                    <tr>

                      <td className="comp-criteria">
                        Estimated Cost
                      </td>

                      {alternatives.map((alt) => (
                        <td key={alt.alternative_id}>
                          <strong>
                            {formatCost(alt.estimated_cost)}
                          </strong>
                        </td>
                      ))}

                    </tr>

                    <tr>

                      <td className="comp-criteria">
                        Feasibility
                      </td>

                      {alternatives.map((alt) => (
                        <td key={alt.alternative_id}>
                          {alt.feasibility ? (
                            <span
                              className={levelBadgeClass(
                                alt.feasibility
                              )}
                            >
                              {alt.feasibility}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                      ))}

                    </tr>

                    <tr>

                      <td className="comp-criteria">
                        Risk Assessment
                      </td>

                      {alternatives.map((alt) => (
                        <td key={alt.alternative_id}>
                          {alt.risk_level ? (
                            <span
                              className={levelBadgeClass(
                                alt.risk_level
                              )}
                            >
                              {alt.risk_level}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                      ))}

                    </tr>

                    <tr>

                      <td className="comp-criteria">
                        Risk Explanation
                      </td>

                      {alternatives.map((alt) => (
                        <td key={alt.alternative_id}>
                          {alt.risk_explanation || "—"}
                        </td>
                      ))}

                    </tr>

                    <tr className="comp-actions-row">

                      <td className="comp-criteria">Actions</td>

                      {alternatives.map((alt) => (
                        <td key={alt.alternative_id}>

                          <div className="comp-actions">

                            <button
                              className="comp-action-btn"
                              onClick={() =>
                                openViewAlternative(alt)
                              }
                            >
                              View
                            </button>

                            <button
                              className="comp-action-btn"
                              onClick={() =>
                                openEditAlternative(alt)
                              }
                            >
                              Edit
                            </button>

                            {alt.is_recommended ? (
                              <button
                                className="comp-action-btn comp-clear"
                                onClick={() =>
                                  handleSelectAlternative(
                                    alt,
                                    false
                                  )
                                }
                                disabled={altWorking}
                              >
                                {altWorking
                                  ? "Working..."
                                  : "Unmark"}
                              </button>
                            ) : (
                              <button
                                className="comp-action-btn comp-select"
                                onClick={() =>
                                  handleSelectAlternative(
                                    alt,
                                    true
                                  )
                                }
                                disabled={altWorking}
                              >
                                {altWorking
                                  ? "Working..."
                                  : "Select"}
                              </button>
                            )}

                            <button
                              className="comp-action-btn comp-delete"
                              onClick={() =>
                                setAltDeleteTarget(alt)
                              }
                            >
                              Delete
                            </button>

                          </div>

                        </td>
                      ))}

                    </tr>

                  </tbody>

                </table>

              </div>

            )}

          </div>
          )}

          {activeModule === "overview" && (
          <>
          {/* EVALUATION CRITERIA */}

          {d.evaluation_criteria && (
            <div className="detail-card">

              <div className="detail-card-title">
                Evaluation Criteria
              </div>

              <div className="detail-card-body">
                {d.evaluation_criteria}
              </div>

            </div>
          )}

          {/* RISKS */}

          {d.risks && (
            <div className="detail-card">

              <div className="detail-card-title">
                Risks
              </div>

              <div className="detail-card-body">
                {d.risks}
              </div>

            </div>
          )}

          {/* STAKEHOLDERS */}

          {d.stakeholders && (
            <div className="detail-card">

              <div className="detail-card-title">
                Stakeholders
              </div>

              <div className="detail-card-body">
                {d.stakeholders}
              </div>

            </div>
          )}

          {/* FINAL OUTCOME */}

          <div className="detail-card">

            <div className="detail-card-title">
              Final Decision / Outcome
            </div>

            <div className="detail-card-body">
              {d.final_outcome ||
                "No final outcome recorded yet."}
            </div>

          </div>

          {/* RATIONALE */}

          {d.rationale && (
            <div className="detail-card">

              <div className="detail-card-title">
                Rationale
              </div>

              <div className="detail-card-body">
                {d.rationale}
              </div>

            </div>
          )}

          </>
          )}

          {activeModule === "documents" && (
          <div className="detail-card documents-card">

            <div className="alt-section-head">

              <div className="alt-section-head-text">

                <div className="detail-card-title">
                  📎 Documents / Attachments
                </div>

                <p className="alt-section-sub">
                  Supporting documents attached to this decision
                </p>

              </div>

            </div>

            {docMessage && (
              <div
                className={`message ${docMessageType}`}
              >
                {docMessage}
              </div>
            )}

            <div className="doc-upload-area">

              <input
                type="file"
                id="document-upload-input"
                className="doc-upload-input"
                onChange={handleDocumentFileSelect}
                disabled={docUploading}
              />

              <label
                htmlFor="document-upload-input"
                className="doc-upload-label"
              >
                <span className="doc-upload-icon">📤</span>

                <span className="doc-upload-text">
                  {docUploading
                    ? `Uploading... ${uploadProgress}%`
                    : "Choose a file to attach"}
                </span>

                <span className="doc-upload-hint">
                  PDF, images, documents, spreadsheets (max 15 MB)
                </span>

              </label>

              {docUploading && (
                <div className="doc-progress">

                  <div
                    className="doc-progress-bar"
                    style={{
                      width: `${uploadProgress}%`
                    }}
                  ></div>

                </div>
              )}

            </div>

            {documentsLoading ? (

              <div className="detail-card-body">
                Loading documents...
              </div>

            ) : documents2.length === 0 ? (

              <div className="detail-card-body">
                No documents attached yet. Use the upload area above
                to attach files.
              </div>

            ) : (

              <div className="doc-list">

                {documents2.map((doc) => {

                  const canDelete = true;

                  return (
                    <div
                      className="doc-item"
                      key={doc.document_id}
                    >

                      <div className="doc-icon">📄</div>

                      <div className="doc-info">

                        <div className="doc-name">
                          {doc.original_file_name}
                        </div>

                        <div className="doc-meta">
                          <span>{doc.file_type || "File"}</span>
                          <span>·</span>
                          <span>
                            {formatFileSize(doc.file_size)}
                          </span>
                          <span>·</span>
                          <span>
                            by{" "}
                            {doc.uploaded_by_name ||
                              `User #${doc.uploaded_by}`}
                          </span>
                          <span>·</span>
                          <span>
                            {formatDate(doc.uploaded_at)}
                          </span>
                        </div>

                      </div>

                      <div className="doc-actions">

                        <button
                          className="doc-action-btn"
                          onClick={() =>
                            handleDownloadDocument(doc, true)
                          }
                        >
                          Open
                        </button>

                        <button
                          className="doc-action-btn"
                          onClick={() =>
                            handleDownloadDocument(doc, false)
                          }
                        >
                          Download
                        </button>

                        {canDelete && (
                          <button
                            className="doc-action-btn doc-delete"
                            onClick={() =>
                              setDocDeleteTarget(doc)
                            }
                          >
                            Delete
                          </button>
                        )}

                      </div>

                    </div>
                  );
                })}

              </div>

            )}

          </div>
          )}

          {activeModule === "overview" && (
          <>
          {/* IMPLEMENTATION STATUS */}

          <div className="detail-card">

            <div className="detail-card-title">
              Implementation Status
            </div>

            <div className="detail-card-body">

              <span
                className={`status-badge status-${(d.implementation_status || "not-started").toLowerCase().replace(/\s+/g, "-")}`}
              >
                {d.implementation_status ||
                  "Not Started"}
              </span>

            </div>

          </div>
          </>
          )}

          {/* DISCUSSION MODULE */}

          {activeModule === "discussion" && (
          <div className="detail-card discussion-card">

            <div className="alt-section-head">
              <div className="alt-section-head-text">
                <div className="detail-card-title">
                  💬 Discussion
                </div>
                <p className="alt-section-sub">
                  Team conversation and commentary on this decision
                </p>
              </div>
            </div>

            {commentMessage && (
              <div
                className={`message ${commentMessageType}`}
              >
                {commentMessage}
              </div>
            )}

            <form
              className="comment-form"
              onSubmit={handleCommentSubmit}
            >
              <textarea
                rows="3"
                placeholder="Write a comment or update for the team..."
                value={commentText}
                onChange={(e) =>
                  setCommentText(e.target.value)
                }
              ></textarea>

              <button
                type="submit"
                className="primary-button action-limited"
                disabled={commentSubmitting}
              >
                {commentSubmitting
                  ? "Posting..."
                  : "Post Comment"}
              </button>
            </form>

            {commentsLoading ? (
              <div className="detail-card-body">
                Loading discussion...
              </div>
            ) : comments2.length === 0 ? (
              <div className="detail-card-body">
                No discussion yet. Start the conversation by posting a
                comment above.
              </div>
            ) : (
              <div className="comment-list">
                {comments2.map((comment) => {
                  const canDelete =
                    (user &&
                      Number(user.role_id) === 4) ||
                    (user &&
                      Number(user.user_id) ===
                        Number(d.expert_id)) ||
                    (user &&
                      Number(user.user_id) ===
                        Number(comment.user_id));

                  return (
                    <div
                      className="comment-item"
                      key={comment.comment_id}
                    >
                      <div className="comment-avatar">
                        {(comment.author_name || "?")
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="comment-body">
                        <div className="comment-head">
                          <strong>
                            {comment.author_name ||
                              `User #${comment.user_id}`}
                          </strong>

                          <span>
                            {formatDate(comment.created_at)}
                          </span>
                        </div>

                        <p className="comment-content">
                          {comment.content}
                        </p>

                        {canDelete && (
                          <div className="comment-actions">
                            <button
                              className="comment-delete-btn"
                              onClick={() =>
                                setCommentDeleteTarget(comment)
                              }
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
          )}

          {/* DECISION HISTORY */}

          {activeModule === "history" && (
          <div className="detail-card">

            <div className="detail-card-title">
              Decision History
            </div>

            {history.length === 0 ? (
              <div className="detail-card-body">
                No history recorded.
              </div>
            ) : (
              <div className="timeline">

                {history.map((entry) => (
                  <div
                    className="timeline-item"
                    key={entry.version_id}
                  >
                    <div className="timeline-dot"></div>

                    <div className="timeline-content">

                      <div className="timeline-head">

                        <strong>
                          v{entry.version_number}
                        </strong>

                        <span>
                          {formatDate(entry.changed_at)}
                        </span>

                      </div>

                      <p>
                        {entry.change_summary}
                      </p>

                      <span className="timeline-user">
                        by {entry.changed_by_name ||
                          `User #${entry.changed_by}`}
                      </span>

                    </div>

                  </div>
                ))}

              </div>
            )}

          </div>
          )}

          {/* APPROVAL HISTORY (now shown in the Approval Workflow card) */}

          {/* AUDIT HISTORY */}

          {activeModule === "audit" && (
          <div className="detail-card">

            <div className="detail-card-title">
              Audit History
            </div>

            {auditLogsLoading ? (
              <div className="detail-card-body">
                Loading audit history...
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="detail-card-body">
                No audit records recorded for this decision yet.
              </div>
            ) : (
              <div className="audit-history-list">

                {auditLogs.map((log) => {
                  const labelMap = {
                    "DECISION_CREATED": "Decision Created",
                    "DECISION_SUBMITTED_FOR_REVIEW": "Submitted for Review",
                    "REVIEWER_APPROVED": "Reviewer Approved",
                    "REVIEWER_REJECTED": "Reviewer Rejected",
                    "MANAGER_APPROVED": "Manager Approved",
                    "MANAGER_REJECTED": "Manager Rejected",
                    "DECISION_ARCHIVED": "Decision Archived",
                    "DECISION_UPDATED": "Decision Updated",
                    "DOCUMENT_UPLOADED": "Document Uploaded",
                    "DOCUMENT_DELETED": "Document Deleted"
                  };

                  return (
                    <div
                      className="audit-history-item"
                      key={log.log_id}
                    >
                      <div className="audit-history-marker">
                        &#10003;
                      </div>
                      <div className="audit-history-line"></div>
                      <div className="audit-history-body">
                        <div className="audit-history-action">
                          {labelMap[log.action] || log.action}
                        </div>
                        <div className="audit-history-user">
                          {log.user_name || log.user_email ||
                            `User #${log.user_id}`}
                        </div>
                        <div className="audit-history-meta">
                          {log.created_at
                            ? formatDate(log.created_at)
                            : ""}
                        </div>
                        {log.description && (
                          <div className="audit-history-details">
                            {log.description}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

              </div>
            )}

          </div>
          )}

        </section>

      </main>

      {deleteTarget && (
        <ConfirmDialog
          title={
            deleteTarget.status === "Draft" ||
            deleteTarget.status === "Under Review" ||
            deleteTarget.status === "Reviewer Approved" ||
            deleteTarget.status === "Rejected"
              ? "Delete Decision"
              : "Archive Decision"
          }
          message={
            deleteTarget.status === "Draft" ||
            deleteTarget.status === "Under Review" ||
            deleteTarget.status === "Reviewer Approved" ||
            deleteTarget.status === "Rejected"
              ? `Are you sure you want to delete "${deleteTarget.title}"? This action cannot be undone.`
              : `Are you sure you want to archive "${deleteTarget.title}"? The decision will be kept in history but no longer appear as an active decision.`
          }
          confirmLabel={
            deleteTarget.status === "Draft" ||
            deleteTarget.status === "Under Review" ||
            deleteTarget.status === "Reviewer Approved" ||
            deleteTarget.status === "Rejected"
              ? "Delete"
              : "Archive"
          }
          cancelLabel="Cancel"
          isBusy={isDeleting}
          onConfirm={() =>
            handleDeleteDecision(deleteTarget)
          }
          onCancel={cancelDelete}
        />
      )}

      {submitTarget && (
        <ConfirmDialog
          title="Submit for Review"
          message={`Are you sure you want to submit "${submitTarget.title}" for review?`}
          confirmLabel="Submit"
          cancelLabel="Cancel"
          isBusy={isSubmitting}
          onConfirm={() =>
            handleSubmitForReview(submitTarget)
          }
          onCancel={() => setSubmitTarget(null)}
        />
      )}

      {archiveTarget && (
        <ConfirmDialog
          title="Archive Decision"
          message={`Are you sure you want to archive "${archiveTarget.title}"? The decision will be kept in history but will no longer appear as an active decision.`}
          confirmLabel="Archive"
          cancelLabel="Cancel"
          isBusy={isArchiving}
          onConfirm={() =>
            handleArchiveDecision(archiveTarget)
          }
          onCancel={() => setArchiveTarget(null)}
        />
      )}

      {reviewTarget && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Reject Decision</h3>
            <p>
              Provide a rejection reason for
              &ldquo;{reviewTarget.title}&rdquo;.
            </p>
            <textarea
              className="reason-input"
              rows="3"
              placeholder="Rejection reason (required)"
              value={rejectReason}
              onChange={(e) =>
                setRejectReason(e.target.value)
              }
            ></textarea>
            <div className="modal-actions">
              <button
                className="secondary-button action-limited"
                onClick={() => {
                  setReviewTarget(null);
                  setRejectReason("");
                }}
                disabled={isReviewing}
              >
                Cancel
              </button>
              <button
                className="danger-button action-limited"
                onClick={() =>
                  reviewStep === "manager"
                    ? handleManagerReviewDecision(
                        reviewTarget,
                        "reject",
                        rejectReason
                      )
                    : handleReviewDecision(
                        reviewTarget,
                        "reject",
                        rejectReason
                      )
                }
                disabled={
                  isReviewing || !rejectReason.trim()
                }
              >
                {isReviewing ? "Rejecting..." : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {altDeleteTarget && (
        <ConfirmDialog
          title="Delete Alternative"
          message={`Are you sure you want to delete the alternative "${altDeleteTarget.title}"? This cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          isBusy={altIsDeleting}
          onConfirm={handleDeleteAlternative}
          onCancel={cancelAltDelete}
        />
      )}

      {docDeleteTarget && (
        <ConfirmDialog
          title="Delete Document"
          message={`Are you sure you want to delete the document "${docDeleteTarget.original_file_name}"? The file will be permanently removed.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          isBusy={docDeleting}
          onConfirm={handleDeleteDocument}
          onCancel={cancelDocDelete}
        />
      )}

      {commentDeleteTarget && (
        <ConfirmDialog
          title="Delete Comment"
          message={`Are you sure you want to delete this comment? This cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          isBusy={commentDeleting}
          onConfirm={handleDeleteComment}
          onCancel={cancelCommentDelete}
        />
      )}

      <AlternativeModal
        mode={altModalMode}
        form={altForm}
        setField={setAltField}
        onClose={closeAltModal}
        onSave={handleSaveAlternative}
        saving={altSaving}
        message={altMessage}
        messageType={altMessageType}
        formatCost={formatCost}
      />

    </div>
  );
};

// ==========================================
// EDIT DECISION PAGE
// ==========================================

const EditDecisionPage = (props) => {
  const {
    user,
    getRoleName,
    navigateTo,
    navigateBack,
    selectedDecision,
    decisionTitle,
    decisionDescription,
    decisionContext,
    decisionProblem,
    decisionObjective,
    decisionCriteria,
    decisionRisks,
    decisionStakeholders,
    decisionRationale,
    decisionOutcome,
    decisionImplementationStatus,
    decisionPriority,
    decisionDate,
    decisionAlternatives,
    decisionMessage,
    decisionMessageType,
    decisionsLoading,
    setDecisionTitle,
    setDecisionDescription,
    setDecisionContext,
    setDecisionProblem,
    setDecisionObjective,
    setDecisionCriteria,
    setDecisionRisks,
    setDecisionStakeholders,
    setDecisionRationale,
    setDecisionOutcome,
    setDecisionImplementationStatus,
    setDecisionPriority,
    setDecisionDate,
    setDecisionAlternatives,
    handleUpdateDecision,
    handleLogout,
    documents,
    documentsLoading,
    docUploading,
    uploadProgress,
    docDeleteTarget,
    docDeleting,
    docMessage,
    docMessageType,
    handleDocumentFileSelect,
    handleDownloadDocument,
    setDocDeleteTarget,
    cancelDocDelete,
    handleDeleteDocument,
    formatFileSize
  } = props;

  if (!selectedDecision) {
    return null;
  }

  const updateAlternative = (index, field, value) => {
    setDecisionAlternatives((prev) => {
      const next = prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      );

      return next;
    });
  };

  const addAlternative = () => {
    setDecisionAlternatives((prev) => [
      ...prev,
      {
        title: "",
        description: "",
        pros: "",
        cons: "",
        estimated_cost: "",
        feasibility: "Medium",
        risk_level: "Medium",
        risk_explanation: ""
      }
    ]);
  };

  const removeAlternative = (index) => {
    setDecisionAlternatives((prev) =>
      prev.filter((item, i) => i !== index)
    );
  };

  const label = (text, required) => (
    <label>
      {text}

      {required && (
        <span className="required-star">*</span>
      )}
    </label>
  );

  return (
    <div className="dash-layout">

      <AppSidebar
        activePage="decisions"
        navigateTo={navigateTo}
        handleLogout={handleLogout}
      />

      <main className="dash-main">

        <header className="dash-header">

          <div>
            <h2 className="dash-header-title">
              Edit Decision
            </h2>
            <p className="dash-header-sub">
              Decision #{selectedDecision.decision_id}
            </p>
          </div>

          <div className="dash-header-right">
            <NotificationBell navigateTo={navigateTo} />
            <button
              className="nav-button"
              onClick={navigateBack}
            >
              &larr; Back
            </button>
            <div className="dash-header-user">
              <div className="dash-avatar">
                {(user?.name || "U").charAt(0).toUpperCase()}
              </div>
              <div className="dash-user-info">
                <div className="dash-user-name">
                  {user?.name}
                </div>
                <div className="dash-user-role">
                  {getRoleName(user?.role_id)}
                </div>
              </div>
            </div>
          </div>

        </header>

        <section className="dash-card">

          <div className="dash-card-header" style={{ marginBottom: "0" }}>
            <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
              Edit Decision #{selectedDecision.decision_id}
            </h4>
          </div>

          <div style={{ height: "1px", background: "#e5e7eb", margin: "12px 0 16px" }}></div>

          <div className="decision-form-box">

            <form onSubmit={handleUpdateDecision}>

              <div className="form-section-title">
                Basic Information
              </div>

              <div className="form-group">

                {label("Decision Title", true)}

                <input
                  type="text"
                  placeholder="Enter decision title"
                  value={decisionTitle}
                  onChange={(e) =>
                    setDecisionTitle(e.target.value)
                  }
                />

              </div>

              <div className="form-group">

                {label("Problem Statement", true)}

                <textarea
                  rows="4"
                  placeholder="Describe the problem this decision addresses"
                  value={decisionProblem}
                  onChange={(e) =>
                    setDecisionProblem(e.target.value)
                  }
                >
                </textarea>

              </div>

              <div className="form-group">

                {label("Decision Context")}

                <textarea
                  rows="4"
                  placeholder="Background and circumstances around the decision"
                  value={decisionContext}
                  onChange={(e) =>
                    setDecisionContext(e.target.value)
                  }
                >
                </textarea>

              </div>

              <div className="form-group">

                {label("Description")}

                <textarea
                  rows="3"
                  placeholder="Short description"
                  value={decisionDescription}
                  onChange={(e) =>
                    setDecisionDescription(e.target.value)
                  }
                >
                </textarea>

              </div>

              <div className="form-group">

                {label("Objective")}

                <textarea
                  rows="3"
                  placeholder="What the decision aims to achieve"
                  value={decisionObjective}
                  onChange={(e) =>
                    setDecisionObjective(e.target.value)
                  }
                >
                </textarea>

              </div>

              <div className="form-section-title">
                Analysis
              </div>

              <div className="form-group">

                {label("Alternatives Considered")}

                {decisionAlternatives.length === 0 ? (
                  <div className="empty-state small">
                    No alternatives added yet.
                  </div>
                ) : (
                  <div className="alt-list">

                    {decisionAlternatives.map((alt, index) => (
                      <div
                        className="alt-item"
                        key={index}
                      >

                        <div className="alt-item-head">

                          <strong>
                            Alternative {index + 1}
                          </strong>

                          <button
                            type="button"
                            className="alt-remove"
                            onClick={() =>
                              removeAlternative(index)
                            }
                          >
                            Remove
                          </button>

                        </div>

                        <div className="form-group">

                          {label("Title")}

                          <input
                            type="text"
                            placeholder="Alternative title"
                            value={alt.title}
                            onChange={(e) =>
                              updateAlternative(
                                index,
                                "title",
                                e.target.value
                              )
                            }
                          />

                        </div>

                        <div className="form-group">

                          {label("Description")}

                          <textarea
                            rows="2"
                            placeholder="Alternative description"
                            value={alt.description}
                            onChange={(e) =>
                              updateAlternative(
                                index,
                                "description",
                                e.target.value
                              )
                            }
                          >
                          </textarea>

                        </div>

                        <div className="alt-grid">

                          <div className="form-group">

                            {label("Pros")}

                            <textarea
                              rows="2"
                              placeholder="Advantages"
                              value={alt.pros}
                              onChange={(e) =>
                                updateAlternative(
                                  index,
                                  "pros",
                                  e.target.value
                                )
                              }
                            >
                            </textarea>

                          </div>

                          <div className="form-group">

                            {label("Cons")}

                            <textarea
                              rows="2"
                              placeholder="Disadvantages"
                              value={alt.cons}
                              onChange={(e) =>
                                updateAlternative(
                                  index,
                                  "cons",
                                  e.target.value
                                )
                              }
                            >
                            </textarea>

                          </div>

                        </div>

                        <div className="alt-grid">

                          <div className="form-group">

                            {label("Estimated Cost")}

                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="e.g. 25000"
                              value={alt.estimated_cost || ""}
                              onChange={(e) =>
                                updateAlternative(
                                  index,
                                  "estimated_cost",
                                  e.target.value
                                )
                              }
                            />

                          </div>

                          <div className="form-group">

                            {label("Feasibility")}

                            <select
                              value={alt.feasibility || "Medium"}
                              onChange={(e) =>
                                updateAlternative(
                                  index,
                                  "feasibility",
                                  e.target.value
                                )
                              }
                            >
                              <option value="Low">Low</option>
                              <option value="Medium">Medium</option>
                              <option value="High">High</option>
                            </select>

                          </div>

                          <div className="form-group">

                            {label("Risk Assessment")}

                            <select
                              value={alt.risk_level || "Medium"}
                              onChange={(e) =>
                                updateAlternative(
                                  index,
                                  "risk_level",
                                  e.target.value
                                )
                              }
                            >
                              <option value="Low">Low</option>
                              <option value="Medium">Medium</option>
                              <option value="High">High</option>
                            </select>

                          </div>

                        </div>

                        <div className="form-group">

                          {label("Risk Explanation")}

                          <textarea
                            rows="2"
                            placeholder="Explain the identified risks"
                            value={alt.risk_explanation}
                            onChange={(e) =>
                              updateAlternative(
                                index,
                                "risk_explanation",
                                e.target.value
                              )
                            }
                          >
                          </textarea>

                        </div>

                      </div>
                    ))}

                  </div>
                )}

                <button
                  type="button"
                  className="secondary-button action-limited"
                  onClick={addAlternative}
                >
                  Add Alternative
                </button>

              </div>

              <div className="form-group">

                {label("Evaluation Criteria")}

                <textarea
                  rows="3"
                  placeholder="Criteria used to compare alternatives"
                  value={decisionCriteria}
                  onChange={(e) =>
                    setDecisionCriteria(e.target.value)
                  }
                >
                </textarea>

              </div>

              <div className="form-group">

                {label("Risks")}

                <textarea
                  rows="3"
                  placeholder="Potential risks and mitigations"
                  value={decisionRisks}
                  onChange={(e) =>
                    setDecisionRisks(e.target.value)
                  }
                >
                </textarea>

              </div>

              <div className="form-group">

                {label("Stakeholders")}

                <textarea
                  rows="3"
                  placeholder="People or groups affected by this decision"
                  value={decisionStakeholders}
                  onChange={(e) =>
                    setDecisionStakeholders(e.target.value)
                  }
                >
                </textarea>

              </div>

              <div className="form-section-title">
                Decision Details
              </div>

              <div className="form-row">

                <div className="form-group">

                  {label("Decision Date")}

                  <input
                    type="datetime-local"
                    value={decisionDate}
                    onChange={(e) =>
                      setDecisionDate(e.target.value)
                    }
                  />

                </div>

                <div className="form-group">

                  {label("Priority")}

                  <select
                    value={decisionPriority}
                    onChange={(e) =>
                      setDecisionPriority(e.target.value)
                    }
                  >
                    <option value="Low">
                      Low
                    </option>
                    <option value="Medium">
                      Medium
                    </option>
                    <option value="High">
                      High
                    </option>
                  </select>

                </div>

              </div>

              <div className="form-row">

                <div className="form-group">

                  {label("Implementation Status")}

                  <select
                    value={decisionImplementationStatus}
                    onChange={(e) =>
                      setDecisionImplementationStatus(
                        e.target.value
                      )
                    }
                  >
                    <option value="Not Started">
                      Not Started
                    </option>
                    <option value="In Progress">
                      In Progress
                    </option>
                    <option value="Completed">
                      Completed
                    </option>
                  </select>

                </div>

              </div>

              <div className="form-group">

                {label("Decision Owner / Expert")}

                <input
                  type="text"
                  value={
                    selectedDecision.expert_name
                      ? `${selectedDecision.expert_name} (Expert #${selectedDecision.expert_id})`
                      : `Expert #${selectedDecision.expert_id}`
                  }
                  readOnly
                />

              </div>

              <div className="form-section-title">
                Outcome / Rationale
              </div>

              <div className="form-group">

                {label("Rationale")}

                <textarea
                  rows="3"
                  placeholder="Reasoning behind the final decision"
                  value={decisionRationale}
                  onChange={(e) =>
                    setDecisionRationale(e.target.value)
                  }
                >
                </textarea>

              </div>

              <div className="form-group">

                {label("Final Decision / Outcome")}

                <textarea
                  rows="3"
                  placeholder="What was finally decided and expected outcome"
                  value={decisionOutcome}
                  onChange={(e) =>
                    setDecisionOutcome(e.target.value)
                  }
                >
                </textarea>

              </div>

              <div className="form-section-title">
                Supporting Document
              </div>

              {docMessage && (
                <div
                  className={`message ${docMessageType}`}
                  style={{ marginBottom: 12 }}
                >
                  {docMessage}
                </div>
              )}

              {documentsLoading ? (
                <div className="message">Loading document...</div>
              ) : documents && documents.length > 0 ? (
                <div className="form-group">
                  {documents
                    .slice()
                    .sort(
                      (a, b) =>
                        (b.document_id || 0) - (a.document_id || 0)
                    )
                    .map((doc) => (
                      <div
                        key={doc.document_id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "8px 12px",
                          background: "#f8f9fa",
                          borderRadius: 6,
                          fontSize: 13,
                          color: "#444",
                          marginBottom: 8
                        }}
                      >
                        <span>📄</span>
                        <span>{doc.original_file_name}</span>
                        <span style={{ color: "#888" }}>
                          ({doc.file_type || "File"} ·{" "}
                          {formatFileSize(doc.file_size)})
                        </span>
                        <div
                          style={{
                            marginLeft: "auto",
                            display: "flex",
                            gap: 8
                          }}
                        >
                          <button
                            type="button"
                            className="link-button"
                            onClick={() =>
                              handleDownloadDocument(doc, true)
                            }
                          >
                            View
                          </button>
                          <button
                            type="button"
                            className="link-button danger"
                            onClick={() => setDocDeleteTarget(doc)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}

                  <label
                    htmlFor="edit-doc-upload"
                    className="doc-upload-label"
                    style={{ marginTop: 8 }}
                  >
                    <span className="doc-upload-text">
                      {docUploading
                        ? `Replacing... ${uploadProgress}%`
                        : "Replace Document"}
                    </span>
                  </label>
                  <input
                    type="file"
                    id="edit-doc-upload"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png"
                    style={{ display: "none" }}
                    onChange={handleDocumentFileSelect}
                    disabled={docUploading}
                  />
                </div>
              ) : (
                <div className="form-group">
                  <p style={{ margin: "0 0 8px", fontSize: 13, color: "#888" }}>
                    No document attached.
                  </p>

                  <label
                    htmlFor="edit-doc-upload"
                    className="doc-upload-label"
                  >
                    <span className="doc-upload-text">
                      {docUploading
                        ? `Uploading... ${uploadProgress}%`
                        : "Choose a document to attach"}
                    </span>
                  </label>
                  <input
                    type="file"
                    id="edit-doc-upload"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png"
                    style={{ display: "none" }}
                    onChange={handleDocumentFileSelect}
                    disabled={docUploading}
                  />
                </div>
              )}

              {decisionMessage && (
                <div
                  className={`message ${decisionMessageType}`}
                >
                  {decisionMessage}
                </div>
              )}

              <button
                type="submit"
                className="primary-button"
                disabled={decisionsLoading}
              >
                {decisionsLoading
                  ? "Updating..."
                  : "Update Decision"}
              </button>

            </form>

          </div>

        </section>

      </main>

      {docDeleteTarget && (
        <ConfirmDialog
          title="Delete Document"
          message={`Are you sure you want to delete the document "${docDeleteTarget.original_file_name}"? The file will be permanently removed.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          isBusy={docDeleting}
          onConfirm={handleDeleteDocument}
          onCancel={cancelDocDelete}
        />
      )}

    </div>
  );
};

// ==========================================
// APP RENDER
// ==========================================

export default App;
