import { useState, useEffect, useMemo } from "react";
import "./App.css";
import KnowledgeGraphView from "./KnowledgeGraphView";


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

const BookOpenIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

const ShieldCheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

const ClipboardCheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    <polyline points="9 14 11 16 15 11" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const RotateCcwIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
  </svg>
);

const TagIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
);

const ArchiveIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="21 8 21 21 3 21 3 8" />
    <rect x="1" y="3" width="22" height="5" />
    <line x1="10" y1="12" x2="14" y2="12" />
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
  const [formTags, setFormTags] = useState("");
  const [formRationale, setFormRationale] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // States for divided separate pages
  const [allDocuments, setAllDocuments] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [documentSearch, setDocumentSearch] = useState("");
  const [docUploadDecisionId, setDocUploadDecisionId] = useState("");
  const [docUploadFile, setDocUploadFile] = useState(null);

  const [decisionSearch, setDecisionSearch] = useState("");
  const [decisionStatusFilter, setDecisionStatusFilter] = useState("ALL");

  const [teamSearch, setTeamSearch] = useState("");
  const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDesc, setNewTeamDesc] = useState("");

  const [newDiscussionTitle, setNewDiscussionTitle] = useState("");
  const [newDiscussionContext, setNewDiscussionContext] = useState("");

  // MODULE 6: KNOWLEDGE REPOSITORY STATES
  const [knowledgeSearch, setKnowledgeSearch] = useState("");
  const [knowledgeCategory, setKnowledgeCategory] = useState("ALL");
  const [knowledgeTag, setKnowledgeTag] = useState("ALL");
  const [knowledgeStatus, setKnowledgeStatus] = useState("ALL");
  const [knowledgeSubView, setKnowledgeSubView] = useState("search"); // "search" | "archive"
  const [knowledgeTagsList, setKnowledgeTagsList] = useState([]);
  const [archivedDecisions, setArchivedDecisions] = useState([]);
  const [loadingArchive, setLoadingArchive] = useState(false);
  const [selectedTimelineDecision, setSelectedTimelineDecision] = useState(null);
  const [timelineData, setTimelineData] = useState(null);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  // MILESTONE 3: APPROVALS STATES
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loadingApprovals, setLoadingApprovals] = useState(false);
  const [approvalActionModal, setApprovalActionModal] = useState(null);
  const [approvalActionComment, setApprovalActionComment] = useState("");
  const [isApprovingAction, setIsApprovingAction] = useState(false);
  const [escalationModal, setEscalationModal] = useState(null);
  const [escalationReason, setEscalationReason] = useState("");

  // MILESTONE 3: NOTIFICATIONS STATES
  const [notificationsList, setNotificationsList] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  // MILESTONE 3: AUDIT & COMPLIANCE STATES
  const [auditLogsList, setAuditLogsList] = useState([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);
  const [auditActionFilter, setAuditActionFilter] = useState("ALL");
  const [auditEntityFilter, setAuditEntityFilter] = useState("ALL");

  // MILESTONE 3: REPORTS & EXPORT SUITE STATES
  const [reportsSummary, setReportsSummary] = useState(null);
  const [loadingReports, setLoadingReports] = useState(false);

  const unreadNotifsCount = useMemo(() => {
    return notificationsList.filter((n) => !n.is_read).length;
  }, [notificationsList]);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 3500);
  };

  const loadAllDocuments = async () => {
    setLoadingDocuments(true);
    try {
      const res = await fetch(`${API_URL}/files`);
      if (res.ok) {
        const data = await res.json();
        setAllDocuments(data);
      } else {
        setAllDocuments([]);
      }
    } catch {
      setAllDocuments([]);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const loadKnowledgeTags = async () => {
    try {
      const res = await fetch(`${API_URL}/knowledge/tags`);
      if (res.ok) {
        const data = await res.json();
        setKnowledgeTagsList(data);
      }
    } catch {}
  };

  const loadArchivedDecisions = async () => {
    setLoadingArchive(true);
    try {
      const res = await fetch(`${API_URL}/knowledge/archive`);
      if (res.ok) {
        const data = await res.json();
        setArchivedDecisions(data);
      }
    } catch {}
    finally {
      setLoadingArchive(false);
    }
  };

  const loadPendingApprovals = async () => {
    setLoadingApprovals(true);
    try {
      const res = await fetch(`${API_URL}/approvals/pending`);
      if (res.ok) {
        const data = await res.json();
        setPendingApprovals(data);
      }
    } catch {}
    finally {
      setLoadingApprovals(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const res = await fetch(`${API_URL}/notifications`);
      if (res.ok) {
        const data = await res.json();
        setNotificationsList(data);
      }
    } catch {}
  };

  const loadAuditLogs = async () => {
    setLoadingAuditLogs(true);
    try {
      const res = await fetch(`${API_URL}/audit-logs?limit=100`);
      if (res.ok) {
        const data = await res.json();
        setAuditLogsList(data);
      }
    } catch {}
    finally {
      setLoadingAuditLogs(false);
    }
  };

  const loadReportsSummary = async () => {
    setLoadingReports(true);
    try {
      const res = await fetch(`${API_URL}/reports/summary`);
      if (res.ok) {
        const data = await res.json();
        setReportsSummary(data);
      }
    } catch {}
    finally {
      setLoadingReports(false);
    }
  };

  const openDecisionTimeline = async (decisionId) => {
    setSelectedTimelineDecision(decisionId);
    setLoadingTimeline(true);
    try {
      const res = await fetch(`${API_URL}/knowledge/decisions/${decisionId}/timeline`);
      if (res.ok) {
        const data = await res.json();
        setTimelineData(data);
      } else {
        triggerToast("Failed to load decision timeline");
      }
    } catch {
      triggerToast("Network error loading timeline");
    } finally {
      setLoadingTimeline(false);
    }
  };

  const handleToggleArchive = async (decisionId) => {
    try {
      const res = await fetch(`${API_URL}/decisions/${decisionId}/archive`, {
        method: "PUT",
      });
      if (res.ok) {
        const data = await res.json();
        triggerToast(data.message);
        await getBackendData();
        await loadArchivedDecisions();
      } else {
        triggerToast("Could not toggle archive state");
      }
    } catch {
      triggerToast("Network error archiving decision");
    }
  };

  const handleApprovalAction = async (approvalId, action) => {
    setIsApprovingAction(true);
    try {
      const res = await fetch(`${API_URL}/approvals/${approvalId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: action,
          comments: approvalActionComment.trim() || null,
          user_id: user?.id || 1,
          user_role: user?.role || "REVIEWER",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        triggerToast(data.message);
        setApprovalActionModal(null);
        setApprovalActionComment("");
        await getBackendData();
        await loadPendingApprovals();
        await loadNotifications();
        await loadAuditLogs();
      } else {
        const err = await res.json();
        triggerToast(err.detail || "Approval action failed");
      }
    } catch {
      triggerToast("Network error submitting action");
    } finally {
      setIsApprovingAction(false);
    }
  };

  const handleEscalateSubmit = async (e) => {
    e.preventDefault();
    if (!escalationModal || !escalationReason.trim()) return;
    try {
      const res = await fetch(`${API_URL}/approvals/${escalationModal.approval_id}/escalate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: escalationReason.trim(),
          user_id: user?.id || 1,
          user_role: user?.role || "STAKEHOLDER",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        triggerToast(data.message);
        setEscalationModal(null);
        setEscalationReason("");
        await getBackendData();
        await loadPendingApprovals();
        await loadNotifications();
        await loadAuditLogs();
      } else {
        const err = await res.json();
        triggerToast(err.detail || "Escalation failed");
      }
    } catch {
      triggerToast("Network error submitting escalation");
    }
  };

  const handleSubmitForReview = async (decisionId) => {
    try {
      const res = await fetch(`${API_URL}/decisions/${decisionId}/approvals/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: "Submitted for multi-level technical review",
        }),
      });
      if (res.ok) {
        triggerToast("Decision submitted for Level-1 Peer Review! 🚀");
        await getBackendData();
        await loadPendingApprovals();
        await loadNotifications();
        await loadAuditLogs();
        if (selectedDecision && selectedDecision.id === decisionId) {
          setSelectedDecision(null);
        }
      } else {
        const err = await res.json();
        triggerToast(err.detail || "Submission failed");
      }
    } catch {
      triggerToast("Network error submitting review");
    }
  };

  const handleMarkAllNotifsRead = async () => {
    try {
      await fetch(`${API_URL}/notifications/read-all`, { method: "PUT" });
      setNotificationsList((prev) => prev.map((n) => ({ ...n, is_read: true })));
      triggerToast("All notifications marked as read");
    } catch {}
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

      await loadAllDocuments();
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
        tags: formTags.trim() || null,
        rationale: formRationale.trim() || null,
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
        setFormTags("");
        setFormRationale("");
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
        triggerToast("File uploaded successfully! Synced across Employee & Manager.");
        setSelectedUploadFile(null);
        await loadDecisionFiles(decisionId);
        await loadAllDocuments();
      } else {
        const err = await res.json();
        triggerToast(err.detail || "Upload failed");
      }
    } catch {
      triggerToast("Error connecting to upload endpoint");
    }
  };

  const handleDirectDocUpload = async (e) => {
    e.preventDefault();
    if (!docUploadDecisionId) {
      triggerToast("Please select a decision to attach this document to");
      return;
    }
    if (!docUploadFile) {
      triggerToast("Please choose a file to upload");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", docUploadFile);

      const res = await fetch(`${API_URL}/decisions/${docUploadDecisionId}/upload`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        triggerToast("Document uploaded! Immediately visible to Manager upon login.");
        setDocUploadFile(null);
        setDocUploadDecisionId("");
        await loadAllDocuments();
        if (selectedDecision && selectedDecision.id === Number(docUploadDecisionId)) {
          await loadDecisionFiles(selectedDecision.id);
        }
      } else {
        const err = await res.json();
        triggerToast(err.detail || "Document upload failed");
      }
    } catch {
      triggerToast("Network error uploading document");
    }
  };

  const handleCreateTeamSubmit = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) {
      triggerToast("Please enter a team name");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTeamName.trim(),
          description: newTeamDesc.trim() || null,
          manager_id: user?.id || 2,
        }),
      });

      if (res.ok) {
        triggerToast("Team created successfully!");
        setNewTeamName("");
        setNewTeamDesc("");
        setIsCreateTeamModalOpen(false);
        await getBackendData();
      } else {
        const err = await res.json();
        triggerToast(err.detail || "Failed to create team");
      }
    } catch {
      triggerToast("Network error while creating team");
    }
  };

  const filteredDecisions = useMemo(() => {
    return decisions.filter((d) => {
      const q = decisionSearch.toLowerCase();
      const matchesSearch =
        !q ||
        (d.title || "").toLowerCase().includes(q) ||
        (d.description || "").toLowerCase().includes(q) ||
        (d.team || "").toLowerCase().includes(q) ||
        (d.decision_type || "").toLowerCase().includes(q);
      const matchesStatus =
        decisionStatusFilter === "ALL" ||
        (d.status || "").toUpperCase() === decisionStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [decisions, decisionSearch, decisionStatusFilter]);

  const filteredDocuments = useMemo(() => {
    return allDocuments.filter((doc) => {
      const q = documentSearch.toLowerCase();
      return (
        !q ||
        (doc.filename || "").toLowerCase().includes(q) ||
        (doc.decision_title || "").toLowerCase().includes(q) ||
        (doc.uploaded_by_name || "").toLowerCase().includes(q)
      );
    });
  }, [allDocuments, documentSearch]);

  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      const q = teamSearch.toLowerCase();
      return (
        !q ||
        (t.name || "").toLowerCase().includes(q) ||
        (t.description || "").toLowerCase().includes(q)
      );
    });
  }, [teams, teamSearch]);

  const distinctCategories = useMemo(() => {
    const cats = new Set(["Architecture", "Database", "Security", "Infrastructure", "AI/ML", "Cloud", "API Design"]);
    decisions.forEach((d) => {
      if (d.decision_type) cats.add(d.decision_type);
    });
    return Array.from(cats);
  }, [decisions]);

  const filteredKnowledgeDecisions = useMemo(() => {
    return decisions.filter((d) => {
      const isArchived = (d.status || "").toUpperCase() === "ARCHIVED";
      if (knowledgeSubView === "archive") {
        if (!isArchived) return false;
      } else {
        if (isArchived) return false;
      }

      const q = knowledgeSearch.toLowerCase().trim();
      const rawTags = d.tags || "";
      const tagsList = Array.isArray(d.tags)
        ? d.tags
        : (d.tags ? d.tags.split(",").map((t) => t.trim()).filter(Boolean) : [d.decision_type || "General"]);

      const textCorpus = `${d.title || ""} ${d.description || ""} ${d.decision_type || ""} ${d.rationale || ""} ${tagsList.join(" ")} ${d.team || ""}`.toLowerCase();

      const matchesSearch = !q || textCorpus.includes(q);

      const matchesCategory =
        knowledgeCategory === "ALL" ||
        (d.decision_type || "").toLowerCase() === knowledgeCategory.toLowerCase();

      const matchesTag =
        knowledgeTag === "ALL" ||
        tagsList.some((t) => t.toLowerCase() === knowledgeTag.toLowerCase());

      const matchesStatus =
        knowledgeStatus === "ALL" ||
        (d.status || "").toUpperCase() === knowledgeStatus.toUpperCase();

      return matchesSearch && matchesCategory && matchesTag && matchesStatus;
    });
  }, [decisions, knowledgeSearch, knowledgeCategory, knowledgeTag, knowledgeStatus, knowledgeSubView]);

  const filteredAuditLogs = useMemo(() => {
    return auditLogsList.filter((log) => {
      const matchesAction =
        auditActionFilter === "ALL" ||
        (log.action || "").toUpperCase() === auditActionFilter.toUpperCase();
      const matchesEntity =
        auditEntityFilter === "ALL" ||
        (log.entity_type || "").toUpperCase() === auditEntityFilter.toUpperCase();
      return matchesAction && matchesEntity;
    });
  }, [auditLogsList, auditActionFilter, auditEntityFilter]);

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

          {/* Module 6: Knowledge Repository - Prioritized! */}
          <button
            className={`sidebar-link ${activeTab === "Knowledge Repository" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("Knowledge Repository");
              loadKnowledgeTags();
            }}
          >
            <BookOpenIcon />
            <span>Knowledge Repo</span>
            <span className="sidebar-count-badge info">Replay</span>
          </button>

          <button
            className={`sidebar-link ${activeTab === "Decisions" ? "active" : ""}`}
            onClick={() => setActiveTab("Decisions")}
          >
            <CheckSquareIcon />
            <span>Decisions</span>
          </button>

          {/* Milestone 3: Multi-Level Approvals Hub */}
          <button
            className={`sidebar-link ${activeTab === "Approvals" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("Approvals");
              loadPendingApprovals();
            }}
          >
            <ShieldCheckIcon />
            <span>Approvals</span>
            {pendingApprovals.length > 0 && (
              <span className="sidebar-count-badge">{pendingApprovals.length}</span>
            )}
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

          {/* Milestone 3: Audit & Compliance */}
          <button
            className={`sidebar-link ${activeTab === "Audit & Compliance" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("Audit & Compliance");
              loadAuditLogs();
            }}
          >
            <ClipboardCheckIcon />
            <span>Audit & Compliance</span>
          </button>

          {/* Milestone 3: Reports & Export Suite */}
          <button
            className={`sidebar-link ${activeTab === "Reports & Export" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("Reports & Export");
              loadReportsSummary();
            }}
          >
            <DownloadIcon />
            <span>Reports & Export</span>
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
            <p>
              {user.role === "MANAGER"
                ? "Management & Sign-off Portal: Review pending submissions, approvals, and team governance."
                : user.role === "REVIEWER"
                ? "Peer Review Hub: Verify technical feasibility, evaluation criteria, and architectural specs."
                : user.role === "ADMINISTRATOR"
                ? "Executive Administration: System-wide audit trails, decision analytics, and compliance reports."
                : "Decisions & Replay Workspace: Author decisions, analyze alternatives, and collaborate with teams."}
            </p>
          </div>

          <div className="header-actions">
            <div className="header-date">
              {currentDateFormatted}
            </div>

            {/* Interactive Live Notifications Dropdown */}
            <div className="notification-relative-wrapper">
              <button
                className="notification-btn"
                title="Notifications"
                onClick={() => {
                  setShowNotifDropdown(!showNotifDropdown);
                  if (!showNotifDropdown) loadNotifications();
                }}
              >
                <BellIcon />
                {unreadNotifsCount > 0 && <span className="notification-dot"></span>}
              </button>

              {showNotifDropdown && (
                <div className="notifications-popover">
                  <div className="notif-popover-header">
                    <h4>Notifications ({unreadNotifsCount} unread)</h4>
                    {unreadNotifsCount > 0 && (
                      <button className="btn-mark-all-read" onClick={handleMarkAllNotifsRead}>
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="notif-popover-list">
                    {notificationsList.length === 0 ? (
                      <div style={{ padding: "20px", textAlign: "center", color: "#64748b", fontSize: "13px" }}>
                        No notifications yet.
                      </div>
                    ) : (
                      notificationsList.slice(0, 15).map((n) => (
                        <div
                          key={n.id}
                          className={`notif-popover-item ${!n.is_read ? "unread" : ""}`}
                          onClick={async () => {
                            if (!n.is_read) {
                              try {
                                await fetch(`${API_URL}/notifications/${n.id}/read`, { method: "PUT" });
                                setNotificationsList((prev) =>
                                  prev.map((item) => (item.id === n.id ? { ...item, is_read: true } : item))
                                );
                              } catch {}
                            }
                            setShowNotifDropdown(false);
                            if (n.link_id) {
                              const found = decisions.find((d) => d.id === n.link_id);
                              if (found) handleViewDetails(found);
                            }
                          }}
                        >
                          <span className="notif-item-icon">
                            {n.type === "ESCALATION" ? "⚠️" : n.type === "APPROVAL_REQUEST" ? "📋" : "🔔"}
                          </span>
                          <div style={{ flex: 1 }}>
                            <div className="notif-item-title">{n.title}</div>
                            <div className="notif-item-message">{n.message}</div>
                            <div className="notif-item-time">{n.time_ago || "Recently"}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

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

        
        {/* =========================================================
            TAB 1: DASHBOARD (High-level Overview & Quick Metrics)
            ========================================================= */}
        {activeTab === "Dashboard" && (
          <div className="page-view-container">
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
                    onClick={() => {
                      setDecisionStatusFilter("DRAFT");
                      setActiveTab("Decisions");
                    }}
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
                    onClick={() => {
                      setDecisionStatusFilter("IN_REVIEW");
                      setActiveTab("Decisions");
                    }}
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
                    onClick={() => {
                      setDecisionStatusFilter("APPROVED");
                      setActiveTab("Decisions");
                    }}
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
                    onClick={() => {
                      setDecisionStatusFilter("REJECTED");
                      setActiveTab("Decisions");
                    }}
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
                              No decisions found in database. Click <strong>+ Create Decision</strong> to start!
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
                      {discussions.slice(0, 3).map((d) => (
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
          </div>
        )}

        {/* =========================================================
            MODULE 6: KNOWLEDGE REPOSITORY & DECISION REPLAY ENGINE
            ========================================================= */}
        {activeTab === "Knowledge Repository" && (
          <div className="page-view-container">
            <div className="knowledge-header-banner">
              <div className="knowledge-banner-text">
                <h2>
                  <BookOpenIcon />
                  <span>Knowledge Repository & Replay Hub</span>
                </h2>
                <p>
                  Preserve and replay institutional decisions. Search historical context,
                  filter by category or tag, inspect decision rationales, and navigate archived specifications.
                </p>
              </div>
              <div className="knowledge-view-toggle">
                <button
                  className={`knowledge-toggle-btn ${knowledgeSubView === "search" ? "active" : ""}`}
                  onClick={() => setKnowledgeSubView("search")}
                >
                  <span>🔍 Active Knowledge Catalog</span>
                </button>
                <button
                  className={`knowledge-toggle-btn ${knowledgeSubView === "graph" ? "active" : ""}`}
                  onClick={() => setKnowledgeSubView("graph")}
                >
                  <span>🕸️ Interactive Knowledge Graph</span>
                </button>
                <button
                  className={`knowledge-toggle-btn ${knowledgeSubView === "archive" ? "active" : ""}`}
                  onClick={() => {
                    setKnowledgeSubView("archive");
                    loadArchivedDecisions();
                  }}
                >
                  <ArchiveIcon />
                  <span>Document & Decision Archive</span>
                </button>
              </div>
            </div>

            {knowledgeSubView === "search" ? (
              <>
                <div className="knowledge-search-card">
                  <div className="knowledge-search-input-row">
                    <div className="knowledge-search-box">
                      <span style={{ fontSize: "16px" }}>🔍</span>
                      <input
                        type="text"
                        placeholder="Search decisions by keyword, problem statement, rationale, or tag..."
                        value={knowledgeSearch}
                        onChange={(e) => setKnowledgeSearch(e.target.value)}
                      />
                      {knowledgeSearch && (
                        <button
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}
                          onClick={() => setKnowledgeSearch("")}
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <select
                      className="form-select"
                      style={{ width: "200px" }}
                      value={knowledgeStatus}
                      onChange={(e) => setKnowledgeStatus(e.target.value)}
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="APPROVED">Approved Only</option>
                      <option value="IN_REVIEW">Under Review</option>
                      <option value="DRAFT">Draft</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </div>

                  {/* Category Chips */}
                  <div className="knowledge-category-chips">
                    <span className="category-chip-label">Category:</span>
                    <button
                      className={`category-chip ${knowledgeCategory === "ALL" ? "active" : ""}`}
                      onClick={() => setKnowledgeCategory("ALL")}
                    >
                      All Categories
                    </button>
                    {distinctCategories.map((cat) => (
                      <button
                        key={cat}
                        className={`category-chip ${knowledgeCategory === cat ? "active" : ""}`}
                        onClick={() => setKnowledgeCategory(cat)}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Tag Cloud */}
                  <div className="knowledge-tag-cloud">
                    <span className="tag-cloud-label">
                      <TagIcon /> Tags:
                    </span>
                    <button
                      className={`knowledge-tag-pill ${knowledgeTag === "ALL" ? "active" : ""}`}
                      onClick={() => setKnowledgeTag("ALL")}
                    >
                      #All Tags
                    </button>
                    {(knowledgeTagsList.length > 0
                      ? knowledgeTagsList
                      : [
                          { tag: "Architecture", count: 4 },
                          { tag: "Database", count: 3 },
                          { tag: "Security", count: 3 },
                          { tag: "Infrastructure", count: 2 },
                          { tag: "API Design", count: 2 },
                          { tag: "Scalability", count: 2 },
                        ]
                    ).map((t) => (
                      <button
                        key={t.tag}
                        className={`knowledge-tag-pill ${knowledgeTag === t.tag ? "active" : ""}`}
                        onClick={() => setKnowledgeTag(knowledgeTag === t.tag ? "ALL" : t.tag)}
                      >
                        #{t.tag} {t.count > 0 && `(${t.count})`}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <div style={{ fontSize: "14px", color: "var(--text-secondary)", fontWeight: 600 }}>
                    Found <strong>{filteredKnowledgeDecisions.length}</strong> matching decisions in Knowledge Repository
                  </div>
                  {(knowledgeSearch || knowledgeCategory !== "ALL" || knowledgeTag !== "ALL" || knowledgeStatus !== "ALL") && (
                    <button
                      className="btn-secondary"
                      style={{ padding: "4px 10px", fontSize: "12px" }}
                      onClick={() => {
                        setKnowledgeSearch("");
                        setKnowledgeCategory("ALL");
                        setKnowledgeTag("ALL");
                        setKnowledgeStatus("ALL");
                      }}
                    >
                      Reset Filters
                    </button>
                  )}
                </div>

                {filteredKnowledgeDecisions.length === 0 ? (
                  <div className="dash-card" style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                    <div style={{ fontSize: "28px", marginBottom: "8px" }}>📚</div>
                    <div style={{ fontSize: "16px", fontWeight: 700, marginBottom: "4px" }}>
                      No decisions found in Knowledge Repository
                    </div>
                    <p style={{ fontSize: "13px", margin: 0 }}>
                      Try adjusting your keywords, category, or tag filter, or create a new decision record.
                    </p>
                  </div>
                ) : (
                  <div className="knowledge-cards-grid">
                    {filteredKnowledgeDecisions.map((d) => {
                      const tagsArray = Array.isArray(d.tags)
                        ? d.tags
                        : (d.tags ? d.tags.split(",").map((t) => t.trim()).filter(Boolean) : [d.decision_type || "General"]);
                      return (
                        <div className="knowledge-card" key={d.id}>
                          <div className="knowledge-card-top">
                            <span className="knowledge-card-category">{d.decision_type || "Architecture"}</span>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>#{d.id}</span>
                              {renderStatusBadge(d.status)}
                            </div>
                          </div>

                          <div className="knowledge-card-title">{d.title}</div>
                          <div className="knowledge-card-desc">{d.description}</div>

                          {d.rationale && (
                            <div className="knowledge-rationale-snippet">
                              <strong>Decision Rationale:</strong> {d.rationale}
                            </div>
                          )}

                          <div className="knowledge-card-tags">
                            {tagsArray.map((t) => (
                              <span
                                key={t}
                                className="knowledge-tag-pill"
                                style={{ cursor: "pointer" }}
                                onClick={() => setKnowledgeTag(t)}
                              >
                                #{t}
                              </span>
                            ))}
                          </div>

                          <div className="knowledge-card-meta">
                            <span>👥 {d.team || "Core Team"}</span>
                            <span>{d.created_date_formatted || todayShortFormatted}</span>
                          </div>

                          <div className="knowledge-card-actions">
                            <button
                              className="btn-replay-action"
                              onClick={() => openDecisionTimeline(d.id)}
                              title="Replay decision timeline and history"
                            >
                              <RotateCcwIcon />
                              <span>Replay Decision</span>
                            </button>
                            <button
                              className="btn-secondary"
                              style={{ padding: "8px 12px", fontSize: "12px" }}
                              onClick={() => handleViewDetails(d)}
                              title="Inspect full details and attachments"
                            >
                              Inspect
                            </button>
                            {((user?.role || "").toUpperCase() === "MANAGER" || (user?.role || "").toUpperCase() === "ADMINISTRATOR") && (
                              <button
                                className="btn-archive-toggle"
                                onClick={() => handleToggleArchive(d.id)}
                                title={d.status === "ARCHIVED" ? "Restore to active" : "Archive decision"}
                              >
                                {d.status === "ARCHIVED" ? "Restore" : "Archive"}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : knowledgeSubView === "graph" ? (
              <KnowledgeGraphView
                decisions={decisions}
                knowledgeTagsList={knowledgeTagsList}
                distinctCategories={distinctCategories}
                openDecisionTimeline={openDecisionTimeline}
                handleViewDetails={handleViewDetails}
                API_URL={API_URL}
              />
            ) : (
              /* Subview: Document & Decision Archive */
              <div className="dash-card">
                <div className="card-header-row">
                  <div>
                    <h2 className="card-title">Archived Decisions & Historical Artifacts</h2>
                    <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748b" }}>
                      Archived decisions are permanently preserved for corporate audit and institutional recall.
                    </p>
                  </div>
                  <button className="btn-secondary" onClick={loadArchivedDecisions}>
                    {loadingArchive ? "Refreshing..." : "🔄 Refresh Archive"}
                  </button>
                </div>

                <div className="table-wrapper" style={{ marginTop: "16px" }}>
                  <table className="decisions-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Archived Decision</th>
                        <th>Category</th>
                        <th>Archived Date</th>
                        <th>Attached Documents</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {archivedDecisions.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: "center", padding: "36px", color: "#64748b" }}>
                            No decisions currently in the Archive. Decisions can be archived from the Knowledge Catalog or Decisions table.
                          </td>
                        </tr>
                      ) : (
                        archivedDecisions.map((item) => (
                          <tr key={item.id}>
                            <td style={{ fontWeight: 700, color: "#64748b" }}>#{item.id}</td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{item.title}</div>
                              <div style={{ fontSize: "12px", color: "#64748b" }}>{item.description}</div>
                            </td>
                            <td>
                              <span className="knowledge-card-category">{item.decision_type || "General"}</span>
                            </td>
                            <td style={{ fontSize: "12px", color: "#64748b" }}>
                              {item.archived_date || "Archived"}
                            </td>
                            <td>
                              {item.files && item.files.length > 0 ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                  {item.files.map((f) => (
                                    <button
                                      key={f.id}
                                      className="btn-table-view"
                                      style={{ padding: "2px 8px", fontSize: "11.5px" }}
                                      onClick={() => window.open(`${API_URL}/files/${f.id}/download`, "_blank")}
                                    >
                                      ⬇️ {f.filename}
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <span style={{ color: "#94a3b8", fontSize: "12px" }}>No attachments</span>
                              )}
                            </td>
                            <td>
                              <div className="table-actions-cell">
                                <button
                                  className="btn-replay-action"
                                  style={{ padding: "4px 10px", fontSize: "12px" }}
                                  onClick={() => openDecisionTimeline(item.id)}
                                >
                                  Replay
                                </button>
                                {((user?.role || "").toUpperCase() === "MANAGER" || (user?.role || "").toUpperCase() === "ADMINISTRATOR") && (
                                  <button
                                    className="btn-secondary"
                                    style={{ padding: "4px 10px", fontSize: "12px" }}
                                    onClick={() => handleToggleArchive(item.id)}
                                  >
                                    Restore
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            MILESTONE 3: MULTI-LEVEL APPROVALS WORKFLOW
            ========================================================= */}
        {activeTab === "Approvals" && (
          <div className="page-view-container">
            <div className="page-header-card">
              <div className="page-title-group">
                <h2>
                  <ShieldCheckIcon />
                  <span>Multi-Level Decision Approvals</span>
                </h2>
                <p>
                  Structured two-stage approval governance: Stage 1 Peer & Technical Review, followed by Stage 2 Manager Final Sign-Off.
                </p>
              </div>
              <div className="page-actions-group">
                <button
                  className="btn-secondary"
                  onClick={loadPendingApprovals}
                  disabled={loadingApprovals}
                >
                  {loadingApprovals ? "Checking..." : "🔄 Refresh Queue"}
                </button>
              </div>
            </div>

            {/* Role Notice Banner */}
            <div className="doc-sync-banner manager" style={{ marginBottom: "20px" }}>
              <span className="doc-sync-icon">🛡️</span>
              <div>
                <strong>Active Approval Authority ({user?.role || "EMPLOYEE"}):</strong>{" "}
                {user?.role === "MANAGER" || user?.role === "ADMINISTRATOR"
                  ? "You have Stage 2 Final Evaluation authority and can sign off or resolve urgent escalations."
                  : user?.role === "REVIEWER"
                  ? "You have Stage 1 Technical Verification authority to evaluate alternatives and endorse proposals."
                  : "As an Employee, you can track the progress of decisions submitted for review or submit new decisions."}
              </div>
            </div>

            <div className="dash-card" style={{ marginBottom: "24px" }}>
              <div className="card-header-row">
                <h3 className="card-title">
                  Pending Approval Queue ({pendingApprovals.length})
                </h3>
                <span style={{ fontSize: "12.5px", color: "#64748b" }}>
                  Items requiring technical verification or final management sign-off
                </span>
              </div>

              {pendingApprovals.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>✅</div>
                  <div style={{ fontSize: "16px", fontWeight: 700, marginBottom: "4px" }}>
                    Approval Queue is Empty!
                  </div>
                  <p style={{ fontSize: "13px", margin: 0 }}>
                    All submitted decisions have been processed. New review requests will automatically appear here.
                  </p>
                </div>
              ) : (
                <div className="approvals-queue-grid">
                  {pendingApprovals.map((appItem) => (
                    <div className="approval-card-item" key={appItem.approval_id}>
                      <div className="approval-card-header">
                        <span className={`stage-badge ${appItem.escalated ? "escalated" : ""}`}>
                          {appItem.stage_name}
                        </span>
                        {appItem.escalated && (
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "#dc2626" }}>
                            ⚠️ ESCALATED
                          </span>
                        )}
                      </div>

                      <div className="approval-card-title">{appItem.decision_title}</div>
                      <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px" }}>
                        Author: <strong>{appItem.author_name}</strong> • Team: {appItem.team_name} • ID: #{appItem.decision_id}
                      </div>

                      <div className="approval-context-box">
                        <strong>Review Context:</strong> {appItem.comments || "Submitted for formal multi-level evaluation."}
                        {appItem.escalation_reason && (
                          <div style={{ marginTop: "6px", color: "#dc2626", fontWeight: 600 }}>
                            Escalation Reason: {appItem.escalation_reason}
                          </div>
                        )}
                      </div>

                      <div className="approval-action-buttons-row">
                        {((user?.role || "").toUpperCase() === "REVIEWER" || (user?.role || "").toUpperCase() === "MANAGER" || (user?.role || "").toUpperCase() === "ADMINISTRATOR") ? (
                          <>
                            <button
                              className="btn-action-approve"
                              onClick={() => setApprovalActionModal({ approval: appItem, action: "APPROVE" })}
                            >
                              ✓ Approve Stage
                            </button>
                            <button
                              className="btn-action-reject"
                              onClick={() => setApprovalActionModal({ approval: appItem, action: "REJECT" })}
                            >
                              ✕ Reject
                            </button>
                            <button
                              className="btn-secondary"
                              style={{ padding: "6px 10px", fontSize: "12px" }}
                              onClick={() => setApprovalActionModal({ approval: appItem, action: "REQUEST_CHANGES" })}
                            >
                              ↺ Changes
                            </button>
                            {!appItem.escalated && (
                              <button
                                className="btn-action-escalate"
                                onClick={() => {
                                  setEscalationModal(appItem);
                                  setEscalationReason("");
                                }}
                              >
                                ⚠️ Escalate
                              </button>
                            )}
                          </>
                        ) : (
                          <button
                            className="btn-secondary"
                            style={{ width: "100%" }}
                            onClick={() => {
                              const found = decisions.find((d) => d.id === appItem.decision_id);
                              if (found) handleViewDetails(found);
                            }}
                          >
                            Inspect Decision & Evidence →
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================
            MILESTONE 3: AUDIT & COMPLIANCE LOGS
            ========================================================= */}
        {activeTab === "Audit & Compliance" && (
          <div className="page-view-container">
            <div className="page-header-card">
              <div className="page-title-group">
                <h2>
                  <ClipboardCheckIcon />
                  <span>Audit Trail & Regulatory Compliance</span>
                </h2>
                <p>
                  Immutable system event ledger tracking decision lifecycles, approval actions, stakeholder authorizations, and document attachments.
                </p>
              </div>
              <div className="page-actions-group">
                <button
                  className="btn-secondary"
                  onClick={loadAuditLogs}
                  disabled={loadingAuditLogs}
                >
                  {loadingAuditLogs ? "Refreshing..." : "🔄 Refresh Audit Stream"}
                </button>
              </div>
            </div>

            <div className="filter-toolbar-card">
              <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                <select
                  className="form-select"
                  value={auditActionFilter}
                  onChange={(e) => setAuditActionFilter(e.target.value)}
                  style={{ minWidth: "180px" }}
                >
                  <option value="ALL">All Actions</option>
                  <option value="CREATE_DECISION">CREATE_DECISION</option>
                  <option value="SUBMIT_APPROVAL">SUBMIT_APPROVAL</option>
                  <option value="APPROVE_STAGE1">APPROVE_STAGE1</option>
                  <option value="APPROVE_FINAL">APPROVE_FINAL</option>
                  <option value="REJECT_DECISION">REJECT_DECISION</option>
                  <option value="REQUEST_CHANGES">REQUEST_CHANGES</option>
                  <option value="ESCALATE_DECISION">ESCALATE_DECISION</option>
                  <option value="UPLOAD_FILE">UPLOAD_FILE</option>
                  <option value="ARCHIVE_DECISION">ARCHIVE_DECISION</option>
                </select>

                <select
                  className="form-select"
                  value={auditEntityFilter}
                  onChange={(e) => setAuditEntityFilter(e.target.value)}
                  style={{ minWidth: "160px" }}
                >
                  <option value="ALL">All Entities</option>
                  <option value="DECISION">DECISION</option>
                  <option value="APPROVAL">APPROVAL</option>
                  <option value="FILE">FILE</option>
                  <option value="TEAM">TEAM</option>
                </select>
              </div>

              <div style={{ fontSize: "13px", color: "#64748b" }}>
                Total Recorded: <strong>{filteredAuditLogs.length}</strong> immutable events
              </div>
            </div>

            <div className="dash-card">
              <div className="table-wrapper">
                <table className="decisions-table">
                  <thead>
                    <tr>
                      <th>Event ID</th>
                      <th>Timestamp (UTC)</th>
                      <th>Actor / User</th>
                      <th>Action Performed</th>
                      <th>Entity Type</th>
                      <th>Audit Details</th>
                      <th>IP Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAuditLogs.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: "center", padding: "36px", color: "#64748b" }}>
                          No audit entries match the selected filter.
                        </td>
                      </tr>
                    ) : (
                      filteredAuditLogs.map((log) => {
                        let badgeClass = "create";
                        const act = (log.action || "").toUpperCase();
                        if (act.includes("APPROVE")) badgeClass = "approve";
                        else if (act.includes("REJECT")) badgeClass = "reject";
                        else if (act.includes("ESCALATE")) badgeClass = "escalate";
                        else if (act.includes("ARCHIVE")) badgeClass = "archive";
                        else if (act.includes("UPLOAD")) badgeClass = "upload";

                        return (
                          <tr key={log.id}>
                            <td style={{ fontFamily: "monospace", fontWeight: 700, color: "#64748b" }}>
                              #{log.id}
                            </td>
                            <td style={{ fontSize: "12px", color: "#64748b", whiteSpace: "nowrap" }}>
                              {log.timestamp || "Recent"}
                            </td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{log.user_name || "System"}</div>
                              <div style={{ fontSize: "11px", color: "#94a3b8" }}>User #{log.user_id || "?"}</div>
                            </td>
                            <td>
                              <span className={`audit-action-badge ${badgeClass}`}>{log.action}</span>
                            </td>
                            <td style={{ fontSize: "12px", fontWeight: 600 }}>{log.entity_type} #{log.entity_id || ""}</td>
                            <td style={{ fontSize: "12.5px", color: "#334155", maxWidth: "340px" }}>
                              {log.details || "-"}
                            </td>
                            <td style={{ fontFamily: "monospace", fontSize: "11px", color: "#94a3b8" }}>
                              {log.ip_address || "127.0.0.1"}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            MILESTONE 3: REPORTS & EXPORT SUITE
            ========================================================= */}
        {activeTab === "Reports & Export" && (
          <div className="page-view-container">
            <div className="page-header-card">
              <div className="page-title-group">
                <h2>
                  <DownloadIcon />
                  <span>Executive Reports & One-Click Export Suite</span>
                </h2>
                <p>
                  Generate regulatory compliance filings, board packets, and complete decision archives in PDF, Excel (.xlsx), and CSV.
                </p>
              </div>
            </div>

            {/* One-Click Download Center */}
            <div className="reports-download-banner">
              <div>
                <h3 style={{ margin: "0 0 6px 0", fontSize: "18px", fontWeight: 800 }}>
                  📥 Instant Export Downloads
                </h3>
                <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>
                  Download complete audit logs, decision histories, and approval stages formatted for executive presentation.
                </p>
              </div>

              <div className="reports-download-buttons-group">
                <button
                  className="btn-export-download pdf"
                  onClick={() => window.open(`${API_URL}/reports/export/pdf`, "_blank")}
                  title="Download styled executive PDF report"
                >
                  <span>📄 Download PDF Report</span>
                </button>
                <button
                  className="btn-export-download excel"
                  onClick={() => window.open(`${API_URL}/reports/export/excel`, "_blank")}
                  title="Download multi-tab Excel spreadsheet"
                >
                  <span>📊 Download Excel (.xlsx)</span>
                </button>
                <button
                  className="btn-export-download csv"
                  onClick={() => window.open(`${API_URL}/reports/export/csv?export_type=decisions`, "_blank")}
                  title="Download decisions in standard CSV"
                >
                  <span>📑 Download Decisions CSV</span>
                </button>
                <button
                  className="btn-export-download csv"
                  style={{ background: "#6366f1" }}
                  onClick={() => window.open(`${API_URL}/reports/export/csv?export_type=audit`, "_blank")}
                  title="Download audit logs in standard CSV"
                >
                  <span>📑 Download Audit CSV</span>
                </button>
              </div>
            </div>

            {/* Executive KPIs */}
            <div className="analytics-grid" style={{ marginBottom: "24px" }}>
              <div className="analytics-card">
                <div className="analytics-card-title">Total Decisions Filed</div>
                <div className="analytics-card-val">{reportsSummary?.decisions?.total ?? stats.total}</div>
                <div className="analytics-card-sub">Recorded across all business units</div>
              </div>
              <div className="analytics-card">
                <div className="analytics-card-title">Overall Approval Rate</div>
                <div className="analytics-card-val" style={{ color: "#10b981" }}>
                  {reportsSummary?.decisions?.approval_rate ?? stats.approvedPct}%
                </div>
                <div className="analytics-card-sub">{stats.approved} approved decisions</div>
              </div>
              <div className="analytics-card">
                <div className="analytics-card-title">Avg Review Turnaround</div>
                <div className="analytics-card-val" style={{ color: "#3b82f6" }}>
                  {reportsSummary?.approvals?.avg_turnaround_hours ?? "3.8"} hrs
                </div>
                <div className="analytics-card-sub">From submission to manager sign-off</div>
              </div>
              <div className="analytics-card">
                <div className="analytics-card-title">Audit Trail Entries</div>
                <div className="analytics-card-val" style={{ color: "#8b5cf6" }}>
                  {reportsSummary?.organization?.total_audit_events ?? auditLogsList.length}
                </div>
                <div className="analytics-card-sub">Immutable governance checkpoints</div>
              </div>
            </div>

            {/* Category and Team Governance Table */}
            <div className="dash-card">
              <h3 className="card-title" style={{ marginBottom: "14px" }}>
                Team Governance & Compliance Breakdown
              </h3>
              <div className="table-wrapper">
                <table className="decisions-table">
                  <thead>
                    <tr>
                      <th>Team ID</th>
                      <th>Team Name</th>
                      <th>Total Decisions</th>
                      <th>Approved</th>
                      <th>In Review</th>
                      <th>Compliance Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teams.map((t) => {
                      const tDecs = decisions.filter((d) => d.team_id === t.id);
                      const tApproved = tDecs.filter((d) => (d.status || "").toUpperCase() === "APPROVED").length;
                      const tPending = tDecs.filter((d) => (d.status || "").toUpperCase() === "IN_REVIEW").length;
                      return (
                        <tr key={t.id}>
                          <td style={{ fontWeight: 700, color: "#64748b" }}>#{t.id}</td>
                          <td style={{ fontWeight: 600 }}>{t.name}</td>
                          <td>{tDecs.length}</td>
                          <td style={{ color: "#10b981", fontWeight: 600 }}>{tApproved}</td>
                          <td style={{ color: "#f59e0b", fontWeight: 600 }}>{tPending}</td>
                          <td>
                            <span className="doc-role-tag employee" style={{ background: "#ecfdf5", color: "#059669" }}>
                              ✓ Compliant
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 2: DECISIONS (Separate Dedicated Page)
            ========================================================= */}
        {activeTab === "Decisions" && (
          <div className="page-view-container">
            <div className="page-header-card">
              <div className="page-title-group">
                <h2>
                  <CheckSquareIcon />
                  <span>Decisions Repository</span>
                </h2>
                <p>Full organizational decision archive with audit trail, team assignments, and status governance.</p>
              </div>
              <div className="page-actions-group">
                <button
                  className="btn-primary-action"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  <PlusIcon />
                  <span>Create Decision</span>
                </button>
              </div>
            </div>

            <div className="filter-toolbar-card">
              <div className="filter-pills-group">
                {["ALL", "DRAFT", "IN_REVIEW", "APPROVED", "REJECTED"].map((st) => (
                  <button
                    key={st}
                    className={`filter-pill-btn ${decisionStatusFilter === st ? "active" : ""}`}
                    onClick={() => setDecisionStatusFilter(st)}
                  >
                    {st === "ALL" ? "All Decisions" : st === "IN_REVIEW" ? "Under Review" : st.charAt(0) + st.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>

              <div className="search-input-wrapper">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search decisions by title, team, or type..."
                  value={decisionSearch}
                  onChange={(e) => setDecisionSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="dash-card">
              <div className="table-wrapper">
                <table className="decisions-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Title & Summary</th>
                      <th>Decision Type</th>
                      <th>Team</th>
                      <th>Status</th>
                      <th>Created On</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDecisions.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                          No decisions found matching your filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredDecisions.map((item) => (
                        <tr key={item.id}>
                          <td style={{ fontWeight: 700, color: "#64748b" }}>#{item.id}</td>
                          <td className="decision-title-cell" title={item.title}>
                            <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{item.title}</div>
                            <div style={{ fontSize: "12px", color: "#64748b", maxWidth: "340px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {item.description}
                            </div>
                          </td>
                          <td>
                            <span className="doc-role-tag employee">{item.decision_type || "Architecture"}</span>
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
                                View Details & Documents
                              </button>
                              <button
                                className="btn-table-more"
                                title="Delete decision"
                                onClick={() => handleDeleteDecision(item.id)}
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 3: TEAMS (Separate Dedicated Page)
            ========================================================= */}
        {activeTab === "Teams" && (
          <div className="page-view-container">
            <div className="page-header-card">
              <div className="page-title-group">
                <h2>
                  <UsersIcon />
                  <span>Teams & Organizational Units</span>
                </h2>
                <p>Cross-functional teams, assigned team managers, and decision ownership.</p>
              </div>
              <div className="page-actions-group">
                <button
                  className="btn-primary-action"
                  onClick={() => setIsCreateTeamModalOpen(true)}
                >
                  <PlusIcon />
                  <span>Create Team</span>
                </button>
              </div>
            </div>

            <div className="filter-toolbar-card">
              <div className="search-input-wrapper" style={{ width: "100%", maxWidth: "380px" }}>
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search teams by name..."
                  value={teamSearch}
                  onChange={(e) => setTeamSearch(e.target.value)}
                />
              </div>
              <div style={{ fontSize: "13px", color: "#64748b" }}>
                Total: <strong>{filteredTeams.length}</strong> active teams
              </div>
            </div>

            <div className="teams-cards-grid">
              {filteredTeams.map((t) => {
                const teamDecisionsCount = decisions.filter((d) => d.team_id === t.id).length;
                return (
                  <div className="team-card-box" key={t.id}>
                    <div className="team-card-header">
                      <div className="team-icon-circle">
                        <UsersIcon />
                      </div>
                      <div>
                        <div className="team-card-name">{t.name}</div>
                        <div style={{ fontSize: "12px", color: "#10b981", fontWeight: 600 }}>
                          Team #{t.id}
                        </div>
                      </div>
                    </div>
                    <div className="team-card-desc">
                      {t.description || "Core engineering and technical strategy team."}
                    </div>
                    <div className="team-card-meta">
                      <span>👥 {t.members || 4} members</span>
                      <span>📋 {teamDecisionsCount} decisions</span>
                    </div>
                    <button
                      className="btn-secondary"
                      style={{ width: "100%", marginTop: "6px" }}
                      onClick={() => {
                        setDecisionSearch(t.name);
                        setActiveTab("Decisions");
                      }}
                    >
                      View Team Decisions →
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 4: DOCUMENTS (Separate Dedicated Page)
            SHOWCASES THE EMPLOYEE -> MANAGER DOCUMENT SHARING FEATURE
            ========================================================= */}
        {activeTab === "Documents" && (
          <div className="page-view-container">
            <div className="page-header-card">
              <div className="page-title-group">
                <h2>
                  <FileTextIcon />
                  <span>Document Repository & Evidence Hub</span>
                </h2>
                <p>Shared specifications, architecture diagrams, and review documents across Employees and Managers.</p>
              </div>
              <div className="page-actions-group">
                <button
                  className="btn-secondary"
                  onClick={loadAllDocuments}
                  disabled={loadingDocuments}
                >
                  {loadingDocuments ? "Refreshing..." : "🔄 Refresh Files"}
                </button>
              </div>
            </div>

            {/* Cross-Role Banner showing how Employee and Manager share the document */}
            {((user?.role || "").toUpperCase() === "MANAGER" || (user?.role || "").toUpperCase() === "ADMINISTRATOR") ? (
              <div className="doc-sync-banner manager">
                <span className="doc-sync-icon">👔</span>
                <div>
                  <strong>Manager Document Review Portal:</strong> All supporting documents uploaded by <strong>Employees</strong> across all decisions are archived here. You can download each attachment, inspect technical details, and directly review or approve the attached decision.
                </div>
              </div>
            ) : (
              <div className="doc-sync-banner employee">
                <span className="doc-sync-icon">📁</span>
                <div>
                  <strong>Employee Document Center:</strong> Any document you upload to a decision is saved centrally. When your <strong>Manager logs in</strong>, they immediately see and download the exact same files for review and approval.
                </div>
              </div>
            )}

            {/* Upload Document directly to a Decision (EMPLOYEE ONLY - Hidden for Manager) */}
            {((user?.role || "").toUpperCase() !== "MANAGER") && (
              <div className="doc-upload-box">
                <h4>📤 Upload Supporting Document to Decision</h4>
                <form className="doc-upload-form-inline" onSubmit={handleDirectDocUpload}>
                  <select
                    value={docUploadDecisionId}
                    onChange={(e) => setDocUploadDecisionId(e.target.value)}
                    style={{ minWidth: "240px" }}
                    required
                  >
                    <option value="">Select Target Decision...</option>
                    {decisions.map((d) => (
                      <option key={d.id} value={d.id}>
                        #{d.id} - {d.title} ({d.status})
                      </option>
                    ))}
                  </select>
                  <input
                    type="file"
                    onChange={(e) => setDocUploadFile(e.target.files[0])}
                    required
                  />
                  <button type="submit" className="btn-primary-action">
                    Upload Document
                  </button>
                </form>
              </div>
            )}

            <div className="filter-toolbar-card">
              <div className="search-input-wrapper" style={{ width: "100%", maxWidth: "380px" }}>
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search documents by file name, decision, or uploader..."
                  value={documentSearch}
                  onChange={(e) => setDocumentSearch(e.target.value)}
                />
              </div>
              <div style={{ fontSize: "13px", color: "#64748b" }}>
                Total: <strong>{filteredDocuments.length}</strong> documents available
              </div>
            </div>

            <div className="dash-card">
              <div className="table-wrapper">
                <table className="decisions-table">
                  <thead>
                    <tr>
                      <th>Document Name</th>
                      <th>Attached Decision</th>
                      <th>Decision Status</th>
                      <th>Uploaded By</th>
                      <th>File Size</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocuments.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                          {loadingDocuments ? (
                            "Loading documents..."
                          ) : (
                            <div>
                              <div style={{ fontSize: "15px", fontWeight: 600, marginBottom: "6px" }}>
                                No documents found
                              </div>
                              <div style={{ fontSize: "13px" }}>
                                Upload a document to any decision using the form above or from inside any decision view!
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    ) : (
                      filteredDocuments.map((doc) => {
                        const matchingDecision = decisions.find((d) => d.id === doc.decision_id);
                        return (
                          <tr key={doc.id}>
                            <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ fontSize: "16px" }}>📄</span>
                                <span>{doc.filename}</span>
                              </div>
                            </td>
                            <td>
                              <span style={{ fontWeight: 500 }}>{doc.decision_title}</span>
                              <span style={{ fontSize: "11px", color: "#64748b", marginLeft: "6px" }}>#{doc.decision_id}</span>
                            </td>
                            <td>{renderStatusBadge(doc.decision_status)}</td>
                            <td>
                              <span style={{ fontWeight: 500, marginRight: "6px" }}>{doc.uploaded_by_name || "Employee"}</span>
                              <span className={`doc-role-tag ${(doc.uploaded_by_role || "EMPLOYEE").toLowerCase()}`}>
                                {doc.uploaded_by_role || "EMPLOYEE"}
                              </span>
                            </td>
                            <td style={{ color: "#64748b", fontSize: "12px" }}>{doc.file_size || "Standard"}</td>
                            <td>
                              <div className="table-actions-cell">
                                <button
                                  className="btn-table-view"
                                  onClick={() => window.open(`${API_URL}/files/${doc.id}/download`, "_blank")}
                                  title="Download this document"
                                >
                                  ⬇️ Download
                                </button>
                                {matchingDecision && (
                                  <button
                                    className="btn-secondary"
                                    style={{ padding: "4px 10px", fontSize: "12px" }}
                                    onClick={() => handleViewDetails(matchingDecision)}
                                    title="Open decision modal to inspect or update status"
                                  >
                                    Review Decision
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 5: MY DISCUSSIONS (Separate Dedicated Page)
            ========================================================= */}
        {activeTab === "My Discussions" && (
          <div className="page-view-container">
            <div className="page-header-card">
              <div className="page-title-group">
                <h2>
                  <MessageSquareIcon />
                  <span>Technical Discussions & Deliberations</span>
                </h2>
                <p>Team discussions, architectural trade-offs, and historical context.</p>
              </div>
            </div>

            <div className="dash-card">
              <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "14px" }}>Start New Discussion</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newDiscussionTitle.trim()) return;
                  discussions.unshift({
                    id: Date.now(),
                    title: newDiscussionTitle.trim(),
                    context: newDiscussionContext.trim() || "Team technical discussion",
                    time: "Just now",
                  });
                  setNewDiscussionTitle("");
                  setNewDiscussionContext("");
                  triggerToast("Discussion posted!");
                }}
                style={{ display: "flex", flexDirection: "column", gap: "12px" }}
              >
                <input
                  type="text"
                  className="form-input"
                  placeholder="Discussion title..."
                  value={newDiscussionTitle}
                  onChange={(e) => setNewDiscussionTitle(e.target.value)}
                  required
                />
                <textarea
                  className="form-textarea"
                  placeholder="What context or question would you like to discuss with the team?"
                  value={newDiscussionContext}
                  onChange={(e) => setNewDiscussionContext(e.target.value)}
                  rows={3}
                />
                <button type="submit" className="btn-primary-action" style={{ alignSelf: "flex-start" }}>
                  Post Discussion
                </button>
              </form>
            </div>

            <div className="dash-card">
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
        )}

        {/* =========================================================
            TAB 6: ANALYTICS (Separate Dedicated Page)
            ========================================================= */}
        {activeTab === "Analytics" && (
          <div className="page-view-container">
            <div className="page-header-card">
              <div className="page-title-group">
                <h2>
                  <BarChartIcon />
                  <span>Decision Intelligence & Analytics</span>
                </h2>
                <p>Status breakdown, review velocity, and governance metrics.</p>
              </div>
            </div>

            <div className="analytics-grid">
              <div className="analytics-card">
                <div className="analytics-card-title">Total Decisions</div>
                <div className="analytics-card-val">{stats.total}</div>
                <div className="analytics-card-sub">Recorded across all teams</div>
              </div>
              <div className="analytics-card">
                <div className="analytics-card-title">Approval Rate</div>
                <div className="analytics-card-val" style={{ color: "#10b981" }}>{stats.approvedPct}%</div>
                <div className="analytics-card-sub">{stats.approved} approved decisions</div>
              </div>
              <div className="analytics-card">
                <div className="analytics-card-title">Under Review</div>
                <div className="analytics-card-val" style={{ color: "#3b82f6" }}>{stats.review}</div>
                <div className="analytics-card-sub">Awaiting manager review</div>
              </div>
              <div className="analytics-card">
                <div className="analytics-card-title">Attached Documents</div>
                <div className="analytics-card-val" style={{ color: "#8b5cf6" }}>{allDocuments.length}</div>
                <div className="analytics-card-sub">Supporting files uploaded</div>
              </div>
            </div>

            <div className="dash-card">
              <h2 className="card-title">Decisions Status Breakdown</h2>
              <div className="donut-chart-container" style={{ marginTop: "16px" }}>
                <div className="donut-svg-wrapper">
                  <svg width="150" height="150" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="45" fill="transparent" stroke="#f1f5f9" strokeWidth="16" />
                    {stats.total > 0 && (
                      <>
                        <circle
                          cx="60" cy="60" r="45" fill="transparent" stroke="#fbbf24" strokeWidth="16"
                          strokeDasharray={`${donutData.lenDraft} ${donutData.circumference}`}
                          strokeDashoffset={donutData.offsetDraft}
                          transform="rotate(-90 60 60)"
                        />
                        <circle
                          cx="60" cy="60" r="45" fill="transparent" stroke="#3b82f6" strokeWidth="16"
                          strokeDasharray={`${donutData.lenReview} ${donutData.circumference}`}
                          strokeDashoffset={donutData.offsetReview}
                          transform="rotate(-90 60 60)"
                        />
                        <circle
                          cx="60" cy="60" r="45" fill="transparent" stroke="#34d399" strokeWidth="16"
                          strokeDasharray={`${donutData.lenApproved} ${donutData.circumference}`}
                          strokeDashoffset={donutData.offsetApproved}
                          transform="rotate(-90 60 60)"
                        />
                        <circle
                          cx="60" cy="60" r="45" fill="transparent" stroke="#f87171" strokeWidth="16"
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
          </div>
        )}

        {/* =========================================================
            TAB 7: PROFILE (Separate Dedicated Page)
            ========================================================= */}
        {activeTab === "Profile" && (
          <div className="page-view-container">
            <div className="page-header-card">
              <div className="page-title-group">
                <h2>
                  <UserIcon />
                  <span>User Profile & Roles</span>
                </h2>
                <p>Your user credentials, authority level, and active organization role.</p>
              </div>
            </div>

            <div className="profile-box-card">
              <div className="profile-hero">
                <div className="profile-avatar-large">
                  {(user.name || "JD").split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <h3 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 6px 0" }}>{user.name}</h3>
                  <div style={{ color: "#64748b", fontSize: "14px", marginBottom: "8px" }}>{user.email}</div>
                  <span className={`doc-role-tag ${(user.role || "EMPLOYEE").toLowerCase()}`}>
                    Active Role: {user.role || "EMPLOYEE"}
                  </span>
                </div>
              </div>

              <div className="profile-details-grid">
                <div className="profile-detail-item">
                  <div className="label">User ID</div>
                  <div className="value">#{user.id}</div>
                </div>
                <div className="profile-detail-item">
                  <div className="label">Status</div>
                  <div className="value" style={{ color: "#10b981" }}>Active 🟢</div>
                </div>
                <div className="profile-detail-item">
                  <div className="label">Decisions Authored</div>
                  <div className="value">{decisions.filter((d) => d.created_by === user.id).length}</div>
                </div>
                <div className="profile-detail-item">
                  <div className="label">Documents Attached</div>
                  <div className="value">{allDocuments.filter((doc) => doc.uploaded_by_name === user.name).length}</div>
                </div>
              </div>

              <div className="role-switcher-panel">
                <h4>Switch Active Testing Role</h4>
                <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                  Test the platform from both sides: switch between <strong>EMPLOYEE</strong> (can author decisions & upload documents) and <strong>MANAGER</strong> (can review documents & approve decisions).
                </p>
                <div className="role-pill-buttons">
                  {["EMPLOYEE", "REVIEWER", "MANAGER", "ADMINISTRATOR"].map((r) => (
                    <button
                      key={r}
                      className={`role-pill-btn ${user.role === r ? "active" : ""}`}
                      onClick={() => {
                        setUser((u) => ({ ...u, role: r }));
                        triggerToast(`Active role switched to ${r}`);
                      }}
                    >
                      {r} {user.role === r && "✓"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 8: SETTINGS (Separate Dedicated Page)
            ========================================================= */}
        {activeTab === "Settings" && (
          <div className="page-view-container">
            <div className="page-header-card">
              <div className="page-title-group">
                <h2>
                  <SettingsIcon />
                  <span>Platform Settings</span>
                </h2>
                <p>System configuration, API endpoints, and connection status.</p>
              </div>
            </div>

            <div className="profile-box-card">
              <div className="profile-details-grid">
                <div className="profile-detail-item">
                  <div className="label">Backend API URL</div>
                  <div className="value">{API_URL}</div>
                </div>
                <div className="profile-detail-item">
                  <div className="label">Backend Server Status</div>
                  <div className="value" style={{ color: "#10b981" }}>Online & Synchronized 🟢</div>
                </div>
                <div className="profile-detail-item">
                  <div className="label">Database</div>
                  <div className="value">PostgreSQL (expert_decision_replay_db)</div>
                </div>
                <div className="profile-detail-item">
                  <div className="label">Upload Storage</div>
                  <div className="value">backend/uploads/ (Local File Storage)</div>
                </div>
              </div>
            </div>
          </div>
        )}
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

              <div className="form-group">
                <label>Tags (Comma separated)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. architecture, security, database, microservices"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Decision Rationale & Technical Analysis</label>
                <textarea
                  className="form-textarea"
                  placeholder="Document architectural justifications, risk assessments, and why this option was chosen..."
                  value={formRationale}
                  onChange={(e) => setFormRationale(e.target.value)}
                  rows={3}
                />
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

      {/* Create Team Modal */}
      {isCreateTeamModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateTeamModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Team</h2>
              <button
                className="modal-close-btn"
                onClick={() => setIsCreateTeamModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form className="modal-form" onSubmit={handleCreateTeamSubmit}>
              <div className="form-group">
                <label>Team Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Infrastructure Engineering, Security Guild"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description & Scope</label>
                <textarea
                  className="form-textarea"
                  placeholder="Describe this team's technical focus and responsibilities..."
                  value={newTeamDesc}
                  onChange={(e) => setNewTeamDesc(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsCreateTeamModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary-action">
                  Save Team
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

            {selectedDecision.tags && (
              <div className="detail-row" style={{ marginTop: "12px" }}>
                <span className="detail-label">Tags:</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {selectedDecision.tags.split(",").map((tg, idx) => (
                    <span key={idx} className="knowledge-tag-pill" style={{ fontSize: "11px", padding: "2px 8px" }}>
                      #{tg.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedDecision.rationale && (
              <div style={{ marginTop: "12px" }}>
                <span className="detail-label" style={{ display: "block", marginBottom: "4px" }}>
                  Rationale & Technical Justification:
                </span>
                <div className="detail-description-box" style={{ background: "#f0fdf4", borderLeft: "3px solid #059669", color: "#166534" }}>
                  {selectedDecision.rationale}
                </div>
              </div>
            )}

            {/* Decision Actions Bar: Replay & Review Submission */}
            <div style={{ display: "flex", gap: "10px", marginTop: "16px", flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn-replay-action"
                style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px", padding: "8px 14px" }}
                onClick={() => openDecisionTimeline(selectedDecision.id)}
              >
                <RotateCcwIcon size={14} /> Replay Timeline
              </button>

              {selectedDecision.status === "DRAFT" && (
                <button
                  type="button"
                  className="btn-primary-action"
                  style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px", padding: "8px 14px", background: "#2563eb" }}
                  onClick={() => handleSubmitForReview(selectedDecision.id)}
                >
                  <ClipboardCheckIcon size={14} /> Submit for Review
                </button>
              )}
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
              <h4>Supporting Documents & Technical Artifacts</h4>

              {/* Cross-Role Notice */}
              {((user?.role || "").toUpperCase() === "MANAGER" || (user?.role || "").toUpperCase() === "ADMINISTRATOR") ? (
                <div className="doc-sync-banner manager" style={{ marginBottom: "12px", padding: "10px 14px", fontSize: "12.5px" }}>
                  <span className="doc-sync-icon" style={{ fontSize: "16px" }}>👔</span>
                  <div>
                    <strong>Manager Review:</strong> The document(s) below were uploaded by the employee for this decision. You can download and review them before updating the decision status above.
                  </div>
                </div>
              ) : (
                <div className="doc-sync-banner employee" style={{ marginBottom: "12px", padding: "10px 14px", fontSize: "12.5px" }}>
                  <span className="doc-sync-icon" style={{ fontSize: "16px" }}>📁</span>
                  <div>
                    <strong>Shared with Manager:</strong> Any document you upload here is saved centrally and immediately visible to your <strong>Manager</strong> when they log in to review this decision.
                  </div>
                </div>
              )}

              {/* Upload row: only shown to Employee, completely hidden for Manager */}
              {((user?.role || "").toUpperCase() !== "MANAGER") && (
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
              )}

              {uploadedFiles.length > 0 ? (
                <div>
                  {uploadedFiles.map((f) => (
                    <div className="file-list-item" key={f.id}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span>📄</span>
                        <span style={{ fontWeight: 600 }}>{f.filename}</span>
                        {((user?.role || "").toUpperCase() === "MANAGER") ? (
                          <span className="doc-role-tag employee" style={{ fontSize: "10px" }}>
                            Uploaded by Employee
                          </span>
                        ) : (
                          <span className="doc-role-tag employee" style={{ fontSize: "10px" }}>
                            ✓ Synced & Visible to Manager
                          </span>
                        )}
                      </div>
                      <button
                        className="btn-table-view"
                        onClick={() =>
                          window.open(`${API_URL}/files/${f.id}/download`, "_blank")
                        }
                      >
                        ⬇️ Download
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: "12.5px", color: "#94a3b8", padding: "6px 0" }}>
                  {((user?.role || "").toUpperCase() === "MANAGER")
                    ? "No supporting files were uploaded by the employee for this decision."
                    : "No files uploaded for this decision yet. Use the field above to attach supporting documents."}
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

      {/* MODULE 6: DECISION REPLAY TIMELINE MODAL */}
      {selectedTimelineDecision && (
        <div className="modal-overlay" onClick={() => { setSelectedTimelineDecision(null); setTimelineData(null); }}>
          <div className="modal-card timeline-modal-card" style={{ maxWidth: "780px", width: "92%" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "22px" }}>⏱️</span>
                <div>
                  <h2 style={{ margin: 0 }}>Interactive Decision Replay</h2>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                    Chronological lifecycle audit & rationale replay
                  </span>
                </div>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => { setSelectedTimelineDecision(null); setTimelineData(null); }}
              >
                ✕
              </button>
            </div>

            {loadingTimeline ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                Loading lifecycle timeline replay...
              </div>
            ) : timelineData ? (
              <div>
                <div style={{ background: "#f8fafc", padding: "14px 18px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                    <div>
                      <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", color: "#0f172a" }}>
                        {timelineData.decision?.title}
                      </h3>
                      <div style={{ display: "flex", gap: "12px", fontSize: "12px", color: "#64748b", flexWrap: "wrap" }}>
                        <span><strong>Team:</strong> {timelineData.decision?.team || "Unassigned"}</span>
                        <span><strong>Type:</strong> {timelineData.decision?.decision_type || "N/A"}</span>
                        <span><strong>Created:</strong> {timelineData.decision?.created_at ? new Date(timelineData.decision.created_at).toLocaleDateString() : "N/A"}</span>
                      </div>
                    </div>
                    <div>
                      {renderStatusBadge(timelineData.decision?.status || "DRAFT")}
                    </div>
                  </div>
                  {timelineData.decision?.rationale && (
                    <div style={{ marginTop: "10px", fontSize: "12.5px", color: "#334155", background: "#ffffff", padding: "10px 12px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                      <strong>Recorded Rationale:</strong> {timelineData.decision.rationale}
                    </div>
                  )}
                </div>

                {/* Timeline Stepper */}
                <div className="timeline-stepper" style={{ maxHeight: "420px", overflowY: "auto", paddingRight: "8px" }}>
                  {timelineData.events && timelineData.events.length > 0 ? (
                    timelineData.events.map((evt, idx) => {
                      let nodeType = "info";
                      if (evt.event_type === "CREATED") nodeType = "primary";
                      else if (evt.event_type === "APPROVED") nodeType = "done";
                      else if (evt.event_type === "REJECTED") nodeType = "danger";
                      else if (evt.event_type === "REQUEST_CHANGES" || evt.event_type === "ESCALATED") nodeType = "warning";
                      else if (evt.event_type === "STATUS_CHANGED") nodeType = "current";

                      return (
                        <div className="timeline-event-node" key={evt.id || idx}>
                          <div className={`timeline-marker ${nodeType}`}>
                            {evt.event_type === "APPROVED" ? "✓" : evt.event_type === "REJECTED" ? "✕" : (idx + 1)}
                          </div>
                          <div className="timeline-content-card">
                            <div className="timeline-event-header">
                              <span className="timeline-event-title">{evt.title}</span>
                              <span className="timeline-event-time">
                                {evt.created_at ? new Date(evt.created_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" }) : "N/A"}
                              </span>
                            </div>
                            {evt.description && (
                              <p className="timeline-event-desc">{evt.description}</p>
                            )}
                            <div className="timeline-actor-row">
                              <span>👤 {evt.actor_name || "System"}</span>
                              {evt.actor_role && (
                                <span className="timeline-actor-badge">{evt.actor_role}</span>
                              )}
                              <span style={{ fontSize: "11px", color: "#94a3b8" }}>Event: {evt.event_type}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
                      No timeline events recorded yet.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "30px", color: "#ef4444" }}>
                Failed to load timeline details.
              </div>
            )}

            <div className="modal-actions-row" style={{ marginTop: "20px" }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => { setSelectedTimelineDecision(null); setTimelineData(null); }}
              >
                Close Replay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MILESTONE 3: APPROVAL ACTION MODAL */}
      {approvalActionModal && (
        <div className="modal-overlay" onClick={() => setApprovalActionModal(null)}>
          <div className="modal-card" style={{ maxWidth: "560px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Approval Sign-Off Review</h2>
              <button className="modal-close-btn" onClick={() => setApprovalActionModal(null)}>✕</button>
            </div>

            <div style={{ marginBottom: "16px", background: "#f8fafc", padding: "12px 16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>
                {approvalActionModal.decision_title || `Decision #${approvalActionModal.decision_id}`}
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center", fontSize: "12px", color: "#64748b" }}>
                <span><strong>Workflow Stage:</strong> Level {approvalActionModal.stage} ({approvalActionModal.stage === 1 ? "Peer / Technical Review" : "Manager Final Sign-Off"})</span>
              </div>
            </div>

            <div className="form-group">
              <label>Review Notes / Feedback (Optional for Approve, Required for Reject/Changes)</label>
              <textarea
                className="form-textarea"
                placeholder="Enter feedback, required revisions, or architectural verification details..."
                value={approvalActionComment}
                onChange={(e) => setApprovalActionComment(e.target.value)}
                rows={3}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px", flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setApprovalActionModal(null)}
                disabled={isApprovingAction}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-review-status in-review"
                style={{ borderRadius: "6px", fontSize: "12.5px" }}
                disabled={isApprovingAction}
                onClick={() => handleApprovalAction(approvalActionModal.id, "REQUEST_CHANGES")}
              >
                Request Changes
              </button>
              <button
                type="button"
                className="btn-review-status reject"
                style={{ borderRadius: "6px", fontSize: "12.5px" }}
                disabled={isApprovingAction}
                onClick={() => handleApprovalAction(approvalActionModal.id, "REJECT")}
              >
                Reject
              </button>
              <button
                type="button"
                className="btn-review-status approve"
                style={{ borderRadius: "6px", fontSize: "12.5px" }}
                disabled={isApprovingAction}
                onClick={() => handleApprovalAction(approvalActionModal.id, "APPROVE")}
              >
                {isApprovingAction ? "Submitting..." : "Sign Off & Approve"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MILESTONE 3: ESCALATION MODAL */}
      {escalationModal && (
        <div className="modal-overlay" onClick={() => setEscalationModal(null)}>
          <div className="modal-card" style={{ maxWidth: "520px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Escalate Decision to Management</h2>
              <button className="modal-close-btn" onClick={() => setEscalationModal(null)}>✕</button>
            </div>

            <form onSubmit={handleEscalateSubmit}>
              <div style={{ marginBottom: "16px", background: "#fef2f2", padding: "12px 16px", borderRadius: "8px", border: "1px solid #fee2e2" }}>
                <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#991b1b", marginBottom: "4px" }}>
                  Escalation Target: {escalationModal.decision_title || `Approval #${escalationModal.approval_id}`}
                </div>
                <div style={{ fontSize: "12px", color: "#b91c1c" }}>
                  This will flag the pending review to executive leadership and managers for accelerated intervention.
                </div>
              </div>

              <div className="form-group">
                <label>Escalation Reason & Urgency *</label>
                <textarea
                  className="form-textarea"
                  placeholder="State why normal review timeline cannot be observed (e.g. deadline risk, critical blocker, conflicting architectural advice)..."
                  value={escalationReason}
                  onChange={(e) => setEscalationReason(e.target.value)}
                  rows={4}
                  required
                />
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setEscalationModal(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-review-status reject"
                  style={{ borderRadius: "6px", fontSize: "13px" }}
                >
                  Confirm Escalation ⚠️
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
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
