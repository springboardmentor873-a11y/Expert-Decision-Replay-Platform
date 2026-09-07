import { useEffect, useState, useCallback } from "react";
import "./App.css";
import translations, { LANGUAGES } from "./translations";

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
const [assignedUsers, setAssignedUsers] = useState([]);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");

    return saved ? JSON.parse(saved) : null;
  });

  // ==========================================
  // DECISIONS
  // ==========================================

  const [decisions, setDecisions] = useState([]);
  const [selectedDecision, setSelectedDecision] = useState(null);

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
  const [decisionStatus, setDecisionStatus] = useState("Active");
  const [decisionAlternatives, setDecisionAlternatives] = useState([]);
  const [decisionAssignedTo, setDecisionAssignedTo] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [teamFilter, setTeamFilter] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
  // MESSAGE
  // ==========================================

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const [loading, setLoading] = useState(false);

  const navigateTo = (targetPage) => {
    window.history.pushState({ page: targetPage }, "", "");
    setPage(targetPage);
  };

  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state && event.state.page) {
        setPage(event.state.page);
      } else if (localStorage.getItem("access_token")) {
        setPage("home");
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
      "profile",
      "settings"
    ];

    if (
      authedPages.includes(page) &&
      !localStorage.getItem("access_token")
    ) {
      setPage("login");
    }
  }, [page]);

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
    loadAssignedUsers();
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
    }
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
  // LOAD ASSIGNED USERS (REVIEWERS / MANAGERS)
  // ==========================================

  const loadAssignedUsers = async () => {
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
        setAssignedUsers([]);
        return;
      }

      const data = await response.json();

      const filtered = (data || []).filter(
        (u) =>
          Number(u.role_id) === 2 ||
          Number(u.role_id) === 3
      );

      setAssignedUsers(filtered);
    } catch (error) {
      console.error("Assigned users error:", error);
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
    setDecisionStatus("Active");
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
      navigateTo("decision-view");

      await loadComments(full.decision_id);
      await loadDocuments(full.decision_id);
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
    setDecisionStatus(full.status || "Active");
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

    navigateTo("decision-edit");
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

      for (const decision of decisions) {
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
            status: decisionStatus,
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

        setTimeout(() => {
          navigateTo("decisions");
          setDecisionMessage("");
          setDecisionMessageType("");
        }, 1000);
      }

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
            status: decisionStatus,
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
        decisionStatus !== (original.status || "Active"),
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
          (decision.status === "Under Review" ||
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
  // UPDATE STATUS
  // ==========================================

  const handleUpdateStatus = async (decision, newStatus) => {
    setOverviewMessage("");
    setOverviewMessageType("");

    if (
      (newStatus === "Approved" || newStatus === "Rejected") &&
      user?.role_id !== 2 &&
      user?.role_id !== 3
    ) {
      setOverviewMessage(
        "Only Managers and Reviewers can approve or reject decisions."
      );

      setOverviewMessageType("error");
      return;
    }

    try {
      setDecisionsLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/decisions/${decision.decision_id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${getToken()}`
          },
          body: JSON.stringify({
            status: newStatus
          })
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
          return;
        }

        if (response.status === 404) {
          setOverviewMessage(
            "Decision not found."
          );

          setOverviewMessageType("error");
          return;
        }

        setOverviewMessage(
          data.detail || "Failed to update status."
        );

        setOverviewMessageType("error");
        return;
      }

      setOverviewMessage(
        `Status updated to "${newStatus}".`
      );

      setOverviewMessageType("success");

      const updatedList = decisions.map((d) =>
        d.decision_id === decision.decision_id ? data : d
      );

      setDecisions(updatedList);

      if (
        selectedDecision &&
        selectedDecision.decision_id === decision.decision_id
      ) {
        setSelectedDecision(data);
      }

    } catch (error) {
      console.error(error);

      setOverviewMessage(
        "Unable to connect to server."
      );

      setOverviewMessageType("error");

    } finally {
      setDecisionsLoading(false);
    }
  };

  // ==========================================
  // REFRESH SELECTED DECISION
  // ==========================================

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
  // CLOSE ALTERNATIVE MODAL
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

      loadAssignedUsers();

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
        decisionStatus={decisionStatus}
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
        setDecisionStatus={setDecisionStatus}
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
      />
    );
  }

  // ==========================================
  // VIEW DECISION
  // ==========================================

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
        handleUpdateStatus={handleUpdateStatus}
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
        decisionStatus={decisionStatus}
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
        setDecisionStatus={setDecisionStatus}
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
  // HOME / DASHBOARD
  // ==========================================

  if (page === "home") {
    const totalDecisions = decisions.length;
    const activeCount = decisions.filter(
      (d) => d.status === "Active"
    ).length;
    const underReviewCount = decisions.filter(
      (d) => d.status === "Under Review"
    ).length;
    const approvedCount = decisions.filter(
      (d) => d.status === "Approved"
    ).length;
    const rejectedCount = decisions.filter(
      (d) => d.status === "Rejected"
    ).length;

    const recentDecisions = [...decisions]
      .sort(
        (a, b) =>
          (b.decision_id || 0) - (a.decision_id || 0)
      )
      .slice(0, 6);

    const dashDate = new Date().toLocaleDateString(
      "en-US",
      {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      }
    );

    return (
      <>
      <div className="dash-layout">

        {/* ---- SIDEBAR ---- */}

        <AppSidebar
          activePage="home"
          navigateTo={navigateTo}
          handleLogout={handleLogout}
        />

        {/* ---- MAIN ---- */}

        <main className="dash-main">

          {/* HEADER */}

          <header className="dash-header">

            <div>
              <h2 className="dash-header-title">
                Dashboard
              </h2>
              <p className="dash-header-sub">
                Welcome back, {user?.name || "User"}
              </p>
            </div>

            <div className="dash-header-right">
              <span className="dash-header-date">
                {dashDate}
              </span>
              <div className="dash-header-user">
                <div className="dash-avatar">
                  {(user?.name || "U")
                    .charAt(0)
                    .toUpperCase()}
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

          {/* WELCOME */}

          <section className="dash-welcome">
            <h3>
              Welcome!
            </h3>
            <p>
              You are successfully logged in.
            </p>
            <strong>{user?.email}</strong>
          </section>

          {/* STAT CARDS */}

          <section className="dash-stats">

            <div className="dash-stat-card">
              <div
                className="dash-stat-icon"
                style={{
                  background: "#dbeafe",
                  color: "#2563eb"
                }}
              >
                &#9733;
              </div>
              <div className="dash-stat-body">
                <span className="dash-stat-value">
                  {totalDecisions}
                </span>
                <span className="dash-stat-label">
                  Total Decisions
                </span>
              </div>
            </div>

            <div className="dash-stat-card">
              <div
                className="dash-stat-icon"
                style={{
                  background: "#d1fae5",
                  color: "#059669"
                }}
              >
                &#9998;
              </div>
              <div className="dash-stat-body">
                <span className="dash-stat-value">
                  {activeCount}
                </span>
                <span className="dash-stat-label">
                  Active
                </span>
              </div>
            </div>

            <div className="dash-stat-card">
              <div
                className="dash-stat-icon"
                style={{
                  background: "#fef3c7",
                  color: "#d97706"
                }}
              >
                &#9202;
              </div>
              <div className="dash-stat-body">
                <span className="dash-stat-value">
                  {underReviewCount}
                </span>
                <span className="dash-stat-label">
                  Under Review
                </span>
              </div>
            </div>

            <div className="dash-stat-card">
              <div
                className="dash-stat-icon"
                style={{
                  background: "#ede9fe",
                  color: "#7c3aed"
                }}
              >
                &#10003;
              </div>
              <div className="dash-stat-body">
                <span className="dash-stat-value">
                  {approvedCount}
                </span>
                <span className="dash-stat-label">
                  Approved
                </span>
              </div>
            </div>

            <div className="dash-stat-card">
              <div
                className="dash-stat-icon"
                style={{
                  background: "#fee2e2",
                  color: "#dc2626"
                }}
              >
                &#10005;
              </div>
              <div className="dash-stat-body">
                <span className="dash-stat-value">
                  {rejectedCount}
                </span>
                <span className="dash-stat-label">
                  Rejected
                </span>
              </div>
            </div>

          </section>

          {/* CONTENT ROW: Table + Sidebar cards */}

          <section className="dash-content-grid">

            {/* RECENT DECISIONS TABLE */}

            <div className="dash-card">

              <div className="dash-card-header">
                <h4>Recent Decisions</h4>
                <button
                  className="dash-link-btn"
                  onClick={openDecisions}
                >
                  View All
                </button>
              </div>

              <div className="dash-table-wrap">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Status</th>
                      <th>Expert</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentDecisions.map((d) => (
                      <tr key={d.decision_id}>
                        <td className="dash-td-title">
                          {d.title}
                        </td>
                        <td>
                          <span
                            className={
                              "dash-badge dash-badge-" +
                              (d.status || "")
                                .toLowerCase()
                                .replace(/\s+/g, "-")
                            }
                          >
                            {d.status}
                          </span>
                        </td>
                        <td>
                          {d.expert_name || "\u2014"}
                        </td>
                        <td>
                          {formatDate(d.created_at)}
                        </td>
                        <td>
                          <button
                            className="action-button view-button"
                            onClick={() =>
                              openViewDecision(d)
                            }
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}

                    {recentDecisions.length === 0 && (
                      <tr>
                        <td
                          colSpan="5"
                          className="dash-empty-row"
                        >
                          No recent decisions yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>

            {/* RIGHT COLUMN */}

            <div className="dash-right-col">

              {/* TEAM ACTIVITY */}

              <div className="dash-card">
                <h4 className="dash-side-title">
                  Team Activity
                </h4>
                <div className="dash-activity-list">
                  {roles.map((r) => (
                    <div
                      className="dash-activity-item"
                      key={r.role_id}
                    >
                      <div className="dash-act-avatar">
                        {r.role_name.charAt(0)}
                      </div>
                      <div className="dash-act-info">
                        <div className="dash-act-name">
                          {r.role_name}
                        </div>
                        <div className="dash-act-desc">
                          System Role
                        </div>
                      </div>
                    </div>
                  ))}
                  {roles.length === 0 && (
                    <div className="dash-empty-row">
                      No roles loaded.
                    </div>
                  )}
                </div>
              </div>

              {/* MY TEAMS */}

              <div className="dash-card">
                <h4 className="dash-side-title">
                  My Teams
                </h4>
                <div className="dash-teams-list">
                  {teams.map((t) => (
                    <div
                      className="dash-team-item"
                      key={t.team_id}
                    >
                      <div className="dash-team-dot"></div>
                      <div className="dash-team-name">
                        {t.team_name}
                      </div>
                    </div>
                  ))}
                  {teams.length === 0 && (
                    <div className="dash-empty-row">
                      No teams loaded.
                    </div>
                  )}
                </div>
              </div>

            </div>

          </section>

          {/* BOTTOM ROW: Chart + Discussions */}

          <section className="dash-bottom-grid">

            {/* DONUT CHART */}

            <div className="dash-card">
              <h4 className="dash-side-title">
                Decisions by Status
              </h4>
              <div className="dash-donut-wrap">

                <div className="dash-donut">
                  <svg
                    viewBox="0 0 36 36"
                    className="dash-donut-svg"
                  >
                    {(() => {
                      const total =
                        totalDecisions || 1;
                      let offset = 25;
                      const items = [
                        {
                          count: activeCount,
                          color: "#3b82f6"
                        },
                        {
                          count: underReviewCount,
                          color: "#f59e0b"
                        },
                        {
                          count: approvedCount,
                          color: "#10b981"
                        },
                        {
                          count: rejectedCount,
                          color: "#ef4444"
                        }
                      ];
                      return items.map(
                        (item, idx) => {
                          const pct =
                            (item.count / total) *
                            100;
                          const dash =
                            pct > 0 ? pct : 0.01;
                          const el = (
                            <circle
                              key={idx}
                              cx="18"
                              cy="18"
                              r="15.9155"
                              fill="none"
                              stroke={item.color}
                              strokeWidth="3.5"
                              strokeDasharray={
                                dash +
                                " " +
                                (100 - dash)
                              }
                              strokeDashoffset={
                                offset
                              }
                            />
                          );
                          offset -= pct;
                          return el;
                        }
                      );
                    })()}
                    <text
                      x="18"
                      y="18"
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="dash-donut-text"
                    >
                      {totalDecisions}
                    </text>
                    <text
                      x="18"
                      y="21"
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="dash-donut-subtext"
                    >
                      Total
                    </text>
                  </svg>
                </div>

                <div className="dash-legend">
                  <div className="dash-legend-item">
                    <span
                      className="dash-legend-dot"
                      style={{
                        background: "#3b82f6"
                      }}
                    ></span>
                    Active ({activeCount})
                  </div>
                  <div className="dash-legend-item">
                    <span
                      className="dash-legend-dot"
                      style={{
                        background: "#f59e0b"
                      }}
                    ></span>
                    Under Review ({underReviewCount})
                  </div>
                  <div className="dash-legend-item">
                    <span
                      className="dash-legend-dot"
                      style={{
                        background: "#10b981"
                      }}
                    ></span>
                    Approved ({approvedCount})
                  </div>
                  <div className="dash-legend-item">
                    <span
                      className="dash-legend-dot"
                      style={{
                        background: "#ef4444"
                      }}
                    ></span>
                    Rejected ({rejectedCount})
                  </div>
                </div>

              </div>
            </div>

            {/* RECENT DISCUSSIONS */}

            <div className="dash-card">
              <h4 className="dash-side-title">
                Recent Discussions
              </h4>
              <div className="dash-disc-list">
                {recentDecisions.slice(0, 4).map(
                  (d) => (
                    <div
                      className="dash-disc-item"
                      key={d.decision_id}
                    >
                      <div className="dash-disc-avatar">
                        {(d.expert_name || "S")
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                      <div className="dash-disc-info">
                        <div className="dash-disc-title">
                          {d.title}
                        </div>
                        <div className="dash-disc-meta">
                          {d.expert_name || "System"}
                          {" \u00B7 "}
                          {d.status}
                        </div>
                      </div>
                    </div>
                  )
                )}
                {recentDecisions.length === 0 && (
                  <div className="dash-empty-row">
                    No recent activity.
                  </div>
                )}
              </div>
            </div>

          </section>


        </main>

      </div>

      {deleteTarget && (
        <ConfirmDialog
          title={
            deleteTarget.status === "Under Review" ||
            deleteTarget.status === "Rejected"
              ? "Delete Decision"
              : "Archive Decision"
          }
          message={
            deleteTarget.status === "Under Review" ||
            deleteTarget.status === "Rejected"
              ? `Are you sure you want to delete "${deleteTarget.title}"? This action cannot be undone.`
              : `Are you sure you want to archive "${deleteTarget.title}"? The decision will be kept in history but no longer appear as an active decision.`
          }
          confirmLabel={
            deleteTarget.status === "Under Review" ||
            deleteTarget.status === "Rejected"
              ? "Delete"
              : "Archive"
          }
          cancelLabel="Cancel"
          isBusy={isDeleting}
          onConfirm={() => handleDeleteDecision(deleteTarget)}
          onCancel={cancelDelete}
        />
      )}
      </>
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

// ==========================================
// SHARED SIDEBAR
// ==========================================

const AppSidebar = ({ activePage, navigateTo, handleLogout }) => {
  const goHome = () => navigateTo("home");
  const goDecisions = () => navigateTo("decisions");
  const goCreate = () => navigateTo("decision-create");
  const goDocuments = () => navigateTo("documents");
  const goTeams = () => navigateTo("teams");
  const goProfile = () => navigateTo("profile");
  const goSettings = () => navigateTo("settings");

  const navClass = (page) =>
    `dash-nav-item${activePage === page ? " active" : ""}`;

  return (
    <aside className="dash-sidebar">
      <div className="dash-sidebar-brand">
        <div className="dash-sidebar-logo">ED</div>
        <div className="dash-sidebar-text">
          <div className="dash-sidebar-title">
            Expert Decision Replay
          </div>
          <div className="dash-sidebar-subtitle">
            Decision Intelligence Platform
          </div>
        </div>
      </div>

      <nav className="dash-sidebar-nav">

        <button
          className={navClass("home")}
          onClick={goHome}
        >
          <span className="dash-nav-icon">&#128202;</span>
          Dashboard
        </button>

        <button
          className={navClass("decisions")}
          onClick={goDecisions}
        >
          <span className="dash-nav-icon">&#128203;</span>
          All Decisions
        </button>

        <button
          className={navClass("create")}
          onClick={goCreate}
        >
          <span className="dash-nav-icon">&#10133;</span>
          Create Decision
        </button>

        <button
          className={navClass("documents")}
          onClick={goDocuments}
        >
          <span className="dash-nav-icon">&#128196;</span>
          Documents
        </button>

        <button
          className={navClass("teams")}
          onClick={goTeams}
        >
          <span className="dash-nav-icon">&#128101;</span>
          Teams
        </button>

        <button
          className={navClass("profile")}
          onClick={goProfile}
        >
          <span className="dash-nav-icon">&#128100;</span>
          Profile
        </button>

        <button
          className={navClass("settings")}
          onClick={goSettings}
        >
          <span className="dash-nav-icon">&#9881;&#65039;</span>
          Settings
        </button>

      </nav>

      <div className="dash-sidebar-footer">
        <button
          className="dash-nav-item"
          onClick={handleLogout}
        >
          <span className="dash-nav-icon">&#128682;</span>
          Logout
        </button>
      </div>
    </aside>
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

  const sortedDocs = [...allDocuments].sort(
    (a, b) =>
      (b.document_id || 0) - (a.document_id || 0)
  );

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
              Documents
            </h2>
            <p className="dash-header-sub">
              Project &amp; Decision Documents
            </p>
          </div>

          <div className="dash-header-right">
            <button
              className="nav-button"
              onClick={() => navigateTo("home")}
            >
              &#8962; Back to Dashboard
            </button>
            <button
              className="nav-button"
              onClick={() => navigateTo("decision-create")}
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

        <section className="dash-card">
          <div className="dash-card-header" style={{ marginBottom: "0" }}>
            <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
              All Documents
              <span style={{ marginLeft: "10px", fontSize: "13px", fontWeight: 500, color: "#64748b" }}>
                {allDocuments.length} file(s)
              </span>
            </h4>
          </div>

          <div style={{ height: "1px", background: "#e5e7eb", margin: "12px 0 16px" }}></div>

          {allDocumentsLoading ? (
            <div className="empty-state">Loading documents...</div>
          ) : sortedDocs.length === 0 ? (
            <div className="empty-state">
              No documents found. Attach documents to a decision to see them here.
            </div>
          ) : (
            <div className="table-wrap">
              <table className="decisions-table">
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Type</th>
                    <th>Size</th>
                    <th>Decision</th>
                    <th>Uploaded By</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedDocs.map((doc) => (
                    <tr key={doc.document_id}>
                      <td>
                        <div className="title-cell">
                          <strong>{doc.original_file_name}</strong>
                        </div>
                      </td>
                      <td>{doc.file_type || "File"}</td>
                      <td>{formatFileSize(doc.file_size)}</td>
                      <td>{doc.decision_title || `Decision #${doc.decision_id}`}</td>
                      <td>{doc.uploaded_by_name || `User #${doc.uploaded_by}`}</td>
                      <td>{formatDate(doc.uploaded_at)}</td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="action-button view-button"
                            onClick={() => handleDownloadDocument(doc, true)}
                          >
                            Open
                          </button>
                          <button
                            className="action-button edit-button"
                            onClick={() => handleDownloadDocument(doc, false)}
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
// TEAMS PAGE
// ==========================================

const TeamsPage = (props) => {
  const {
    user,
    getRoleName,
    navigateTo,
    teams,
    allUsers,
    handleLogout
  } = props;

  const membersByTeam = (teamId) =>
    allUsers.filter(
      (u) => Number(u.team_id) === Number(teamId)
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
            <h2 className="dash-header-title">
              Teams
            </h2>
            <p className="dash-header-sub">
              Available teams and their members
            </p>
          </div>

          <div className="dash-header-right">
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

        {teams.length === 0 ? (
          <div className="empty-state">No teams available.</div>
        ) : (
          <section className="dash-content-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
            {teams.map((team) => {
              const members = membersByTeam(team.team_id);
              return (
                <div className="dash-card" key={team.team_id}>
                  <div className="dash-card-header">
                    <h4>{team.team_name}</h4>
                    <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 600 }}>
                      {members.length} member(s)
                    </span>
                  </div>
                  <div className="dash-teams-list" style={{ flexDirection: "column" }}>
                    {members.length === 0 && (
                      <div className="dash-empty-row">No members in this team.</div>
                    )}
                    {members.map((m) => (
                      <div className="dash-activity-item" key={m.user_id}>
                        <div className="dash-act-avatar">
                          {(m.name || "U").charAt(0).toUpperCase()}
                        </div>
                        <div className="dash-act-info">
                          <div className="dash-act-name">{m.name}</div>
                          <div className="dash-act-desc">
                            {getRoleName(m.role_id)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </section>
        )}

      </main>

    </div>
  );
};

// ==========================================
// PROFILE PAGE
// ==========================================

const ProfilePage = (props) => {
  const {
    user,
    getRoleName,
    getTeamName,
    navigateTo,
    handleLogout
  } = props;

  const infoRows = [
    { label: "Full Name", value: user?.name || "—" },
    { label: "Email Address", value: user?.email || "—" },
    { label: "User ID", value: user?.user_id || "—" },
    { label: "Role", value: getRoleName(user?.role_id) },
    { label: "Team", value: getTeamName(user?.team_id) }
  ];

  return (
    <div className="dash-layout">

      <AppSidebar
        activePage="profile"
        navigateTo={navigateTo}
        handleLogout={handleLogout}
      />

      <main className="dash-main">

        <header className="dash-header">

          <div>
            <h2 className="dash-header-title">
              Profile
            </h2>
            <p className="dash-header-sub">
              Your account information
            </p>
          </div>

          <div className="dash-header-right">
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
          <div className="dash-card-header" style={{ marginBottom: "0" }}>
            <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
              Basic Information
            </h4>
          </div>

          <div style={{ height: "1px", background: "#e5e7eb", margin: "12px 0 16px" }}></div>

          <div className="dash-activity-list">
            {infoRows.map((row) => (
              <div className="dash-activity-item" key={row.label}>
                <div className="dash-act-info">
                  <div className="dash-act-desc" style={{ fontWeight: 600, color: "#94a3b8" }}>
                    {row.label}
                  </div>
                  <div className="dash-act-name">{row.value}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>

    </div>
  );
};

// ==========================================
// SETTINGS PAGE
// ==========================================

const SettingsPage = (props) => {
  const {
    user,
    getRoleName,
    navigateTo,
    handleLogout
  } = props;

  return (
    <div className="dash-layout">

      <AppSidebar
        activePage="settings"
        navigateTo={navigateTo}
        handleLogout={handleLogout}
      />

      <main className="dash-main">

        <header className="dash-header">

          <div>
            <h2 className="dash-header-title">
              Settings
            </h2>
            <p className="dash-header-sub">
              Account &amp; application preferences
            </p>
          </div>

          <div className="dash-header-right">
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

        <div className="dash-content-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>

          <div className="dash-card">
            <div className="dash-card-header" style={{ marginBottom: "0" }}>
              <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                Account Settings
              </h4>
            </div>
            <div style={{ height: "1px", background: "#e5e7eb", margin: "12px 0 16px" }}></div>

            <div className="dash-activity-list">
              <div className="dash-activity-item">
                <div className="dash-act-info">
                  <div className="dash-act-desc" style={{ fontWeight: 600, color: "#94a3b8" }}>
                    Signed in as
                  </div>
                  <div className="dash-act-name">{user?.email || "—"}</div>
                </div>
              </div>
              <div className="dash-activity-item">
                <div className="dash-act-info">
                  <div className="dash-act-desc" style={{ fontWeight: 600, color: "#94a3b8" }}>
                    Account status
                  </div>
                  <div className="dash-act-name">
                    <span className="dash-badge dash-badge-active">Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="dash-card">
            <div className="dash-card-header" style={{ marginBottom: "0" }}>
              <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                Application Settings
              </h4>
            </div>
            <div style={{ height: "1px", background: "#e5e7eb", margin: "12px 0 16px" }}></div>

            <div className="dash-activity-list">
              <div className="dash-activity-item">
                <div className="dash-act-info">
                  <div className="dash-act-desc" style={{ fontWeight: 600, color: "#94a3b8" }}>
                    Language
                  </div>
                  <div className="dash-act-name">English</div>
                </div>
              </div>
              <div className="dash-activity-item">
                <div className="dash-act-info">
                  <div className="dash-act-desc" style={{ fontWeight: 600, color: "#94a3b8" }}>
                    Notifications
                  </div>
                  <div className="dash-act-name">Enabled</div>
                </div>
              </div>
              <div className="dash-activity-item">
                <div className="dash-act-info">
                  <div className="dash-act-desc" style={{ fontWeight: 600, color: "#94a3b8" }}>
                    Platform
                  </div>
                  <div className="dash-act-name">Expert Decision Replay</div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </main>

    </div>
  );
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

        <h3>
          {title}
        </h3>

        <p>
          {message}
        </p>

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
            {isBusy
              ? "Working..."
              : (confirmLabel || "Confirm")}
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

  if (!mode) return null;

  const isView = mode === "view";

  const FIELD_LEVELS = ["Low", "Medium", "High"];

  const viewRow = (label, value, extra = null) => (
    <div className="alt-view-row">
      <div className="alt-view-label">{label}</div>
      <div className={extra ? `alt-view-value ${extra}` : "alt-view-value"}>
        {value}
      </div>
    </div>
  );

  const badge = (value) => {
    const normalized = (value || "").toLowerCase();

    return (
      <span className={value ? `level-badge level-${normalized}` : ""}>
        {value || "Not specified"}
      </span>
    );
  };

  return (
    <div className="modal-overlay">

      <div className="modal-box alt-modal">

        <h3>
          {isView
            ? "View Alternative"
            : (mode === "edit"
                ? "Edit Alternative"
                : "Add Alternative")}
        </h3>

        {message && messageType ? (
          <div className={messageType === "error"
            ? "form-error"
            : "form-success"}
          >
            {message}
          </div>
        ) : null}

        {isView ? (

          <div className="alt-view-details">

            {viewRow(
              "Alternative Title",
              form.title || "—"
            )}

            {viewRow(
              "Description",
              form.description || "Not specified"
            )}

            {viewRow(
              "Pros",
              form.pros || "Not specified"
            )}

            {viewRow(
              "Cons",
              form.cons || "Not specified"
            )}

            {viewRow(
              "Estimated Cost",
              formatCost(form.estimated_cost)
            )}

            {viewRow(
              "Feasibility",
              badge(form.feasibility)
            )}

            {viewRow(
              "Risk Assessment",
              badge(form.risk_level)
            )}

            {viewRow(
              "Risk Explanation",
              form.risk_explanation || "Not specified"
            )}

            <div className="modal-actions">

              <button
                className="secondary-button action-limited"
                onClick={onClose}
              >
                Close
              </button>

            </div>

          </div>

        ) : (

          <form
            className="alt-form"
            onSubmit={onSave}
          >

            <div className="form-group">
              <label>
                Alternative Title *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) =>
                  setField("title", e.target.value)
                }
                placeholder="e.g. Option A: Cloud Migration"
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setField("description", e.target.value)
                }
                placeholder="Describe this alternative..."
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>Pros</label>
              <textarea
                value={form.pros}
                onChange={(e) =>
                  setField("pros", e.target.value)
                }
                placeholder="List advantages..."
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>Cons</label>
              <textarea
                value={form.cons}
                onChange={(e) =>
                  setField("cons", e.target.value)
                }
                placeholder="List disadvantages..."
                rows="3"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Estimated Cost</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.estimated_cost}
                  onChange={(e) =>
                    setField("estimated_cost", e.target.value)
                  }
                  placeholder="e.g. 25000"
                />
              </div>

              <div className="form-group">
                <label>Feasibility</label>
                <select
                  value={form.feasibility}
                  onChange={(e) =>
                    setField("feasibility", e.target.value)
                  }
                >
                  {FIELD_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Risk Assessment</label>
                <select
                  value={form.risk_level}
                  onChange={(e) =>
                    setField("risk_level", e.target.value)
                  }
                >
                  {FIELD_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Risk Explanation</label>
              <textarea
                value={form.risk_explanation}
                onChange={(e) =>
                  setField("risk_explanation", e.target.value)
                }
                placeholder="Explain the identified risks..."
                rows="2"
              />
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
                  : (mode === "edit"
                      ? "Update Alternative"
                      : "Save Alternative")}
              </button>

            </div>

          </form>

        )}

      </div>

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
    handleLogout,
    formatDate
  } = props;

  const handleSearchKey = (e) => {
    if (e.key === "Enter") {
      applyFilters();
    }
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
                <option value="Active">
                  Active
                </option>
                <option value="Under Review">
                  Under Review
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

                          {decision.status !== "Archived" && (
                          <button
                            className="action-button delete-button"
                            onClick={() =>
                              setDeleteTarget(decision)
                            }
                          >
                            {decision.status === "Under Review" ||
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
            deleteTarget.status === "Under Review" ||
            deleteTarget.status === "Rejected"
              ? "Delete Decision"
              : "Archive Decision"
          }
          message={
            deleteTarget.status === "Under Review" ||
            deleteTarget.status === "Rejected"
              ? `Are you sure you want to delete "${deleteTarget.title}"? This action cannot be undone.`
              : `Are you sure you want to archive "${deleteTarget.title}"? The decision will be kept in history but no longer appear as an active decision.`
          }
          confirmLabel={
            deleteTarget.status === "Under Review" ||
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
    decisionStatus,
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
    setDecisionStatus,
    setDecisionAlternatives,
    handleCreateDecision,
    handleLogout,
    createFile,
    setCreateFile,
    createFileUploading,
    setCreateFileUploading,
    lastCreatedDecisionId,
    setLastCreatedDecisionId,
    handleCreateFileUpload
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

                <div className="form-group">

                  {label("Status")}

                  <select
                    value={decisionStatus}
                    onChange={(e) =>
                      setDecisionStatus(e.target.value)
                    }
                  >
                    <option value="Active">
                      Active
                    </option>
                    <option value="Under Review">
                      Under Review
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
    handleUpdateStatus,
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

  if (!selectedDecision) {
    return null;
  }

  const modules = [
    { key: "overview", label: "Overview", icon: "📋" },
    { key: "alternatives", label: "Alternatives", icon: "⚖️" },
    { key: "documents", label: "Documents", icon: "📎" },
    { key: "discussion", label: "Discussion", icon: "💬" },
    { key: "history", label: "History", icon: "🕓" }
  ];

  const d = selectedDecision;

  const history = d.history || [];

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
            <span className={statusBadgeClass(d.status)}>
              {d.status}
            </span>
          </div>

          <div style={{ height: "1px", background: "#e5e7eb", margin: "12px 0 16px" }}></div>

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
                  Decision Owner
                </span>

                <strong>
                  {d.expert_name ||
                    `User #${d.expert_id}`}
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

              <div className="info-card">

                <span>
                  Status
                </span>

                <strong>
                  {d.status}
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

          {/* ACTIONS */}

          <div className="detail-actions">

            <select
              className="status-select"
              value={d.status}
              onChange={(e) =>
                handleUpdateStatus(d, e.target.value)
              }
            >
              <option value="Active">
                Active
              </option>
              <option value="Under Review">
                Under Review
              </option>

              {(user?.role_id === 2 || user?.role_id === 3) && (
                <>
                  <option value="Approved">
                    Approved
                  </option>
                  <option value="Rejected">
                    Rejected
                  </option>
                </>
              )}

              <option value="Archived">
                Archived
              </option>
            </select>

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
              {d.status === "Under Review" ||
              d.status === "Rejected"
                ? "Delete Decision"
                : "Archive Decision"}
            </button>
            )}

          </div>

        </section>

      </main>

      {deleteTarget && (
        <ConfirmDialog
          title={
            deleteTarget.status === "Under Review" ||
            deleteTarget.status === "Rejected"
              ? "Delete Decision"
              : "Archive Decision"
          }
          message={
            deleteTarget.status === "Under Review" ||
            deleteTarget.status === "Rejected"
              ? `Are you sure you want to delete "${deleteTarget.title}"? This action cannot be undone.`
              : `Are you sure you want to archive "${deleteTarget.title}"? The decision will be kept in history but no longer appear as an active decision.`
          }
          confirmLabel={
            deleteTarget.status === "Under Review" ||
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
    decisionStatus,
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
    setDecisionStatus,
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

                  {label("Status")}

                  <select
                    value={decisionStatus}
                    onChange={(e) =>
                      setDecisionStatus(e.target.value)
                    }
                  >
                    <option value="Active">
                      Active
                    </option>
                    <option value="Under Review">
                      Under Review
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
