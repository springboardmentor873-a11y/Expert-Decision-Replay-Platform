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
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
function ManagerDashboard() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");
const API_URL = "http://localhost:5173";
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
const [teams, setTeams] = useState([]);
const [activeSection, setActiveSection] = useState("dashboard");
const [teamSearch, setTeamSearch] = useState("");
const [teamSort, setTeamSort] = useState("name");
const [teamTab, setTeamTab] = useState("active");

const [showTeams, setShowTeams] = useState(false);

const [showCreateTeam, setShowCreateTeam] = useState(false);

const [newTeam, setNewTeam] = useState({
  name: "",
  description: "",
  icon: "👥",
});

const [createTeamMessage, setCreateTeamMessage] = useState("");

const [showJoinRequests, setShowJoinRequests] = useState(false);

const [showTeamDetails, setShowTeamDetails] = useState(false);
const [selectedTeam, setSelectedTeam] = useState(null);

const [currentUserId, setCurrentUserId] = useState(null);


  const [actionLoading, setActionLoading] = useState(false);
const [teamsLoading, setTeamsLoading] = useState(false);
  const [managerFeedback, setManagerFeedback] = useState("");
  const [message, setMessage] = useState("");

  const [approvedCount, setApprovedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);

  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsMessage, setAnalyticsMessage] = useState("");

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [selectedDecision, setSelectedDecision] =
  useState(null);
  const [searchQuery, setSearchQuery] = useState("");
const [searchResults, setSearchResults] = useState([]);
const [selectedCategory, setSelectedCategory] = useState("All");
const [joinRequests, setJoinRequests] = useState([]);
const [joinRequestsLoading, setJoinRequestsLoading] = useState(false);
const [joinRequestMessage, setJoinRequestMessage] = useState("");
const [graphLoading, setGraphLoading] = useState(false);
const [allDecisions, setAllDecisions] = useState([]);
const [selectedGraphDecision, setSelectedGraphDecision] = useState(null);
const [expandedGraphNodes, setExpandedGraphNodes] = useState({});
const [activeReport, setActiveReport] = useState("decisions");
const [reportData, setReportData] = useState(null);
const [reportLoading, setReportLoading] = useState(false);
const [reportError, setReportError] = useState("");
// =====================================================
const [expandedGraphNode, setExpandedGraphNode] = useState(null);
// TEAM FUNCTIONS
// =====================================================

// -----------------------------------------------------
// LOAD TEAMS MANAGED BY CURRENT MANAGER
// -----------------------------------------------------
// =====================================================
// LOAD ALL DECISIONS FOR KNOWLEDGE GRAPH
// =====================================================

// -----------------------------------------------------
// LOAD ALL DECISIONS FOR KNOWLEDGE GRAPH
// -----------------------------------------------------

const loadAllDecisions = async () => {
  try {
    const response = await fetch(
      `${API_URL}/api/decisions`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to load decisions"
      );
    }

    setAllDecisions(
      Array.isArray(data)
        ? data
        : data.decisions || []
    );

  } catch (error) {
    console.error(
      "Load All Decisions Error:",
      error
    );

    setAllDecisions([]);
  }
};
const loadManagerTeams = async () => {
  try {
    setTeamsLoading(true);

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
        data.message || "Failed to load teams"
      );
    }

    setTeams(data);
  } catch (error) {
    console.error("Failed to load manager teams:", error);
  } finally {
    setTeamsLoading(false);
  }
};
const loadJoinRequests = async () => {
    try {
        const response = await fetch(
            "http://localhost:5173/api/teams/join-requests",
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Failed to load join requests"
            );
        }

        setJoinRequests(data);

    } catch (error) {
        console.error(
            "Failed to load join requests:",
            error
        );
    }
};
// -----------------------------------------------------
// CREATE TEAM
// -----------------------------------------------------

const createTeam = async () => {
  try {
    if (!newTeam.name.trim()) {
      alert("Please enter a team name");
      return;
    }

    if (!newTeam.description.trim()) {
      alert("Please enter a team description");
      return;
    }

    const response = await fetch(
      "http://localhost:5173/api/teams",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newTeam.name.trim(),
          description: newTeam.description.trim(),
          icon: newTeam.icon || "👥",
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to create team");
      return;
    }

    alert("Team created successfully!");

    setNewTeam({
      name: "",
      description: "",
      icon: "👥",
    });

    setShowCreateTeam(false);

    // Refresh teams
    await loadManagerTeams();

  } catch (error) {
    console.error("Create team error:", error);
    alert("Unable to connect to server");
  }
};

// -----------------------------------------------------
// APPROVE JOIN REQUEST
// -----------------------------------------------------

const approveJoinRequest = async (requestId) => {
  try {
    const response = await fetch(
      `${API_URL}/api/teams/join-requests/${requestId}/approve`,
      {
        method: "PUT",

        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(
        data.message ||
          "Failed to approve request"
      );
      return;
    }

    alert(
      data.message ||
        "Join request approved"
    );

    await loadJoinRequests();
    await loadManagerTeams();

  } catch (error) {
    console.error(
      "Approve Join Request Error:",
      error
    );

    alert(
      "Unable to connect to server."
    );
  }
};


// -----------------------------------------------------
// REJECT JOIN REQUEST
// -----------------------------------------------------

const rejectJoinRequest = async (requestId) => {
  try {
    const response = await fetch(
      `${API_URL}/api/teams/join-requests/${requestId}/reject`,
      {
        method: "PUT",

        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(
        data.message ||
          "Failed to reject request"
      );
      return;
    }

    alert(
      data.message ||
        "Join request rejected"
    );

    await loadJoinRequests();

  } catch (error) {
    console.error(
      "Reject Join Request Error:",
      error
    );

    alert(
      "Unable to connect to server."
    );
  }
};


// -----------------------------------------------------
// REMOVE MEMBER
// -----------------------------------------------------

const removeMemberFromTeam = async (
  teamId,
  memberId
) => {
  const confirmRemove = window.confirm(
    "Are you sure you want to remove this member from the team?"
  );

  if (!confirmRemove) {
    return;
  }

  try {
    const response = await fetch(
      `${API_URL}/api/teams/${teamId}/members/${memberId}`,
      {
        method: "DELETE",

        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(
        data.message ||
          "Failed to remove member"
      );
      return;
    }

    alert(
      data.message ||
        "Member removed successfully"
    );

    await loadManagerTeams();

    // Refresh selected team
    if (selectedTeam?._id === teamId) {
      const updatedTeam = teams.find(
        (team) => team._id === teamId
      );

      if (updatedTeam) {
        setSelectedTeam(updatedTeam);
      }
    }

  } catch (error) {
    console.error(
      "Remove Member Error:",
      error
    );

    alert(
      "Unable to connect to server."
    );
  }
};


// -----------------------------------------------------
// DELETE TEAM
// -----------------------------------------------------

const deleteTeam = async (teamId) => {
  const confirmDelete = window.confirm(
    "Are you sure you want to delete this team? This action cannot be undone."
  );

  if (!confirmDelete) {
    return;
  }

  try {
    const response = await fetch(
      `${API_URL}/api/teams/${teamId}`,
      {
        method: "DELETE",

        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(
        data.message ||
          "Failed to delete team"
      );
      return;
    }

    alert(
      data.message ||
        "Team deleted successfully"
    );

    setSelectedTeam(null);
    setShowTeamDetails(false);

    await loadManagerTeams();

  } catch (error) {
    console.error(
      "Delete Team Error:",
      error
    );

    alert(
      "Unable to connect to server."
    );
  }
};


// -----------------------------------------------------
// LOAD TEAMS WHEN DASHBOARD OPENS
// -----------------------------------------------------
useEffect(() => {
  loadJoinRequests();
  loadAllDecisions();
  loadManagerTeams();
}, []);

useEffect(() => {
  fetchReport(activeReport);
}, [activeReport]);

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
}; 
const searchDecisions = async () => {
  try {
    const params = new URLSearchParams();

    if (searchQuery.trim()) {
      params.append("query", searchQuery.trim());
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
        data.message || "Failed to search decisions"
      );
    }

    // Make sure searchResults is always an array
    if (Array.isArray(data)) {
      setSearchResults(data);
    } else if (Array.isArray(data.decisions)) {
      setSearchResults(data.decisions);
    } else if (Array.isArray(data.results)) {
      setSearchResults(data.results);
    } else {
      setSearchResults([]);
    }

  } catch (error) {
    console.error("Search Decisions Error:", error);
    setSearchResults([]);
  }
};
  // =====================================================
// FILTERED MANAGER TEAMS
// =====================================================

const filteredTeams = teams
  .filter((team) => {
    if (teamTab === "active") {
      return team.status === "active";
    }

    if (teamTab === "archived") {
      return team.status === "archived";
    }

    return true;
  })
  .filter((team) =>
    team.name
      .toLowerCase()
      .includes(teamSearch.toLowerCase())
  )
  .sort((a, b) => {
    if (teamSort === "name") {
      return a.name.localeCompare(b.name);
    }

    if (teamSort === "members") {
      return (b.members?.length || 0) - (a.members?.length || 0);
    }

    if (teamSort === "decisions") {
      return (b.decisions || 0) - (a.decisions || 0);
    }

    return 0;
  });


// =====================================================
// MY TEAMS
// =====================================================

const myTeams = teams.filter(
  (team) => team.status === "active"
);

const myArchivedTeams = teams.filter(
  (team) => team.status === "archived"
);

const displayedMyTeams =
  teamTab === "active"
    ? myTeams
    : myArchivedTeams;

  
  // --------------------------------------------------
  // FETCH DECISIONS WAITING FOR MANAGER APPROVAL
  // --------------------------------------------------

  const fetchDecisions = async () => {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(
        `${API_URL}/api/decisions/manager`,
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

      setMessage(
        error.message || "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

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
  // --------------------------------------------------
  // FETCH ANALYTICS
  // --------------------------------------------------

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      setAnalyticsMessage("");

      const response = await fetch(
        `${API_URL}/api/decisions/analytics`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch analytics"
        );
      }

      setAnalytics(data);
    } catch (error) {
      console.error(
        "Analytics fetch error:",
        error
      );

      setAnalyticsMessage(
        error.message ||
          "Failed to load analytics"
      );
    } finally {
      setAnalyticsLoading(false);
    }
  };
// --------------------------------------------------
// FETCH NOTIFICATIONS
// --------------------------------------------------

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

    setNotifications(data);
  } catch (error) {
    console.error("Notification fetch error:", error);
  } finally {
    setNotificationLoading(false);
  }
};

// --------------------------------------------------
// FETCH UNREAD NOTIFICATION COUNT
// --------------------------------------------------

const fetchUnreadCount = async () => {
  try {
    const response = await fetch(
      `${API_URL}/api/notifications/unread-count`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Failed to fetch unread notification count"
      );
    }

    setUnreadCount(data.count || 0);
  } catch (error) {
    console.error(
      "Unread notification count error:",
      error
    );
  }
};

// --------------------------------------------------
// MARK ONE NOTIFICATION AS READ
// --------------------------------------------------

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
        data.message ||
          "Failed to mark notification as read"
      );
    }

    setNotifications((prev) =>
      prev.map((notification) =>
        notification._id === notificationId
          ? {
              ...notification,
              isRead: true,
            }
          : notification
      )
    );

    setUnreadCount((prev) =>
      prev > 0 ? prev - 1 : 0
    );
  } catch (error) {
    console.error(
      "Mark notification read error:",
      error
    );
  }
};

// --------------------------------------------------
// MARK ALL NOTIFICATIONS AS READ
// --------------------------------------------------

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
        data.message ||
          "Failed to mark all notifications as read"
      );
    }

    setNotifications((prev) =>
      prev.map((notification) => ({
        ...notification,
        isRead: true,
      }))
    );

    setUnreadCount(0);
  } catch (error) {
    console.error(
      "Mark all notifications error:",
      error
    );
  }
};

// --------------------------------------------------
// TOGGLE NOTIFICATION PANEL
// --------------------------------------------------

const toggleNotifications = async () => {
  const newState = !showNotifications;

  setShowNotifications(newState);

  if (newState) {
    await fetchNotifications();
    await fetchUnreadCount();
  }
};
  // --------------------------------------------------
  // LOAD DASHBOARD DATA
  // --------------------------------------------------

  useEffect(() => {
    fetchDecisions();
    fetchAnalytics();
  }, []);

  // --------------------------------------------------
  // APPROVE OR REJECT DECISION
  // --------------------------------------------------

  const handleDecision = async (status) => {
    if (!selectedDecision || actionLoading) {
      return;
    }

    try {
      setActionLoading(true);
      setMessage("");

      const response = await fetch(
        `${API_URL}/api/decisions/${selectedDecision._id}/manager`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            managerFeedback,
            status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update decision"
        );
      }

      if (status === "Approved") {
        setApprovedCount(
          (prev) => prev + 1
        );
      } else {
        setRejectedCount(
          (prev) => prev + 1
        );
      }

      setMessage(
        `Decision ${status.toLowerCase()} successfully!`
      );

      setSelectedDecision(null);
      setManagerFeedback("");

      await fetchDecisions();

      // Refresh analytics after decision
      await fetchAnalytics();

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      console.error(error);

      setMessage(
        error.message ||
          "Failed to update decision"
      );
    } finally {
      setActionLoading(false);
    }
  };

  // --------------------------------------------------
  // LOGOUT
  // --------------------------------------------------

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  // --------------------------------------------------
  // SCROLL TO SECTION
  // --------------------------------------------------

  const scrollToSection = (id) => {
    document
      .getElementById(id)
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  };

  // --------------------------------------------------
  // SELECT DECISION
  // --------------------------------------------------

  const selectDecision = (decision) => {
    setSelectedDecision(decision);
    setManagerFeedback("");
    setMessage("");

    setTimeout(() => {
      scrollToSection("final-review");
    }, 100);
  };

  // --------------------------------------------------
  // FORMAT DATE
  // --------------------------------------------------

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // --------------------------------------------------
  // OPEN DOCUMENT
  // --------------------------------------------------

  const handleViewDocument = (document) => {
    if (!document?.filePath) {
      setMessage(
        "Document path not available"
      );

      return;
    }

    const fileUrl = `${API_URL}/${document.filePath.replace(
      /\\/g,
      "/"
    )}`;

    window.open(fileUrl, "_blank");
  };
// =====================================================
// TEAM JOIN REQUESTS
// =====================================================

const fetchJoinRequests = async () => {
  try {
    setJoinRequestsLoading(true);
    setJoinRequestMessage("");

    const token = localStorage.getItem("token");

    const response = await fetch(
      "http://localhost:5173/api/teams/join-requests",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to fetch join requests"
      );
    }

    setJoinRequests(data);
  } catch (error) {
    console.error("Fetch Join Requests Error:", error);

    setJoinRequestMessage(
      error.message || "Failed to load join requests"
    );
  } finally {
    setJoinRequestsLoading(false);
  }
};
useEffect(() => {
  fetchJoinRequests();
}, []);
const handleJoinRequest = async (requestId, action) => {
  try {
    setJoinRequestMessage("");

    const token = localStorage.getItem("token");

    const response = await fetch(
      `http://localhost:5173/api/teams/join-requests/${requestId}/${action}`,
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
        data.message || `Failed to ${action} request`
      );
    }

    setJoinRequestMessage(data.message);

    // Remove processed request from the screen
    setJoinRequests((prev) =>
      prev.filter(
        (request) => request._id !== requestId
      )
    );

    // Refresh teams
    fetchTeams();

  } catch (error) {
    console.error(
      "Join Request Action Error:",
      error
    );

    setJoinRequestMessage(
      error.message ||
        `Failed to ${action} request`
    );
  }
};


  return (
    <div style={styles.container}>
{/* ================= SIDEBAR ================= */}
<aside style={styles.sidebar}>
  {/* BRAND */}
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

  {/* NAVIGATION */}
  <div style={styles.navSection}>
    {/* DASHBOARD */}
    <button
      type="button"
      style={styles.activeMenu}
      onClick={() =>
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        })
      }
    >
      <span style={styles.menuIcon}>⌂</span>
      <span>Dashboard</span>
    </button>

    {/* PENDING APPROVAL */}
    <button
      type="button"
      style={styles.menuButton}
      onClick={() => scrollToSection("pending")}
    >
      <span style={styles.menuIcon}>◷</span>
      <span>Pending Approval</span>
    </button>

    {/* TEAM DECISIONS */}
    <button
      type="button"
      style={styles.menuButton}
      onClick={() => scrollToSection("pending")}
    >
      <span style={styles.menuIcon}>▣</span>
      <span>Team Decisions</span>
    </button>

    {/* FINAL REVIEW */}
    <button
      type="button"
      style={styles.menuButton}
      onClick={() => scrollToSection("final-review")}
    >
      <span style={styles.menuIcon}>✓</span>
      <span>Final Review</span>
    </button>

    {/* ANALYTICS */}
    <button
      type="button"
      style={styles.menuButton}
      onClick={() => scrollToSection("analytics")}
    >
      <span style={styles.menuIcon}>◉</span>
      <span>Analytics</span>
    </button>

    {/* KNOWLEDGE REPOSITORY */}
    <button
      type="button"
      style={styles.menuButton}
      onClick={() => {
        document
          .getElementById("repository")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }}
    >
      <span style={styles.menuIcon}>⌕</span>
      <span>Knowledge Repository</span>
    </button>

    {/* MY TEAMS */}
    <button
      type="button"
      style={
        activeSection === "teams"
          ? styles.activeMenu
          : styles.menuButton
      }
      onClick={() => scrollToSection("teams")}
    >
      <span style={styles.menuIcon}>♧</span>
      <span>My Teams</span>
    </button>

    {/* REPORTS & EXPORT */}
    <button
      type="button"
      style={
        activeSection === "reports"
          ? styles.activeMenu
          : styles.menuButton
      }
      onClick={() => scrollToSection("reports")}
    >
      <span style={styles.menuIcon}>▤</span>
      <span>Reports & Export</span>
    </button>
  </div>

  {/* LOGOUT */}
  <div style={styles.sidebarFooter}>
    <button
      type="button"
      style={styles.logoutButton}
      onClick={handleLogout}
    >
      <span style={styles.menuIcon}>⇥</span>
      <span>Logout</span>
    </button>
  </div>
</aside>

      {/* ================= MAIN AREA ================= */}

      <main style={styles.main}>

        {/* ================= TOP BAR ================= */}

        <div style={styles.topbar}>

          <div />

          <div style={styles.profileArea}>

            <div
  style={styles.notificationWrapper}
>
  <button
    type="button"
    onClick={toggleNotifications}
    style={styles.notification}
    title="Notifications"
  >
    🔔

    {unreadCount > 0 && (
      <span style={styles.notificationBadge}>
        {unreadCount > 9 ? "9+" : unreadCount}
      </span>
    )}
  </button>

  {showNotifications && (
    <div style={styles.notificationDropdown}>

      <div style={styles.notificationHeader}>
        <div>
          <h3 style={styles.notificationTitle}>
            Notifications
          </h3>

          <p style={styles.notificationSubtitle}>
            {unreadCount > 0
              ? `${unreadCount} unread notification${
                  unreadCount > 1 ? "s" : ""
                }`
              : "You're all caught up"}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllNotificationsAsRead}
            style={styles.markAllButton}
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
            <div style={styles.notificationEmptyIcon}>
              🔔
            </div>

            <strong>No notifications</strong>

            <p>
              New decision updates will appear here.
            </p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification._id}
              style={{
                ...styles.notificationItem,
                ...(notification.isRead
                  ? styles.notificationRead
                  : styles.notificationUnread),
              }}
              onClick={() => {
                if (!notification.isRead) {
                  markNotificationAsRead(
                    notification._id
                  );
                }
              }}
            >
              <div
                style={
                  styles.notificationItemIcon
                }
              >
                {notification.type ===
                "Decision Reviewed"
                  ? "📋"
                  : notification.type ===
                    "Decision Approved"
                  ? "✅"
                  : notification.type ===
                    "Decision Rejected"
                  ? "❌"
                  : "🔔"}
              </div>

              <div
                style={
                  styles.notificationItemContent
                }
              >
                <div
                  style={
                    styles.notificationItemTop
                  }
                >
                  <strong>
                    {notification.type ||
                      "Notification"}
                  </strong>

                  {!notification.isRead && (
                    <span
                      style={
                        styles.unreadDot
                      }
                    />
                  )}
                </div>

                <p
                  style={
                    styles.notificationMessage
                  }
                >
                  {notification.message}
                </p>

                {notification.decision && (
                  <p
                    style={
                      styles.notificationDecision
                    }
                  >
                    Decision:{" "}
                    {notification.decision.title}
                  </p>
                )}

                <span
                  style={
                    styles.notificationDate
                  }
                >
                  {notification.createdAt
                    ? new Date(
                        notification.createdAt
                      ).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : ""}
                </span>
              </div>
            </div>
          ))
        )}

      </div>

      <div style={styles.notificationFooter}>
        <button
          type="button"
          onClick={async () => {
            await fetchNotifications();
            await fetchUnreadCount();
          }}
          style={styles.refreshNotificationButton}
        >
          ↻ Refresh notifications
        </button>
      </div>

    </div>
  )}
</div>

            <div style={styles.avatar}>
              {user?.name
                ?.charAt(0)
                ?.toUpperCase() || "M"}
            </div>

            <div>
              <strong style={styles.userName}>
                {user?.name || "Manager"}
              </strong>

              <p style={styles.userRole}>
                {user?.role || "Manager"}
              </p>
            </div>

          </div>

        </div>

        <div style={styles.content}>

          {/* ================= WELCOME ================= */}

          <section style={styles.welcome}>

            <div>

              <h1 style={styles.welcomeTitle}>
                Welcome back,{" "}
                {user?.name || "Manager"}!
              </h1>

              <p style={styles.welcomeText}>
                Here's an overview of your
                team's decision activity.
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

          {/* ================= MESSAGE ================= */}

          {message && (
            <div
              style={{
                ...styles.message,

                ...(message
                  .toLowerCase()
                  .includes("successfully")
                  ? styles.successMessage
                  : styles.errorMessage),
              }}
            >
              {message}
            </div>
          )}

          {/* ================= STATISTICS ================= */}

      {/* ================= STATISTICS ================= */}

<section style={styles.stats}>

  {/* PENDING */}
  <div
    style={{
      ...styles.statCard,
      ...styles.pendingCard,
    }}
  >
    <div style={styles.statIcon}>
      ◷
    </div>

    <div>
      <h2 style={styles.statNumber}>
        {analytics?.summary?.pendingReview ?? 0}
      </h2>

      <p style={styles.statLabel}>
        Pending Review
      </p>

      <button
        style={styles.viewButton}
        onClick={() =>
          scrollToSection("pending")
        }
      >
        View →
      </button>
    </div>
  </div>


  {/* UNDER REVIEW */}
  <div
    style={{
      ...styles.statCard,
      ...styles.totalCard,
    }}
  >
    <div style={styles.statIcon}>
      🔎
    </div>

    <div>
      <h2 style={styles.statNumber}>
        {analytics?.summary?.underReview ?? 0}
      </h2>

      <p style={styles.statLabel}>
        Under Review
      </p>

      <p style={styles.smallText}>
        Reviewed by reviewer
      </p>
    </div>
  </div>


  {/* APPROVED */}
  <div
    style={{
      ...styles.statCard,
      ...styles.approvedCard,
    }}
  >
    <div style={styles.statIcon}>
      ✓
    </div>

    <div>
      <h2 style={styles.statNumber}>
        {analytics?.summary?.approved ?? 0}
      </h2>

      <p style={styles.statLabel}>
        Approved
      </p>

      <p style={styles.smallText}>
        Final approvals
      </p>
    </div>
  </div>


  {/* REJECTED */}
  <div
    style={{
      ...styles.statCard,
      ...styles.rejectedCard,
    }}
  >
    <div style={styles.statIcon}>
      ✕
    </div>

    <div>
      <h2 style={styles.statNumber}>
        {analytics?.summary?.rejected ?? 0}
      </h2>

      <p style={styles.statLabel}>
        Rejected
      </p>

      <p style={styles.smallText}>
        Final rejections
      </p>
    </div>
  </div>


  {/* TOTAL */}
  <div
    style={{
      ...styles.statCard,
      ...styles.totalCard,
    }}
  >
    <div style={styles.statIcon}>
      ▣
    </div>

    <div>
      <h2 style={styles.statNumber}>
        {analytics?.summary?.totalDecisions ?? 0}
      </h2>

      <p style={styles.statLabel}>
        Total Decisions
      </p>

      <p style={styles.smallText}>
        All recorded decisions
      </p>
    </div>
  </div>


  {/* APPROVAL RATE */}
  <div
    style={{
      ...styles.statCard,
      ...styles.totalCard,
    }}
  >
    <div style={styles.statIcon}>
      %
    </div>

    <div>
      <h2 style={styles.statNumber}>
        {analytics?.summary?.approvalRate ?? 0}%
      </h2>

      <p style={styles.statLabel}>
        Approval Rate
      </p>

      <p style={styles.smallText}>
        Completed decisions
      </p>
    </div>
  </div>

</section>

          {/* ================= MAIN GRID ================= */}

          <div style={styles.dashboardGrid}>

            {/* ================= PENDING DECISIONS ================= */}

            <section
              id="pending"
              style={styles.largePanel}
            >

              <div style={styles.panelHeader}>

                <div>

                  <h2 style={styles.panelTitle}>
                    Pending Approvals
                  </h2>

                  <p style={styles.panelSubtitle}>
                    Decisions waiting for your
                    final review
                  </p>

                </div>

                <button
                  style={styles.createButton}
                  onClick={fetchDecisions}
                  disabled={loading}
                >
                  {loading
                    ? "Loading..."
                    : "↻ Refresh"}
                </button>

              </div>

              {loading ? (

                <div style={styles.emptyState}>
                  Loading decisions...
                </div>

              ) : decisions.length === 0 ? (

                <div style={styles.emptyState}>
                  ✓ No decisions are waiting
                  for approval.
                </div>

              ) : (

                <div style={styles.tableWrapper}>

                  <table style={styles.table}>

                    <thead>

                      <tr>

                        <th style={styles.tableHeader}>
                          Title
                        </th>

                        <th style={styles.tableHeader}>
                          Created By
                        </th>

                        <th style={styles.tableHeader}>
                          Reviewer Feedback
                        </th>

                        <th style={styles.tableHeader}>
                          Documents
                        </th>

                        <th style={styles.tableHeader}>
                          Created On
                        </th>

                        <th style={styles.tableHeader}>
                          Action
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {decisions.map(
                        (decision) => (

                          <tr
                            key={decision._id}
                            style={styles.tableRow}
                          >

                            {/* TITLE */}

                            <td
                              style={
                                styles.tableCell
                              }
                            >

                              <strong
                                style={
                                  styles.decisionTitle
                                }
                              >
                                {decision.title}
                              </strong>

                              <p
                                style={
                                  styles.description
                                }
                              >
                                {decision.description}
                              </p>

                            </td>

                            {/* CREATED BY */}

                            <td
                              style={
                                styles.tableCell
                              }
                            >

                              <strong>
                                {decision.createdBy
                                  ?.name ||
                                  "Unknown"}
                              </strong>

                              <p style={styles.email}>
                                {decision.createdBy
                                  ?.email || ""}
                              </p>

                            </td>

                            {/* REVIEWER FEEDBACK */}

                            <td
                              style={
                                styles.tableCell
                              }
                            >

                              <p
                                style={
                                  styles.feedbackText
                                }
                              >
                                {decision
                                  .reviewerFeedback ||
                                  "No feedback"}
                              </p>

                            </td>

                            {/* DOCUMENTS */}

                            <td
                              style={
                                styles.tableCell
                              }
                            >

                              {decision.documents
                                ?.length > 0 ? (

                                <div>

                                  {decision.documents.map(
                                    (doc) => (

                                      <button
                                        key={doc._id}
                                        onClick={() =>
                                          handleViewDocument(
                                            doc
                                          )
                                        }
                                        style={{
                                          ...styles.documentButton,
                                          display:
                                            "block",
                                          marginBottom:
                                            "6px",
                                        }}
                                        title={
                                          doc.fileName
                                        }
                                      >
                                        📄{" "}
                                        {
                                          doc.fileName
                                        }
                                      </button>

                                    )
                                  )}

                                </div>

                              ) : (

                                <span
                                  style={
                                    styles.noDocument
                                  }
                                >
                                  No document
                                </span>

                              )}

                            </td>

                            {/* CREATED DATE */}

                            <td
                              style={
                                styles.tableCell
                              }
                            >
                              {formatDate(
                                decision.createdAt
                              )}
                            </td>

                            {/* ACTION */}

                            <td
                              style={
                                styles.tableCell
                              }
                            >

                              <button
                                style={
                                  styles.reviewButton
                                }
                                onClick={() =>
                                  selectDecision(
                                    decision
                                  )
                                }
                              >
                                Review
                              </button>

                            </td>

                          </tr>

                        )
                      )}

                    </tbody>

                  </table>

                </div>

              )}

            </section>

            {/* ================= ACTIVITY PANEL ================= */}

            <aside
              id="activity"
              style={styles.activityPanel}
            >

              <h2 style={styles.panelTitle}>
                Manager Activity
              </h2>

              <div style={styles.activityItem}>

                <div style={styles.activityIcon}>
                  ◷
                </div>

                <div>

                  <strong>
                    Pending Reviews
                  </strong>

                  <p style={styles.activityText}>
                    {decisions.length} decision(s)
                    require attention
                  </p>

                </div>

              </div>

              <div style={styles.activityItem}>

                <div style={styles.greenIcon}>
                  ✓
                </div>

                <div>

                  <strong>
                    Approved
                  </strong>

                  <p style={styles.activityText}>
                    {approvedCount} decision(s)
                    approved this session
                  </p>

                </div>

              </div>

              <div style={styles.activityItem}>

                <div style={styles.redIcon}>
                  ✕
                </div>

                <div>

                  <strong>
                    Rejected
                  </strong>

                  <p style={styles.activityText}>
                    {rejectedCount} decision(s)
                    rejected this session
                  </p>

                </div>

              </div>

              <div style={styles.activityItemLast}>

                <div style={styles.blueIcon}>
                  ▣
                </div>

                <div>

                  <strong>
                    Team Decisions
                  </strong>

                  <p style={styles.activityText}>
                    Review decisions submitted
                    by your team
                  </p>

                </div>

              </div>

            </aside>

          </div>
         {/* ==================== KNOWLEDGE REPOSITORY ==================== */}

<section
  id="knowledge-repository"
  style={{
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "24px",
    marginTop: "24px",
    marginBottom: "24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  }}
>
  {/* =====================================================
      HEADER
  ===================================================== */}

  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "22px",
      gap: "20px",
    }}
  >
    <div>
      <h2
        style={{
          margin: 0,
          fontSize: "20px",
          fontWeight: "700",
          color: "#0f172a",
        }}
      >
        Knowledge Repository
      </h2>

      <p
        style={{
          marginTop: "6px",
          marginBottom: 0,
          color: "#64748b",
          fontSize: "14px",
        }}
      >
        Search and explore previously recorded organizational decisions.
      </p>
    </div>

    <div
      style={{
        background: "#eff6ff",
        color: "#2563eb",
        padding: "8px 14px",
        borderRadius: "20px",
        fontSize: "13px",
        fontWeight: "600",
        whiteSpace: "nowrap",
      }}
    >
      Decision Knowledge Base
    </div>
  </div>

  {/* =====================================================
      SEARCH CONTROLS
  ===================================================== */}

  <div
    style={{
      display: "flex",
      gap: "12px",
      alignItems: "center",
      marginBottom: "22px",
      flexWrap: "wrap",
    }}
  >
    <div
      style={{
        flex: 1,
        minWidth: "280px",
        position: "relative",
      }}
    >
      <span
        style={{
          position: "absolute",
          left: "14px",
          top: "50%",
          transform: "translateY(-50%)",
          fontSize: "16px",
        }}
      >
        🔍
      </span>

      <input
        type="text"
        placeholder="Search decisions, problems, or recommendations..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            searchDecisions();
          }
        }}
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "12px 14px 12px 42px",
          border: "1px solid #cbd5e1",
          borderRadius: "8px",
          fontSize: "14px",
          outline: "none",
          color: "#0f172a",
        }}
      />
    </div>

    <select
      value={selectedCategory}
      onChange={(e) => setSelectedCategory(e.target.value)}
      style={{
        padding: "12px 14px",
        border: "1px solid #cbd5e1",
        borderRadius: "8px",
        background: "#ffffff",
        color: "#334155",
        fontSize: "14px",
        minWidth: "170px",
      }}
    >
      <option value="All">All Categories</option>
      <option value="General">General</option>
      <option value="Technology">Technology</option>
      <option value="Business">Business</option>
      <option value="Finance">Finance</option>
      <option value="Operations">Operations</option>
    </select>

    <button
      type="button"
      onClick={searchDecisions}
      style={{
        padding: "12px 22px",
        border: "none",
        borderRadius: "8px",
        background: "#2563eb",
        color: "#ffffff",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer",
      }}
    >
      🔍 Search
    </button>
  </div>

  {/* =====================================================
      SEARCH RESULTS
  ===================================================== */}

  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "14px",
    }}
  >
    <h3
      style={{
        margin: 0,
        fontSize: "16px",
        fontWeight: "600",
        color: "#0f172a",
      }}
    >
      Search Results
    </h3>

    <span
      style={{
        fontSize: "13px",
        color: "#64748b",
      }}
    >
      {Array.isArray(searchResults)
        ? `${searchResults.length} decision${
            searchResults.length === 1 ? "" : "s"
          } found`
        : "0 decisions found"}
    </span>
  </div>

  {!Array.isArray(searchResults) || searchResults.length === 0 ? (
    <div
      style={{
        border: "1px dashed #cbd5e1",
        borderRadius: "10px",
        padding: "35px 20px",
        textAlign: "center",
        background: "#f8fafc",
      }}
    >
      <div
        style={{
          fontSize: "32px",
          marginBottom: "10px",
        }}
      >
        📚
      </div>

      <p
        style={{
          margin: 0,
          color: "#475569",
          fontSize: "14px",
          fontWeight: "500",
        }}
      >
        No decisions found
      </p>

      <p
        style={{
          marginTop: "6px",
          marginBottom: 0,
          color: "#94a3b8",
          fontSize: "13px",
        }}
      >
        Search the repository to find previously recorded decisions.
      </p>
    </div>
  ) : (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit, minmax(320px, 1fr))",
        gap: "16px",
      }}
    >
      {searchResults.map((decision) => (
        <div
          key={decision._id}
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            padding: "18px",
            background: "#ffffff",
            boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "10px",
              marginBottom: "12px",
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: "16px",
                fontWeight: "700",
                color: "#0f172a",
                lineHeight: "1.4",
              }}
            >
              {decision.title || "Untitled Decision"}
            </h3>

            <span
              style={{
                flexShrink: 0,
                padding: "4px 9px",
                borderRadius: "12px",
                background: "#eff6ff",
                color: "#2563eb",
                fontSize: "11px",
                fontWeight: "600",
              }}
            >
              {decision.category || "General"}
            </span>
          </div>

          <p
            style={{
              margin: "0 0 5px 0",
              fontSize: "11px",
              fontWeight: "700",
              color: "#64748b",
              letterSpacing: "0.4px",
            }}
          >
            PROBLEM / DECISION
          </p>

          <p
            style={{
              margin: 0,
              color: "#475569",
              fontSize: "13px",
              lineHeight: "1.6",
            }}
          >
            {decision.problemStatement ||
              decision.description ||
              "No description available."}
          </p>

          {decision.recommendation && (
            <div
              style={{
                background: "#f8fafc",
                borderRadius: "7px",
                padding: "11px",
                marginTop: "12px",
              }}
            >
              <p
                style={{
                  margin: "0 0 5px 0",
                  fontSize: "11px",
                  fontWeight: "700",
                  color: "#64748b",
                }}
              >
                RECOMMENDATION
              </p>

              <p
                style={{
                  margin: 0,
                  fontSize: "13px",
                  color: "#334155",
                  lineHeight: "1.5",
                }}
              >
                {decision.recommendation}
              </p>
            </div>
          )}

          {decision.status && (
            <div style={{ marginTop: "12px" }}>
              <span
                style={{
                  display: "inline-block",
                  padding: "4px 9px",
                  borderRadius: "12px",
                  background:
                    decision.status === "Approved"
                      ? "#ecfdf5"
                      : decision.status === "Rejected"
                      ? "#fef2f2"
                      : "#fefce8",
                  color:
                    decision.status === "Approved"
                      ? "#15803d"
                      : decision.status === "Rejected"
                      ? "#dc2626"
                      : "#a16207",
                  fontSize: "11px",
                  fontWeight: "600",
                }}
              >
                {decision.status}
              </span>
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "14px",
              paddingTop: "12px",
              borderTop: "1px solid #f1f5f9",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                color: "#94a3b8",
              }}
            >
              {decision.createdAt
                ? new Date(decision.createdAt).toLocaleDateString()
                : "Date unavailable"}
            </span>

            <span
              style={{
                fontSize: "12px",
                color: "#2563eb",
                fontWeight: "600",
              }}
            >
              Decision Record
            </span>
          </div>
        </div>
      ))}
          </div>)}
        <DecisionKnowledgeGraph allDecisions={allDecisions} />
  

  {/* =====================================================
      INTERACTIVE KNOWLEDGE GRAPH
  ===================================================== */}
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
          {/* ================================================= */}
          {/*                    ANALYTICS                       */}
          {/* ================================================= */}

          <section
            id="analytics"
            style={styles.analyticsSection}
          >

            <div style={styles.analyticsHeader}>

              <div
                style={styles.analyticsHeaderText}
              >

                <h2 style={styles.panelTitle}>
                  Decision Analytics
                </h2>

                <p style={styles.panelSubtitle}>
                  Overview of decision activity,
                  workflow status, and team
                  performance.
                </p>

              </div>

              <button
                style={
                  styles.analyticsRefreshButton
                }
                onClick={fetchAnalytics}
                disabled={analyticsLoading}
              >
                {analyticsLoading
                  ? "Loading..."
                  : "↻ Refresh Analytics"}
              </button>

            </div>

            {/* ANALYTICS ERROR */}

            {analyticsMessage && (
              <div
                style={styles.analyticsError}
              >
                {analyticsMessage}
              </div>
            )}

            {/* ANALYTICS LOADING */}

            {analyticsLoading &&
              !analytics && (
                <div
                  style={styles.chartEmpty}
                >
                  Loading analytics...
                </div>
              )}

            {/* ANALYTICS CONTENT */}

            {analytics && (
              <>

                {/* ================= SUMMARY CARDS ================= */}

                <div
                  style={
                    styles.analyticsSummaryGrid
                  }
                >

                  <div
                    style={
                      styles.analyticsCard
                    }
                  >
                    <div
                      style={
                        styles.analyticsCardIcon
                      }
                    >
                      ▣
                    </div>

                    <div>
                      <h3
                        style={
                          styles.analyticsCardNumber
                        }
                      >
                        {
                          analytics.summary
                            .totalDecisions
                        }
                      </h3>

                      <p
                        style={
                          styles.analyticsCardLabel
                        }
                      >
                        Total Decisions
                      </p>

                      <p
                        style={
                          styles.analyticsCardSubtext
                        }
                      >
                        All recorded decisions
                      </p>
                    </div>
                  </div>

                  <div
                    style={
                      styles.analyticsCard
                    }
                  >
                    <div
                      style={
                        styles.analyticsCardIcon
                      }
                    >
                      ◷
                    </div>

                    <div>
                      <h3
                        style={
                          styles.analyticsCardNumber
                        }
                      >
                        {
                          analytics.summary
                            .pendingReview
                        }
                      </h3>

                      <p
                        style={
                          styles.analyticsCardLabel
                        }
                      >
                        Pending Review
                      </p>

                      <p
                        style={
                          styles.analyticsCardSubtext
                        }
                      >
                        Waiting for review
                      </p>
                    </div>
                  </div>

                  <div
                    style={
                      styles.analyticsCard
                    }
                  >
                    <div
                      style={
                        styles.analyticsCardIcon
                      }
                    >
                      🔎
                    </div>

                    <div>
                      <h3
                        style={
                          styles.analyticsCardNumber
                        }
                      >
                        {
                          analytics.summary
                            .underReview
                        }
                      </h3>

                      <p
                        style={
                          styles.analyticsCardLabel
                        }
                      >
                        Under Review
                      </p>

                      <p
                        style={
                          styles.analyticsCardSubtext
                        }
                      >
                        Reviewed by reviewer
                      </p>
                    </div>
                  </div>

                  <div
                    style={
                      styles.analyticsCard
                    }
                  >
                    <div
                      style={
                        styles.analyticsCardIcon
                      }
                    >
                      ✓
                    </div>

                    <div>
                      <h3
                        style={
                          styles.analyticsCardNumber
                        }
                      >
                        {
                          analytics.summary
                            .approved
                        }
                      </h3>

                      <p
                        style={
                          styles.analyticsCardLabel
                        }
                      >
                        Approved
                      </p>

                      <p
                        style={
                          styles.analyticsCardSubtext
                        }
                      >
                        Final approvals
                      </p>
                    </div>
                  </div>

                  <div
                    style={
                      styles.analyticsCard
                    }
                  >
                    <div
                      style={
                        styles.analyticsCardIcon
                      }
                    >
                      ✕
                    </div>

                    <div>
                      <h3
                        style={
                          styles.analyticsCardNumber
                        }
                      >
                        {
                          analytics.summary
                            .rejected
                        }
                      </h3>

                      <p
                        style={
                          styles.analyticsCardLabel
                        }
                      >
                        Rejected
                      </p>

                      <p
                        style={
                          styles.analyticsCardSubtext
                        }
                      >
                        Final rejections
                      </p>
                    </div>
                  </div>

                  <div
                    style={
                      styles.analyticsCard
                    }
                  >
                    <div
                      style={
                        styles.analyticsCardIcon
                      }
                    >
                      %
                    </div>

                    <div>
                      <h3
                        style={
                          styles.analyticsCardNumber
                        }
                      >
                        {
                          analytics.summary
                            .approvalRate
                        }%
                      </h3>

                      <p
                        style={
                          styles.analyticsCardLabel
                        }
                      >
                        Approval Rate
                      </p>

                      <p
                        style={
                          styles.analyticsCardSubtext
                        }
                      >
                        Completed decisions
                      </p>
                    </div>
                  </div>

                </div>

                {/* ================= CHARTS ================= */}

                <div
                  style={
                    styles.analyticsChartsGrid
                  }
                >

                  {/* STATUS DISTRIBUTION */}

                  <div style={styles.chartCard}>

                    <h3
                      style={styles.chartTitle}
                    >
                      Status Distribution
                    </h3>

                    <p
                      style={styles.chartSubtitle}
                    >
                      Current decision workflow
                      status
                    </p>

                    <div
                      style={
                        styles.chartContainer
                      }
                    >

                      {analytics.statusDistribution
                        ?.some(
                          (item) =>
                            item.count > 0
                        ) ? (

                        <ResponsiveContainer
                          width="100%"
                          height="100%"
                        >

                          <PieChart>

                            <Pie
                              data={
                                analytics.statusDistribution
                              }
                              dataKey="count"
                              nameKey="status"
                              cx="50%"
                              cy="50%"
                              outerRadius={110}
                              label
                            >

                              {analytics.statusDistribution.map(
                                (
                                  entry,
                                  index
                                ) => (

                                  <Cell
                                    key={`status-${entry.status}`}
                                    fill={
                                      ANALYTICS_COLORS[
                                        index %
                                          ANALYTICS_COLORS.length
                                      ]
                                    }
                                  />

                                )
                              )}

                            </Pie>

                            <Tooltip />

                            <Legend />

                          </PieChart>

                        </ResponsiveContainer>

                      ) : (

                        <div
                          style={
                            styles.chartEmpty
                          }
                        >
                          No status data available.
                        </div>

                      )}

                    </div>

                  </div>

                  {/* MONTHLY DECISIONS */}

                  <div style={styles.chartCard}>

                    <h3
                      style={styles.chartTitle}
                    >
                      Monthly Decisions
                    </h3>

                    <p
                      style={styles.chartSubtitle}
                    >
                      Decisions created over time
                    </p>

                    <div
                      style={
                        styles.chartContainer
                      }
                    >

                      {analytics.monthlyDecisions
                        ?.length > 0 ? (

                        <ResponsiveContainer
                          width="100%"
                          height="100%"
                        >

                          <BarChart
                            data={
                              analytics.monthlyDecisions
                            }
                          >

                            <CartesianGrid
                              strokeDasharray="3 3"
                            />

                            <XAxis
                              dataKey="month"
                            />

                            <YAxis
                              allowDecimals={false}
                            />

                            <Tooltip />

                            <Bar
                              dataKey="count"
                              name="Decisions"
                              fill="#3b82f6"
                              radius={[
                                5,
                                5,
                                0,
                                0,
                              ]}
                            />

                          </BarChart>

                        </ResponsiveContainer>

                      ) : (

                        <div
                          style={
                            styles.chartEmpty
                          }
                        >
                          No monthly decision data
                          available.
                        </div>

                      )}

                    </div>

                  </div>

                  {/* REVIEWER ACTIVITY */}

                  <div style={styles.chartCard}>

                    <h3
                      style={styles.chartTitle}
                    >
                      Reviewer Activity
                    </h3>

                    <p
                      style={styles.chartSubtitle}
                    >
                      Number of decisions reviewed
                      by each reviewer
                    </p>

                    <div
                      style={
                        styles.chartContainer
                      }
                    >

                      {analytics.reviewerData
                        ?.length > 0 ? (

                        <ResponsiveContainer
                          width="100%"
                          height="100%"
                        >

                          <BarChart
                            data={
                              analytics.reviewerData
                            }
                            layout="vertical"
                          >

                            <CartesianGrid
                              strokeDasharray="3 3"
                            />

                            <XAxis
                              type="number"
                              allowDecimals={false}
                            />

                            <YAxis
                              type="category"
                              dataKey="name"
                              width={100}
                            />

                            <Tooltip />

                            <Bar
                              dataKey="reviews"
                              name="Reviews"
                              fill="#16a34a"
                              radius={[
                                0,
                                5,
                                5,
                                0,
                              ]}
                            />

                          </BarChart>

                        </ResponsiveContainer>

                      ) : (

                        <div
                          style={
                            styles.chartEmpty
                          }
                        >
                          No reviewer activity
                          available.
                        </div>

                      )}

                    </div>

                  </div>

                  {/* MANAGER ACTIVITY */}

                  <div style={styles.chartCard}>

                    <h3
                      style={styles.chartTitle}
                    >
                      Manager Activity
                    </h3>

                    <p
                      style={styles.chartSubtitle}
                    >
                      Final decisions handled by
                      managers
                    </p>

                    <div
                      style={
                        styles.chartContainer
                      }
                    >

                      {analytics.managerData
                        ?.length > 0 ? (

                        <ResponsiveContainer
                          width="100%"
                          height="100%"
                        >

                          <BarChart
                            data={
                              analytics.managerData
                            }
                            layout="vertical"
                          >

                            <CartesianGrid
                              strokeDasharray="3 3"
                            />

                            <XAxis
                              type="number"
                              allowDecimals={false}
                            />

                            <YAxis
                              type="category"
                              dataKey="name"
                              width={100}
                            />

                            <Tooltip />

                            <Bar
                              dataKey="decisions"
                              name="Decisions"
                              fill="#f59e0b"
                              radius={[
                                0,
                                5,
                                5,
                                0,
                              ]}
                            />

                          </BarChart>

                        </ResponsiveContainer>

                      ) : (

                        <div
                          style={
                            styles.chartEmpty
                          }
                        >
                          No manager activity
                          available.
                        </div>

                      )}

                    </div>

                  </div>

                </div>

              </>
            )}

          </section>
{/* ==================== MY TEAMS ==================== */}
{/* ==================== MY TEAMS ==================== */}

<section
  id="teams"
  style={styles.teamSection}
>

  {/* HEADER */}

  <div style={styles.teamHeader}>

    <div>
      <h2 style={styles.teamTitle}>
        My Teams
      </h2>

      <p style={styles.teamSubtitle}>
        Collaborate with teams and track team
        decision activity.
      </p>
    </div>


    <div
      style={{
        display: "flex",
        gap: "10px",
        flexWrap: "wrap",
      }}
    >

      {/* CREATE TEAM */}

      <button
        type="button"
        style={styles.joinTeamButton}
        onClick={() => {
          setShowCreateTeam(true);
          setCreateTeamMessage("");
        }}
      >
        + Create Team
      </button>


      {/* JOIN REQUESTS */}

      <button
        type="button"
        style={styles.joinTeamButton}
        onClick={async () => {
          const newState =
            !showJoinRequests;

          setShowJoinRequests(
            newState
          );

          if (newState) {
            await loadJoinRequests();
          }
        }}
      >
        Join Requests
        {joinRequests.length > 0 && (
          <span
            style={{
              marginLeft: "8px",
              background: "#dc2626",
              color: "white",
              borderRadius: "999px",
              padding: "2px 7px",
              fontSize: "12px",
            }}
          >
            {joinRequests.length}
          </span>
        )}
      </button>

    </div>

  </div>


  {/* =====================================================
      CREATE TEAM FORM
      ===================================================== */}

  {showCreateTeam && (

    <div
      style={{
        background: "white",
        border: "1px solid #e2e8f0",
        borderRadius: "16px",
        padding: "24px",
        marginBottom: "24px",
        boxShadow:
          "0 4px 15px rgba(0,0,0,0.06)",
      }}
    >

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >

        <div>
          <h3
            style={{
              margin: 0,
              fontSize: "20px",
            }}
          >
            Create New Team
          </h3>

          <p
            style={{
              marginTop: "6px",
              color: "#64748b",
            }}
          >
            Create a team and start collaborating.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowCreateTeam(false);
            setCreateTeamMessage("");
          }}
          style={{
            border: "none",
            background: "transparent",
            fontSize: "22px",
            cursor: "pointer",
          }}
        >
          ✕
        </button>

      </div>


      <div
        style={{
          display: "grid",
          gap: "16px",
        }}
      >

        {/* TEAM NAME */}

        <input
          type="text"
          placeholder="Team Name"
          value={newTeam.name}
          onChange={(e) =>
            setNewTeam({
              ...newTeam,
              name: e.target.value,
            })
          }
          style={{
            padding: "12px",
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
            fontSize: "15px",
          }}
        />


        {/* DESCRIPTION */}

        <textarea
          placeholder="Team Description"
          value={newTeam.description}
          onChange={(e) =>
            setNewTeam({
              ...newTeam,
              description:
                e.target.value,
            })
          }
          rows="4"
          style={{
            padding: "12px",
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
            fontSize: "15px",
            resize: "vertical",
          }}
        />


        {/* ICON */}

        <input
          type="text"
          placeholder="Team Icon (example: 👥)"
          value={newTeam.icon}
          onChange={(e) =>
            setNewTeam({
              ...newTeam,
              icon: e.target.value,
            })
          }
          style={{
            padding: "12px",
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
            fontSize: "15px",
          }}
        />


        {/* MESSAGE */}

        {createTeamMessage && (

          <div
            style={{
              padding: "10px",
              borderRadius: "8px",
              background:
                createTeamMessage.includes(
                  "successfully"
                )
                  ? "#ecfdf5"
                  : "#fef2f2",
              color:
                createTeamMessage.includes(
                  "successfully"
                )
                  ? "#15803d"
                  : "#dc2626",
            }}
          >
            {createTeamMessage}
          </div>

        )}


        {/* CREATE BUTTON */}

        <button
          type="button"
          onClick={createTeam}
          style={{
            padding: "12px 18px",
            border: "none",
            borderRadius: "8px",
            background: "#166534",
            color: "white",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          Create Team
        </button>

      </div>

    </div>

  )}


  {/* =====================================================
      JOIN REQUESTS
      ===================================================== */}

  {showJoinRequests && (

    <div
      style={{
        background: "white",
        border: "1px solid #e2e8f0",
        borderRadius: "16px",
        padding: "24px",
        marginBottom: "24px",
      }}
    >

      <h3
        style={{
          marginTop: 0,
        }}
      >
        Pending Join Requests
      </h3>


      {joinRequests.length === 0 ? (

        <p
          style={{
            color: "#64748b",
          }}
        >
          No pending join requests.
        </p>

      ) : (

        <div
          style={{
            display: "grid",
            gap: "12px",
          }}
        >

          {joinRequests.map(
            (request) => (

              <div
                key={request._id}
                style={{
                  border:
                    "1px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "16px",
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems: "center",
                  gap: "16px",
                  flexWrap: "wrap",
                }}
              >

                <div>

                  <strong>
                    {request.employee?.name}
                  </strong>

                  <p
                    style={{
                      margin:
                        "5px 0",
                      color:
                        "#64748b",
                    }}
                  >
                    {request.employee?.email}
                  </p>

                  <span
                    style={{
                      fontSize:
                        "13px",
                      color:
                        "#475569",
                    }}
                  >
                    Requested to join{" "}
                    <strong>
                      {request.team?.name}
                    </strong>
                  </span>

                </div>


                <div
                  style={{
                    display:
                      "flex",
                    gap: "8px",
                  }}
                >

                  <button
                    type="button"
                    onClick={() =>
                      approveJoinRequest(
                        request._id
                      )
                    }
                    style={{
                      padding:
                        "9px 15px",
                      border: "none",
                      borderRadius:
                        "7px",
                      background:
                        "#16a34a",
                      color:
                        "white",
                      cursor:
                        "pointer",
                    }}
                  >
                    Approve
                  </button>


                  <button
                    type="button"
                    onClick={() =>
                      rejectJoinRequest(
                        request._id
                      )
                    }
                    style={{
                      padding:
                        "9px 15px",
                      border: "none",
                      borderRadius:
                        "7px",
                      background:
                        "#dc2626",
                      color:
                        "white",
                      cursor:
                        "pointer",
                    }}
                  >
                    Reject
                  </button>

                </div>

              </div>

            )
          )}

        </div>

      )}

    </div>

  )}


  {/* =====================================================
      SEARCH + SORT
      ===================================================== */}

  <div style={styles.teamControls}>

    <div style={styles.teamSearchBox}>

      <span style={styles.teamSearchIcon}>
        🔍
      </span>

      <input
        type="text"
        placeholder="Search Teams"
        value={teamSearch}
        onChange={(e) =>
          setTeamSearch(e.target.value)
        }
        style={styles.teamSearchInput}
      />

    </div>


    <select
      style={styles.teamSortSelect}
      value={teamSort}
      onChange={(e) =>
        setTeamSort(e.target.value)
      }
    >

      <option value="name">
        Sort by Name
      </option>

      <option value="members">
        Sort by Members
      </option>

      <option value="decisions">
        Sort by Decisions
      </option>

    </select>

  </div>


  {/* =====================================================
      TABS
      ===================================================== */}

  <div style={styles.teamTabs}>

    <button
      type="button"
      style={
        teamTab === "active"
          ? styles.teamTabActive
          : styles.teamTab
      }
      onClick={() =>
        setTeamTab("active")
      }
    >
      Active Teams
    </button>


    <button
      type="button"
      style={
        teamTab === "archived"
          ? styles.teamTabActive
          : styles.teamTab
      }
      onClick={() =>
        setTeamTab("archived")
      }
    >
      Archived Teams
    </button>

  </div>


  {/* =====================================================
      TEAM CARDS
      ===================================================== */}

  <div style={styles.teamGrid}>

    {teamsLoading ? (

      <div style={styles.emptyState}>
        Loading teams...
      </div>

    ) : displayedMyTeams.length === 0 ? (

      <div style={styles.emptyState}>
        {teamTab === "active"
          ? "You haven't created any active teams yet."
          : "You don't have any archived teams."}
      </div>

    ) : (

      displayedMyTeams
        .filter((team) =>
          team.name
            .toLowerCase()
            .includes(
              teamSearch.toLowerCase()
            )
        )
        .sort((a, b) => {

          if (
            teamSort === "name"
          ) {
            return a.name.localeCompare(
              b.name
            );
          }

          if (
            teamSort === "members"
          ) {
            return (
              (b.members?.length ||
                0) -
              (a.members?.length ||
                0)
            );
          }

          return (
            (b.decisions || 0) -
            (a.decisions || 0)
          );

        })
        .map((team) => (

          <div
            key={team._id}
            style={styles.teamCard}
          >

            <div
              style={
                styles.teamCardTop
              }
            >

              <div
                style={
                  styles.teamIcon
                }
              >
                {team.icon || "👥"}
              </div>


              <span
                style={{
                  ...styles.activeTeamBadge,

                  background:
                    team.status ===
                    "active"
                      ? "#ecfdf5"
                      : "#f1f5f9",

                  color:
                    team.status ===
                    "active"
                      ? "#15803d"
                      : "#64748b",
                }}
              >
                ●{" "}
                {team.status ===
                "active"
                  ? "Active"
                  : "Archived"}
              </span>

            </div>


            <h3
              style={
                styles.teamCardTitle
              }
            >
              {team.name}
            </h3>


            <p
              style={
                styles.teamCardDescription
              }
            >
              {team.description}
            </p>


            <div
              style={
                styles.teamStats
              }
            >

              <span>
                👤{" "}
                {team.members?.length ||
                  0}{" "}
                Members
              </span>

              <span>
                📋{" "}
                {team.decisions ||
                  0}{" "}
                Decisions
              </span>

            </div>


            <div
              style={
                styles.teamCardFooter
              }
            >

              <button
                type="button"
                style={
                  styles.viewTeamButton
                }
                onClick={() => {
                  setSelectedTeam(
                    team
                  );
                  setShowTeamDetails(
                    true
                  );
                }}
              >
                View Team
              </button>


              <button
                type="button"
                style={
                  styles.teamMoreButton
                }
                onClick={() => {
                  setSelectedTeam(
                    team
                  );
                  setShowTeamDetails(
                    true
                  );
                }}
              >
                ⋯
              </button>

            </div>

          </div>

        ))

    )}

  </div>


  {/* =====================================================
      TEAM DETAILS
      ===================================================== */}

  {showTeamDetails &&
    selectedTeam && (

      <div
        style={{
          background: "white",
          border:
            "1px solid #e2e8f0",
          borderRadius: "16px",
          padding: "24px",
          marginTop: "24px",
        }}
      >

        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
          }}
        >

          <h3>
            {selectedTeam.icon ||
              "👥"}{" "}
            {selectedTeam.name}
          </h3>


          <button
            type="button"
            onClick={() => {
              setShowTeamDetails(
                false
              );
              setSelectedTeam(
                null
              );
            }}
            style={{
              border: "none",
              background:
                "transparent",
              fontSize: "20px",
              cursor: "pointer",
            }}
          >
            ✕
          </button>

        </div>


        <p
          style={{
            color: "#64748b",
          }}
        >
          {selectedTeam.description}
        </p>


        <h4>
          Team Members
        </h4>


        {selectedTeam.members
          ?.length === 0 ? (

          <p>
            No members found.
          </p>

        ) : (

          <div
            style={{
              display: "grid",
              gap: "10px",
            }}
          >

            {selectedTeam.members?.map(
              (member) => (

                <div
                  key={member._id}
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center",
                    padding:
                      "12px",
                    border:
                      "1px solid #e2e8f0",
                    borderRadius:
                      "8px",
                  }}
                >

                  <div>

                    <strong>
                      {member.name}
                    </strong>

                    <div
                      style={{
                        color:
                          "#64748b",
                        fontSize:
                          "13px",
                      }}
                    >
                      {member.email} •{" "}
                      {member.role}
                    </div>

                  </div>


                  {String(
                    member._id
                  ) !==
                    String(
                      selectedTeam.manager?._id
                    ) && (

                    <button
                      type="button"
                      onClick={() =>
                        removeMemberFromTeam(
                          selectedTeam._id,
                          member._id
                        )
                      }
                      style={{
                        border:
                          "none",
                        borderRadius:
                          "7px",
                        padding:
                          "8px 12px",
                        background:
                          "#fee2e2",
                        color:
                          "#b91c1c",
                        cursor:
                          "pointer",
                      }}
                    >
                      Remove
                    </button>

                  )}

                </div>

              )
            )}

          </div>

        )}


        <div
          style={{
            marginTop: "20px",
            display: "flex",
            gap: "10px",
          }}
        >

          <button
            type="button"
            onClick={() =>
              deleteTeam(
                selectedTeam._id
              )
            }
            style={{
              border: "none",
              borderRadius: "8px",
              padding:
                "10px 16px",
              background:
                "#dc2626",
              color: "white",
              cursor:
                "pointer",
            }}
          >
            Delete Team
          </button>

        </div>

      </div>

    )}

</section>
{/* ==================== TEAM JOIN REQUESTS ==================== */}

<section
  style={{
    marginTop: "30px",
    padding: "28px",
    background: "#ffffff",
    borderRadius: "16px",
    border: "1px solid #e5e7eb",
  }}
>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "20px",
    }}
  >
    <div>
      <h2
        style={{
          margin: 0,
          fontSize: "22px",
          fontWeight: "700",
          color: "#1f2937",
        }}
      >
        Team Join Requests
      </h2>

      <p
        style={{
          marginTop: "6px",
          color: "#6b7280",
        }}
      >
        Review employees requesting to join your teams.
      </p>
    </div>

    <span
      style={{
        padding: "6px 12px",
        borderRadius: "20px",
        background: "#fef3c7",
        color: "#92400e",
        fontSize: "13px",
        fontWeight: "600",
      }}
    >
      {joinRequests.length} Pending
    </span>
  </div>

  {joinRequestMessage && (
    <div
      style={{
        marginBottom: "18px",
        padding: "12px 15px",
        borderRadius: "8px",
        background: "#f0fdf4",
        color: "#166534",
      }}
    >
      {joinRequestMessage}
    </div>
  )}

  {joinRequestsLoading ? (
    <p style={{ color: "#6b7280" }}>
      Loading requests...
    </p>
  ) : joinRequests.length === 0 ? (
    <div
      style={{
        padding: "25px",
        textAlign: "center",
        border: "1px dashed #d1d5db",
        borderRadius: "12px",
        color: "#6b7280",
      }}
    >
      No pending join requests.
    </div>
  ) : (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "15px",
      }}
    >
      {joinRequests.map((request) => (
        <div
          key={request._id}
          style={{
            padding: "18px",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            background: "#f9fafb",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "20px",
            }}
          >
            <div>
              <h3
                style={{
                  margin: 0,
                  color: "#1f2937",
                }}
              >
                {request.employee?.name || "Employee"}
              </h3>

              <p
                style={{
                  margin: "5px 0",
                  color: "#6b7280",
                  fontSize: "14px",
                }}
              >
                {request.employee?.email}
              </p>

              <p
                style={{
                  margin: "8px 0 0",
                  color: "#374151",
                }}
              >
                Requested to join{" "}
                <strong>
                  {request.team?.name}
                </strong>
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
              }}
            >
              <button
                type="button"
                onClick={() =>
                  handleJoinRequest(
                    request._id,
                    "approve"
                  )
                }
                style={{
                  padding: "9px 16px",
                  border: "none",
                  borderRadius: "7px",
                  background: "#166534",
                  color: "#ffffff",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                ✓ Approve
              </button>

              <button
                type="button"
                onClick={() =>
                  handleJoinRequest(
                    request._id,
                    "reject"
                  )
                }
                style={{
                  padding: "9px 16px",
                  border: "none",
                  borderRadius: "7px",
                  background: "#dc2626",
                  color: "#ffffff",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                ✕ Reject
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )}
</section>
          {/* ================= FINAL REVIEW ================= */}

          <section
            id="final-review"
            style={styles.reviewPanel}
          >

            <h2 style={styles.panelTitle}>
              Final Decision Review
            </h2>

            <p style={styles.panelSubtitle}>
              Review the decision and reviewer
              feedback before making the final
              decision.
            </p>

            {!selectedDecision ? (

              <div style={styles.emptyState}>
                Select a decision from Pending
                Approvals to begin.
              </div>

            ) : (

              <>

                {/* DECISION DETAILS */}

                <div
                  style={styles.reviewDetails}
                >

                  <div
                    style={styles.reviewHeader}
                  >

                    <div>

                      <span
                        style={
                          styles.statusBadge
                        }
                      >
                        Under Review
                      </span>

                      <h2
                        style={
                          styles.selectedTitle
                        }
                      >
                        {selectedDecision.title}
                      </h2>

                    </div>

                  </div>

                  <p
                    style={
                      styles.selectedDescription
                    }
                  >
                    {
                      selectedDecision.description
                    }
                  </p>

                  <div
                    style={styles.infoGrid}
                  >

                    <div>

                      <p
                        style={
                          styles.infoLabel
                        }
                      >
                        Created By
                      </p>

                      <strong>
                        {selectedDecision
                          .createdBy?.name ||
                          "Unknown"}
                      </strong>

                    </div>

                    <div>

                      <p
                        style={
                          styles.infoLabel
                        }
                      >
                        Created On
                      </p>

                      <strong>
                        {formatDate(
                          selectedDecision.createdAt
                        )}
                      </strong>

                    </div>

                  </div>

                </div>

                {/* DOCUMENTS */}

                <div
                  style={styles.documentsBox}
                >

                  <h3
                    style={
                      styles.feedbackHeading
                    }
                  >
                    Decision Documents
                  </h3>

                  {selectedDecision.documents
                    ?.length > 0 ? (

                    <div
                      style={
                        styles.documentList
                      }
                    >

                      {selectedDecision.documents.map(
                        (doc) => (

                          <div
                            key={doc._id}
                            style={
                              styles.documentItem
                            }
                          >

                            <span
                              style={
                                styles.documentName
                              }
                            >
                              📄 {doc.fileName}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                handleViewDocument(
                                  doc
                                )
                              }
                              style={
                                styles.openDocument
                              }
                            >
                              View Document
                            </button>

                          </div>

                        )
                      )}

                    </div>

                  ) : (

                    <p
                      style={
                        styles.noDocument
                      }
                    >
                      No documents attached to
                      this decision.
                    </p>

                  )}

                </div>

                {/* REVIEWER FEEDBACK */}

                <div
                  style={styles.reviewerBox}
                >

                  <h3
                    style={
                      styles.feedbackHeading
                    }
                  >
                    Reviewer Feedback
                  </h3>

                  <p
                    style={
                      styles.reviewerFeedback
                    }
                  >
                    {selectedDecision
                      .reviewerFeedback ||
                      "No reviewer feedback available."}
                  </p>

                </div>

                {/* MANAGER FORM */}

                <div
                  style={styles.managerForm}
                >

                  <label style={styles.label}>
                    Manager Feedback
                  </label>

                  <textarea
                    rows="5"
                    placeholder="Add your final comments and recommendations..."
                    value={managerFeedback}
                    onChange={(e) =>
                      setManagerFeedback(
                        e.target.value
                      )
                    }
                    style={styles.textarea}
                    disabled={actionLoading}
                  />

                  <div
                    style={styles.actionRow}
                  >

                    <button
                      style={{
                        ...styles.rejectButton,

                        ...(actionLoading
                          ? styles.disabledButton
                          : {}),
                      }}
                      onClick={() =>
                        handleDecision(
                          "Rejected"
                        )
                      }
                      disabled={actionLoading}
                    >
                      {actionLoading
                        ? "Processing..."
                        : "✕ Reject Decision"}
                    </button>

                    <button
                      style={{
                        ...styles.approveButton,

                        ...(actionLoading
                          ? styles.disabledButton
                          : {}),
                      }}
                      onClick={() =>
                        handleDecision(
                          "Approved"
                        )
                      }
                      disabled={actionLoading}
                    >
                      {actionLoading
                        ? "Processing..."
                        : "✓ Approve Decision"}
                    </button>

                  </div>

                </div>

              </>

            )}

          </section>

        </div>

      </main>

    </div>
  );
}

/* =====================================================
                      STYLES
===================================================== */

const styles = {
  /* ================= LAYOUT ================= */

  layout: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#f1f5f9",
    fontFamily: "Arial, sans-serif",
    color: "#0f172a",
  },

  sidebar: {
    position: "fixed",
    top: 0,
    left: 0,
    bottom: 0,
    width: "236px",
    padding: "16px 10px",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    backgroundColor: "#0f172a",
    borderRight: "1px solid #1e293b",
    zIndex: 100,
    overflowY: "auto",
  },

  main: {
    flex: 1,
    minWidth: 0,
    marginLeft: "236px",
  },

  topbar: {
    height: "62px",
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 30px",
    boxSizing: "border-box",
  },

  content: {
    padding: "28px",
    minWidth: 0,
    boxSizing: "border-box",
  },

  /* ================= BRAND ================= */

  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "8px 10px 22px",
    marginBottom: "16px",
    borderBottom: "1px solid #263247",
  },

  logoIcon: {
    width: "38px",
    height: "38px",
    borderRadius: "10px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "21px",
    flexShrink: 0,
  },

  brandTitle: {
    margin: 0,
    fontSize: "15px",
    fontWeight: "700",
    color: "#f8fafc",
  },

  brandSub: {
    margin: "4px 0 0",
    fontSize: "11px",
    color: "#94a3b8",
  },

  navSection: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    width: "100%",
  },

  menuButton: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    width: "100%",
    minHeight: "44px",
    padding: "11px 12px",
    boxSizing: "border-box",
    border: "1px solid transparent",
    borderRadius: "8px",
    backgroundColor: "transparent",
    color: "#cbd5e1",
    fontSize: "13px",
    textAlign: "left",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
  },

  activeMenu: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    width: "100%",
    minHeight: "44px",
    padding: "11px 12px",
    boxSizing: "border-box",
    border: "1px solid #334155",
    borderLeft: "3px solid #3b82f6",
    borderRadius: "8px",
    backgroundColor: "#1e293b",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: "600",
    textAlign: "left",
    cursor: "pointer",
  },

  sidebarFooter: {
    marginTop: "auto",
    paddingTop: "16px",
    borderTop: "1px solid #263247",
  },

  logoutButton: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    width: "100%",
    minHeight: "44px",
    marginTop: "auto",
    padding: "11px 12px",
    boxSizing: "border-box",
    border: "1px solid #334155",
    borderRadius: "8px",
    backgroundColor: "#172033",
    color: "#fca5a5",
    fontSize: "13px",
    fontWeight: "600",
    textAlign: "left",
    cursor: "pointer",
  },

  /* ================= PROFILE ================= */

  profileArea: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  notificationProfile: {
    fontSize: "20px",
    marginRight: "12px",
  },

  avatar: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    backgroundColor: "#64748b",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    flexShrink: 0,
  },

  userName: {
    fontSize: "13px",
    fontWeight: "600",
  },

  userRole: {
    margin: "3px 0 0",
    color: "#64748b",
    fontSize: "11px",
    textTransform: "capitalize",
  },

  /* ================= WELCOME ================= */

  welcome: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    marginBottom: "20px",
  },

  welcomeTitle: {
    margin: 0,
    fontSize: "32px",
    color: "#1e293b",
  },

  welcomeText: {
    margin: "8px 0 0",
    color: "#64748b",
    fontSize: "16px",
  },

  date: {
    color: "#475569",
    fontSize: "14px",
    marginTop: "8px",
    textAlign: "right",
  },

  /* ================= MESSAGES ================= */

  message: {
    marginBottom: "16px",
    padding: "12px 16px",
    borderRadius: "8px",
    fontWeight: "bold",
    fontSize: "14px",
  },

  successMessage: {
    backgroundColor: "#dcfce7",
    color: "#166534",
    border: "1px solid #bbf7d0",
  },

  errorMessage: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    border: "1px solid #fecaca",
  },

  /* ================= STATS ================= */

  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(180px, 1fr))",
    gap: "14px",
    marginBottom: "16px",
  },

  statCard: {
    padding: "17px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    minHeight: "90px",
    boxSizing: "border-box",
  },

  pendingCard: {
    backgroundColor: "#fff7df",
  },

  approvedCard: {
    backgroundColor: "#eaf8f0",
  },

  rejectedCard: {
    backgroundColor: "#fff0f0",
  },

  totalCard: {
    backgroundColor: "#edf4ff",
  },

  statIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    backgroundColor: "rgba(255,255,255,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "25px",
    color: "#2563eb",
    flexShrink: 0,
  },

  statNumber: {
    margin: 0,
    fontSize: "30px",
  },

  statLabel: {
    margin: "5px 0",
    color: "#475569",
    fontSize: "15px",
  },

  smallText: {
    margin: "5px 0 0",
    color: "#64748b",
    fontSize: "12px",
  },

  viewButton: {
    border: "none",
    backgroundColor: "transparent",
    color: "#2563eb",
    padding: 0,
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
  },

  /* ================= DASHBOARD GRID ================= */

  dashboardGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 300px",
    gap: "16px",
  },

  largePanel: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    overflow: "hidden",
    minWidth: 0,
  },

  activityPanel: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "18px",
  },

  panelHeader: {
    padding: "18px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    borderBottom: "1px solid #e2e8f0",
  },

  panelTitle: {
    margin: 0,
    fontSize: "22px",
    color: "#1e293b",
  },

  panelSubtitle: {
    color: "#64748b",
    margin: "7px 0 0",
    fontSize: "14px",
  },

  createButton: {
    backgroundColor: "#2563b8",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    padding: "9px 14px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  /* ================= TABLE ================= */

  tableWrapper: {
    overflowX: "auto",
    width: "100%",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1050px",
    fontSize: "14px",
  },

  tableHeader: {
    textAlign: "left",
    padding: "14px",
    backgroundColor: "#f8fafc",
    color: "#475569",
    borderBottom: "1px solid #e2e8f0",
    fontSize: "13px",
  },

  tableRow: {
    borderBottom: "1px solid #eef2f7",
  },

  tableCell: {
    padding: "16px 14px",
    verticalAlign: "top",
  },

  decisionTitle: {
    color: "#1e293b",
    fontSize: "15px",
  },

  description: {
    color: "#64748b",
    fontSize: "13px",
    margin: "6px 0 0",
    maxWidth: "240px",
    lineHeight: "20px",
  },

  email: {
    margin: "5px 0 0",
    color: "#64748b",
    fontSize: "12px",
  },

  feedbackText: {
    margin: 0,
    fontSize: "13px",
    color: "#475569",
    maxWidth: "190px",
    lineHeight: "20px",
  },

  reviewButton: {
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
    borderRadius: "6px",
    padding: "9px 16px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "bold",
  },

  /* ================= DOCUMENTS ================= */

  documentButton: {
    border: "1px solid #bfdbfe",
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
    borderRadius: "6px",
    padding: "7px 10px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "bold",
    textAlign: "left",
    maxWidth: "200px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  documentsBox: {
    marginTop: "18px",
    padding: "18px",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
  },

  documentList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "12px",
  },

  documentItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    padding: "12px",
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
  },

  documentName: {
    fontSize: "13px",
    color: "#334155",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  openDocument: {
    color: "#2563eb",
    backgroundColor: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "6px",
    padding: "7px 10px",
    fontSize: "12px",
    fontWeight: "bold",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  noDocument: {
    color: "#94a3b8",
    fontSize: "12px",
  },

  emptyState: {
    margin: "16px",
    padding: "35px",
    textAlign: "center",
    backgroundColor: "#f8fafc",
    color: "#64748b",
    borderRadius: "8px",
  },

  /* ================= ACTIVITY ================= */

  activityItem: {
    display: "flex",
    gap: "12px",
    padding: "16px 0",
    borderBottom: "1px solid #eef2f7",
  },

  activityItemLast: {
    display: "flex",
    gap: "12px",
    padding: "16px 0 0",
  },

  activityText: {
    margin: "5px 0 0",
    color: "#64748b",
    fontSize: "13px",
    lineHeight: "18px",
  },

  activityIcon: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    backgroundColor: "#fff3cd",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#b45309",
    flexShrink: 0,
  },

  greenIcon: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    backgroundColor: "#dcfce7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#15803d",
    flexShrink: 0,
  },

  redIcon: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    backgroundColor: "#fee2e2",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#dc2626",
    flexShrink: 0,
  },

  blueIcon: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    backgroundColor: "#dbeafe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#2563eb",
    flexShrink: 0,
  },

  /* ================= ANALYTICS ================= */

  analyticsSection: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "22px",
    marginTop: "16px",
  },

  analyticsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "20px",
  },

  analyticsHeaderText: {
    flex: 1,
  },

  analyticsRefreshButton: {
    backgroundColor: "#2563b8",
    color: "#ffffff",
    border: "none",
    borderRadius: "7px",
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: "bold",
    whiteSpace: "nowrap",
  },

  analyticsSummaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(180px, 1fr))",
    gap: "14px",
    marginBottom: "20px",
  },

  analyticsCard: {
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "9px",
    padding: "16px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    minHeight: "90px",
    boxSizing: "border-box",
  },

  analyticsCardIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    backgroundColor: "#e0ecff",
    color: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    fontWeight: "bold",
    flexShrink: 0,
  },

  analyticsCardNumber: {
    margin: 0,
    fontSize: "25px",
    color: "#1e293b",
  },

  analyticsCardLabel: {
    margin: "4px 0 0",
    fontSize: "14px",
    fontWeight: "bold",
    color: "#334155",
  },

  analyticsCardSubtext: {
    margin: "4px 0 0",
    fontSize: "11px",
    color: "#64748b",
  },

  analyticsChartsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "16px",
  },

  chartCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "9px",
    padding: "18px",
    minWidth: 0,
  },

  chartTitle: {
    margin: 0,
    fontSize: "17px",
    color: "#1e293b",
  },

  chartSubtitle: {
    margin: "5px 0 0",
    color: "#64748b",
    fontSize: "12px",
  },

  chartContainer: {
    width: "100%",
    height: "320px",
    marginTop: "15px",
  },

  chartEmpty: {
    height: "100%",
    minHeight: "180px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    color: "#64748b",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    padding: "20px",
    boxSizing: "border-box",
  },

  analyticsError: {
    marginBottom: "16px",
    padding: "12px 15px",
    borderRadius: "7px",
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    border: "1px solid #fecaca",
    fontSize: "14px",
    fontWeight: "bold",
  },

  /* ================= FINAL REVIEW ================= */

  reviewPanel: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "22px",
    marginTop: "16px",
  },

  reviewDetails: {
    marginTop: "20px",
    backgroundColor: "#f8fafc",
    padding: "20px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
  },

  reviewHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "15px",
  },

  statusBadge: {
    display: "inline-block",
    backgroundColor: "#dbeafe",
    color: "#1d4ed8",
    padding: "5px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "bold",
  },

  selectedTitle: {
    margin: "12px 0 0",
    fontSize: "25px",
    color: "#1e293b",
  },

  selectedDescription: {
    color: "#475569",
    lineHeight: "1.7",
    fontSize: "15px",
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "20px",
    marginTop: "20px",
  },

  infoLabel: {
    margin: "0 0 5px",
    color: "#64748b",
    fontSize: "12px",
  },

  /* ================= REVIEWER FEEDBACK ================= */

  reviewerBox: {
    marginTop: "18px",
    padding: "18px",
    backgroundColor: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "8px",
  },

  feedbackHeading: {
    margin: 0,
    fontSize: "15px",
    color: "#1e3a8a",
  },

  reviewerFeedback: {
    marginBottom: 0,
    color: "#334155",
    lineHeight: "1.6",
    fontSize: "14px",
  },

  /* ================= MANAGER FORM ================= */

  managerForm: {
    marginTop: "20px",
  },

  label: {
    display: "block",
    fontWeight: "bold",
    marginBottom: "10px",
    fontSize: "15px",
  },

  textarea: {
    width: "100%",
    boxSizing: "border-box",
    padding: "15px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontFamily: "Arial, sans-serif",
    fontSize: "15px",
    resize: "vertical",
    outline: "none",
  },

  actionRow: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "16px",
  },

  approveButton: {
    backgroundColor: "#16a34a",
    color: "#ffffff",
    border: "none",
    padding: "12px 18px",
    borderRadius: "7px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  rejectButton: {
    backgroundColor: "#dc2626",
    color: "#ffffff",
    border: "none",
    padding: "12px 18px",
    borderRadius: "7px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  disabledButton: {
    opacity: 0.6,
    cursor: "not-allowed",
  },

  /* ================= NOTIFICATIONS ================= */

  notificationWrapper: {
    position: "relative",
  },

  notification: {
    position: "relative",
    width: "42px",
    height: "42px",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "#f8fafc",
    cursor: "pointer",
    fontSize: "21px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  notificationBadge: {
    position: "absolute",
    top: "-3px",
    right: "-3px",
    minWidth: "18px",
    height: "18px",
    padding: "0 4px",
    borderRadius: "20px",
    backgroundColor: "#dc2626",
    color: "#ffffff",
    fontSize: "10px",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "2px solid #ffffff",
    boxSizing: "border-box",
  },

  notificationDropdown: {
    position: "absolute",
    top: "52px",
    right: 0,
    width: "390px",
    maxWidth: "calc(100vw - 30px)",
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    boxShadow: "0 15px 40px rgba(15, 23, 42, 0.18)",
    zIndex: 1000,
    overflow: "hidden",
  },

  notificationHeader: {
    padding: "17px 18px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    borderBottom: "1px solid #e2e8f0",
  },

  notificationTitle: {
    margin: 0,
    color: "#1e293b",
    fontSize: "17px",
  },

  notificationSubtitle: {
    margin: "4px 0 0",
    color: "#64748b",
    fontSize: "12px",
  },

  markAllButton: {
    border: "none",
    backgroundColor: "transparent",
    color: "#2563eb",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "bold",
    whiteSpace: "nowrap",
  },

  notificationList: {
    maxHeight: "400px",
    overflowY: "auto",
  },

  notificationItem: {
    display: "flex",
    gap: "12px",
    padding: "15px 17px",
    borderBottom: "1px solid #f1f5f9",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
  },

  notificationUnread: {
    backgroundColor: "#eff6ff",
  },

  notificationRead: {
    backgroundColor: "#ffffff",
  },

  notificationItemIcon: {
    width: "34px",
    height: "34px",
    borderRadius: "9px",
    backgroundColor: "#dbeafe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    fontSize: "16px",
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
    color: "#1e293b",
    fontSize: "13px",
  },

  unreadDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor: "#2563eb",
    flexShrink: 0,
  },

  notificationMessage: {
    margin: "5px 0",
    color: "#475569",
    fontSize: "13px",
    lineHeight: "1.45",
  },

  notificationDecision: {
    margin: "5px 0",
    color: "#2563eb",
    fontSize: "11px",
    fontWeight: "bold",
  },

  notificationDate: {
    color: "#94a3b8",
    fontSize: "10px",
  },

  notificationEmpty: {
    padding: "35px 20px",
    textAlign: "center",
    color: "#64748b",
    fontSize: "13px",
  },

  notificationEmptyIcon: {
    fontSize: "28px",
    marginBottom: "8px",
  },

  notificationFooter: {
    padding: "10px 15px",
    borderTop: "1px solid #e2e8f0",
    backgroundColor: "#f8fafc",
  },

  refreshNotificationButton: {
    width: "100%",
    padding: "9px",
    border: "1px solid #cbd5e1",
    borderRadius: "7px",
    backgroundColor: "#ffffff",
    color: "#334155",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "bold",
  },

  /* ================= MY TEAMS ================= */

  teamSection: {
    marginTop: "32px",
    padding: "28px",
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 4px 15px rgba(0,0,0,0.04)",
  },

  teamHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "24px",
  },

  teamTitle: {
    margin: 0,
    fontSize: "26px",
    fontWeight: "700",
    color: "#1f2937",
  },

  teamSubtitle: {
    margin: "6px 0 0",
    fontSize: "14px",
    color: "#6b7280",
  },

  joinTeamButton: {
    border: "none",
    borderRadius: "8px",
    padding: "11px 18px",
    backgroundColor: "#166534",
    color: "#ffffff",
    fontWeight: "600",
    cursor: "pointer",
  },

  teamControls: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    marginBottom: "20px",
  },

  teamSearchBox: {
    flex: 1,
    maxWidth: "420px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 14px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    backgroundColor: "#ffffff",
  },

  teamSearchIcon: {
    fontSize: "15px",
  },

  teamSearchInput: {
    width: "100%",
    border: "none",
    outline: "none",
    fontSize: "14px",
    color: "#374151",
  },

  teamSortSelect: {
    minWidth: "170px",
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    backgroundColor: "#ffffff",
    color: "#374151",
    outline: "none",
  },

  teamTabs: {
    display: "flex",
    gap: "24px",
    borderBottom: "1px solid #e5e7eb",
    marginBottom: "24px",
  },

  teamTabActive: {
    padding: "10px 4px",
    border: "none",
    borderBottom: "2px solid #166534",
    backgroundColor: "transparent",
    color: "#166534",
    fontWeight: "700",
    cursor: "pointer",
  },

  teamTab: {
    padding: "10px 4px",
    border: "none",
    backgroundColor: "transparent",
    color: "#6b7280",
    fontWeight: "500",
    cursor: "pointer",
  },

  teamGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "18px",
  },

  teamCard: {
    padding: "20px",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    backgroundColor: "#ffffff",
    transition: "transform 0.2s ease",
  },

  teamCardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "18px",
  },

  teamIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "10px",
    backgroundColor: "#ecfdf5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "21px",
  },

  activeTeamBadge: {
    padding: "5px 9px",
    borderRadius: "20px",
    backgroundColor: "#ecfdf5",
    color: "#15803d",
    fontSize: "11px",
    fontWeight: "600",
  },

  teamCardTitle: {
    margin: "0 0 8px",
    fontSize: "17px",
    fontWeight: "700",
    color: "#1f2937",
  },

  teamCardDescription: {
    minHeight: "48px",
    margin: "0 0 18px",
    fontSize: "13px",
    lineHeight: "1.6",
    color: "#6b7280",
  },

  teamStats: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    padding: "12px 0",
    borderTop: "1px solid #f0f0f0",
    borderBottom: "1px solid #f0f0f0",
    fontSize: "12px",
    color: "#6b7280",
  },

  teamCardFooter: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "14px",
  },

  viewTeamButton: {
    flex: 1,
    padding: "9px 12px",
    border: "1px solid #166534",
    borderRadius: "7px",
    backgroundColor: "#ffffff",
    color: "#166534",
    fontWeight: "600",
    fontSize: "13px",
    cursor: "pointer",
  },

  teamMoreButton: {
    width: "38px",
    height: "36px",
    border: "1px solid #e5e7eb",
    borderRadius: "7px",
    backgroundColor: "#ffffff",
    color: "#6b7280",
    fontSize: "20px",
    cursor: "pointer",
  },

  joinTeamCard: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    marginTop: "26px",
    padding: "20px",
    borderRadius: "14px",
    border: "1px dashed #bbf7d0",
    backgroundColor: "#f0fdf4",
  },

  joinTeamIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    backgroundColor: "#dcfce7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    flexShrink: 0,
  },

  joinTeamContent: {
    flex: 1,
  },

  joinTeamTitle: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "700",
    color: "#166534",
  },

  joinTeamText: {
    margin: "5px 0 0",
    fontSize: "13px",
    color: "#4b5563",
  },

  browseTeamButton: {
    padding: "9px 16px",
    border: "none",
    borderRadius: "7px",
    backgroundColor: "#166534",
    color: "#ffffff",
    fontWeight: "600",
    cursor: "pointer",
  },

  teamBottomGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "20px",
    marginTop: "24px",
  },

  teamActivityCard: {
    padding: "20px",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    backgroundColor: "#ffffff",
  },

  bottomCardTitle: {
    margin: "0 0 18px",
    fontSize: "17px",
    fontWeight: "700",
    color: "#1f2937",
  },

  teamActivityItem: {
    display: "flex",
    gap: "12px",
    padding: "13px 0",
    borderBottom: "1px solid #f3f4f6",
  },

  activityDot: {
    width: "9px",
    height: "9px",
    marginTop: "6px",
    borderRadius: "50%",
    backgroundColor: "#16a34a",
    flexShrink: 0,
  },

  meetingItem: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "12px 0",
    borderBottom: "1px solid #f3f4f6",
  },

  meetingDate: {
    width: "48px",
    height: "48px",
    borderRadius: "8px",
    backgroundColor: "#f0fdf4",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "#166534",
    flexShrink: 0,
  },

  teamQuote: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginTop: "24px",
    padding: "22px",
    borderRadius: "14px",
    backgroundColor: "#f9fafb",
    border: "1px solid #e5e7eb",
  },

  quoteIcon: {
    fontSize: "26px",
  },

  quoteText: {
    margin: 0,
    fontSize: "15px",
    fontWeight: "600",
    color: "#374151",
  },

  quoteSubtext: {
    display: "block",
    marginTop: "6px",
    fontSize: "12px",
    color: "#6b7280",
  },

  availableTeamsPanel: {
    marginTop: "20px",
    padding: "24px",
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
  },

  availableTeamsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },

  availableTeamsTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "700",
    color: "#0f172a",
  },

  availableTeamsSubtitle: {
    margin: "6px 0 0",
    color: "#64748b",
    fontSize: "14px",
  },

  teamCountBadge: {
    padding: "6px 12px",
    borderRadius: "20px",
    backgroundColor: "#f1f5f9",
    color: "#475569",
    fontSize: "13px",
    fontWeight: "600",
  },

  joinSuccessMessage: {
    marginBottom: "18px",
    padding: "12px 16px",
    borderRadius: "10px",
    backgroundColor: "#ecfdf5",
    border: "1px solid #bbf7d0",
    color: "#15803d",
    fontSize: "14px",
    fontWeight: "600",
  },

  availableTeamsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "18px",
  },

  availableTeamCard: {
    padding: "20px",
    borderRadius: "14px",
    border: "1px solid #e2e8f0",
    backgroundColor: "#f8fafc",
  },

  availableTeamTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "14px",
  },

  availableTeamTitle: {
    margin: "0 0 8px",
    fontSize: "17px",
    fontWeight: "700",
    color: "#0f172a",
  },

  availableTeamDescription: {
    margin: "0 0 16px",
    color: "#64748b",
    fontSize: "13px",
    lineHeight: "1.5",
  },

  joinAvailableTeamButton: {
    width: "100%",
    marginTop: "16px",
    padding: "10px 14px",
    border: "none",
    borderRadius: "9px",
    backgroundColor: "#0f766e",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },

  joinedTeamButton: {
    backgroundColor: "#dcfce7",
    color: "#15803d",
    cursor: "default",
  },

  /* ================= REPORTS ================= */

  reportsSection: {
    marginTop: "24px",
    padding: "24px",
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(15,23,42,0.04)",
    minWidth: 0,
  },

  reportsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
    marginBottom: "22px",
  },

  reportsTitle: {
    margin: 0,
    fontSize: "24px",
    color: "#1e293b",
  },

  reportsSubtitle: {
    margin: "6px 0 0",
    fontSize: "14px",
    color: "#64748b",
  },

  reportTabs: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "20px",
    borderBottom: "1px solid #e2e8f0",
    paddingBottom: "14px",
  },

  reportTab: {
    padding: "10px 14px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    backgroundColor: "#ffffff",
    color: "#475569",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },

  reportTabActive: {
    padding: "10px 14px",
    border: "1px solid #2563eb",
    borderRadius: "8px",
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
  },

  reportContent: {
    padding: "20px",
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    minWidth: 0,
    overflowX: "auto",
  },

  reportStats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "12px",
    marginBottom: "20px",
  },

  reportStatCard: {
    padding: "16px",
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "9px",
  },

  reportStatNumber: {
    margin: 0,
    fontSize: "26px",
    fontWeight: "700",
    color: "#1e293b",
  },

  reportStatLabel: {
    margin: "6px 0 0",
    fontSize: "12px",
    color: "#64748b",
  },

  exportActions: {
    display: "flex",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: "10px",
    marginBottom: "18px",
  },

  exportPdfButton: {
    padding: "10px 15px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#4f46e5",
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
  },

  exportExcelButton: {
    padding: "10px 15px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#059669",
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
  },

  reportError: {
    padding: "12px 15px",
    marginBottom: "16px",
    borderRadius: "8px",
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    border: "1px solid #fecaca",
    fontSize: "13px",
  },

  reportLoading: {
    padding: "35px 20px",
    textAlign: "center",
    color: "#64748b",
    fontSize: "14px",
  },

  reportEmpty: {
    padding: "35px 20px",
    textAlign: "center",
    color: "#64748b",
    backgroundColor: "#ffffff",
    borderRadius: "8px",
  },

  /* ================= SEARCH ================= */

  searchContainer: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },

  searchIcon: {
    position: "absolute",
    left: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none",
    flexShrink: 0,
  },

  searchInput: {
    width: "100%",
    minWidth: 0,
    height: "46px",
    padding: "0 14px 0 42px",
    boxSizing: "border-box",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    backgroundColor: "#ffffff",
    color: "#111827",
    fontSize: "14px",
    outline: "none",
  },

  searchButton: {
    height: "46px",
    padding: "0 24px",
    border: "none",
    borderRadius: "10px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  /* ================= GENERAL SECTION STYLES ================= */

  section: {
    scrollMarginTop: "20px",
    minWidth: 0,
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    marginBottom: "20px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "25px",
    fontWeight: "700",
    color: "#1e293b",
  },

  sectionSubtitle: {
    margin: "7px 0 0",
    fontSize: "14px",
    color: "#64748b",
    lineHeight: "1.5",
  },
};


export default ManagerDashboard;