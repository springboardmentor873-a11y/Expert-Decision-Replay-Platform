import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DecisionKnowledgeGraph from "../components/DecisionKnowledgeGraph";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

function EmployeeDashboard() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  const API_URL = "http://localhost:5173";

  const [decisions, setDecisions] = useState([]);
const [loading, setLoading] = useState(true);

const [searchQuery, setSearchQuery] = useState("");
const [category, setCategory] = useState("General");
const [selectedCategory, setSelectedCategory] = useState("All");
const [searchResults, setSearchResults] = useState([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");

  // Documents section
  const [documents, setDocuments] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentMessage, setDocumentMessage] = useState("");

  // Documents attached while creating a decision
  const [selectedFiles, setSelectedFiles] = useState([]);

  // Discussions
  const [discussions, setDiscussions] = useState([]);
  const [discussionMessage, setDiscussionMessage] = useState("");
  const [discussionText, setDiscussionText] = useState("");

  // Alternatives
  const [alternatives, setAlternatives] = useState([]);
  const [selectedDecision, setSelectedDecision] = useState("");

  // Audit History
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditDecision, setAuditDecision] = useState(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditMessage, setAuditMessage] = useState("");
  // Review & Feedback
const [feedbackDecision, setFeedbackDecision] = useState(null);
// Notifications
const [notifications, setNotifications] = useState([]);
const [unreadCount, setUnreadCount] = useState(0);
const [notificationOpen, setNotificationOpen] = useState(false);
const [notificationLoading, setNotificationLoading] = useState(false);
  const [alternativeName, setAlternativeName] = useState("");
  const [alternativeDescription, setAlternativeDescription] =
    useState("");

  const [cost, setCost] = useState("");
  const [performance, setPerformance] = useState("");
  const [scalability, setScalability] = useState("");
  const [risk, setRisk] = useState("");
  const [alternativeMessage, setAlternativeMessage] = useState("");
  // ==================== TEAMS ====================

const [teams, setTeams] = useState([]);
const [myTeams, setMyTeams] = useState([]);
const [teamLoading, setTeamLoading] = useState(false);
const [teamMessage, setTeamMessage] = useState("");
const [teamSearch, setTeamSearch] = useState("");
const [requestedTeams, setRequestedTeams] = useState([]);

// =====================================================
// TEAM DETAILS
// =====================================================

const [selectedTeam, setSelectedTeam] = useState(null);
const [teamDetails, setTeamDetails] = useState(null);
const [teamDetailsLoading, setTeamDetailsLoading] = useState(false);
const [teamDetailsMessage, setTeamDetailsMessage] = useState("");
const [activeSection, setActiveSection] = useState("dashboard");
const [allDecisions, setAllDecisions] = useState([]);
const [expandedGraphNode, setExpandedGraphNode] = useState(null);
const [selectedGraphDecision, setSelectedGraphDecision] = useState(null);
// =====================================================
// REPORTS & EXPORT
// =====================================================

const [activeReport, setActiveReport] = useState("decisions");
const [reportData, setReportData] = useState(null);
const [reportLoading, setReportLoading] = useState(false);
const [reportError, setReportError] = useState("");
  // ============================================================
// REVIEWER + MANAGER FEEDBACK
// ============================================================
const openFeedback = (decision) => {
  setFeedbackDecision(decision);
};

const closeFeedback = () => {
  setFeedbackDecision(null);
};

  // Fetch decisions created by logged-in employee
  const fetchDecisions = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/decisions/my-decisions`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch decisions"
        );
      }

      setDecisions(data);
    } catch (error) {
      console.error(error);
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };
  // =====================================================
// FETCH REPORTS
// =====================================================

const fetchReport = async (type) => {
  try {
    setReportLoading(true);
    setReportError("");
    setReportData(null);

    const response = await fetch(
      `${API_URL}/api/reports/${type}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to fetch report"
      );
    }

    setReportData(data);
  } catch (error) {
    console.error("Report Error:", error);
    setReportError(
      error.message || "Failed to load report"
    );
  } finally {
    setReportLoading(false);
  }
};
const searchDecisions = async () => {
  if (!searchQuery.trim() && selectedCategory === "All") {
    setSearchResults([]);
    return;
  }

  try {
    const params = new URLSearchParams();

    if (searchQuery.trim()) {
      params.append("query", searchQuery);
    }

    if (selectedCategory !== "All") {
      params.append("category", selectedCategory);
    }

    const response = await fetch(
      `${API_URL}/api/decisions/search?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Search failed"
      );
    }

    setSearchResults(data.decisions);
  } catch (error) {
    console.error(error);
    setMessage(error.message);
  }
};
  // Fetch uploaded documents
  const fetchDocuments = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/documents/my-documents`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch documents"
        );
      }

      setDocuments(data);
    } catch (error) {
      console.error(error);
      setDocumentMessage(error.message);
    }
  };

  // Fetch discussions
  const fetchDiscussions = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/discussions`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch discussions"
        );
      }

      setDiscussions(data);
    } catch (error) {
      console.error(error);
      setDiscussionMessage(error.message);
    }
  };

  // Fetch alternatives
  const fetchAlternatives = async (decisionId) => {
    if (!decisionId) {
      setAlternatives([]);
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/alternatives/decision/${decisionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch alternatives"
        );
      }

      setAlternatives(data);
    } catch (error) {
      console.error(error);
      setAlternativeMessage(error.message);
    }
  };

  useEffect(() => {
  fetchDecisions();
  fetchDocuments();
  fetchDiscussions();
  fetchNotifications();
}, []);
// =====================================================
// FETCH REPORT WHEN REPORT TYPE CHANGES
// =====================================================

useEffect(() => {
  fetchReport(activeReport);
}, [activeReport]);
  // ============================================================
  // AUDIT HISTORY
 // ============================================================
// PDF EXPORT
// ============================================================

const exportPDF = () => {
  if (!reportData) {
    alert("No report data available.");
    return;
  }

  const doc = new jsPDF("landscape");

  const reportTitles = {
    decisions: "Decision Report",
    approvals: "Approval Report",
    teams: "Team Performance Report",
    audit: "Audit Activity Report",
  };

  const title = reportTitles[activeReport];

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 18);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Generated: ${new Date().toLocaleString()}`,
    14,
    26
  );

  let columns = [];
  let rows = [];

  // ----------------------------------------------------------
  // DECISION REPORT
  // ----------------------------------------------------------

  if (activeReport === "decisions") {
    columns = [
      "Decision",
      "Category",
      "Created By",
      "Status",
      "Created",
    ];

    rows = (reportData.decisions || []).map((decision) => [
      decision.title || "Untitled Decision",
      decision.category || "—",
      decision.createdBy?.name || "Unknown",
      decision.status || "Unknown",
      decision.createdAt
        ? new Date(
            decision.createdAt
          ).toLocaleDateString()
        : "—",
    ]);
  }

  // ----------------------------------------------------------
  // APPROVAL REPORT
  // ----------------------------------------------------------

  if (activeReport === "approvals") {
    const approvals =
      reportData.approvals ||
      reportData.decisions ||
      [];

    columns = [
      "Decision",
      "Created By",
      "Status",
      "Reviewed By",
      "Approved By",
    ];

    rows = approvals.map((decision) => [
      decision.title || "Untitled Decision",
      decision.createdBy?.name || "Unknown",
      decision.status || "Unknown",
      decision.reviewedBy?.name || "Not reviewed",
      decision.approvedBy?.name || "Not approved",
    ]);
  }

  // ----------------------------------------------------------
  // TEAM REPORT
  // ----------------------------------------------------------

  if (activeReport === "teams") {
    columns = [
      "Team",
      "Manager",
      "Members",
      "Decisions",
      "Approved",
      "Pending",
      "Rejected",
    ];

    rows = (reportData.teams || []).map((team) => [
      team.name || "Unnamed Team",
      team.manager?.name || "No manager",
      team.memberCount || 0,
      team.decisionCount || 0,
      team.approved || 0,
      team.pendingReview || 0,
      team.rejected || 0,
    ]);
  }

  // ----------------------------------------------------------
  // AUDIT REPORT
  // ----------------------------------------------------------

  if (activeReport === "audit") {
    columns = [
      "Action",
      "User",
      "Decision",
      "Category",
      "Date & Time",
    ];

    rows = (reportData.logs || []).map((log) => [
      log.action || log.event || "Action",
      log.performedBy?.name || "Unknown",
      log.decision?.title || "No decision",
      log.decision?.category || "—",
      log.createdAt
        ? new Date(log.createdAt).toLocaleString()
        : "—",
    ]);
  }

  autoTable(doc, {
    head: [columns],
    body: rows,
    startY: 34,
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 4,
      valign: "middle",
    },
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  doc.save(
    `${activeReport}-report-${Date.now()}.pdf`
  );
};


// ============================================================
// EXCEL EXPORT
// ============================================================

const exportExcel = () => {
  if (!reportData) {
    alert("No report data available.");
    return;
  }

  let rows = [];

  // ----------------------------------------------------------
  // DECISION REPORT
  // ----------------------------------------------------------

  if (activeReport === "decisions") {
    rows = (reportData.decisions || []).map(
      (decision) => ({
        Decision:
          decision.title || "Untitled Decision",
        Category:
          decision.category || "—",
        "Created By":
          decision.createdBy?.name || "Unknown",
        "Created By Email":
          decision.createdBy?.email || "—",
        Status:
          decision.status || "Unknown",
        "Reviewed By":
          decision.reviewedBy?.name || "—",
        "Approved By":
          decision.approvedBy?.name || "—",
        Created:
          decision.createdAt
            ? new Date(
                decision.createdAt
              ).toLocaleString()
            : "—",
      })
    );
  }

  // ----------------------------------------------------------
  // APPROVAL REPORT
  // ----------------------------------------------------------

  if (activeReport === "approvals") {
    const approvals =
      reportData.approvals ||
      reportData.decisions ||
      [];

    rows = approvals.map((decision) => ({
      Decision:
        decision.title || "Untitled Decision",
      Category:
        decision.category || "—",
      "Created By":
        decision.createdBy?.name || "Unknown",
      "Created By Email":
        decision.createdBy?.email || "—",
      Status:
        decision.status || "Unknown",
      "Reviewed By":
        decision.reviewedBy?.name || "Not reviewed",
      "Reviewer Email":
        decision.reviewedBy?.email || "—",
      "Approved By":
        decision.approvedBy?.name || "Not approved",
      "Approver Email":
        decision.approvedBy?.email || "—",
      Updated:
        decision.updatedAt
          ? new Date(
              decision.updatedAt
            ).toLocaleString()
          : "—",
    }));
  }

  // ----------------------------------------------------------
  // TEAM REPORT
  // ----------------------------------------------------------

  if (activeReport === "teams") {
    rows = (reportData.teams || []).map(
      (team) => ({
        Team:
          team.name || "Unnamed Team",
        Description:
          team.description || "—",
        Manager:
          team.manager?.name || "No manager",
        "Manager Email":
          team.manager?.email || "—",
        Members:
          team.memberCount || 0,
        Decisions:
          team.decisionCount || 0,
        Approved:
          team.approved || 0,
        "Pending Review":
          team.pendingReview || 0,
        "Under Review":
          team.underReview || 0,
        Rejected:
          team.rejected || 0,
        Created:
          team.createdAt
            ? new Date(
                team.createdAt
              ).toLocaleString()
            : "—",
      })
    );
  }

  // ----------------------------------------------------------
  // AUDIT REPORT
  // ----------------------------------------------------------

  if (activeReport === "audit") {
    rows = (reportData.logs || []).map(
      (log) => ({
        Action:
          log.action ||
          log.event ||
          "Action",
        User:
          log.performedBy?.name ||
          "Unknown",
        "User Email":
          log.performedBy?.email || "—",
        Decision:
          log.decision?.title ||
          "No decision",
        Category:
          log.decision?.category || "—",
        Status:
          log.decision?.status || "—",
        "Date & Time":
          log.createdAt
            ? new Date(
                log.createdAt
              ).toLocaleString()
            : "—",
      })
    );
  }

  if (rows.length === 0) {
    alert("No report records available for export.");
    return;
  }

  const worksheet =
    XLSX.utils.json_to_sheet(rows);

  // Make columns easier to read
  const columnWidths = Object.keys(rows[0]).map(
    (key) => {
      const maxLength = Math.max(
        key.length,
        ...rows.map((row) =>
          String(row[key] ?? "").length
        )
      );

      return {
        wch: Math.min(
          Math.max(maxLength + 2, 12),
          35
        ),
      };
    }
  );

  worksheet["!cols"] = columnWidths;

  const workbook =
    XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Report"
  );

  XLSX.writeFile(
    workbook,
    `${activeReport}-report-${Date.now()}.xlsx`
  );
}; // ============================================================

  const fetchAuditHistory = async (decision) => {
    if (!decision?._id) return;

    try {
      setAuditLoading(true);
      setAuditMessage("");
      setAuditDecision(decision);
      setAuditLogs([]);

      const response = await fetch(
        `${API_URL}/api/audit-logs/decision/${decision._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch audit history"
        );
      }

      setAuditLogs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Audit history error:", error);
      setAuditMessage(error.message);
    } finally {
      setAuditLoading(false);
    }
  };

  const closeAuditHistory = () => {
    setAuditDecision(null);
    setAuditLogs([]);
    setAuditMessage("");
    setAuditLoading(false);
  };

  const formatAuditDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  // ============================================================
// NOTIFICATIONS
// ============================================================

const fetchNotifications = async () => {
  try {
    setNotificationLoading(true);

    const response = await fetch(
      `${API_URL}/api/notifications`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to fetch notifications"
      );
    }

    setNotifications(Array.isArray(data) ? data : []);

    const unread = Array.isArray(data)
      ? data.filter((notification) => !notification.isRead).length
      : 0;

    setUnreadCount(unread);
  } catch (error) {
    console.error("Fetch notifications error:", error);
  } finally {
    setNotificationLoading(false);
  }
};

const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await fetch(
      `${API_URL}/api/notifications/${notificationId}/read`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to mark notification as read"
      );
    }

    setNotifications((previousNotifications) =>
      previousNotifications.map((notification) =>
        notification._id === notificationId
          ? {
              ...notification,
              isRead: true,
            }
          : notification
      )
    );

    setUnreadCount((previousCount) =>
      Math.max(0, previousCount - 1)
    );
  } catch (error) {
    console.error("Mark notification read error:", error);
  }
};

const markAllNotificationsAsRead = async () => {
  try {
    const response = await fetch(
      `${API_URL}/api/notifications/read-all`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to mark all notifications as read"
      );
    }

    setNotifications((previousNotifications) =>
      previousNotifications.map((notification) => ({
        ...notification,
        isRead: true,
      }))
    );

    setUnreadCount(0);
  } catch (error) {
    console.error(
      "Mark all notifications read error:",
      error
    );
  }
};

  // ============================================================
  // CREATE DECISION + OPTIONAL DOCUMENTS
  // ============================================================

  const handleCreateDecision = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const formData = new FormData();

      // Add decision information
      formData.append("title", title);
      formData.append("description", description);
      formData.append("category", category);

      // Add optional documents
      selectedFiles.forEach((file) => {
        formData.append("documents", file);
      });

      const response = await fetch(
        `${API_URL}/api/decisions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create decision"
        );
      }

      // Reset decision fields
      setTitle("");
      setDescription("");
      setCategory("General");

      // Reset selected documents
      setSelectedFiles([]);

      const decisionFileInput =
        document.getElementById("decisionDocuments");

      if (decisionFileInput) {
        decisionFileInput.value = "";
      }

      // Success message
      if (selectedFiles.length > 0) {
        setMessage(
          `Decision created and ${selectedFiles.length} document(s) uploaded successfully!`
        );
      } else {
        setMessage("Decision created successfully!");
      }

      // Refresh data
      fetchDecisions();
      fetchDocuments();
    } catch (error) {
      console.error(error);
      setMessage(error.message);
    }
  };

  // ============================================================
  // SELECT DOCUMENTS FOR NEW DECISION
  // ============================================================

  const handleDecisionFileSelection = (e) => {
    const files = Array.from(e.target.files);

    if (files.length > 10) {
      setMessage(
        "You can upload a maximum of 10 documents."
      );

      e.target.value = "";
      setSelectedFiles([]);
      return;
    }

    setSelectedFiles(files);
    setMessage("");
  };

  // ============================================================
  // SEPARATE DOCUMENT UPLOAD
  // ============================================================

  const handleDocumentUpload = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      setDocumentMessage("Please select a file");
      return;
    }

    try {
      const formData = new FormData();

      formData.append("document", selectedFile);

      const response = await fetch(
        `${API_URL}/api/documents/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Document upload failed"
        );
      }

      setDocumentMessage(
        "Document uploaded successfully!"
      );

      setSelectedFile(null);

      fetchDocuments();
    } catch (error) {
      console.error(error);
      setDocumentMessage(error.message);
    }
  };

  // ============================================================
  // CREATE DISCUSSION
  // ============================================================

  const handleCreateDiscussion = async (e) => {
    e.preventDefault();

    if (!discussionText.trim()) {
      setDiscussionMessage(
        "Please enter a discussion message"
      );
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/discussions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: discussionText,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create discussion"
        );
      }

      setDiscussionText("");

      setDiscussionMessage(
        "Discussion created successfully!"
      );

      fetchDiscussions();
    } catch (error) {
      console.error(error);
      setDiscussionMessage(error.message);
    }
  };

  // ============================================================
  // ADD ALTERNATIVE
  // ============================================================

  const handleAddAlternative = async (e) => {
    e.preventDefault();

    setAlternativeMessage("");

    if (!selectedDecision) {
      setAlternativeMessage(
        "Please select a decision first."
      );
      return;
    }

    if (!alternativeName.trim()) {
      setAlternativeMessage(
        "Please enter an alternative name."
      );
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/alternatives`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            decision: selectedDecision,
            name: alternativeName,
            description: alternativeDescription,
            cost,
            performance,
            scalability,
            risk,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to add alternative"
        );
      }

      setAlternativeName("");
      setAlternativeDescription("");
      setCost("");
      setPerformance("");
      setScalability("");
      setRisk("");

      setAlternativeMessage(
        "Alternative added successfully!"
      );

      fetchAlternatives(selectedDecision);
    } catch (error) {
      console.error(error);
      setAlternativeMessage(error.message);
    }
  };

  // ============================================================
  // DELETE DOCUMENT
  // ============================================================

  const handleDeleteDocument = async (documentId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this document?"
    );

    if (!confirmDelete) return;

    try {
      const response = await fetch(
        `${API_URL}/api/documents/${documentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete document"
        );
      }

      setDocumentMessage(
        "Document deleted successfully!"
      );

      fetchDocuments();
    } catch (error) {
      console.error(error);
      setDocumentMessage(error.message);
    }
  };

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  // ============================================================
  // SCROLL
  // ============================================================

 const scrollToSection = (sectionId) => {
  setActiveSection(sectionId);

  const section = document.getElementById(sectionId);

  if (section) {
    section.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
};

  // ============================================================
  // STATISTICS
  // ============================================================

  const totalDecisions = decisions.length;

  const inReview = decisions.filter(
    (decision) =>
      decision.status === "Pending Review" ||
      decision.status === "Under Review"
  ).length;

  const approved = decisions.filter(
    (decision) => decision.status === "Approved"
  ).length;

  const rejected = decisions.filter(
    (decision) => decision.status === "Rejected"
  ).length;

  const chartData = [
    {
      name: "In Review",
      decisions: inReview,
    },
    {
      name: "Approved",
      decisions: approved,
    },
    {
      name: "Rejected",
      decisions: rejected,
    },
  ];

  // ============================================================
  // DATE FORMAT
  // ============================================================

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };
// =====================================================
// TEAM FUNCTIONS
// =====================================================

// Fetch all active teams
const fetchTeams = async () => {
  try {
    setTeamLoading(true);

    const response = await fetch(
      "http://localhost:5173/api/teams",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to fetch teams"
      );
    }

    setTeams(data);
  } catch (error) {
    console.error("Fetch Teams Error:", error);
    setTeamMessage(
      error.message || "Failed to load teams"
    );
  } finally {
    setTeamLoading(false);
  }
};


// Fetch teams where employee is already a member
const fetchMyTeams = async () => {
  try {
    const response = await fetch(
      "http://localhost:5173/api/teams/my-teams",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to fetch my teams"
      );
    }

    setMyTeams(data);
  } catch (error) {
    console.error("Fetch My Teams Error:", error);
  }
};

// =====================================================
// FETCH COMPLETE TEAM DETAILS
// =====================================================

const fetchTeamDetails = async (teamId) => {
  try {
    setTeamDetailsLoading(true);
    setTeamDetailsMessage("");

    const response = await fetch(
      `http://localhost:5173/api/teams/${teamId}/details`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to fetch team details"
      );
    }

    setTeamDetails(data);
    setSelectedTeam(teamId);

  } catch (error) {
    console.error(
      "Fetch Team Details Error:",
      error
    );

    setTeamDetailsMessage(
      error.message ||
      "Failed to load team details"
    );

  } finally {
    setTeamDetailsLoading(false);
  }
};
// =====================================================
// CLOSE TEAM DETAILS
// =====================================================

const closeTeamDetails = () => {
  setSelectedTeam(null);
  setTeamDetails(null);
  setTeamDetailsMessage("");
};
// Request to join a team
const requestToJoinTeam = async (teamId) => {
    try {
        setTeamMessage("");

        const response = await fetch(
            "http://localhost:5173/api/teams/join-request",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    teamId: teamId,
                }),
            }
        );

        const data = await response.json();

        console.log("JOIN REQUEST RESPONSE:", response.status);
        console.log("JOIN REQUEST DATA:", data);

        if (!response.ok) {
            setTeamMessage(
                data.message || "Failed to send join request"
            );
            return;
        }

        setRequestedTeams((prev) => [
            ...prev,
            teamId,
        ]);

        setTeamMessage(
            data.message ||
            "Join request sent successfully!"
        );

    } catch (error) {
        console.error("Join Team Error:", error);

        setTeamMessage(
            "Unable to connect to the server."
        );
    }
};

// Load teams when dashboard opens
useEffect(() => {
  fetchTeams();
  fetchMyTeams();
}, []);
  return (
    <div style={styles.container}>
      {/* SIDEBAR */}

      <aside style={styles.sidebar}>
        <div style={styles.brand}>
          <div style={styles.logoIcon}>◉</div>

          <div>
            <h2 style={styles.brandTitle}>
              Expert Decision
            </h2>

            <p style={styles.brandSub}>
              Replay Platform
            </p>
          </div>
        </div>

       <div style={styles.navSection}>

  {/* DASHBOARD */}
  <button
    style={
      activeSection === "dashboard"
        ? styles.activeMenu
        : styles.menuButton
    }
    onClick={() => {
      setActiveSection("dashboard");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }}
  >
    <span>⌂</span>
    Dashboard
  </button>

  {/* NEW DECISION */}
  <button
    style={
      activeSection === "new-decision"
        ? styles.activeMenu
        : styles.menuButton
    }
    onClick={() => scrollToSection("new-decision")}
  >
    <span>＋</span>
    New Decision
  </button>

  {/* MY DECISIONS */}
  <button
    style={
      activeSection === "my-decisions"
        ? styles.activeMenu
        : styles.menuButton
    }
    onClick={() => scrollToSection("my-decisions")}
  >
    <span>▣</span>
    My Decisions
  </button>

  {/* DECISION HISTORY */}
  <button
    style={
      activeSection === "my-decisions"
        ? styles.activeMenu
        : styles.menuButton
    }
    onClick={() => scrollToSection("my-decisions")}
  >
    <span>◷</span>
    Decision History
  </button>

  {/* DOCUMENTS */}
  <button
    style={
      activeSection === "documents"
        ? styles.activeMenu
        : styles.menuButton
    }
    onClick={() => scrollToSection("documents")}
  >
    📎 Documents
  </button>

  {/* DISCUSSIONS */}
  <button
    style={
      activeSection === "discussions"
        ? styles.activeMenu
        : styles.menuButton
    }
    onClick={() => scrollToSection("discussions")}
  >
    💬 Discussions
  </button>

  {/* COMPARE ALTERNATIVES */}
  <button
    style={
      activeSection === "alternatives"
        ? styles.activeMenu
        : styles.menuButton
    }
    onClick={() => scrollToSection("alternatives")}
  >
    📊 Compare Alternatives
  </button>

  {/* KNOWLEDGE REPOSITORY */}
<button
  style={
    activeSection === "repository"
      ? styles.activeMenu
      : styles.menuButton
  }
  onClick={() => scrollToSection("repository")}
>
  <span>🔍</span>
  Knowledge Repository
</button>

{/* REPORTS & EXPORT */}
<button
  style={
    activeSection === "reports"
      ? styles.activeMenu
      : styles.menuButton
  }
  onClick={() => scrollToSection("reports")}
>
  <span>📈</span>
  Reports & Export
</button>

</div>

<button
  style={styles.logoutButton}
  onClick={handleLogout}
>
  <span>⇥</span>
  Logout
</button>
      </aside>
  

{searchQuery && searchResults.length === 0 && (
  <p
    style={{
      marginTop: "20px",
      color: "#6b7280",
    }}
  >
    No decisions found.
  </p>
)}

      {/* MAIN AREA */}

      <main style={styles.main}>
 
        {/* TOP BAR */}

        <div style={styles.topbar}>
          <div />

          <div style={styles.profileArea}>
            <div
  style={styles.notificationWrapper}
  onClick={() => {
    setNotificationOpen((previous) => !previous);

    if (!notificationOpen) {
      fetchNotifications();
    }
  }}
>
  <div style={styles.notification}>
    🔔
  </div>

  {unreadCount > 0 && (
    <span style={styles.notificationBadge}>
      {unreadCount > 99 ? "99+" : unreadCount}
    </span>
  )}

  {notificationOpen && (
    <div
      style={styles.notificationDropdown}
      onClick={(event) => event.stopPropagation()}
    >
      <div style={styles.notificationHeader}>
        <div>
          <strong>Notifications</strong>

          {unreadCount > 0 && (
            <span style={styles.notificationUnreadText}>
              {unreadCount} unread
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            style={styles.markAllButton}
            onClick={markAllNotificationsAsRead}
          >
            Mark all as read
          </button>
        )}
      </div>

      <div style={styles.notificationList}>
        {notificationLoading ? (
          <div style={styles.notificationEmpty}>
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div style={styles.notificationEmpty}>
            <div style={styles.emptyNotificationIcon}>🔔</div>
            <p>No notifications yet.</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification._id}
              style={{
                ...styles.notificationItem,
                backgroundColor: notification.isRead
                  ? "#ffffff"
                  : "#f8fafc",
              }}
              onClick={() => {
                if (!notification.isRead) {
                  markNotificationAsRead(notification._id);
                }
              }}
            >
              <div style={styles.notificationItemIcon}>
                {notification.type === "Decision Approved"
                  ? "✓"
                  : notification.type === "Decision Rejected"
                  ? "✕"
                  : notification.type === "Decision Reviewed"
                  ? "📋"
                  : "🔔"}
              </div>

              <div style={styles.notificationItemContent}>
                <div style={styles.notificationItemTop}>
                  <strong>{notification.type}</strong>

                  {!notification.isRead && (
                    <span style={styles.unreadDot}></span>
                  )}
                </div>

                <p style={styles.notificationMessage}>
                  {notification.message}
                </p>

                <span style={styles.notificationDate}>
                  {formatAuditDate(notification.createdAt)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )}
</div>

            <div style={styles.avatar}>
              {user?.name?.charAt(0)?.toUpperCase() ||
                "E"}
            </div>

            <div>
              <strong style={styles.userName}>
                {user?.name || "Employee"}
              </strong>

              <p style={styles.userRole}>
                {user?.role || "Employee"}
              </p>
            </div>
          </div>
        </div>

        <div style={styles.content}>
          {/* WELCOME */}

          <section style={styles.welcome}>
            <div>
              <h1 style={styles.welcomeTitle}>
                Welcome back, {user?.name || "Employee"}! 👋
              </h1>

              <p style={styles.welcomeText}>
                Track your decisions and follow their
                review progress.
              </p>
            </div>

            <p style={styles.date}>
              {new Date().toLocaleDateString(
                "en-IN",
                {
                  weekday: "long",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                }
              )}
            </p>
          </section>

          {/* STATISTICS */}

          <section style={styles.stats}>
            <div
              style={{
                ...styles.statCard,
                ...styles.totalCard,
              }}
            >
              <div style={styles.statIcon}>▣</div>

              <div>
                <h2 style={styles.statNumber}>
                  {totalDecisions}
                </h2>

                <p style={styles.statLabel}>
                  My Decisions
                </p>

                <p style={styles.smallText}>
                  Total submitted
                </p>
              </div>
            </div>

            <div
              style={{
                ...styles.statCard,
                ...styles.pendingCard,
              }}
            >
              <div style={styles.statIcon}>◷</div>

              <div>
                <h2 style={styles.statNumber}>
                  {inReview}
                </h2>

                <p style={styles.statLabel}>
                  In Review
                </p>

                <p style={styles.smallText}>
                  Awaiting progress
                </p>
              </div>
            </div>

            <div
              style={{
                ...styles.statCard,
                ...styles.approvedCard,
              }}
            >
              <div style={styles.statIcon}>✓</div>

              <div>
                <h2 style={styles.statNumber}>
                  {approved}
                </h2>

                <p style={styles.statLabel}>
                  Approved
                </p>

                <p style={styles.smallText}>
                  Successfully completed
                </p>
              </div>
            </div>

            <div
              style={{
                ...styles.statCard,
                ...styles.rejectedCard,
              }}
            >
              <div style={styles.statIcon}>✕</div>

              <div>
                <h2 style={styles.statNumber}>
                  {rejected}
                </h2>

                <p style={styles.statLabel}>
                  Rejected
                </p>

                <p style={styles.smallText}>
                  Needs reconsideration
                </p>
              </div>
            </div>
          </section>

          {/* DECISION ANALYTICS */}

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>
              Decision Analytics
            </h2>

            <div style={styles.chartContainer}>
              <ResponsiveContainer
                width="100%"
                height={210}
              >
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis dataKey="name" />

                  <YAxis allowDecimals={false} />

                  <Tooltip />

                  <Bar
                    dataKey="decisions"
                    fill="#4f46e5"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* QUICK ACTIONS */}

          <section style={styles.quickPanel}>
            <div>
              <h2 style={styles.panelTitle}>
                Quick Actions
              </h2>

              <p style={styles.panelText}>
                Create a new decision or review your
                existing submissions.
              </p>
            </div>

            <button
              style={styles.primaryButton}
              onClick={() =>
                scrollToSection("new-decision")
              }
            >
              ＋ New Decision
            </button>
          </section>

          {/* =====================================================
              NEW DECISION
          ===================================================== */}

          <section
            id="new-decision"
            style={styles.section}
          >
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>
                  Create New Decision
                </h2>

                <p style={styles.sectionSubtitle}>
                  Record a business or technical decision
                  for review.
                </p>
              </div>
            </div>
<div style={styles.formGroup}>
  <label style={styles.label}>Category</label>

  <select
    value={category}
    onChange={(e) => setCategory(e.target.value)}
    style={styles.input}
  >
    <option value="General">General</option>
    <option value="Technical">Technical</option>
    <option value="Business">Business</option>
    <option value="Financial">Financial</option>
    <option value="HR">HR</option>
    <option value="Operational">Operational</option>
  </select>
</div>
            <form
              onSubmit={handleCreateDecision}
              style={styles.formCard}
            >
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Decision Title
                </label>

                <input
                  type="text"
                  value={title}
                  onChange={(e) =>
                    setTitle(e.target.value)
                  }
                  placeholder="Enter decision title"
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Decision Description
                </label>

                <textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  placeholder="Describe the problem, context and decision"
                  rows="6"
                  required
                  style={styles.textarea}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Attach Documents
                </label>

                <input
                  id="decisionDocuments"
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={
                    handleDecisionFileSelection
                  }
                  style={styles.fileInput}
                />

                <p style={styles.helperText}>
                  Maximum 10 documents. Supported formats:
                  PDF, DOC, DOCX, JPG, JPEG and PNG.
                </p>

                {selectedFiles.length > 0 && (
                  <div
                    style={
                      styles.selectedFilesContainer
                    }
                  >
                    <p
                      style={
                        styles.selectedFilesTitle
                      }
                    >
                      Selected Documents:
                    </p>

                    {selectedFiles.map(
                      (file, index) => (
                        <div
                          key={`${file.name}-${index}`}
                          style={
                            styles.selectedFileItem
                          }
                        >
                          <span>
                            📄 {file.name}
                          </span>

                          <span
                            style={
                              styles.fileSize
                            }
                          >
                            {(
                              file.size /
                              (1024 * 1024)
                            ).toFixed(2)}{" "}
                            MB
                          </span>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>

              {message && (
                <div style={styles.successMessage}>
                  {message}
                </div>
              )}

              <button
                type="submit"
                style={styles.primaryButton}
              >
                Create Decision
              </button>
            </form>
          </section>

          {/* =====================================================
              MY DECISIONS
          ===================================================== */}

          <section
            id="my-decisions"
            style={styles.section}
          >
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>
                  My Decisions
                </h2>

                <p style={styles.sectionSubtitle}>
                  View the decisions you have submitted
                  and track their status.
                </p>
              </div>
            </div>

            <div style={styles.tableCard}>
              {loading ? (
                <div style={styles.loading}>
                  Loading decisions...
                </div>
              ) : decisions.length === 0 ? (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>
                    ▣
                  </div>

                  <h3 style={styles.emptyTitle}>
                    No decisions yet
                  </h3>

                  <p style={styles.emptyText}>
                    Create your first decision to start
                    tracking the review process.
                  </p>
                </div>
              ) : (
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>
                          Title
                        </th>

                        <th style={styles.th}>
                          Status
                        </th>

                        <th style={styles.th}>
                          Created
                        </th>

                        <th style={styles.th}>
                          History
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {decisions.map((decision) => (
                        <tr key={decision._id}>
                          <td style={styles.td}>
  <strong style={styles.decisionTitle}>
    {decision.title}
  </strong>

  <p style={styles.decisionDescription}>
    {decision.description}
  </p>

  {decision.documents && decision.documents.length > 0 && (
    <div
      style={{
        marginTop: "12px",
        padding: "10px 12px",
        background: "#f9fafb",
        borderRadius: "8px",
        border: "1px solid #e5e7eb",
      }}
    >
      <div
        style={{
          fontSize: "13px",
          fontWeight: "600",
          marginBottom: "8px",
          color: "#374151",
        }}
      >
        📎 Documents
      </div>

      {decision.documents.map((document) => (
        <div
          key={document._id}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
            padding: "6px 0",
          }}
        >
          <span
            style={{
              fontSize: "13px",
              color: "#4b5563",
            }}
          >
            📄 {document.originalName || document.filename}
          </span>

          <a
  href={`http://localhost:5173/${document.filePath}`}
  target="_blank"
  rel="noopener noreferrer"
  style={{
    fontSize: "12px",
    color: "#047857",
    fontWeight: "600",
    textDecoration: "none",
  }}
>
  View
</a>
        </div>
      ))}
    </div>
  )}
</td>

                          <td style={styles.td}>
                            <span
                              style={{
                                ...styles.statusBadge,
                                ...(decision.status ===
                                "Approved"
                                  ? styles.approvedBadge
                                  : decision.status ===
                                    "Rejected"
                                  ? styles.rejectedBadge
                                  : decision.status ===
                                    "Under Review"
                                  ? styles.reviewBadge
                                  : styles.pendingBadge),
                              }}
                            >
                              {decision.status}
                            </span>
                          </td>

                          <td style={styles.td}>
                            {formatDate(
                              decision.createdAt
                            )}
                          </td>

                          <td style={styles.td}>
  <div style={styles.decisionActionButtons}>
    <button
      type="button"
      style={styles.feedbackButton}
      onClick={() => openFeedback(decision)}
    >
      💬 Feedback
    </button>

    <button
      type="button"
      style={styles.historyButton}
      onClick={() => fetchAuditHistory(decision)}
    >
      ◷ View History
    </button>
  </div>
</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
<section
  id="repository"
  style={{
    ...styles.section,
    paddingBottom: "40px",
  }}
>
  {/* ==============================
      SECTION HEADER
  ============================== */}
  <div style={styles.sectionHeader}>
    <div>
      <h2 style={styles.sectionTitle}>
        Knowledge Repository
      </h2>

      <p style={styles.sectionSubtitle}>
        Search and explore decisions from the organization.
      </p>
    </div>
  </div>

  {/* ==============================
      REPOSITORY CARD
  ============================== */}
  <div
    style={{
      ...styles.tableCard,
      padding: "24px",
    }}
  >
    {/* ==============================
        SEARCH AREA
    ============================== */}
    <div
      style={{
        display: "flex",
        gap: "12px",
        alignItems: "center",
        marginBottom:
          searchResults.length > 0 ? "24px" : "0",
      }}
    >
      {/* SEARCH INPUT */}
      <div
        style={{
          position: "relative",
          flex: 1,
        }}
      >
        <span
          style={{
            position: "absolute",
            left: "15px",
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: "16px",
            color: "#64748b",
            pointerEvents: "none",
          }}
        >
          🔍
        </span>

        <input
          type="text"
          placeholder="Search decisions by title or description..."
          value={searchQuery}
          onChange={(e) =>
            setSearchQuery(e.target.value)
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              searchDecisions();
            }
          }}
          style={{
            width: "100%",
            height: "46px",
            boxSizing: "border-box",
            padding: "0 15px 0 44px",
            border: "1px solid #d1d5db",
            borderRadius: "10px",
            background: "#ffffff",
            color: "#111827",
            fontSize: "14px",
            outline: "none",
          }}
        />
      </div>

      {/* CATEGORY FILTER */}
      <select
        value={selectedCategory}
        onChange={(e) =>
          setSelectedCategory(e.target.value)
        }
        style={{
          width: "180px",
          height: "46px",
          padding: "0 12px",
          border: "1px solid #d1d5db",
          borderRadius: "10px",
          backgroundColor: "#ffffff",
          color: "#111827",
          fontSize: "14px",
          cursor: "pointer",
          outline: "none",
        }}
      >
        <option value="All">
          All Categories
        </option>

        <option value="Technical">
          Technical
        </option>

        <option value="Business">
          Business
        </option>

        <option value="Financial">
          Financial
        </option>

        <option value="HR">
          HR
        </option>

        <option value="Operational">
          Operational
        </option>

        <option value="General">
          General
        </option>
      </select>

      {/* SEARCH BUTTON */}
      <button
        type="button"
        onClick={searchDecisions}
        style={{
          ...styles.searchButton,
          height: "46px",
          padding: "0 24px",
          borderRadius: "10px",
          fontWeight: "600",
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        Search
      </button>
    </div>

    {/* ==============================
        SEARCH RESULTS
    ============================== */}
    {searchResults.length > 0 && (
      <div
        style={{
          marginTop: "24px",
        }}
      >
        {/* RESULTS HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: "17px",
              fontWeight: "600",
              color: "#1f2937",
            }}
          >
            Search Results
          </h3>

          <span
            style={{
              padding: "5px 10px",
              borderRadius: "20px",
              background: "#ecfdf5",
              color: "#047857",
              fontSize: "13px",
              fontWeight: "600",
            }}
          >
            {searchResults.length} found
          </span>
        </div>

        {/* RESULT CARDS */}
        <div
          style={{
            display: "grid",
            gap: "14px",
          }}
        >
          {searchResults.map((decision) => (
            <div
              key={decision._id}
              style={{
                padding: "20px",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                background: "#ffffff",
                boxShadow:
                  "0 2px 8px rgba(0, 0, 0, 0.04)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "15px",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <h3
                    style={{
                      margin: "0 0 8px",
                      fontSize: "18px",
                      fontWeight: "600",
                      color: "#111827",
                    }}
                  >
                    {decision.title}
                  </h3>

                  <p
                    style={{
                      margin: 0,
                      color: "#6b7280",
                      lineHeight: "1.6",
                      fontSize: "14px",
                    }}
                  >
                    {decision.description ||
                      "No description available."}
                  </p>
                </div>

                {/* STATUS */}
                <span
                  style={{
                    display: "inline-block",
                    padding: "6px 12px",
                    borderRadius: "20px",

                    background:
                      decision.status === "Approved"
                        ? "#dcfce7"
                        : decision.status === "Rejected"
                        ? "#fee2e2"
                        : "#fef3c7",

                    color:
                      decision.status === "Approved"
                        ? "#166534"
                        : decision.status === "Rejected"
                        ? "#991b1b"
                        : "#92400e",

                    fontSize: "12px",
                    fontWeight: "600",
                    whiteSpace: "nowrap",
                  }}
                >
                  {decision.status || "Pending"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* ==============================
        NO RESULTS
    ============================== */}
    {searchQuery.trim() &&
      searchResults.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "35px 20px",
            color: "#6b7280",
          }}
        >
          <div
            style={{
              fontSize: "30px",
              marginBottom: "10px",
            }}
          >
            🔎
          </div>

          <p
            style={{
              margin: 0,
              fontSize: "14px",
            }}
          >
            No decisions found for "
            {searchQuery}"
          </p>
        </div>
      )}

    {/* ==============================
        KNOWLEDGE GRAPH
    ============================== */}
    <div
      style={{
        marginTop:
          searchResults.length > 0 ||
          searchQuery.trim()
            ? "28px"
            : "0",
      }}
    >
      <DecisionKnowledgeGraph allDecisions={decisions} />
    </div>
  </div>
</section>
{/* ============================================================
    REPORTS & EXPORT
============================================================ */}

<section
  id="reports"
  style={{
    ...styles.section,
    paddingBottom: "60px",
  }}
>
  {/* HEADER */}
  <div
    style={{
      marginBottom: "26px",
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        gap: "20px",
        flexWrap: "wrap",
      }}
    >
      <div>
        <h2
          style={{
            margin: 0,
            fontSize: "26px",
            fontWeight: "800",
            color: "#172033",
            letterSpacing: "-0.4px",
          }}
        >
          Reports & Export
        </h2>

        <p
          style={{
            margin: "7px 0 0",
            color: "#64748b",
            fontSize: "14px",
          }}
        >
          Analyze organizational decisions, approvals, teams, and
          system activity.
        </p>
      </div>

      <div
        style={{
          padding: "7px 12px",
          borderRadius: "20px",
          background: "#f1f5f9",
          color: "#475569",
          fontSize: "12px",
          fontWeight: "600",
        }}
      >
        Live Report Data
      </div>
    </div>
  </div>

  {/* REPORT NAVIGATION */}
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: "10px",
      padding: "8px",
      marginBottom: "24px",
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: "14px",
      boxShadow: "0 2px 8px rgba(15, 23, 42, 0.03)",
    }}
  >
    {[
      {
        id: "decisions",
        icon: "📋",
        label: "Decision Reports",
        description: "Decision overview",
      },
      {
        id: "approvals",
        icon: "✓",
        label: "Approval Reports",
        description: "Approval activity",
      },
      {
        id: "teams",
        icon: "👥",
        label: "Team Reports",
        description: "Team performance",
      },
      {
        id: "audit",
        icon: "◉",
        label: "Audit Reports",
        description: "System activity",
      },
    ].map((report) => {
      const active = activeReport === report.id;

      return (
        <button
          key={report.id}
          type="button"
          onClick={() => setActiveReport(report.id)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "11px",
            padding: "14px 15px",
            borderRadius: "10px",
            border: active
              ? "1px solid #c7d2fe"
              : "1px solid transparent",
            background: active ? "#eef2ff" : "transparent",
            cursor: "pointer",
            textAlign: "left",
            transition: "all 0.2s ease",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              borderRadius: "9px",
              background: active ? "#4f46e5" : "#f1f5f9",
              color: active ? "#ffffff" : "#64748b",
              fontSize: "16px",
              fontWeight: "700",
            }}
          >
            {report.icon}
          </div>

          <div>
            <div
              style={{
                color: active ? "#3730a3" : "#334155",
                fontSize: "13px",
                fontWeight: "700",
              }}
            >
              {report.label}
            </div>

            <div
              style={{
                marginTop: "3px",
                color: "#94a3b8",
                fontSize: "11px",
              }}
            >
              {report.description}
            </div>
          </div>
        </button>
      );
    })}
  </div>

  {/* REPORT BODY */}
  <div
    style={{
      background: "#f8fafc",
      border: "1px solid #e2e8f0",
      borderRadius: "16px",
      padding: "24px",
    }}
  >
    {/* REPORT TITLE + EXPORT */}
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "20px",
        paddingBottom: "22px",
        marginBottom: "24px",
        borderBottom: "1px solid #e2e8f0",
        flexWrap: "wrap",
      }}
    >
      <div>
        <h3
          style={{
            margin: 0,
            color: "#172033",
            fontSize: "20px",
            fontWeight: "800",
          }}
        >
          {activeReport === "decisions" && "Decision Report"}

          {activeReport === "approvals" && "Approval Report"}

          {activeReport === "teams" && "Team Performance Report"}

          {activeReport === "audit" && "Audit Activity Report"}
        </h3>

        <p
          style={{
            margin: "6px 0 0",
            color: "#64748b",
            fontSize: "13px",
          }}
        >
          {activeReport === "decisions" &&
            "Overview of all organizational decisions and their current status."}

          {activeReport === "approvals" &&
            "Track decisions that have moved through the review and approval process."}

          {activeReport === "teams" &&
            "Monitor team membership and decision activity across the organization."}

          {activeReport === "audit" &&
            "Review important actions and activity recorded across the platform."}
        </p>
      </div>

      <div
        style={{
          display: "flex",
          gap: "9px",
        }}
      >
        <button
  type="button"
  onClick={exportPDF}
  style={{
    padding: "10px 15px",
    borderRadius: "8px",
    border: "none",
    background: "#4f46e5",
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
  }}
>
  📄 Export PDF
</button>

<button
  type="button"
  onClick={exportExcel}
  style={{
    padding: "10px 15px",
    borderRadius: "8px",
    border: "none",
    background: "#059669",
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
  }}
>
  📊 Export Excel
</button>
      </div>
    </div>

    {/* LOADING */}
    {reportLoading ? (
      <div
        style={{
          minHeight: "280px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "#64748b",
        }}
      >
        <div
          style={{
            width: "38px",
            height: "38px",
            border: "4px solid #e2e8f0",
            borderTop: "4px solid #4f46e5",
            borderRadius: "50%",
            marginBottom: "14px",
            animation: "spin 1s linear infinite",
          }}
        />

        <div
          style={{
            fontSize: "14px",
            fontWeight: "600",
          }}
        >
          Generating report...
        </div>
      </div>
    ) : reportError ? (
      /* ERROR */
      <div
        style={{
          padding: "18px",
          borderRadius: "10px",
          background: "#fef2f2",
          border: "1px solid #fecaca",
          color: "#b91c1c",
          fontSize: "13px",
        }}
      >
        {reportError}
      </div>
    ) : reportData ? (
      <>
        {/* =====================================================
            DECISION REPORT
        ===================================================== */}

        {activeReport === "decisions" && (
          <>
            {/* KPI CARDS */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(5, minmax(0, 1fr))",
                gap: "14px",
                marginBottom: "26px",
              }}
            >
              {[
                [
                  "Total Decisions",
                  reportData.statistics?.total || 0,
                  "#4f46e5",
                  "All decisions",
                ],
                [
                  "Pending Review",
                  reportData.statistics?.pendingReview || 0,
                  "#d97706",
                  "Awaiting review",
                ],
                [
                  "Under Review",
                  reportData.statistics?.underReview || 0,
                  "#2563eb",
                  "Currently reviewed",
                ],
                [
                  "Approved",
                  reportData.statistics?.approved || 0,
                  "#059669",
                  "Successfully approved",
                ],
                [
                  "Rejected",
                  reportData.statistics?.rejected || 0,
                  "#dc2626",
                  "Not approved",
                ],
              ].map(([label, value, color, subtitle]) => (
                <div
                  key={label}
                  style={{
                    padding: "20px",
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    boxShadow:
                      "0 2px 6px rgba(15,23,42,0.03)",
                  }}
                >
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: color,
                      marginBottom: "13px",
                    }}
                  />

                  <div
                    style={{
                      color: "#64748b",
                      fontSize: "11px",
                      fontWeight: "700",
                    }}
                  >
                    {label}
                  </div>

                  <div
                    style={{
                      marginTop: "7px",
                      color: color,
                      fontSize: "27px",
                      fontWeight: "800",
                    }}
                  >
                    {value}
                  </div>

                  <div
                    style={{
                      marginTop: "5px",
                      color: "#94a3b8",
                      fontSize: "10px",
                    }}
                  >
                    {subtitle}
                  </div>
                </div>
              ))}
            </div>

            {/* DECISION TABLE */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "18px 20px",
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                <div
                  style={{
                    color: "#172033",
                    fontSize: "15px",
                    fontWeight: "800",
                  }}
                >
                  Decision Overview
                </div>

                <div
                  style={{
                    marginTop: "4px",
                    color: "#94a3b8",
                    fontSize: "12px",
                  }}
                >
                  Complete list of organizational decisions
                </div>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.tableHeader}>
                        Decision
                      </th>

                      <th style={styles.tableHeader}>
                        Category
                      </th>

                      <th style={styles.tableHeader}>
                        Owner
                      </th>

                      <th style={styles.tableHeader}>
                        Status
                      </th>

                      <th style={styles.tableHeader}>
                        Created
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {reportData.decisions?.map((decision) => (
                      <tr key={decision._id}>
                        <td style={styles.tableCell}>
                          <strong>
                            {decision.title}
                          </strong>
                        </td>

                        <td style={styles.tableCell}>
                          {decision.category || "General"}
                        </td>

                        <td style={styles.tableCell}>
                          {decision.createdBy?.name ||
                            "Unknown"}
                        </td>

                        <td style={styles.tableCell}>
                          <span
                            style={{
                              display: "inline-flex",
                              padding: "5px 10px",
                              borderRadius: "20px",
                              background:
                                decision.status ===
                                "Approved"
                                  ? "#dcfce7"
                                  : decision.status ===
                                    "Rejected"
                                  ? "#fee2e2"
                                  : decision.status ===
                                    "Under Review"
                                  ? "#dbeafe"
                                  : "#fef3c7",
                              color:
                                decision.status ===
                                "Approved"
                                  ? "#166534"
                                  : decision.status ===
                                    "Rejected"
                                  ? "#991b1b"
                                  : decision.status ===
                                    "Under Review"
                                  ? "#1d4ed8"
                                  : "#92400e",
                              fontSize: "11px",
                              fontWeight: "700",
                            }}
                          >
                            {decision.status}
                          </span>
                        </td>

                        <td style={styles.tableCell}>
                          {new Date(
                            decision.createdAt
                          ).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

     {/* =====================================================
    APPROVAL REPORT
===================================================== */}

{activeReport === "approvals" && (
  <>
    {/* SUMMARY CARDS */}
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(4, minmax(0, 1fr))",
        gap: "16px",
        marginBottom: "26px",
      }}
    >
      {[
        [
          "Total",
          reportData.statistics?.total || 0,
          "#4f46e5",
        ],
        [
          "Approved",
          reportData.statistics?.approved || 0,
          "#059669",
        ],
        [
          "Rejected",
          reportData.statistics?.rejected || 0,
          "#dc2626",
        ],
        [
          "Under Review",
          reportData.statistics?.underReview || 0,
          "#d97706",
        ],
      ].map(([label, value, color]) => (
        <div
          key={label}
          style={{
            padding: "23px",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
          }}
        >
          <div
            style={{
              color: "#64748b",
              fontSize: "12px",
              fontWeight: "700",
              textTransform: "uppercase",
            }}
          >
            {label}
          </div>

          <div
            style={{
              marginTop: "8px",
              color,
              fontSize: "30px",
              fontWeight: "800",
            }}
          >
            {value}
          </div>
        </div>
      ))}
    </div>

    {/* INFORMATION BAR */}
    <div
      style={{
        padding: "17px 20px",
        marginBottom: "22px",
        background: "#ecfdf5",
        border: "1px solid #bbf7d0",
        borderRadius: "10px",
        color: "#166534",
        fontSize: "13px",
      }}
    >
      <strong>Approval Workflow:</strong>{" "}
      Decisions are tracked from review through final
      approval or rejection.
    </div>

    {/* APPROVAL DETAILS */}
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "14px",
        overflow: "hidden",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          padding: "20px 22px",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <div
          style={{
            fontSize: "16px",
            fontWeight: "800",
            color: "#172033",
          }}
        >
          Approval Details
        </div>

        <div
          style={{
            marginTop: "5px",
            color: "#94a3b8",
            fontSize: "12px",
          }}
        >
          Reviewers and approvers associated with each
          decision
        </div>
      </div>

      {/* TABLE */}
      <div
        style={{
          width: "100%",
          overflowX: "auto",
        }}
      >
        <table
          style={{
            width: "100%",
            minWidth: "1000px",
            borderCollapse: "collapse",
            tableLayout: "fixed",
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  width: "25%",
                  padding: "15px 18px",
                  textAlign: "left",
                  background: "#f8fafc",
                  color: "#475569",
                  fontSize: "11px",
                  fontWeight: "800",
                  textTransform: "uppercase",
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                Decision
              </th>

              <th
                style={{
                  width: "18%",
                  padding: "15px 18px",
                  textAlign: "left",
                  background: "#f8fafc",
                  color: "#475569",
                  fontSize: "11px",
                  fontWeight: "800",
                  textTransform: "uppercase",
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                Created By
              </th>

              <th
                style={{
                  width: "15%",
                  padding: "15px 18px",
                  textAlign: "left",
                  background: "#f8fafc",
                  color: "#475569",
                  fontSize: "11px",
                  fontWeight: "800",
                  textTransform: "uppercase",
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                Status
              </th>

              <th
                style={{
                  width: "21%",
                  padding: "15px 18px",
                  textAlign: "left",
                  background: "#f8fafc",
                  color: "#475569",
                  fontSize: "11px",
                  fontWeight: "800",
                  textTransform: "uppercase",
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                Reviewed By
              </th>

              <th
                style={{
                  width: "21%",
                  padding: "15px 18px",
                  textAlign: "left",
                  background: "#f8fafc",
                  color: "#475569",
                  fontSize: "11px",
                  fontWeight: "800",
                  textTransform: "uppercase",
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                Approved By
              </th>
            </tr>
          </thead>

          <tbody>
            {(
              reportData.approvals ||
              reportData.decisions ||
              []
            ).length > 0 ? (
              (
                reportData.approvals ||
                reportData.decisions ||
                []
              ).map((decision) => (
                <tr
                  key={decision._id}
                  style={{
                    borderBottom:
                      "1px solid #f1f5f9",
                  }}
                >
                  {/* DECISION */}
                  <td
                    style={{
                      padding: "17px 18px",
                      verticalAlign: "top",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: "700",
                        color: "#172033",
                        lineHeight: "1.5",
                      }}
                    >
                      {decision.title ||
                        "Untitled Decision"}
                    </div>

                    <div
                      style={{
                        marginTop: "4px",
                        fontSize: "11px",
                        color: "#94a3b8",
                      }}
                    >
                      {decision.category ||
                        "No category"}
                    </div>
                  </td>

                  {/* CREATED BY */}
                  <td
                    style={{
                      padding: "17px 18px",
                      verticalAlign: "top",
                    }}
                  >
                    {decision.createdBy ? (
                      <>
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: "600",
                            color: "#334155",
                          }}
                        >
                          {decision.createdBy.name ||
                            "Unknown"}
                        </div>

                        {decision.createdBy.email && (
                          <div
                            style={{
                              marginTop: "4px",
                              fontSize: "10px",
                              color: "#94a3b8",
                              wordBreak:
                                "break-word",
                            }}
                          >
                            {decision.createdBy.email}
                          </div>
                        )}
                      </>
                    ) : (
                      <span
                        style={{
                          color: "#94a3b8",
                          fontSize: "12px",
                        }}
                      >
                        Unknown
                      </span>
                    )}
                  </td>

                  {/* STATUS */}
                  <td
                    style={{
                      padding: "17px 18px",
                      verticalAlign: "top",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        padding: "6px 11px",
                        borderRadius: "20px",
                        background:
                          decision.status ===
                          "Approved"
                            ? "#dcfce7"
                            : decision.status ===
                              "Rejected"
                            ? "#fee2e2"
                            : "#fef3c7",
                        color:
                          decision.status ===
                          "Approved"
                            ? "#166534"
                            : decision.status ===
                              "Rejected"
                            ? "#991b1b"
                            : "#92400e",
                        fontSize: "11px",
                        fontWeight: "700",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {decision.status ||
                        "Unknown"}
                    </span>
                  </td>

                  {/* REVIEWED BY */}
                  <td
                    style={{
                      padding: "17px 18px",
                      verticalAlign: "top",
                    }}
                  >
                    {decision.reviewedBy ? (
                      <>
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: "600",
                            color: "#334155",
                          }}
                        >
                          {decision.reviewedBy.name ||
                            "Unknown"}
                        </div>

                        {decision.reviewedBy.email && (
                          <div
                            style={{
                              marginTop: "4px",
                              fontSize: "10px",
                              color: "#94a3b8",
                              wordBreak:
                                "break-word",
                            }}
                          >
                            {decision.reviewedBy.email}
                          </div>
                        )}
                      </>
                    ) : (
                      <span
                        style={{
                          color: "#94a3b8",
                          fontSize: "12px",
                        }}
                      >
                        Not reviewed
                      </span>
                    )}
                  </td>

                  {/* APPROVED BY */}
                  <td
                    style={{
                      padding: "17px 18px",
                      verticalAlign: "top",
                    }}
                  >
                    {decision.approvedBy ? (
                      <>
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: "600",
                            color: "#334155",
                          }}
                        >
                          {decision.approvedBy.name ||
                            "Unknown"}
                        </div>

                        {decision.approvedBy.email && (
                          <div
                            style={{
                              marginTop: "4px",
                              fontSize: "10px",
                              color: "#94a3b8",
                              wordBreak:
                                "break-word",
                            }}
                          >
                            {decision.approvedBy.email}
                          </div>
                        )}
                      </>
                    ) : (
                      <span
                        style={{
                          color: "#94a3b8",
                          fontSize: "12px",
                        }}
                      >
                        Not approved
                      </span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="5"
                  style={{
                    padding: "50px 20px",
                    textAlign: "center",
                    color: "#94a3b8",
                    fontSize: "13px",
                  }}
                >
                  No approval records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </>
)}
        {/* =====================================================
    TEAM REPORT
===================================================== */}

{activeReport === "teams" && (
  <>
    {/* SUMMARY CARDS */}
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(4, minmax(0, 1fr))",
        gap: "16px",
        marginBottom: "26px",
      }}
    >
      {[
        [
          "Total Teams",
          reportData.statistics?.totalTeams || 0,
          "#4f46e5",
        ],
        [
          "Total Members",
          reportData.statistics?.totalMembers || 0,
          "#2563eb",
        ],
        [
          "Total Decisions",
          reportData.statistics?.totalDecisions || 0,
          "#d97706",
        ],
        [
          "Approved",
          reportData.statistics?.totalApproved || 0,
          "#059669",
        ],
      ].map(([label, value, color]) => (
        <div
          key={label}
          style={{
            padding: "23px",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
          }}
        >
          <div
            style={{
              color: "#64748b",
              fontSize: "12px",
              fontWeight: "700",
              textTransform: "uppercase",
            }}
          >
            {label}
          </div>

          <div
            style={{
              marginTop: "8px",
              color,
              fontSize: "30px",
              fontWeight: "800",
            }}
          >
            {value}
          </div>
        </div>
      ))}
    </div>

    {/* TEAM ACTIVITY */}
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "14px",
        overflow: "hidden",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          padding: "20px 22px",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <div
          style={{
            fontSize: "16px",
            fontWeight: "800",
            color: "#172033",
          }}
        >
          Team Activity
        </div>

        <div
          style={{
            marginTop: "5px",
            color: "#94a3b8",
            fontSize: "12px",
          }}
        >
          Decision activity and membership by team
        </div>
      </div>

      {/* TABLE */}
      <div
        style={{
          width: "100%",
          overflowX: "auto",
        }}
      >
        <table
          style={{
            width: "100%",
            minWidth: "1000px",
            borderCollapse: "collapse",
            tableLayout: "fixed",
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  width: "25%",
                  padding: "15px 18px",
                  textAlign: "left",
                  background: "#f8fafc",
                  color: "#475569",
                  fontSize: "11px",
                  fontWeight: "800",
                  textTransform: "uppercase",
                  borderBottom:
                    "1px solid #e2e8f0",
                }}
              >
                Team
              </th>

              <th
                style={{
                  width: "18%",
                  padding: "15px 18px",
                  textAlign: "left",
                  background: "#f8fafc",
                  color: "#475569",
                  fontSize: "11px",
                  fontWeight: "800",
                  textTransform: "uppercase",
                  borderBottom:
                    "1px solid #e2e8f0",
                }}
              >
                Manager
              </th>

              <th
                style={{
                  width: "14%",
                  padding: "15px 18px",
                  textAlign: "left",
                  background: "#f8fafc",
                  color: "#475569",
                  fontSize: "11px",
                  fontWeight: "800",
                  textTransform: "uppercase",
                  borderBottom:
                    "1px solid #e2e8f0",
                }}
              >
                Members
              </th>

              <th
                style={{
                  width: "14%",
                  padding: "15px 18px",
                  textAlign: "left",
                  background: "#f8fafc",
                  color: "#475569",
                  fontSize: "11px",
                  fontWeight: "800",
                  textTransform: "uppercase",
                  borderBottom:
                    "1px solid #e2e8f0",
                }}
              >
                Decisions
              </th>

              <th
                style={{
                  width: "14%",
                  padding: "15px 18px",
                  textAlign: "left",
                  background: "#f8fafc",
                  color: "#475569",
                  fontSize: "11px",
                  fontWeight: "800",
                  textTransform: "uppercase",
                  borderBottom:
                    "1px solid #e2e8f0",
                }}
              >
                Approved
              </th>

              <th
                style={{
                  width: "15%",
                  padding: "15px 18px",
                  textAlign: "left",
                  background: "#f8fafc",
                  color: "#475569",
                  fontSize: "11px",
                  fontWeight: "800",
                  textTransform: "uppercase",
                  borderBottom:
                    "1px solid #e2e8f0",
                }}
              >
                Created
              </th>
            </tr>
          </thead>

          <tbody>
            {reportData.teams?.length > 0 ? (
              reportData.teams.map((team) => (
                <tr
                  key={team._id}
                  style={{
                    borderBottom:
                      "1px solid #f1f5f9",
                  }}
                >
                  {/* TEAM */}
                  <td
                    style={{
                      padding: "17px 18px",
                      verticalAlign: "top",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: "700",
                        color: "#172033",
                        lineHeight: "1.5",
                      }}
                    >
                      {team.icon || "👥"}{" "}
                      {team.name || "Unnamed Team"}
                    </div>

                    {team.description && (
                      <div
                        style={{
                          marginTop: "4px",
                          fontSize: "11px",
                          color: "#94a3b8",
                          lineHeight: "1.4",
                        }}
                      >
                        {team.description}
                      </div>
                    )}
                  </td>

                  {/* MANAGER */}
                  <td
                    style={{
                      padding: "17px 18px",
                      verticalAlign: "top",
                    }}
                  >
                    {team.manager ? (
                      <>
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: "600",
                            color: "#334155",
                          }}
                        >
                          {team.manager.name ||
                            "Unknown"}
                        </div>

                        {team.manager.email && (
                          <div
                            style={{
                              marginTop: "4px",
                              fontSize: "10px",
                              color: "#94a3b8",
                              wordBreak:
                                "break-word",
                            }}
                          >
                            {team.manager.email}
                          </div>
                        )}
                      </>
                    ) : (
                      <span
                        style={{
                          color: "#94a3b8",
                          fontSize: "12px",
                        }}
                      >
                        No manager
                      </span>
                    )}
                  </td>

                  {/* MEMBERS */}
                  <td
                    style={{
                      padding: "17px 18px",
                      verticalAlign: "top",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: "700",
                        color: "#334155",
                      }}
                    >
                      {team.memberCount || 0}
                    </span>
                  </td>

                  {/* DECISIONS */}
                  <td
                    style={{
                      padding: "17px 18px",
                      verticalAlign: "top",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: "700",
                        color: "#334155",
                      }}
                    >
                      {team.decisionCount || 0}
                    </span>
                  </td>

                  {/* APPROVED */}
                  <td
                    style={{
                      padding: "17px 18px",
                      verticalAlign: "top",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        padding: "6px 11px",
                        borderRadius: "20px",
                        background: "#dcfce7",
                        color: "#166534",
                        fontSize: "11px",
                        fontWeight: "700",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {team.approved || 0}
                    </span>
                  </td>

                  {/* CREATED */}
                  <td
                    style={{
                      padding: "17px 18px",
                      verticalAlign: "top",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#64748b",
                      }}
                    >
                      {team.createdAt
                        ? new Date(
                            team.createdAt
                          ).toLocaleDateString()
                        : "—"}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="6"
                  style={{
                    padding: "50px 20px",
                    textAlign: "center",
                    color: "#94a3b8",
                    fontSize: "13px",
                  }}
                >
                  No team records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </>
)}

        {/* =====================================================
            AUDIT REPORT
        ===================================================== */}

        {activeReport === "audit" && (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(3, minmax(0, 1fr))",
                gap: "16px",
                marginBottom: "26px",
              }}
            >
              {[
                [
                  "Total Actions",
                  reportData.summary?.totalActions || 0,
                  "#4f46e5",
                ],
                [
                  "Unique Users",
                  reportData.summary?.uniqueUsers || 0,
                  "#2563eb",
                ],
                [
                  "Unique Decisions",
                  reportData.summary?.uniqueDecisions || 0,
                  "#059669",
                ],
              ].map(([label, value, color]) => (
                <div
                  key={label}
                  style={{
                    padding: "23px",
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                  }}
                >
                  <div
                    style={{
                      color: "#64748b",
                      fontSize: "12px",
                      fontWeight: "700",
                    }}
                  >
                    {label}
                  </div>

                  <div
                    style={{
                      marginTop: "8px",
                      color,
                      fontSize: "30px",
                      fontWeight: "800",
                    }}
                  >
                    {value}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                padding: "17px 20px",
                marginBottom: "22px",
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                borderRadius: "10px",
                color: "#1e40af",
                fontSize: "13px",
              }}
            >
              <strong>Audit Trail:</strong>{" "}
              Every recorded action provides traceability for
              decisions and system activity.
            </div>

            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "18px 20px",
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                <div
                  style={{
                    fontSize: "15px",
                    fontWeight: "800",
                    color: "#172033",
                  }}
                >
                  Recent Audit Activity
                </div>

                <div
                  style={{
                    marginTop: "4px",
                    color: "#94a3b8",
                    fontSize: "12px",
                  }}
                >
                  Latest actions recorded by the platform
                </div>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.tableHeader}>
                        Action
                      </th>

                      <th style={styles.tableHeader}>
                        User
                      </th>

                      <th style={styles.tableHeader}>
                        Decision
                      </th>

                      <th style={styles.tableHeader}>
                        Date & Time
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {reportData.logs?.map((log) => (
                      <tr key={log._id}>
                        <td style={styles.tableCell}>
                          <span
                            style={{
                              display: "inline-flex",
                              padding: "5px 10px",
                              borderRadius: "20px",
                              background: "#f1f5f9",
                              color: "#475569",
                              fontSize: "11px",
                              fontWeight: "700",
                            }}
                          >
                            {log.action ||
                              log.event ||
                              "Action"}
                          </span>
                        </td>

                        <td style={styles.tableCell}>
                          <strong>
                            {log.performedBy?.name ||
                              "Unknown"}
                          </strong>
                        </td>

                        <td style={styles.tableCell}>
                          {log.decision?.title || "—"}
                        </td>

                        <td style={styles.tableCell}>
                          {new Date(
                            log.createdAt
                          ).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </>
    ) : (
      <div
        style={{
          minHeight: "250px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#64748b",
          fontSize: "14px",
        }}
      >
        Select a report to view its data.
      </div>
    )}
  </div>
</section>
          {/* =====================================================
              DOCUMENTS
          ===================================================== */}

          <section
            id="documents"
            style={styles.section}
          >
            

        

              
              {/* Document list */}

              <div style={styles.formCard}>
                <h3 style={styles.cardTitle}>
                  My Uploaded Documents
                </h3>

                {documents.length === 0 ? (
                  <p style={styles.mutedText}>
                    No documents uploaded yet.
                  </p>
                ) : (
                  <div style={styles.documentList}>
                    {documents.map((document) => (
                      <div
                        key={document._id}
                        style={
                          styles.documentItem
                        }
                      >
                        <div
                          style={
                            styles.documentInfo
                          }
                        >
                          <div
                            style={
                              styles.documentIcon
                            }
                          >
                            📄
                          </div>

                          <div>
                            <strong
                              style={
                                styles.documentName
                              }
                            >
                              {document.name ||
                                document.fileName ||
                                "Document"}
                            </strong>

                            <p
                              style={
                                styles.documentDate
                              }
                            >
                              {formatDate(
                                document.createdAt
                              )}
                            </p>
                          </div>
                        </div>

                        <div
                          style={
                            styles.documentActions
                          }
                        >
                          <a
                            href={`${API_URL}/uploads/${document.fileName}`}
                            target="_blank"
                            rel="noreferrer"
                            style={
                              styles.viewButton
                            }
                          >
                            View
                          </a>

                          <a
                            href={`${API_URL}/uploads/${document.fileName}`}
                            download
                            style={
                              styles.downloadButton
                            }
                          >
                            Download
                          </a>

                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteDocument(
                                document._id
                              )
                            }
                            style={
                              styles.deleteButton
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            
          </section>
                    {/* =====================================================
              DISCUSSIONS
          ===================================================== */}

          <section
            id="discussions"
            style={styles.section}
          >
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>
                  Discussions
                </h2>

                <p style={styles.sectionSubtitle}>
                  Share comments and participate in
                  decision discussions.
                </p>
              </div>
            </div>

            <div style={styles.twoColumnGrid}>
              {/* Create discussion */}

              <form
                onSubmit={handleCreateDiscussion}
                style={styles.formCard}
              >
                <h3 style={styles.cardTitle}>
                  Start a Discussion
                </h3>

                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Message
                  </label>

                  <textarea
                    value={discussionText}
                    onChange={(e) =>
                      setDiscussionText(
                        e.target.value
                      )
                    }
                    placeholder="Write your discussion message..."
                    rows="7"
                    style={styles.textarea}
                  />
                </div>

                {discussionMessage && (
                  <div
                    style={
                      styles.successMessage
                    }
                  >
                    {discussionMessage}
                  </div>
                )}

                <button
                  type="submit"
                  style={styles.primaryButton}
                >
                  Start Discussion
                </button>
              </form>

              {/* Discussion list */}

              <div style={styles.formCard}>
                <h3 style={styles.cardTitle}>
                  Recent Discussions
                </h3>

                {discussions.length === 0 ? (
                  <div style={styles.emptyMiniState}>
                    <div
                      style={
                        styles.emptyMiniIcon
                      }
                    >
                      💬
                    </div>

                    <p style={styles.mutedText}>
                      No discussions yet.
                    </p>
                  </div>
                ) : (
                  <div
                    style={
                      styles.discussionList
                    }
                  >
                    {discussions.map(
                      (discussion) => (
                        <div
                          key={discussion._id}
                          style={
                            styles.discussionItem
                          }
                        >
                          <div
                            style={
                              styles.discussionHeader
                            }
                          >
                            <div>
                              <strong
                                style={
                                  styles.discussionUser
                                }
                              >
                                {discussion.user
                                  ?.name ||
                                  discussion.createdBy
                                    ?.name ||
                                  "User"}
                              </strong>

                              <span
                                style={
                                  styles.discussionRole
                                }
                              >
                                {discussion.user
                                  ?.role ||
                                  discussion.createdBy
                                    ?.role ||
                                  ""}
                              </span>
                            </div>

                            <span
                              style={
                                styles.discussionDate
                              }
                            >
                              {formatDate(
                                discussion.createdAt
                              )}
                            </span>
                          </div>

                          <p
                            style={
                              styles.discussionText
                            }
                          >
                            {discussion.message ||
                              discussion.text}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* =====================================================
              ALTERNATIVES
          ===================================================== */}

          <section
            id="alternatives"
            style={styles.section}
          >
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>
                  Compare Alternatives
                </h2>

                <p style={styles.sectionSubtitle}>
                  Add and compare possible solutions for
                  your decisions.
                </p>
              </div>
            </div>

            {/* Select decision */}

            <div style={styles.formCard}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Select Decision
                </label>

                <select
                  value={selectedDecision}
                  onChange={(e) => {
                    const decisionId =
                      e.target.value;

                    setSelectedDecision(
                      decisionId
                    );

                    setAlternativeMessage("");

                    fetchAlternatives(
                      decisionId
                    );
                  }}
                  style={styles.input}
                >
                  <option value="">
                    -- Select a decision --
                  </option>

                  {decisions.map(
                    (decision) => (
                      <option
                        key={decision._id}
                        value={decision._id}
                      >
                        {decision.title}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            {selectedDecision && (
              <div
                style={
                  styles.alternativeLayout
                }
              >
                {/* Add alternative */}

                <form
                  onSubmit={
                    handleAddAlternative
                  }
                  style={styles.formCard}
                >
                  <h3 style={styles.cardTitle}>
                    Add Alternative
                  </h3>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>
                      Alternative Name
                    </label>

                    <input
                      type="text"
                      value={alternativeName}
                      onChange={(e) =>
                        setAlternativeName(
                          e.target.value
                        )
                      }
                      placeholder="e.g. Cloud migration"
                      required
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>
                      Description
                    </label>

                    <textarea
                      value={
                        alternativeDescription
                      }
                      onChange={(e) =>
                        setAlternativeDescription(
                          e.target.value
                        )
                      }
                      placeholder="Describe this alternative"
                      rows="4"
                      style={styles.textarea}
                    />
                  </div>

                  <div
                    style={
                      styles.formRow
                    }
                  >
                    <div
                      style={
                        styles.formGroup
                      }
                    >
                      <label
                        style={styles.label}
                      >
                        Cost
                      </label>

                      <input
                        type="text"
                        value={cost}
                        onChange={(e) =>
                          setCost(
                            e.target.value
                          )
                        }
                        placeholder="Low / Medium / High"
                        style={styles.input}
                      />
                    </div>

                    <div
                      style={
                        styles.formGroup
                      }
                    >
                      <label
                        style={styles.label}
                      >
                        Performance
                      </label>

                      <input
                        type="text"
                        value={performance}
                        onChange={(e) =>
                          setPerformance(
                            e.target.value
                          )
                        }
                        placeholder="Low / Medium / High"
                        style={styles.input}
                      />
                    </div>
                  </div>

                  <div
                    style={
                      styles.formRow
                    }
                  >
                    <div
                      style={
                        styles.formGroup
                      }
                    >
                      <label
                        style={styles.label}
                      >
                        Scalability
                      </label>

                      <input
                        type="text"
                        value={scalability}
                        onChange={(e) =>
                          setScalability(
                            e.target.value
                          )
                        }
                        placeholder="Low / Medium / High"
                        style={styles.input}
                      />
                    </div>

                    <div
                      style={
                        styles.formGroup
                      }
                    >
                      <label
                        style={styles.label}
                      >
                        Risk
                      </label>

                      <input
                        type="text"
                        value={risk}
                        onChange={(e) =>
                          setRisk(
                            e.target.value
                          )
                        }
                        placeholder="Low / Medium / High"
                        style={styles.input}
                      />
                    </div>
                  </div>

                  {alternativeMessage && (
                    <div
                      style={
                        styles.successMessage
                      }
                    >
                      {alternativeMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    style={styles.primaryButton}
                  >
                    Add Alternative
                  </button>
                </form>

                {/* Alternative comparison */}

                <div style={styles.formCard}>
                  <h3 style={styles.cardTitle}>
                    Alternative Comparison
                  </h3>

                  {alternatives.length === 0 ? (
                    <div
                      style={
                        styles.emptyMiniState
                      }
                    >
                      <div
                        style={
                          styles.emptyMiniIcon
                        }
                      >
                        📊
                      </div>

                      <p
                        style={
                          styles.mutedText
                        }
                      >
                        No alternatives added for
                        this decision yet.
                      </p>
                    </div>
                  ) : (
                    <div
                      style={
                        styles.comparisonTableWrapper
                      }
                    >
                      <table
                        style={
                          styles.comparisonTable
                        }
                      >
                        <thead>
                          <tr>
                            <th
                              style={
                                styles.comparisonTh
                              }
                            >
                              Alternative
                            </th>

                            <th
                              style={
                                styles.comparisonTh
                              }
                            >
                              Cost
                            </th>

                            <th
                              style={
                                styles.comparisonTh
                              }
                            >
                              Performance
                            </th>

                            <th
                              style={
                                styles.comparisonTh
                              }
                            >
                              Scalability
                            </th>

                            <th
                              style={
                                styles.comparisonTh
                              }
                            >
                              Risk
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {alternatives.map(
                            (alternative) => (
                              <tr
                                key={
                                  alternative._id
                                }
                              >
                                <td
                                  style={
                                    styles.comparisonTd
                                  }
                                >
                                  <strong>
                                    {
                                      alternative.name
                                    }
                                  </strong>

                                  {alternative.description && (
                                    <p
                                      style={
                                        styles.alternativeDescription
                                      }
                                    >
                                      {
                                        alternative.description
                                      }
                                    </p>
                                  )}
                                </td>

                                <td
                                  style={
                                    styles.comparisonTd
                                  }
                                >
                                  {
                                    alternative.cost
                                  }
                                </td>

                                <td
                                  style={
                                    styles.comparisonTd
                                  }
                                >
                                  {
                                    alternative.performance
                                  }
                                </td>

                                <td
                                  style={
                                    styles.comparisonTd
                                  }
                                >
                                  {
                                    alternative.scalability
                                  }
                                </td>

                                <td
                                  style={
                                    styles.comparisonTd
                                  }
                                >
                                  {
                                    alternative.risk
                                  }
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>

{/* ============================================================
    REVIEW + MANAGER FEEDBACK MODAL
============================================================ */}

{feedbackDecision && (
  <div
    style={styles.modalOverlay}
    onClick={closeFeedback}
  >
    <div
      style={styles.feedbackModal}
      onClick={(e) => e.stopPropagation()}
    >
      {/* HEADER */}

      <div style={styles.feedbackModalHeader}>
        <div>
          <h2 style={styles.feedbackModalTitle}>
            💬 Review & Feedback
          </h2>

          <p style={styles.feedbackDecisionTitle}>
            {feedbackDecision.title}
          </p>
        </div>

        <button
          type="button"
          onClick={closeFeedback}
          style={styles.closeModalButton}
          aria-label="Close feedback"
        >
          ✕
        </button>
      </div>

      {/* BODY */}

      <div style={styles.feedbackModalBody}>

        {/* CURRENT STATUS */}

        <div style={styles.feedbackStatusBox}>
          <span style={styles.feedbackLabel}>
            Current Status
          </span>

          <span
            style={{
              ...styles.statusBadge,
              ...(feedbackDecision.status ===
              "Approved"
                ? styles.approvedBadge
                : feedbackDecision.status ===
                  "Rejected"
                ? styles.rejectedBadge
                : feedbackDecision.status ===
                  "Under Review"
                ? styles.reviewBadge
                : styles.pendingBadge),
            }}
          >
            {feedbackDecision.status}
          </span>
        </div>

        {/* REVIEWER FEEDBACK */}

        <div style={styles.feedbackSection}>
          <div style={styles.feedbackSectionHeader}>
            <div>
              <h3 style={styles.feedbackSectionTitle}>
                👤 Reviewer Feedback
              </h3>

              <p style={styles.feedbackSectionSubtitle}>
                Comments provided during the review stage
              </p>
            </div>
          </div>

          {feedbackDecision.reviewerFeedback ? (
            <div style={styles.feedbackContentBox}>
              <p style={styles.feedbackText}>
                {feedbackDecision.reviewerFeedback}
              </p>

              {feedbackDecision.reviewedBy && (
                <div style={styles.feedbackPerson}>
                  <div style={styles.feedbackAvatar}>
                    {feedbackDecision.reviewedBy?.name
                      ?.charAt(0)
                      ?.toUpperCase() || "R"}
                  </div>

                  <div>
                    <strong style={styles.feedbackPersonName}>
                      {feedbackDecision.reviewedBy?.name ||
                        "Reviewer"}
                    </strong>

                    <span style={styles.feedbackPersonRole}>
                      {feedbackDecision.reviewedBy?.role ||
                        "Reviewer"}
                    </span>

                    {feedbackDecision.reviewedBy?.email && (
                      <span style={styles.feedbackPersonEmail}>
                        {feedbackDecision.reviewedBy.email}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={styles.noFeedbackBox}>
              <span style={styles.noFeedbackIcon}>
                ◷
              </span>

              <div>
                <strong style={styles.noFeedbackTitle}>
                  No reviewer feedback yet
                </strong>

                <p style={styles.noFeedbackText}>
                  Your decision has not received reviewer
                  feedback yet.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* MANAGER FEEDBACK */}

        <div style={styles.feedbackSection}>
          <div style={styles.feedbackSectionHeader}>
            <div>
              <h3 style={styles.feedbackSectionTitle}>
                👔 Manager Feedback
              </h3>

              <p style={styles.feedbackSectionSubtitle}>
                Final comments from the manager
              </p>
            </div>
          </div>

          {feedbackDecision.managerFeedback ? (
            <div style={styles.managerFeedbackContentBox}>
              <p style={styles.feedbackText}>
                {feedbackDecision.managerFeedback}
              </p>

              {feedbackDecision.approvedBy && (
                <div style={styles.feedbackPerson}>
                  <div style={styles.managerFeedbackAvatar}>
                    {feedbackDecision.approvedBy?.name
                      ?.charAt(0)
                      ?.toUpperCase() || "M"}
                  </div>

                  <div>
                    <strong style={styles.feedbackPersonName}>
                      {feedbackDecision.approvedBy?.name ||
                        "Manager"}
                    </strong>

                    <span style={styles.feedbackPersonRole}>
                      {feedbackDecision.approvedBy?.role ||
                        "Manager"}
                    </span>

                    {feedbackDecision.approvedBy?.email && (
                      <span style={styles.feedbackPersonEmail}>
                        {feedbackDecision.approvedBy.email}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={styles.noFeedbackBox}>
              <span style={styles.noFeedbackIcon}>
                ◷
              </span>

              <div>
                <strong style={styles.noFeedbackTitle}>
                  No manager feedback yet
                </strong>

                <p style={styles.noFeedbackText}>
                  Final manager feedback will appear here
                  after the manager reviews your decision.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* FINAL RESULT */}

        {(feedbackDecision.status === "Approved" ||
          feedbackDecision.status === "Rejected") && (
          <div
            style={{
              ...styles.finalResultBox,
              ...(feedbackDecision.status === "Approved"
                ? styles.finalApprovedBox
                : styles.finalRejectedBox),
            }}
          >
            <div style={styles.finalResultIcon}>
              {feedbackDecision.status === "Approved"
                ? "✓"
                : "✕"}
            </div>

            <div>
              <strong style={styles.finalResultTitle}>
                Decision{" "}
                {feedbackDecision.status}
              </strong>

              <p style={styles.finalResultText}>
                {feedbackDecision.status === "Approved"
                  ? "Your decision has received final approval from the manager."
                  : "Your decision has been rejected by the manager. Review the feedback above."}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}

      <div style={styles.feedbackModalFooter}>
        <button
          type="button"
          onClick={closeFeedback}
          style={styles.closeAuditButton}
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}
      {/* ============================================================
          AUDIT HISTORY MODAL
      ============================================================ */}

      {auditDecision && (
        <div
          style={styles.modalOverlay}
          onClick={closeAuditHistory}
        >
          <div
            style={styles.auditModal}
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div
              style={
                styles.auditModalHeader
              }
            >
              <div>
                <h2
                  style={
                    styles.auditModalTitle
                  }
                >
                  📜 Decision History
                </h2>

                <p
                  style={
                    styles.auditDecisionTitle
                  }
                >
                  {auditDecision.title}
                </p>
              </div>

              <button
                type="button"
                onClick={closeAuditHistory}
                style={
                  styles.closeModalButton
                }
                aria-label="Close audit history"
              >
                ✕
              </button>
            </div>

            <div
              style={
                styles.auditModalBody
              }
            >
              {auditLoading ? (
                <div
                  style={
                    styles.auditLoading
                  }
                >
                  Loading decision history...
                </div>
              ) : auditMessage ? (
                <div
                  style={
                    styles.auditError
                  }
                >
                  {auditMessage}
                </div>
              ) : auditLogs.length === 0 ? (
                <div
                  style={
                    styles.auditEmpty
                  }
                >
                  No audit history is available
                  for this decision yet.
                </div>
              ) : (
                <div
                  style={
                    styles.auditTimeline
                  }
                >
                  {auditLogs.map(
                    (log, index) => (
                      <div
                        key={
                          log._id ||
                          `${log.action}-${index}`
                        }
                        style={
                          styles.auditTimelineItem
                        }
                      >
                        <div
                          style={
                            styles.auditTimelineMarker
                          }
                        >
                          <div
                            style={
                              styles.auditDot
                            }
                          >
                            ●
                          </div>

                          {index <
                            auditLogs.length -
                              1 && (
                            <div
                              style={
                                styles.auditLine
                              }
                            />
                          )}
                        </div>

                        <div
                          style={
                            styles.auditCard
                          }
                        >
                          <div
                            style={
                              styles.auditCardHeader
                            }
                          >
                            <h3
                              style={
                                styles.auditAction
                              }
                            >
                              {log.action}
                            </h3>

                            <span
                              style={
                                styles.auditDate
                              }
                            >
                              {formatAuditDate(
                                log.createdAt
                              )}
                            </span>
                          </div>

                          <div
                            style={
                              styles.auditInfoGrid
                            }
                          >
                            <div>
                              <span
                                style={
                                  styles.auditLabel
                                }
                              >
                                Performed by
                              </span>

                              <strong
                                style={
                                  styles.auditValue
                                }
                              >
                                {log.performedBy
                                  ?.name ||
                                  "Unknown User"}
                              </strong>
                            </div>

                            <div>
                              <span
                                style={
                                  styles.auditLabel
                                }
                              >
                                Role
                              </span>

                              <strong
                                style={
                                  styles.auditValue
                                }
                              >
                                {log.performedBy
                                  ?.role || "-"}
                              </strong>
                            </div>

                            <div>
                              <span
                                style={
                                  styles.auditLabel
                                }
                              >
                                Status Change
                              </span>

                              <strong
                                style={
                                  styles.auditValue
                                }
                              >
                                {log.previousStatus
                                  ? `${log.previousStatus} → ${
                                      log.newStatus ||
                                      "-"
                                    }`
                                  : log.newStatus
                                  ? `Initial → ${log.newStatus}`
                                  : "No status change"}
                              </strong>
                            </div>
                          </div>

                          {log.details && (
                            <div
                              style={
                                styles.auditDetails
                              }
                            >
                              <span
                                style={
                                  styles.auditLabel
                                }
                              >
                                Details / Feedback
                              </span>

                              <p
                                style={
                                  styles.auditDetailsText
                                }
                              >
                                {log.details}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            <div
              style={
                styles.auditModalFooter
              }
            >
              <button
                type="button"
                onClick={closeAuditHistory}
                style={
                  styles.closeAuditButton
                }
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* =====================================================
    MY TEAMS
===================================================== */}

<section
  id="teams"
  style={{
    width: "100%",
    boxSizing: "border-box",
    marginTop: "40px",
    padding: "30px",
    background: "#ffffff",
    borderRadius: "16px",
    border: "1px solid #e5e7eb",
  }}
>
  {/* HEADER */}
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "25px",
      gap: "20px",
      flexWrap: "wrap",
    }}
  >
    <div>
      <h2
        style={{
          margin: 0,
          fontSize: "24px",
          fontWeight: "700",
          color: "#1f2937",
        }}
      >
        My Teams
      </h2>

      <p
        style={{
          margin: "6px 0 0",
          color: "#6b7280",
        }}
      >
        Collaborate with teams and participate in organizational decisions.
      </p>
    </div>

    <button
      type="button"
      onClick={fetchTeams}
      style={{
        padding: "10px 18px",
        borderRadius: "8px",
        border: "none",
        background: "#166534",
        color: "#ffffff",
        cursor: "pointer",
        fontWeight: "600",
      }}
    >
      Browse Teams
    </button>
  </div>

  {/* MESSAGE */}
  {teamMessage && (
    <div
      style={{
        marginBottom: "20px",
        padding: "12px 16px",
        borderRadius: "8px",
        background: "#f0fdf4",
        color: "#166534",
        border: "1px solid #bbf7d0",
      }}
    >
      {teamMessage}
    </div>
  )}

 {/* ============================================================
    MY CURRENT TEAMS
============================================================ */}

<div style={styles.teamSection}>

  {/* SECTION HEADER */}
  <div style={styles.teamSectionHeader}>
    <div>
      <h2 style={styles.teamSectionTitle}>
        My Current Teams
      </h2>

      <p style={styles.teamSectionSubtitle}>
        Manage your teams, members, and collaborative decisions.
      </p>
    </div>

    <div style={styles.teamCountBadge}>
      {myTeams.length}{" "}
      {myTeams.length === 1 ? "Team" : "Teams"}
    </div>
  </div>


  {/* LOADING */}
  {teamLoading && (
    <div style={styles.teamEmptyState}>
      <div style={styles.teamLoadingIcon}>
        ⟳
      </div>

      <h3>Loading your teams...</h3>

      <p>
        Please wait while we fetch your team information.
      </p>
    </div>
  )}


  {/* NO TEAMS */}
  {!teamLoading && myTeams.length === 0 && (
    <div style={styles.teamEmptyState}>

      <div style={styles.teamEmptyIcon}>
        👥
      </div>

      <h3>You haven't joined any teams yet</h3>

      <p>
        Browse the available teams below and request to
        join a team that matches your work.
      </p>

      <button
        style={styles.teamBrowseButton}
        onClick={fetchTeams}
      >
        Browse Available Teams
      </button>

    </div>
  )}


  {/* TEAM CARDS */}
  {!teamLoading && myTeams.length > 0 && (

    <div style={styles.myTeamsGrid}>

      {myTeams.map((team) => (

        <div
          key={team._id}
          style={styles.myTeamCard}
        >

          {/* CARD TOP */}
          <div style={styles.myTeamCardTop}>

            <div style={styles.myTeamIdentity}>

              <div style={styles.myTeamIcon}>
                {team.icon || "👥"}
              </div>

              <div>
                <h3 style={styles.myTeamName}>
                  {team.name}
                </h3>

                <div style={styles.myTeamStatus}>
                  <span
                    style={
                      styles.myTeamStatusDot
                    }
                  />

                  Active
                </div>
              </div>

            </div>

          </div>


          {/* DESCRIPTION */}
          <p style={styles.myTeamDescription}>
            {team.description ||
              "No team description available."}
          </p>


          {/* TEAM QUICK INFO */}
          <div style={styles.myTeamInfoGrid}>

            {/* MEMBERS */}
            <div style={styles.myTeamInfoItem}>

              <div style={styles.myTeamInfoIcon}>
                👥
              </div>

              <div>
                <span style={styles.myTeamInfoLabel}>
                  Members
                </span>

                <strong style={styles.myTeamInfoValue}>
                  {team.members?.length || 0}
                </strong>
              </div>

            </div>


            {/* MANAGER */}
            <div style={styles.myTeamInfoItem}>

              <div style={styles.myTeamInfoIcon}>
                👤
              </div>

              <div>
                <span style={styles.myTeamInfoLabel}>
                  Manager
                </span>

                <strong style={styles.myTeamInfoValue}>
                  {team.manager?.name ||
                    "Not assigned"}
                </strong>
              </div>

            </div>

          </div>


          {/* CARD FOOTER */}
          <div style={styles.myTeamCardFooter}>

            <span style={styles.teamCreatedText}>
              Created{" "}
              {team.createdAt
                ? new Date(
                    team.createdAt
                  ).toLocaleDateString(
                    "en-IN",
                    {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    }
                  )
                : "—"}
            </span>


            <button
              style={styles.viewTeamButton}
              onClick={() =>
                fetchTeamDetails(team._id)
              }
            >
              View Team
              <span>→</span>
            </button>

          </div>

        </div>

      ))}

    </div>

  )}

</div>


{/* ============================================================
    TEAM DETAILS / TEAM WORKSPACE
============================================================ */}

{selectedTeam && (
  <div style={styles.teamDetailsOverlay}>
    <div style={styles.teamDetailsModal}>

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div style={styles.teamDetailsHeader}>

        <div style={styles.teamDetailsTitleArea}>

          <div style={styles.teamDetailsIcon}>
            {teamDetails?.team?.icon || "👥"}
          </div>

          <div style={{ minWidth: 0 }}>

            <div style={styles.teamWorkspaceLabel}>
              TEAM WORKSPACE
            </div>

            <h2 style={styles.teamDetailsTitle}>
              {teamDetails?.team?.name || "Team Details"}
            </h2>

            <p style={styles.teamDetailsSubtitle}>
              {teamDetails?.team?.description ||
                "Collaborative decision-making workspace"}
            </p>

          </div>

        </div>

        <button
          style={styles.teamDetailsCloseButton}
          onClick={closeTeamDetails}
          aria-label="Close team details"
        >
          ×
        </button>

      </div>


      {/* ======================================================
          LOADING
      ====================================================== */}

      {teamDetailsLoading && (
        <div style={styles.teamDetailsLoading}>

          <div style={styles.teamLoadingIcon}>
            ⟳
          </div>

          <h3>
            Loading team workspace...
          </h3>

          <p>
            Fetching members, decisions and team activity.
          </p>

        </div>
      )}


      {/* ======================================================
          ERROR
      ====================================================== */}

      {!teamDetailsLoading && teamDetailsMessage && (
        <div style={styles.teamDetailsError}>
          {teamDetailsMessage}
        </div>
      )}


      {/* ======================================================
          MAIN TEAM WORKSPACE
      ====================================================== */}

      {!teamDetailsLoading &&
        teamDetails &&
        !teamDetailsMessage && (

          <div style={styles.teamDetailsContent}>

            {/* ==================================================
                TEAM SUMMARY
            ================================================== */}

            <div style={styles.teamOverviewCard}>

              <div style={styles.teamOverviewHeader}>

                <div>
                  <div style={styles.teamOverviewLabel}>
                    TEAM OVERVIEW
                  </div>

                  <h3 style={styles.teamOverviewTitle}>
                    {teamDetails.team.name}
                  </h3>
                </div>

                <div style={styles.activeTeamBadge}>
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "#10B981",
                      display: "inline-block"
                    }}
                  />
                  Active
                </div>

              </div>


              <p style={styles.teamOverviewDescription}>
                {teamDetails.team.description ||
                  "No team description available."}
              </p>


              <div style={styles.teamMetaRow}>

                <div>
                  <span>TEAM MANAGER: </span>
                  <strong>
                    {teamDetails.team.manager?.name ||
                      "Not assigned"}
                  </strong>
                </div>

                <div>
                  <span>MANAGER EMAIL: </span>
                  <strong>
                    {teamDetails.team.manager?.email ||
                      "—"}
                  </strong>
                </div>

                <div>
                  <span>TEAM MEMBERS: </span>
                  <strong>
                    {teamDetails.team.members?.length || 0}
                  </strong>
                </div>

              </div>

            </div>


            {/* ==================================================
                DECISION STATISTICS
            ================================================== */}

            <div style={styles.teamStatsGrid}>

              <div style={styles.teamStatCard}>
                <div style={styles.teamStatIcon}>
                  📊
                </div>

                <div>
                  <span style={styles.teamStatLabel}>
                    Total Decisions
                  </span>

                  <strong style={styles.teamStatValue}>
                    {teamDetails.statistics?.total || 0}
                  </strong>
                </div>
              </div>


              <div style={styles.teamStatCard}>
                <div style={styles.teamStatIcon}>
                  ✓
                </div>

                <div>
                  <span style={styles.teamStatLabel}>
                    Approved
                  </span>

                  <strong style={styles.teamStatValue}>
                    {teamDetails.statistics?.approved || 0}
                  </strong>
                </div>
              </div>


              <div style={styles.teamStatCard}>
                <div style={styles.teamStatIcon}>
                  🔍
                </div>

                <div>
                  <span style={styles.teamStatLabel}>
                    Under Review
                  </span>

                  <strong style={styles.teamStatValue}>
                    {teamDetails.statistics?.underReview || 0}
                  </strong>
                </div>
              </div>


              <div style={styles.teamStatCard}>
                <div style={styles.teamStatIcon}>
                  ⏳
                </div>

                <div>
                  <span style={styles.teamStatLabel}>
                    Pending
                  </span>

                  <strong style={styles.teamStatValue}>
                    {teamDetails.statistics?.pendingReview || 0}
                  </strong>
                </div>
              </div>


              <div style={styles.teamStatCard}>
                <div style={styles.teamStatIcon}>
                  ✕
                </div>

                <div>
                  <span style={styles.teamStatLabel}>
                    Rejected
                  </span>

                  <strong style={styles.teamStatValue}>
                    {teamDetails.statistics?.rejected || 0}
                  </strong>
                </div>
              </div>

            </div>


            {/* ==================================================
                TWO COLUMN WORKSPACE
            ================================================== */}

            <div style={styles.teamWorkspaceGrid}>

              {/* =================================================
                  LEFT — TEAM MEMBERS
              ================================================= */}

              <div style={styles.teamWorkspaceSection}>

                <div style={styles.teamWorkspaceSectionHeader}>

                  <div>
                    <h3>
                      Team Members
                    </h3>

                    <p>
                      People working in this team
                    </p>
                  </div>

                  <span style={styles.sectionCountBadge}>
                    {teamDetails.team.members?.length || 0}
                  </span>

                </div>


                <div style={styles.teamMembersList}>

                  {teamDetails.team.members?.length > 0 ? (

                    teamDetails.team.members.map((member) => (

                      <div
                        key={member._id}
                        style={styles.teamMemberRow}
                      >

                        {/* Avatar */}

                        <div style={styles.teamMemberAvatar}>
                          {member.name
                            ?.charAt(0)
                            ?.toUpperCase() || "U"}
                        </div>


                        {/* Member information */}

                        <div style={styles.teamMemberInfo}>

                          <strong>
                            {member.name || "Unknown User"}
                          </strong>

                          <span>
                            {member.email || "No email available"}
                          </span>

                        </div>


                        {/* Role */}

                        <span style={styles.memberRoleBadge}>
                          {member.role || "Employee"}
                        </span>


                        {/* Decision count */}

                        <div style={styles.memberDecisionCount}>

                          <strong>
                            {member.decisionCount || 0}
                          </strong>

                          <span>
                            decisions
                          </span>

                        </div>

                      </div>

                    ))

                  ) : (

                    <div style={styles.noTeamData}>

                      <div style={styles.noTeamDataIcon}>
                        👥
                      </div>

                      <div
                        style={{
                          fontWeight: 700,
                          color: "#475569",
                          fontSize: "13px"
                        }}
                      >
                        No team members
                      </div>

                      <div
                        style={{
                          marginTop: "4px",
                          color: "#94A3B8",
                          fontSize: "11px"
                        }}
                      >
                        No members are currently assigned.
                      </div>

                    </div>

                  )}

                </div>

              </div>


              {/* =================================================
                  RIGHT — RECENT DECISIONS
              ================================================= */}

              <div style={styles.teamWorkspaceSection}>

                <div style={styles.teamWorkspaceSectionHeader}>

                  <div>
                    <h3>
                      Decision Activity
                    </h3>

                    <p>
                      Latest decisions by team members
                    </p>
                  </div>

                  <span style={styles.sectionCountBadge}>
                    {teamDetails.decisions?.length || 0}
                  </span>

                </div>


                <div style={styles.teamDecisionsList}>

                  {teamDetails.decisions?.length > 0 ? (

                    teamDetails.decisions.map((decision) => (

                      <div
                        key={decision._id}
                        style={styles.teamDecisionRow}
                      >

                        <div style={styles.teamDecisionMain}>

                          <h4
                            style={{
                              margin: 0,
                              color: "#1E293B",
                              fontSize: "14px",
                              fontWeight: 700
                            }}
                          >
                            {decision.title}
                          </h4>

                          <p
                            style={{
                              margin: "5px 0 9px",
                              color: "#64748B",
                              fontSize: "12px",
                              lineHeight: 1.5
                            }}
                          >
                            {decision.description ||
                              "No description available."}
                          </p>


                          <div style={styles.teamDecisionMeta}>

                            <span>
                              {decision.category || "General"}
                            </span>

                            <span>
                              By{" "}
                              {decision.createdBy?.name ||
                                "Unknown"}
                            </span>

                            <span>
                              {decision.createdAt
                                ? new Date(
                                    decision.createdAt
                                  ).toLocaleDateString(
                                    "en-IN",
                                    {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric"
                                    }
                                  )
                                : "—"}
                            </span>

                          </div>

                        </div>


                        {/* STATUS */}

                        <span
                          style={{
                            ...styles.teamDecisionStatus,

                            ...(decision.status === "Approved"
                              ? styles.statusApproved
                              : decision.status === "Rejected"
                              ? styles.statusRejected
                              : decision.status === "Under Review"
                              ? styles.statusUnderReview
                              : styles.statusPending)
                          }}
                        >
                          {decision.status || "Pending Review"}
                        </span>

                      </div>

                    ))

                  ) : (

                    <div style={styles.noTeamData}>

                      <div style={styles.noTeamDataIcon}>
                        📋
                      </div>

                      <div
                        style={{
                          fontWeight: 700,
                          color: "#475569",
                          fontSize: "13px"
                        }}
                      >
                        No decisions yet
                      </div>

                      <div
                        style={{
                          marginTop: "4px",
                          color: "#94A3B8",
                          fontSize: "11px"
                        }}
                      >
                        Team decisions will appear here.
                      </div>

                    </div>

                  )}

                </div>

              </div>

            </div>


            {/* ==================================================
                FOOTER INFORMATION
            ================================================== */}

            <div style={styles.teamWorkspaceFooter}>

              <div>
                <span style={styles.teamFooterLabel}>
                  TEAM CREATED
                </span>

                <strong style={styles.teamFooterValue}>
                  {teamDetails.team.createdAt
                    ? new Date(
                        teamDetails.team.createdAt
                      ).toLocaleDateString(
                        "en-IN",
                        {
                          day: "2-digit",
                          month: "long",
                          year: "numeric"
                        }
                      )
                    : "—"}
                </strong>
              </div>


              <div>
                <span style={styles.teamFooterLabel}>
                  TEAM STATUS
                </span>

                <strong
                  style={{
                    ...styles.teamFooterValue,
                    color: "#059669"
                  }}
                >
                  Active
                </strong>
              </div>


              <button
                style={styles.teamFooterCloseButton}
                onClick={closeTeamDetails}
              >
                Close Workspace
              </button>

            </div>

          </div>
        )}

    </div>
  </div>
)}
  {/* =====================================================
      AVAILABLE TEAMS
  ===================================================== */}

  <div
    style={{
      borderTop: "1px solid #e5e7eb",
      paddingTop: "25px",
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "18px",
        gap: "15px",
        flexWrap: "wrap",
      }}
    >
      <div>
        <h3
          style={{
            fontSize: "18px",
            margin: 0,
            color: "#374151",
          }}
        >
          Available Teams
        </h3>

        <p
          style={{
            margin: "5px 0 0",
            fontSize: "13px",
            color: "#9ca3af",
          }}
        >
          Request to join a team
        </p>
      </div>

      <input
        type="text"
        placeholder="Search teams..."
        value={teamSearch}
        onChange={(e) => setTeamSearch(e.target.value)}
        style={{
          padding: "10px 14px",
          borderRadius: "8px",
          border: "1px solid #d1d5db",
          outline: "none",
          width: "220px",
          fontSize: "14px",
          boxSizing: "border-box",
        }}
      />
    </div>

    {/* AVAILABLE TEAMS */}

    {teams.filter((team) =>
      team.name
        .toLowerCase()
        .includes(teamSearch.toLowerCase())
    ).length === 0 ? (
      <div
        style={{
          padding: "30px",
          textAlign: "center",
          background: "#f9fafb",
          borderRadius: "10px",
          color: "#6b7280",
        }}
      >
        No matching teams found.
      </div>
    ) : (
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "18px",
          width: "100%",
        }}
      >
        {teams
          .filter((team) =>
            team.name
              .toLowerCase()
              .includes(teamSearch.toLowerCase())
          )
          .map((team) => {
            const alreadyMember = myTeams.some(
              (myTeam) =>
                String(myTeam._id) === String(team._id)
            );

            const requestSent =
              requestedTeams.includes(team._id);

            return (
              <div
                key={team._id}
                style={{
                  padding: "18px",
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  background: "#ffffff",
                  boxSizing: "border-box",
                }}
              >
                {/* ICON + STATUS */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "14px",
                  }}
                >
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "10px",
                      background: "#f0fdf4",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "22px",
                    }}
                  >
                    {team.icon || "👥"}
                  </div>

                  <span
                    style={{
                      padding: "4px 9px",
                      borderRadius: "20px",
                      background: "#ecfdf5",
                      color: "#15803d",
                      fontSize: "11px",
                      fontWeight: "600",
                    }}
                  >
                    ● Active
                  </span>
                </div>

                {/* NAME */}
                <h4
                  style={{
                    margin: "0 0 6px",
                    fontSize: "17px",
                    color: "#1f2937",
                  }}
                >
                  {team.name}
                </h4>

                {/* DESCRIPTION */}
                <p
                  style={{
                    color: "#6b7280",
                    fontSize: "13px",
                    lineHeight: "1.5",
                    margin: "0 0 12px",
                    minHeight: "40px",
                  }}
                >
                  {team.description || "No description available."}
                </p>

                {/* MEMBERS */}
                <div
                  style={{
                    color: "#4b5563",
                    fontSize: "13px",
                  }}
                >
                  👤 {team.members?.length || 0} Members
                </div>

                {/* JOIN BUTTON */}
                <button
                  type="button"
                  disabled={alreadyMember || requestSent}
                  onClick={() =>
                    requestToJoinTeam(team._id)
                  }
                  style={{
                    marginTop: "16px",
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "none",
                    cursor:
                      alreadyMember || requestSent
                        ? "default"
                        : "pointer",
                    background:
                      alreadyMember || requestSent
                        ? "#e5e7eb"
                        : "#166534",
                    color:
                      alreadyMember || requestSent
                        ? "#6b7280"
                        : "#ffffff",
                    fontWeight: "600",
                    fontSize: "13px",
                  }}
                >
                  {alreadyMember
                    ? "✓ Already a Member"
                    : requestSent
                    ? "✓ Request Pending"
                    : "＋ Request to Join"}
                </button>
              </div>
            );
          })}
      </div>
    )}

    {/* NO TEAMS */}
    {teams.length === 0 && !teamLoading && (
      <div
        style={{
          marginTop: "15px",
          padding: "30px",
          textAlign: "center",
          color: "#6b7280",
          background: "#f9fafb",
          borderRadius: "10px",
        }}
      >
        No teams are currently available.
      </div>
    )}
  </div>
</section>
      </main>
    </div>
  );
}

const styles = {
  /* ============================================================
     MAIN LAYOUT
  ============================================================ */

  container: {
    display: "flex",
    minHeight: "100vh",
    width: "100%",
    background: "#E8EEF6",
    color: "#0F172A",
    fontFamily: "Inter, Arial, Helvetica, sans-serif",
  },

  sidebar: {
    width: "252px",
    minWidth: "252px",
    height: "100vh",
    position: "fixed",
    left: 0,
    top: 0,
    display: "flex",
    flexDirection: "column",
    background: "#0F172A",
    borderRight: "1px solid #1E293B",
    boxShadow: "4px 0 18px rgba(15, 23, 42, 0.12)",
    zIndex: 100,
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "20px 18px",
    borderBottom: "1px solid #1E293B",
  },

  logoIcon: {
    width: "38px",
    height: "38px",
    borderRadius: "9px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#2563EB",
    color: "#FFFFFF",
    fontSize: "18px",
    fontWeight: "800",
    boxShadow: "0 4px 12px rgba(37, 99, 235, 0.30)",
  },

  brandTitle: {
    margin: 0,
    color: "#F8FAFC",
    fontSize: "17px",
    fontWeight: "800",
    letterSpacing: "-0.2px",
  },

  brandSub: {
    margin: "4px 0 0",
    color: "#94A3B8",
    fontSize: "12px",
    fontWeight: "500",
  },

  navSection: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    padding: "17px 10px",
    flex: 1,
  },

  menuButton: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: "11px",
    padding: "12px 13px",
    border: "1px solid transparent",
    borderRadius: "7px",
    background: "transparent",
    color: "#B8C2D1",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    textAlign: "left",
  },

  activeMenu: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: "11px",
    padding: "12px 13px",
    border: "1px solid #334155",
    borderRadius: "7px",
    background: "#1E293B",
    color: "#FFFFFF",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "700",
    textAlign: "left",
    boxShadow: "inset 3px 0 0 #3B82F6",
  },

  logoutButton: {
    margin: "0 10px 12px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px 13px",
    border: "1px solid #334155",
    borderRadius: "7px",
    background: "#151F30",
    color: "#FCA5A5",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    textAlign: "left",
  },

  main: {
    flex: 1,
    marginLeft: "252px",
    width: "calc(100% - 252px)",
    minWidth: 0,
    minHeight: "100vh",
    background: "#E8EEF6",
  },

  /* ============================================================
     TOPBAR
  ============================================================ */

  topbar: {
    height: "62px",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: "0 32px",
    background: "#FFFFFF",
    borderBottom: "1px solid #CBD5E1",
    boxShadow: "0 1px 5px rgba(15, 23, 42, 0.05)",
    position: "sticky",
    top: 0,
    zIndex: 50,
  },

  profileArea: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  notificationWrapper: {
    position: "relative",
  },

  notification: {
    width: "38px",
    height: "38px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #D1D9E6",
    borderRadius: "8px",
    background: "#FFFFFF",
    color: "#475569",
    cursor: "pointer",
    position: "relative",
    fontSize: "16px",
  },

  notificationBadge: {
    position: "absolute",
    top: "-5px",
    right: "-5px",
    minWidth: "18px",
    height: "18px",
    padding: "0 5px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "999px",
    background: "#DC2626",
    color: "#FFFFFF",
    fontSize: "10px",
    fontWeight: "800",
    border: "2px solid #FFFFFF",
  },

  notificationDropdown: {
    position: "absolute",
    top: "48px",
    right: 0,
    width: "370px",
    maxHeight: "440px",
    overflowY: "auto",
    background: "#FFFFFF",
    border: "1px solid #D1D9E6",
    borderRadius: "10px",
    boxShadow: "0 16px 40px rgba(15, 23, 42, 0.16)",
    zIndex: 200,
  },

  notificationHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "15px 17px",
    borderBottom: "1px solid #E2E8F0",
  },

  notificationUnreadText: {
    color: "#475569",
    fontSize: "13px",
    fontWeight: "600",
  },

  markAllButton: {
    border: "none",
    background: "transparent",
    color: "#2563EB",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "700",
  },

  notificationList: {
    display: "flex",
    flexDirection: "column",
  },

  notificationItem: {
    display: "flex",
    gap: "11px",
    padding: "13px 17px",
    borderBottom: "1px solid #F1F5F9",
    cursor: "pointer",
  },

  notificationItemIcon: {
    width: "32px",
    height: "32px",
    minWidth: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "7px",
    background: "#EFF6FF",
    color: "#2563EB",
    fontSize: "14px",
  },

  notificationItemContent: {
    flex: 1,
    minWidth: 0,
  },

  notificationItemTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
  },

  notificationMessage: {
    margin: 0,
    color: "#1E293B",
    fontSize: "13px",
    lineHeight: "1.5",
  },

  notificationDate: {
    marginTop: "5px",
    color: "#94A3B8",
    fontSize: "11px",
  },

  unreadDot: {
    width: "7px",
    height: "7px",
    minWidth: "7px",
    borderRadius: "50%",
    background: "#2563EB",
  },

  notificationEmpty: {
    padding: "35px 20px",
    textAlign: "center",
    color: "#64748B",
    fontSize: "13px",
  },

  emptyNotificationIcon: {
    width: "40px",
    height: "40px",
    margin: "0 auto 10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    background: "#F1F5F9",
    color: "#94A3B8",
  },

  avatar: {
    width: "36px",
    height: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "8px",
    background: "#1D4ED8",
    color: "#FFFFFF",
    fontSize: "14px",
    fontWeight: "800",
  },

  userName: {
    margin: 0,
    color: "#172033",
    fontSize: "13px",
    fontWeight: "700",
  },

  userRole: {
    margin: "3px 0 0",
    color: "#64748B",
    fontSize: "11px",
    fontWeight: "500",
  },

  /* ============================================================
     MAIN CONTENT
  ============================================================ */

  content: {
    width: "100%",
    maxWidth: "none",
    boxSizing: "border-box",
    margin: 0,
    padding: "32px 38px 60px",
  },

  welcome: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "25px",
    paddingBottom: "22px",
    marginBottom: "22px",
    borderBottom: "1px solid #CBD5E1",
  },

  welcomeTitle: {
    margin: 0,
    color: "#0F172A",
    fontSize: "31px",
    lineHeight: "1.25",
    fontWeight: "800",
    letterSpacing: "-0.7px",
  },

  welcomeText: {
    margin: "9px 0 0",
    color: "#52647A",
    fontSize: "15px",
    lineHeight: "1.55",
  },

  date: {
    padding: "10px 14px",
    border: "1px solid #CBD5E1",
    borderRadius: "8px",
    background: "#F8FAFC",
    color: "#475569",
    fontSize: "12px",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },

  /* ============================================================
     KPI / STATS
  ============================================================ */

  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "17px",
    marginBottom: "27px",
  },

  statCard: {
    position: "relative",
    minHeight: "105px",
    display: "flex",
    alignItems: "center",
    gap: "15px",
    padding: "19px 20px",
    background: "#FFFFFF",
    border: "1px solid #CBD5E1",
    borderRadius: "10px",
    boxShadow: "0 3px 10px rgba(15, 23, 42, 0.05)",
    overflow: "hidden",
  },

  totalCard: {
    borderTop: "3px solid #2563EB",
  },

  pendingCard: {
    borderTop: "3px solid #D97706",
  },

  approvedCard: {
    borderTop: "3px solid #059669",
  },

  rejectedCard: {
    borderTop: "3px solid #DC2626",
  },

  statIcon: {
    width: "42px",
    height: "42px",
    minWidth: "42px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "9px",
    background: "#EFF6FF",
    color: "#2563EB",
    fontSize: "17px",
  },

  statNumber: {
    margin: 0,
    color: "#0F172A",
    fontSize: "29px",
    lineHeight: "1",
    fontWeight: "800",
    letterSpacing: "-0.5px",
  },

  statLabel: {
    margin: "7px 0 0",
    color: "#334155",
    fontSize: "13px",
    fontWeight: "700",
  },

  smallText: {
    margin: "5px 0 0",
    color: "#64748B",
    fontSize: "11px",
    fontWeight: "500",
  },

  /* ============================================================
     SECTIONS
  ============================================================ */

  section: {
    marginBottom: "28px",
  },

  sectionHeader: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: "15px",
    marginBottom: "13px",
  },

  sectionTitle: {
    margin: 0,
    color: "#172033",
    fontSize: "22px",
    fontWeight: "800",
    letterSpacing: "-0.25px",
  },

  sectionSubtitle: {
    margin: "6px 0 0",
    color: "#52647A",
    fontSize: "14px",
    lineHeight: "1.55",
  },

  /* ============================================================
     ANALYTICS
  ============================================================ */

  chartContainer: {
    width: "100%",
    minHeight: "260px",
    boxSizing: "border-box",
    padding: "22px 24px",
    background: "#FFFFFF",
    border: "1px solid #CBD5E1",
    borderRadius: "10px",
    boxShadow: "0 3px 10px rgba(15, 23, 42, 0.05)",
    overflow: "hidden",
  },

  /* ============================================================
     QUICK ACTION
  ============================================================ */

  quickPanel: {
    position: "relative",
    width: "100%",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "30px",
    padding: "27px 29px",
    marginBottom: "28px",
    background:
      "linear-gradient(105deg, #0F172A 0%, #172554 65%, #1E3A5F 100%)",
    border: "1px solid #263449",
    borderRadius: "11px",
    overflow: "hidden",
    boxShadow: "0 9px 24px rgba(15, 23, 42, 0.14)",
  },

  panelTitle: {
    margin: 0,
    color: "#FFFFFF",
    fontSize: "22px",
    fontWeight: "800",
    letterSpacing: "-0.3px",
  },

  panelText: {
    margin: "9px 0 0",
    maxWidth: "720px",
    color: "#C3CEDD",
    fontSize: "14px",
    lineHeight: "1.65",
  },

  primaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    minWidth: "155px",
    padding: "13px 21px",
    border: "1px solid #60A5FA",
    borderRadius: "8px",
    background: "#2563EB",
    color: "#FFFFFF",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "800",
    whiteSpace: "nowrap",
    boxShadow: "0 5px 14px rgba(37, 99, 235, 0.30)",
  },

  /* ============================================================
     FORMS
  ============================================================ */

  formCard: {
    width: "100%",
    boxSizing: "border-box",
    padding: "25px",
    background: "#FFFFFF",
    border: "1px solid #CBD5E1",
    borderRadius: "10px",
    boxShadow: "0 3px 10px rgba(15, 23, 42, 0.05)",
  },

  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    marginBottom: "18px",
  },

  label: {
    color: "#334155",
    fontSize: "14px",
    fontWeight: "700",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px 14px",
    border: "1px solid #C7D2E0",
    borderRadius: "7px",
    background: "#FFFFFF",
    color: "#172033",
    outline: "none",
    fontSize: "14px",
    lineHeight: "1.45",
  },

  textarea: {
    width: "100%",
    minHeight: "125px",
    boxSizing: "border-box",
    padding: "13px 14px",
    border: "1px solid #C7D2E0",
    borderRadius: "7px",
    background: "#FFFFFF",
    color: "#172033",
    outline: "none",
    resize: "vertical",
    fontSize: "14px",
    lineHeight: "1.55",
    fontFamily: "inherit",
  },

  fileInput: {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px",
    border: "1px dashed #B8C5D6",
    borderRadius: "7px",
    background: "#F8FAFC",
    color: "#475569",
    fontSize: "13px",
    cursor: "pointer",
  },

  helperText: {
    margin: 0,
    color: "#64748B",
    fontSize: "12px",
    lineHeight: "1.5",
  },

  selectedFilesContainer: {
    marginTop: "13px",
    padding: "13px",
    border: "1px solid #DCE3EC",
    borderRadius: "7px",
    background: "#F8FAFC",
  },

  selectedFilesTitle: {
    margin: "0 0 9px",
    color: "#334155",
    fontSize: "13px",
    fontWeight: "700",
  },

  selectedFileItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    padding: "9px 0",
    borderBottom: "1px solid #E2E8F0",
    color: "#475569",
    fontSize: "13px",
  },

  fileSize: {
    color: "#64748B",
    fontSize: "11px",
  },

  successMessage: {
    marginTop: "13px",
    padding: "11px 13px",
    border: "1px solid #A7F3D0",
    borderRadius: "7px",
    background: "#ECFDF5",
    color: "#047857",
    fontSize: "13px",
    fontWeight: "600",
  },

  /* ============================================================
     TABLES
  ============================================================ */

  tableCard: {
    width: "100%",
    background: "#FFFFFF",
    border: "1px solid #CBD5E1",
    borderRadius: "10px",
    boxShadow: "0 3px 10px rgba(15, 23, 42, 0.05)",
    overflow: "hidden",
  },

  tableWrapper: {
    width: "100%",
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
  },

  th: {
    padding: "16px 17px",
    background: "#F8FAFC",
    borderBottom: "1px solid #DCE3EC",
    color: "#475569",
    fontSize: "13px",
    fontWeight: "800",
    textAlign: "left",
    whiteSpace: "nowrap",
  },

  td: {
    padding: "19px 17px",
    borderBottom: "1px solid #E5EAF1",
    color: "#334155",
    fontSize: "14px",
    verticalAlign: "middle",
  },

  decisionTitle: {
    margin: 0,
    color: "#172033",
    fontSize: "15px",
    fontWeight: "700",
    lineHeight: "1.45",
  },

  decisionDescription: {
    margin: "6px 0 0",
    color: "#52647A",
    fontSize: "13px",
    lineHeight: "1.6",
  },

  /* ============================================================
     STATUS
  ============================================================ */

  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "7px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
    whiteSpace: "nowrap",
  },

  approvedBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "7px 12px",
    borderRadius: "999px",
    background: "#ECFDF5",
    color: "#047857",
    border: "1px solid #A7F3D0",
    fontSize: "12px",
    fontWeight: "800",
    whiteSpace: "nowrap",
  },

  reviewBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "7px 12px",
    borderRadius: "999px",
    background: "#FFF7ED",
    color: "#C2410C",
    border: "1px solid #FED7AA",
    fontSize: "12px",
    fontWeight: "800",
    whiteSpace: "nowrap",
  },

  pendingBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "7px 12px",
    borderRadius: "999px",
    background: "#EFF6FF",
    color: "#1D4ED8",
    border: "1px solid #BFDBFE",
    fontSize: "12px",
    fontWeight: "800",
    whiteSpace: "nowrap",
  },

  rejectedBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "7px 12px",
    borderRadius: "999px",
    background: "#FEF2F2",
    color: "#B91C1C",
    border: "1px solid #FECACA",
    fontSize: "12px",
    fontWeight: "800",
    whiteSpace: "nowrap",
  },

  historyButton: {
    padding: "9px 13px",
    border: "1px solid #CBD5E1",
    borderRadius: "7px",
    background: "#FFFFFF",
    color: "#334155",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "700",
  },

  feedbackButton: {
    padding: "9px 13px",
    border: "1px solid #BFDBFE",
    borderRadius: "7px",
    background: "#EFF6FF",
    color: "#1D4ED8",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "700",
  },

  /* ============================================================
     LOADING / EMPTY
  ============================================================ */

  loading: {
    minHeight: "190px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#64748B",
    fontSize: "14px",
    fontWeight: "600",
  },

  emptyState: {
    padding: "48px 26px",
    textAlign: "center",
    background: "#FFFFFF",
    border: "1px solid #CBD5E1",
    borderRadius: "10px",
  },

  emptyIcon: {
    width: "46px",
    height: "46px",
    margin: "0 auto 13px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    background: "#F1F5F9",
    color: "#64748B",
    fontSize: "18px",
  },

  emptyTitle: {
    margin: 0,
    color: "#334155",
    fontSize: "16px",
    fontWeight: "800",
  },

  emptyText: {
    maxWidth: "450px",
    margin: "7px auto 0",
    color: "#64748B",
    fontSize: "13px",
    lineHeight: "1.55",
  },

  /* ============================================================
     GRIDS / CARDS
  ============================================================ */

  twoColumnGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "21px",
  },

  cardTitle: {
    margin: "0 0 15px",
    color: "#172033",
    fontSize: "17px",
    fontWeight: "800",
  },

  selectedFileBox: {
    padding: "11px 13px",
    border: "1px solid #DCE3EC",
    borderRadius: "7px",
    background: "#F8FAFC",
  },

  mutedText: {
    color: "#64748B",
    fontSize: "12px",
  },

  /* ============================================================
     DOCUMENTS
  ============================================================ */

  documentList: {
    display: "flex",
    flexDirection: "column",
    gap: "9px",
  },

  documentItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "15px",
    padding: "13px",
    border: "1px solid #E2E8F0",
    borderRadius: "8px",
    background: "#FFFFFF",
  },

  documentInfo: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
    minWidth: 0,
  },

  documentIcon: {
    width: "34px",
    height: "34px",
    minWidth: "34px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "7px",
    background: "#EFF6FF",
    color: "#2563EB",
    fontSize: "14px",
  },

  documentName: {
    margin: 0,
    color: "#334155",
    fontSize: "13px",
    fontWeight: "700",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  documentDate: {
    marginTop: "4px",
    color: "#64748B",
    fontSize: "11px",
  },

  documentActions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: "8px",
    flexShrink: 0,
  },

  viewButton: {
    padding: "7px 10px",
    border: "1px solid #BFDBFE",
    borderRadius: "6px",
    background: "#EFF6FF",
    color: "#1D4ED8",
    cursor: "pointer",
    fontSize: "11px",
    fontWeight: "700",
  },

  downloadButton: {
    padding: "7px 10px",
    border: "1px solid #A7F3D0",
    borderRadius: "6px",
    background: "#ECFDF5",
    color: "#047857",
    cursor: "pointer",
    fontSize: "11px",
    fontWeight: "700",
  },

  deleteButton: {
    padding: "7px 10px",
    border: "1px solid #FECACA",
    borderRadius: "6px",
    background: "#FEF2F2",
    color: "#B91C1C",
    cursor: "pointer",
    fontSize: "11px",
    fontWeight: "700",
  },

  /* ============================================================
     DISCUSSIONS
  ============================================================ */

  discussionList: {
    display: "flex",
    flexDirection: "column",
    gap: "11px",
  },

  discussionItem: {
    padding: "15px",
    border: "1px solid #E2E8F0",
    borderRadius: "8px",
    background: "#FFFFFF",
  },

  discussionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    marginBottom: "9px",
  },

  discussionUser: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  discussionRole: {
    padding: "4px 7px",
    borderRadius: "4px",
    background: "#F1F5F9",
    color: "#64748B",
    fontSize: "10px",
    fontWeight: "700",
  },

  discussionDate: {
    color: "#64748B",
    fontSize: "11px",
  },

  discussionText: {
    margin: 0,
    color: "#475569",
    fontSize: "13px",
    lineHeight: "1.6",
  },

  emptyMiniState: {
    padding: "28px 16px",
    textAlign: "center",
    border: "1px dashed #CBD5E1",
    borderRadius: "8px",
    background: "#F8FAFC",
  },

  emptyMiniIcon: {
    width: "34px",
    height: "34px",
    margin: "0 auto 9px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    background: "#E2E8F0",
    color: "#64748B",
  },

  /* ============================================================
     ALTERNATIVES / COMPARISON
  ============================================================ */

  alternativeLayout: {
    display: "grid",
    gridTemplateColumns: "minmax(300px, 0.8fr) minmax(0, 1.5fr)",
    gap: "21px",
    alignItems: "start",
  },

  formRow: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "16px",
  },

  comparisonTableWrapper: {
    width: "100%",
    overflowX: "auto",
    border: "1px solid #DCE3EC",
    borderRadius: "8px",
    background: "#FFFFFF",
  },

  comparisonTable: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px",
  },

  comparisonTh: {
    padding: "12px 13px",
    background: "#F8FAFC",
    borderBottom: "1px solid #DCE3EC",
    color: "#475569",
    fontSize: "12px",
    fontWeight: "800",
    textAlign: "left",
  },

  comparisonTd: {
    padding: "12px 13px",
    borderBottom: "1px solid #EEF2F7",
    color: "#475569",
    fontSize: "13px",
  },

  alternativeDescription: {
    margin: "6px 0 0",
    color: "#64748B",
    fontSize: "12px",
    lineHeight: "1.5",
  },

  /* ============================================================
     AUDIT HISTORY MODAL
  ============================================================ */

  modalOverlay: {
    position: "fixed",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    background: "rgba(15, 23, 42, 0.55)",
    backdropFilter: "blur(3px)",
    zIndex: 1000,
  },

  auditModal: {
    width: "100%",
    maxWidth: "780px",
    maxHeight: "85vh",
    display: "flex",
    flexDirection: "column",
    background: "#FFFFFF",
    border: "1px solid #DCE3EC",
    borderRadius: "11px",
    boxShadow: "0 24px 60px rgba(15, 23, 42, 0.20)",
    overflow: "hidden",
  },

  auditModalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "15px",
    padding: "19px 22px",
    borderBottom: "1px solid #E2E8F0",
  },

  auditModalTitle: {
    margin: 0,
    color: "#172033",
    fontSize: "19px",
    fontWeight: "800",
  },

  auditDecisionTitle: {
    margin: "5px 0 0",
    color: "#64748B",
    fontSize: "13px",
  },

  closeModalButton: {
    width: "36px",
    height: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #CBD5E1",
    borderRadius: "7px",
    background: "#FFFFFF",
    color: "#475569",
    cursor: "pointer",
    fontSize: "16px",
  },

  auditModalBody: {
    padding: "22px",
    overflowY: "auto",
  },

  auditLoading: {
    padding: "40px",
    textAlign: "center",
    color: "#64748B",
    fontSize: "13px",
  },

  auditError: {
    padding: "13px",
    border: "1px solid #FECACA",
    borderRadius: "7px",
    background: "#FEF2F2",
    color: "#B91C1C",
    fontSize: "13px",
  },

  auditEmpty: {
    padding: "35px",
    textAlign: "center",
    color: "#64748B",
    fontSize: "13px",
  },

  auditTimeline: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    gap: "13px",
  },

  auditTimelineItem: {
    position: "relative",
    display: "flex",
    gap: "13px",
  },

  auditTimelineMarker: {
    position: "relative",
    width: "17px",
    minWidth: "17px",
    display: "flex",
    justifyContent: "center",
  },

  auditDot: {
    width: "10px",
    height: "10px",
    marginTop: "7px",
    borderRadius: "50%",
    background: "#2563EB",
    border: "2px solid #DBEAFE",
    zIndex: 2,
  },

  auditLine: {
    position: "absolute",
    top: "16px",
    bottom: "-19px",
    width: "1px",
    background: "#DCE3EC",
  },

  auditCard: {
    flex: 1,
    padding: "15px",
    border: "1px solid #E2E8F0",
    borderRadius: "8px",
    background: "#F8FAFC",
  },

  auditCardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    marginBottom: "9px",
  },

  auditAction: {
    color: "#334155",
    fontSize: "13px",
    fontWeight: "800",
  },

  auditDate: {
    color: "#64748B",
    fontSize: "11px",
  },

  auditInfoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "9px",
    marginBottom: "9px",
  },

  auditLabel: {
    color: "#64748B",
    fontSize: "11px",
    fontWeight: "600",
  },

  auditValue: {
    marginTop: "3px",
    color: "#475569",
    fontSize: "12px",
    fontWeight: "600",
  },

  auditDetails: {
    marginTop: "9px",
    paddingTop: "9px",
    borderTop: "1px solid #E2E8F0",
  },

  auditDetailsText: {
    margin: 0,
    color: "#52647A",
    fontSize: "12px",
    lineHeight: "1.6",
  },

  auditModalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    padding: "14px 22px",
    borderTop: "1px solid #E2E8F0",
    background: "#F8FAFC",
  },

  closeAuditButton: {
    padding: "10px 17px",
    border: "1px solid #CBD5E1",
    borderRadius: "7px",
    background: "#FFFFFF",
    color: "#334155",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "700",
  },

  /* ============================================================
     REVIEW / FEEDBACK
  ============================================================ */

  decisionActionButtons: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  feedbackModal: {
    width: "100%",
    maxWidth: "840px",
    maxHeight: "88vh",
    display: "flex",
    flexDirection: "column",
    background: "#FFFFFF",
    border: "1px solid #DCE3EC",
    borderRadius: "12px",
    boxShadow: "0 24px 60px rgba(15, 23, 42, 0.20)",
    overflow: "hidden",
  },

  feedbackModalHeader: {
    padding: "21px 25px",
    borderBottom: "1px solid #E2E8F0",
  },

  feedbackModalTitle: {
    margin: 0,
    color: "#172033",
    fontSize: "21px",
    fontWeight: "800",
  },

  feedbackDecisionTitle: {
    margin: "6px 0 0",
    color: "#64748B",
    fontSize: "13px",
  },

  feedbackModalBody: {
    padding: "25px",
    overflowY: "auto",
  },

  feedbackStatusBox: {
    padding: "16px 17px",
    marginBottom: "21px",
    border: "1px solid #BFDBFE",
    borderRadius: "8px",
    background: "#EFF6FF",
    color: "#1E40AF",
    fontSize: "14px",
    fontWeight: "600",
  },

  feedbackLabel: {
    display: "block",
    marginBottom: "8px",
    color: "#475569",
    fontSize: "13px",
    fontWeight: "700",
  },

  feedbackSection: {
    marginBottom: "23px",
  },

  feedbackSectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    marginBottom: "11px",
  },

  feedbackSectionTitle: {
    margin: 0,
    color: "#334155",
    fontSize: "15px",
    fontWeight: "800",
  },

  feedbackSectionSubtitle: {
    margin: "5px 0 0",
    color: "#64748B",
    fontSize: "12px",
  },

  feedbackContentBox: {
    padding: "17px",
    border: "1px solid #DCE3EC",
    borderRadius: "9px",
    background: "#F8FAFC",
  },

  managerFeedbackContentBox: {
    padding: "17px",
    border: "1px solid #DCE3EC",
    borderRadius: "9px",
    background: "#F8FAFC",
  },

  feedbackText: {
    margin: 0,
    color: "#334155",
    fontSize: "14px",
    lineHeight: "1.7",
    whiteSpace: "pre-wrap",
  },

  feedbackPerson: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "12px",
  },

  feedbackAvatar: {
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "8px",
    background: "#2563EB",
    color: "#FFFFFF",
    fontSize: "14px",
    fontWeight: "800",
  },

  managerFeedbackAvatar: {
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "8px",
    background: "#059669",
    color: "#FFFFFF",
    fontSize: "14px",
    fontWeight: "800",
  },

  feedbackPersonName: {
    margin: 0,
    color: "#334155",
    fontSize: "14px",
    fontWeight: "800",
  },

  feedbackPersonRole: {
    margin: "3px 0 0",
    color: "#64748B",
    fontSize: "11px",
  },

  feedbackPersonEmail: {
    margin: "3px 0 0",
    color: "#64748B",
    fontSize: "11px",
  },

  noFeedbackBox: {
    padding: "34px 25px",
    textAlign: "center",
    border: "1px dashed #CBD5E1",
    borderRadius: "9px",
    background: "#F8FAFC",
  },

  noFeedbackIcon: {
    width: "42px",
    height: "42px",
    margin: "0 auto 11px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    background: "#E2E8F0",
    color: "#64748B",
    fontSize: "16px",
  },

  noFeedbackTitle: {
    margin: 0,
    color: "#334155",
    fontSize: "14px",
    fontWeight: "800",
  },

  noFeedbackText: {
    margin: "6px 0 0",
    color: "#64748B",
    fontSize: "12px",
    lineHeight: "1.55",
  },

  finalResultBox: {
    padding: "18px",
    borderRadius: "9px",
    marginTop: "19px",
  },

  finalApprovedBox: {
    padding: "18px",
    border: "1px solid #A7F3D0",
    borderRadius: "9px",
    background: "#ECFDF5",
    marginTop: "19px",
  },

  finalRejectedBox: {
    padding: "18px",
    border: "1px solid #FECACA",
    borderRadius: "9px",
    background: "#FEF2F2",
    marginTop: "19px",
  },

  finalResultIcon: {
    width: "38px",
    height: "38px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "8px",
    marginBottom: "10px",
    fontSize: "17px",
  },

  finalResultTitle: {
    margin: 0,
    color: "#334155",
    fontSize: "15px",
    fontWeight: "800",
  },

  finalResultText: {
    margin: "6px 0 0",
    color: "#52647A",
    fontSize: "13px",
    lineHeight: "1.6",
  },

  feedbackModalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "9px",
    padding: "16px 25px",
    borderTop: "1px solid #E2E8F0",
    background: "#F8FAFC",
  },
  // ============================================================
/* TEAM WORKSPACE STYLES */
// ============================================================

// ============================================================
/* PREMIUM TEAM WORKSPACE STYLES */
// ============================================================

teamSection: {
  marginTop: "28px",
},

teamSectionHeader: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  marginBottom: "18px",
  gap: "20px",
},

teamSectionTitle: {
  margin: 0,
  fontSize: "22px",
  fontWeight: 750,
  color: "#0F172A",
},

teamSectionSubtitle: {
  margin: "6px 0 0",
  color: "#64748B",
  fontSize: "14px",
},

teamCountBadge: {
  background: "#EEF2FF",
  color: "#4338CA",
  border: "1px solid #C7D2FE",
  borderRadius: "999px",
  padding: "7px 13px",
  fontSize: "12px",
  fontWeight: 750,
  whiteSpace: "nowrap",
},

/* ============================================================
   MY TEAM CARDS
============================================================ */

myTeamsGrid: {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(340px, 1fr))",
  gap: "18px",
},
myTeamsSection: {
  width: "100%",
  maxWidth: "1570px",
  margin: "0 auto",
  padding: "0 24px 32px",
  boxSizing: "border-box",
},

myTeamCard: {
  position: "relative",
  background:
    "linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 100%)",
  border: "1px solid #E2E8F0",
  borderRadius: "16px",
  padding: "20px",
  boxShadow:
    "0 5px 20px rgba(15, 23, 42, 0.055)",
  transition:
    "transform 0.2s ease, box-shadow 0.2s ease",
},

myTeamCardTop: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
},

myTeamIdentity: {
  display: "flex",
  alignItems: "center",
  gap: "13px",
},

myTeamIcon: {
  width: "52px",
  height: "52px",
  borderRadius: "15px",
  background:
    "linear-gradient(135deg, #EEF2FF, #E0E7FF)",
  border: "1px solid #C7D2FE",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "25px",
  boxShadow:
    "0 4px 10px rgba(79, 70, 229, 0.08)",
  flexShrink: 0,
},

myTeamName: {
  margin: 0,
  color: "#0F172A",
  fontSize: "17px",
  fontWeight: 750,
},

myTeamStatus: {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  marginTop: "5px",
  fontSize: "11px",
  fontWeight: 700,
  color: "#059669",
},

myTeamStatusDot: {
  width: "7px",
  height: "7px",
  borderRadius: "50%",
  background: "#10B981",
  boxShadow:
    "0 0 0 3px rgba(16, 185, 129, 0.12)",
},

myTeamDescription: {
  margin: "17px 0 18px",
  color: "#64748B",
  fontSize: "13px",
  lineHeight: 1.65,
  minHeight: "43px",
},

myTeamInfoGrid: {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "10px",
},

myTeamInfoItem: {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  background: "#F8FAFC",
  border: "1px solid #E2E8F0",
  borderRadius: "11px",
  padding: "11px",
  minWidth: 0,
},

myTeamInfoIcon: {
  width: "32px",
  height: "32px",
  borderRadius: "9px",
  background: "#EEF2FF",
  color: "#4F46E5",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "15px",
  flexShrink: 0,
},

myTeamInfoLabel: {
  display: "block",
  color: "#94A3B8",
  fontSize: "9px",
  fontWeight: 750,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
},

myTeamInfoValue: {
  display: "block",
  marginTop: "3px",
  color: "#1E293B",
  fontSize: "13px",
  fontWeight: 750,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
},

myTeamCardFooter: {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  marginTop: "18px",
  paddingTop: "15px",
  borderTop: "1px solid #E2E8F0",
},

teamCreatedText: {
  color: "#94A3B8",
  fontSize: "10px",
},

viewTeamButton: {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  border: "none",
  background:
    "linear-gradient(135deg, #4F46E5, #4338CA)",
  color: "#FFFFFF",
  borderRadius: "9px",
  padding: "9px 14px",
  fontSize: "12px",
  fontWeight: 750,
  cursor: "pointer",
  boxShadow:
    "0 4px 10px rgba(79, 70, 229, 0.18)",
},

teamBrowseButton: {
  marginTop: "12px",
  border: "none",
  background:
    "linear-gradient(135deg, #4F46E5, #4338CA)",
  color: "#FFFFFF",
  borderRadius: "9px",
  padding: "10px 16px",
  fontSize: "13px",
  fontWeight: 700,
  cursor: "pointer",
},

/* ============================================================
   EMPTY / LOADING
============================================================ */

teamEmptyState: {
  background: "#FFFFFF",
  border: "1px dashed #CBD5E1",
  borderRadius: "16px",
  padding: "42px 25px",
  textAlign: "center",
},

teamEmptyIcon: {
  width: "58px",
  height: "58px",
  margin: "0 auto 14px",
  borderRadius: "16px",
  background: "#EEF2FF",
  color: "#4F46E5",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "26px",
},

teamLoadingIcon: {
  width: "42px",
  height: "42px",
  margin: "0 auto 12px",
  borderRadius: "50%",
  background: "#EEF2FF",
  color: "#4F46E5",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "22px",
},

/* ============================================================
   TEAM WORKSPACE MODAL
============================================================ */

teamDetailsOverlay: {
  position: "fixed",
  inset: 0,
  background:
    "rgba(15, 23, 42, 0.64)",
  backdropFilter: "blur(7px)",
  zIndex: 1000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "22px",
},

teamDetailsModal: {
  width: "100%",
  maxWidth: "1120px",
  height: "92vh",
  maxHeight: "900px",
  background: "#F8FAFC",
  borderRadius: "22px",
  overflow: "hidden",
  boxShadow:
    "0 30px 80px rgba(15, 23, 42, 0.30)",
  display: "flex",
  flexDirection: "column",
  border: "1px solid rgba(255,255,255,0.8)",
},

teamDetailsHeader: {
  background:
    "linear-gradient(135deg, #111827 0%, #1E1B4B 100%)",
  color: "#FFFFFF",
  padding: "21px 25px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "20px",
  flexShrink: 0,
},

teamDetailsTitleArea: {
  display: "flex",
  alignItems: "center",
  gap: "14px",
  minWidth: 0,
},

teamDetailsIcon: {
  width: "54px",
  height: "54px",
  borderRadius: "15px",
  background:
    "linear-gradient(135deg, #6366F1, #4F46E5)",
  border: "1px solid rgba(255,255,255,0.2)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "25px",
  boxShadow:
    "0 7px 20px rgba(0,0,0,0.18)",
  flexShrink: 0,
},

teamWorkspaceLabel: {
  color: "#A5B4FC",
  fontSize: "10px",
  fontWeight: 800,
  letterSpacing: "0.12em",
  marginBottom: "4px",
},

teamDetailsTitle: {
  margin: 0,
  color: "#FFFFFF",
  fontSize: "21px",
  fontWeight: 750,
},

teamDetailsSubtitle: {
  margin: "5px 0 0",
  color: "#CBD5E1",
  fontSize: "12px",
  lineHeight: 1.5,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
},

teamDetailsCloseButton: {
  width: "36px",
  height: "36px",
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(255,255,255,0.08)",
  color: "#FFFFFF",
  borderRadius: "9px",
  fontSize: "22px",
  lineHeight: 1,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
},

teamDetailsContent: {
  padding: "22px",
  overflowY: "auto",
  background:
    "linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)",
},

teamDetailsLoading: {
  padding: "70px 20px",
  textAlign: "center",
  background: "#FFFFFF",
},

teamDetailsError: {
  margin: "20px",
  padding: "13px 15px",
  background: "#FEF2F2",
  border: "1px solid #FECACA",
  color: "#B91C1C",
  borderRadius: "10px",
  fontSize: "13px",
  fontWeight: 600,
},

/* ============================================================
   TEAM OVERVIEW
============================================================ */

teamOverviewCard: {
  background:
    "linear-gradient(135deg, #FFFFFF 0%, #F5F7FF 100%)",
  border: "1px solid #D9DEFF",
  borderRadius: "16px",
  padding: "20px",
  marginBottom: "18px",
  boxShadow:
    "0 4px 14px rgba(79, 70, 229, 0.04)",
},

teamOverviewHeader: {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "20px",
},

teamOverviewLabel: {
  display: "block",
  color: "#4F46E5",
  fontSize: "10px",
  fontWeight: 800,
  letterSpacing: "0.10em",
  marginBottom: "5px",
},

teamOverviewTitle: {
  margin: 0,
  color: "#0F172A",
  fontSize: "19px",
  fontWeight: 750,
},

teamOverviewDescription: {
  margin: "13px 0 18px",
  color: "#64748B",
  fontSize: "13px",
  lineHeight: 1.6,
},

activeTeamBadge: {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  padding: "7px 11px",
  borderRadius: "999px",
  background: "#ECFDF5",
  color: "#047857",
  border: "1px solid #A7F3D0",
  fontSize: "10px",
  fontWeight: 800,
  whiteSpace: "nowrap",
},

teamMetaRow: {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "12px",
  paddingTop: "16px",
  borderTop: "1px solid #E0E7FF",
},

/* ============================================================
   STATISTICS
============================================================ */

teamStatsGrid: {
  display: "grid",
  gridTemplateColumns: "repeat(5, 1fr)",
  gap: "12px",
  marginBottom: "20px",
},

teamStatCard: {
  background: "#FFFFFF",
  border: "1px solid #E2E8F0",
  borderRadius: "14px",
  padding: "15px",
  display: "flex",
  alignItems: "center",
  gap: "11px",
  boxShadow:
    "0 3px 10px rgba(15, 23, 42, 0.035)",
},

teamStatIcon: {
  width: "36px",
  height: "36px",
  borderRadius: "10px",
  background: "#EEF2FF",
  color: "#4F46E5",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "15px",
  flexShrink: 0,
},

teamStatLabel: {
  display: "block",
  color: "#64748B",
  fontSize: "9px",
  fontWeight: 650,
  lineHeight: 1.3,
},

teamStatValue: {
  display: "block",
  marginTop: "3px",
  color: "#0F172A",
  fontSize: "20px",
  fontWeight: 800,
},

/* ============================================================
   TWO COLUMN WORKSPACE
============================================================ */

teamWorkspaceGrid: {
  display: "grid",
  gridTemplateColumns: "0.9fr 1.1fr",
  gap: "18px",
  alignItems: "start",
},

teamWorkspaceSection: {
  background: "#FFFFFF",
  border: "1px solid #E2E8F0",
  borderRadius: "16px",
  overflow: "hidden",
  boxShadow:
    "0 4px 14px rgba(15, 23, 42, 0.035)",
},

teamWorkspaceSectionHeader: {
  padding: "17px 19px",
  borderBottom: "1px solid #E2E8F0",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "15px",
  background: "#FFFFFF",
},

sectionCountBadge: {
  minWidth: "28px",
  height: "28px",
  padding: "0 8px",
  borderRadius: "8px",
  background: "#EEF2FF",
  color: "#4338CA",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "11px",
  fontWeight: 800,
},

/* ============================================================
   MEMBERS
============================================================ */

teamMembersList: {
  padding: "5px 19px",
},

teamMemberRow: {
  display: "flex",
  alignItems: "center",
  gap: "11px",
  padding: "13px 0",
  borderBottom: "1px solid #F1F5F9",
},

teamMemberAvatar: {
  width: "38px",
  height: "38px",
  borderRadius: "11px",
  background:
    "linear-gradient(135deg, #E0E7FF, #C7D2FE)",
  color: "#4338CA",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "12px",
  fontWeight: 800,
  flexShrink: 0,
},

teamMemberInfo: {
  flex: 1,
  minWidth: 0,
},

memberRoleBadge: {
  background: "#F1F5F9",
  color: "#475569",
  border: "1px solid #E2E8F0",
  borderRadius: "6px",
  padding: "5px 8px",
  fontSize: "9px",
  fontWeight: 750,
  whiteSpace: "nowrap",
},

memberDecisionCount: {
  minWidth: "65px",
  textAlign: "right",
},

/* ============================================================
   DECISIONS
============================================================ */

teamDecisionsList: {
  padding: "5px 19px",
},

teamDecisionRow: {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "15px",
  padding: "15px 0",
  borderBottom: "1px solid #F1F5F9",
},

teamDecisionMain: {
  flex: 1,
  minWidth: 0,
},

teamDecisionMeta: {
  display: "flex",
  flexWrap: "wrap",
  gap: "6px",
},
teamDecisionStatus: {
  padding: "6px 9px",
  borderRadius: "7px",
  fontSize: "9px",
  fontWeight: 800,
  whiteSpace: "nowrap",
},

statusApproved: {
  background: "#ECFDF5",
  color: "#047857",
  border: "1px solid #A7F3D0",
},

statusRejected: {
  background: "#FEF2F2",
  color: "#B91C1C",
  border: "1px solid #FECACA",
},

statusUnderReview: {
  background: "#F5F3FF",
  color: "#6D28D9",
  border: "1px solid #DDD6FE",
},

statusPending: {
  background: "#FFFBEB",
  color: "#B45309",
  border: "1px solid #FDE68A",
},

/* ============================================================
   FOOTER
============================================================ */

teamWorkspaceFooter: {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "20px",
  background: "#FFFFFF",
  border: "1px solid #E2E8F0",
  borderRadius: "14px",
  padding: "14px 18px",
  marginTop: "2px",
},

teamFooterLabel: {
  display: "block",
  color: "#94A3B8",
  fontSize: "9px",
  fontWeight: 750,
  letterSpacing: "0.06em",
},

teamFooterValue: {
  display: "block",
  marginTop: "3px",
  color: "#334155",
  fontSize: "12px",
  fontWeight: 700,
},

teamFooterCloseButton: {
  border: "1px solid #C7D2FE",
  background: "#EEF2FF",
  color: "#4338CA",
  borderRadius: "8px",
  padding: "8px 13px",
  fontSize: "11px",
  fontWeight: 750,
  cursor: "pointer",
},

/* ============================================================
   EMPTY STATE
============================================================ */

noTeamData: {
  padding: "32px 20px",
  textAlign: "center",
  color: "#64748B",
  fontSize: "12px",
},

noTeamDataIcon: {
  width: "40px",
  height: "40px",
  margin: "0 auto 9px",
  borderRadius: "11px",
  background: "#EEF2FF",
  color: "#4F46E5",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "18px",
},
/* ============================================================
   REPORTS & EXPORT
============================================================ */

/* ================= REPORTS ================= */

reportsSection: {
  marginTop: "24px",
  padding: "24px",
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  boxShadow: "0 4px 16px rgba(15,23,42,0.04)",
},

reportsHeader: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "16px",
  marginBottom: "24px",
  paddingBottom: "20px",
  borderBottom: "1px solid #e2e8f0",
},

reportsTitle: {
  margin: 0,
  fontSize: "25px",
  fontWeight: "800",
  color: "#172033",
  letterSpacing: "-0.5px",
},

reportsSubtitle: {
  margin: "7px 0 0",
  fontSize: "13px",
  lineHeight: "1.6",
  color: "#64748b",
},

reportTabs: {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "10px",
  marginBottom: "24px",
  padding: "5px 0 16px",
  borderBottom: "1px solid #e2e8f0",
},

reportTab: {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  padding: "11px 17px",
  border: "1px solid #e2e8f0",
  borderRadius: "9px",
  backgroundColor: "#ffffff",
  color: "#475569",
  fontSize: "13px",
  fontWeight: "600",
  cursor: "pointer",
  whiteSpace: "nowrap",
  transition: "all 0.2s ease",
},

reportTabActive: {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  padding: "11px 17px",
  border: "1px solid #4f46e5",
  borderRadius: "9px",
  backgroundColor: "#eef2ff",
  color: "#4338ca",
  fontSize: "13px",
  fontWeight: "700",
  cursor: "pointer",
  whiteSpace: "nowrap",
  boxShadow: "0 2px 5px rgba(79,70,229,0.08)",
},

reportContent: {
  width: "100%",
  minWidth: 0,
  padding: "24px",
  boxSizing: "border-box",
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "14px",
  overflowX: "auto",
},

reportStats: {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))",
  gap: "16px",
  marginBottom: "26px",
  width: "100%",
},

reportStatCard: {
  minWidth: 0,
  padding: "22px",
  backgroundColor: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  boxShadow: "0 2px 7px rgba(15,23,42,0.03)",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
},

reportStatNumber: {
  margin: "8px 0 0",
  fontSize: "29px",
  lineHeight: "1.2",
  fontWeight: "800",
  color: "#172033",
},

reportStatLabel: {
  margin: "6px 0 0",
  fontSize: "12px",
  lineHeight: "1.5",
  color: "#64748b",
  fontWeight: "600",
},

exportActions: {
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "10px",
  marginBottom: "20px",
},

exportPdfButton: {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  padding: "11px 17px",
  borderRadius: "9px",
  border: "1px solid #4338ca",
  backgroundColor: "#4f46e5",
  color: "#ffffff",
  fontSize: "12px",
  fontWeight: "700",
  cursor: "pointer",
  whiteSpace: "nowrap",
  boxShadow: "0 2px 5px rgba(79,70,229,0.15)",
},

exportExcelButton: {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  padding: "11px 17px",
  borderRadius: "9px",
  border: "1px solid #047857",
  backgroundColor: "#059669",
  color: "#ffffff",
  fontSize: "12px",
  fontWeight: "700",
  cursor: "pointer",
  whiteSpace: "nowrap",
  boxShadow: "0 2px 5px rgba(5,150,105,0.12)",
},

reportError: {
  padding: "16px 18px",
  marginBottom: "20px",
  borderRadius: "10px",
  backgroundColor: "#fef2f2",
  color: "#b91c1c",
  border: "1px solid #fecaca",
  fontSize: "13px",
  lineHeight: "1.6",
},

reportLoading: {
  minHeight: "260px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "30px",
  textAlign: "center",
  color: "#64748b",
  fontSize: "14px",
},

reportEmpty: {
  minHeight: "180px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "35px 20px",
  textAlign: "center",
  color: "#64748b",
  backgroundColor: "#ffffff",
  border: "1px dashed #cbd5e1",
  borderRadius: "12px",
},

/* REPORT TABLE STYLES */

table: {
  width: "100%",
  minWidth: "850px",
  borderCollapse: "separate",
  borderSpacing: 0,
  tableLayout: "auto",
  backgroundColor: "#ffffff",
  fontSize: "13px",
},

tableHeader: {
  padding: "15px 18px",
  textAlign: "left",
  verticalAlign: "middle",
  backgroundColor: "#f1f5f9",
  color: "#475569",
  fontSize: "11px",
  fontWeight: "800",
  textTransform: "uppercase",
  letterSpacing: "0.4px",
  whiteSpace: "nowrap",
  borderBottom: "1px solid #e2e8f0",
},

tableCell: {
  padding: "16px 18px",
  textAlign: "left",
  verticalAlign: "middle",
  color: "#334155",
  fontSize: "13px",
  lineHeight: "1.6",
  borderBottom: "1px solid #f1f5f9",
  overflowWrap: "break-word",
},

};
export default EmployeeDashboard;