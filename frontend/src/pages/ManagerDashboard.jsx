import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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
import KnowledgeGraph from "../components/KnowledgeGraph";
function GraphDetailNode({
  left,
  top,
  icon,
  label,
  value,
}) {
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        transform: "translate(-50%, -50%)",

        width: "145px",
        minHeight: "82px",

        padding: "10px",

        borderRadius: "12px",

        background: "#ffffff",

        border: "1px solid #93c5fd",

        boxShadow:
          "0 5px 15px rgba(15,23,42,0.10)",

        textAlign: "center",

        zIndex: 9,

        animation:
          "graphNodeAppear 0.3s ease",
      }}
    >
      <div
        style={{
          fontSize: "19px",
          marginBottom: "3px",
        }}
      >
        {icon}
      </div>

      <div
        style={{
          fontSize: "11px",
          fontWeight: "700",
          color: "#2563eb",
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: "4px",
          fontSize: "10px",
          color: "#64748b",
          lineHeight: "1.35",

          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",

          overflow: "hidden",
        }}
        title={value}
      >
        {value}
      </div>
    </div>
  );
}

function InfoBox({
  label,
  value,
}) {
  return (
    <div
      style={{
        padding: "11px 12px",
        borderRadius: "9px",
        background: "#ffffff",
        border: "1px solid #e2e8f0",
      }}
    >
      <div
        style={{
          fontSize: "10px",
          fontWeight: "700",
          color: "#64748b",
          textTransform: "uppercase",
          marginBottom: "5px",
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: "12px",
          color: "#334155",
          lineHeight: "1.4",
        }}
      >
        {value}
      </div>
    </div>
  );
}
function ManagerDashboard() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");
const API_URL = "http://localhost:5173";
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
const [teams, setTeams] = useState([]);

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

        <div style={styles.brand}>
          <div style={styles.logoIcon}>
            ◉
          </div>

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

          <button
            style={styles.activeMenu}
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              })
            }
          >
            <span>⌂</span>
            Dashboard
          </button>

          <button
            style={styles.menuButton}
            onClick={() =>
              scrollToSection("pending")
            }
          >
            <span>◷</span>
            Pending Approval
          </button>

          <button
            style={styles.menuButton}
            onClick={() =>
              scrollToSection("pending")
            }
          >
            <span>▣</span>
            Team Decisions
          </button>

          <button
            style={styles.menuButton}
            onClick={() =>
              scrollToSection("final-review")
            }
          >
            <span>✓</span>
            Final Review
          </button>

          <button
            style={styles.menuButton}
            onClick={() =>
              scrollToSection("analytics")
            }
          >
            <span>◉</span>
            Analytics
          </button>
          <button
  type="button"
  onClick={() => {
    document
      .getElementById("knowledge-repository")
      ?.scrollIntoView({
        behavior: "smooth",
      });
  }}
>
  Knowledge Repository
</button>
<button
  style={styles.menuButton}
  onClick={() => scrollToSection("teams")}
>
  <span>👥</span>
  My Teams
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
    </div>
  )}

  {/* =====================================================
      INTERACTIVE KNOWLEDGE GRAPH
  ===================================================== */}

  {/* =====================================================
    INTERACTIVE EXPANDABLE KNOWLEDGE GRAPH
===================================================== */}

{/* =====================================================
    DECISION KNOWLEDGE GRAPH
===================================================== */}

<div
  style={{
    marginTop: "28px",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    background: "#ffffff",
    overflow: "hidden",
  }}
>
  {/* =====================================================
      HEADER
  ===================================================== */}

  <div
    style={{
      padding: "18px 20px",
      borderBottom: "1px solid #e2e8f0",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "15px",
      flexWrap: "wrap",
    }}
  >
    <div>
      <h3
        style={{
          margin: 0,
          fontSize: "17px",
          fontWeight: "700",
          color: "#0f172a",
        }}
      >
        Decision Knowledge Graph
      </h3>

      <p
        style={{
          margin: "5px 0 0",
          fontSize: "13px",
          color: "#64748b",
        }}
      >
        Explore decisions and their related knowledge.
      </p>
    </div>

    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
    >
      <span
        style={{
          padding: "6px 11px",
          borderRadius: "15px",
          background: "#eff6ff",
          color: "#2563eb",
          fontSize: "12px",
          fontWeight: "600",
        }}
      >
        {allDecisions.length} Decisions
      </span>

      <button
        type="button"
        onClick={() => {
          setExpandedGraphNode(null);
          setSelectedGraphDecision(null);
        }}
        style={{
          padding: "6px 11px",
          border: "1px solid #cbd5e1",
          borderRadius: "7px",
          background: "#ffffff",
          color: "#475569",
          cursor: "pointer",
          fontSize: "12px",
          fontWeight: "600",
        }}
      >
        Reset
      </button>
    </div>
  </div>

  {/* =====================================================
      GRAPH AREA
  ===================================================== */}

  <div
    style={{
      position: "relative",
      height:
        selectedGraphDecision ||
        expandedGraphNode === "decisions"
          ? "760px"
          : "500px",

      background:
        "radial-gradient(circle at center, #ffffff 0%, #f8fafc 85%)",

      overflow: "hidden",

      transition: "height 0.3s ease",
    }}
  >
    {allDecisions.length === 0 ? (
      /* =================================================
          EMPTY
      ================================================= */

      <div
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          color: "#64748b",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "40px",
              marginBottom: "12px",
            }}
          >
            🧠
          </div>

          <p
            style={{
              margin: 0,
              fontWeight: "600",
            }}
          >
            No decisions available
          </p>

          <p
            style={{
              marginTop: "6px",
              fontSize: "13px",
            }}
          >
            Decisions will automatically appear here.
          </p>
        </div>
      </div>
    ) : (
      <>
        {/* =================================================
            SVG CONNECTIONS
        ================================================= */}

        <svg
          width="100%"
          height="100%"
          viewBox="0 0 1000 760"
          preserveAspectRatio="none"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 1,
          }}
        >
          {/* CENTER → CATEGORIES */}

          <line
            x1="500"
            y1="250"
            x2="220"
            y2="120"
            stroke={
              expandedGraphNode === "categories"
                ? "#2563eb"
                : "#cbd5e1"
            }
            strokeWidth={
              expandedGraphNode === "categories"
                ? "3"
                : "2"
            }
          />

          {/* CENTER → STATUS */}

          <line
            x1="500"
            y1="250"
            x2="780"
            y2="120"
            stroke={
              expandedGraphNode === "status"
                ? "#2563eb"
                : "#cbd5e1"
            }
            strokeWidth={
              expandedGraphNode === "status"
                ? "3"
                : "2"
            }
          />

          {/* CENTER → PEOPLE */}

          <line
            x1="500"
            y1="250"
            x2="220"
            y2="380"
            stroke={
              expandedGraphNode === "people"
                ? "#2563eb"
                : "#cbd5e1"
            }
            strokeWidth={
              expandedGraphNode === "people"
                ? "3"
                : "2"
            }
          />

          {/* CENTER → DECISIONS */}

          <line
            x1="500"
            y1="250"
            x2="780"
            y2="380"
            stroke={
              expandedGraphNode === "decisions"
                ? "#2563eb"
                : "#cbd5e1"
            }
            strokeWidth={
              expandedGraphNode === "decisions"
                ? "3"
                : "2"
            }
          />

          {/* =================================================
              DECISION → DETAIL NODES
          ================================================= */}

          {selectedGraphDecision && (
            <>
              <line
                x1="500"
                y1="570"
                x2="180"
                y2="650"
                stroke="#93c5fd"
                strokeWidth="2"
                strokeDasharray="6 5"
              />

              <line
                x1="500"
                y1="570"
                x2="340"
                y2="690"
                stroke="#93c5fd"
                strokeWidth="2"
                strokeDasharray="6 5"
              />

              <line
                x1="500"
                y1="570"
                x2="500"
                y2="700"
                stroke="#93c5fd"
                strokeWidth="2"
                strokeDasharray="6 5"
              />

              <line
                x1="500"
                y1="570"
                x2="660"
                y2="690"
                stroke="#93c5fd"
                strokeWidth="2"
                strokeDasharray="6 5"
              />

              <line
                x1="500"
                y1="570"
                x2="820"
                y2="650"
                stroke="#93c5fd"
                strokeWidth="2"
                strokeDasharray="6 5"
              />
            </>
          )}
        </svg>

        {/* =================================================
            CENTRAL REPOSITORY
        ================================================= */}

        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "250px",
            transform: "translate(-50%, -50%)",

            width: "190px",
            height: "125px",

            borderRadius: "20px",

            background:
              "linear-gradient(135deg,#2563eb,#1d4ed8)",

            color: "#ffffff",

            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",

            boxShadow:
              "0 12px 30px rgba(37,99,235,0.25)",

            zIndex: 5,
          }}
        >
          <div
            style={{
              fontSize: "30px",
              marginBottom: "4px",
            }}
          >
            🧠
          </div>

          <strong
            style={{
              fontSize: "15px",
            }}
          >
            Decision Repository
          </strong>

          <span
            style={{
              marginTop: "5px",
              fontSize: "12px",
              opacity: 0.9,
            }}
          >
            {allDecisions.length} decisions
          </span>
        </div>

        {/* =================================================
            CATEGORY NODE
        ================================================= */}

        <button
          type="button"
          onClick={() => {
            setSelectedGraphDecision(null);

            setExpandedGraphNode(
              expandedGraphNode === "categories"
                ? null
                : "categories"
            );
          }}
          style={{
            position: "absolute",
            left: "22%",
            top: "120px",
            transform: "translate(-50%, -50%)",

            width: "155px",
            minHeight: "95px",

            borderRadius: "16px",

            border:
              expandedGraphNode === "categories"
                ? "2px solid #2563eb"
                : "1px solid #bfdbfe",

            background:
              expandedGraphNode === "categories"
                ? "#eff6ff"
                : "#ffffff",

            boxShadow:
              "0 5px 15px rgba(15,23,42,0.08)",

            cursor: "pointer",
            zIndex: 4,
          }}
        >
          <div
            style={{
              fontSize: "25px",
            }}
          >
            📂
          </div>

          <div
            style={{
              marginTop: "4px",
              fontSize: "13px",
              fontWeight: "700",
              color: "#2563eb",
            }}
          >
            Categories
          </div>

          <div
            style={{
              marginTop: "4px",
              fontSize: "11px",
              color: "#64748b",
            }}
          >
            {
              new Set(
                allDecisions.map(
                  (d) => d.category || "General"
                )
              ).size
            }{" "}
            categories
          </div>
        </button>

        {/* =================================================
            STATUS NODE
        ================================================= */}

        <button
          type="button"
          onClick={() => {
            setSelectedGraphDecision(null);

            setExpandedGraphNode(
              expandedGraphNode === "status"
                ? null
                : "status"
            );
          }}
          style={{
            position: "absolute",
            left: "78%",
            top: "120px",
            transform: "translate(-50%, -50%)",

            width: "155px",
            minHeight: "95px",

            borderRadius: "16px",

            border:
              expandedGraphNode === "status"
                ? "2px solid #2563eb"
                : "1px solid #bfdbfe",

            background:
              expandedGraphNode === "status"
                ? "#eff6ff"
                : "#ffffff",

            boxShadow:
              "0 5px 15px rgba(15,23,42,0.08)",

            cursor: "pointer",
            zIndex: 4,
          }}
        >
          <div
            style={{
              fontSize: "25px",
            }}
          >
            📊
          </div>

          <div
            style={{
              marginTop: "4px",
              fontSize: "13px",
              fontWeight: "700",
              color: "#2563eb",
            }}
          >
            Status
          </div>

          <div
            style={{
              marginTop: "4px",
              fontSize: "11px",
              color: "#64748b",
            }}
          >
            4 decision states
          </div>
        </button>

        {/* =================================================
            PEOPLE NODE
        ================================================= */}

        <button
          type="button"
          onClick={() => {
            setSelectedGraphDecision(null);

            setExpandedGraphNode(
              expandedGraphNode === "people"
                ? null
                : "people"
            );
          }}
          style={{
            position: "absolute",
            left: "22%",
            top: "380px",
            transform: "translate(-50%, -50%)",

            width: "155px",
            minHeight: "95px",

            borderRadius: "16px",

            border:
              expandedGraphNode === "people"
                ? "2px solid #2563eb"
                : "1px solid #bfdbfe",

            background:
              expandedGraphNode === "people"
                ? "#eff6ff"
                : "#ffffff",

            boxShadow:
              "0 5px 15px rgba(15,23,42,0.08)",

            cursor: "pointer",
            zIndex: 4,
          }}
        >
          <div
            style={{
              fontSize: "25px",
            }}
          >
            👥
          </div>

          <div
            style={{
              marginTop: "4px",
              fontSize: "13px",
              fontWeight: "700",
              color: "#2563eb",
            }}
          >
            People
          </div>

          <div
            style={{
              marginTop: "4px",
              fontSize: "11px",
              color: "#64748b",
            }}
          >
            Users involved
          </div>
        </button>

        {/* =================================================
            ALL DECISIONS NODE
        ================================================= */}

        <button
          type="button"
          onClick={() => {
            setSelectedGraphDecision(null);

            setExpandedGraphNode(
              expandedGraphNode === "decisions"
                ? null
                : "decisions"
            );
          }}
          style={{
            position: "absolute",
            left: "78%",
            top: "380px",
            transform: "translate(-50%, -50%)",

            width: "155px",
            minHeight: "95px",

            borderRadius: "16px",

            border:
              expandedGraphNode === "decisions"
                ? "2px solid #2563eb"
                : "1px solid #bfdbfe",

            background:
              expandedGraphNode === "decisions"
                ? "#eff6ff"
                : "#ffffff",

            boxShadow:
              "0 5px 15px rgba(15,23,42,0.08)",

            cursor: "pointer",
            zIndex: 4,
          }}
        >
          <div
            style={{
              fontSize: "25px",
            }}
          >
            📋
          </div>

          <div
            style={{
              marginTop: "4px",
              fontSize: "13px",
              fontWeight: "700",
              color: "#2563eb",
            }}
          >
            All Decisions
          </div>

          <div
            style={{
              marginTop: "4px",
              fontSize: "11px",
              color: "#64748b",
            }}
          >
            View {allDecisions.length} records
          </div>
        </button>

        {/* =================================================
            CATEGORY EXPANSION
        ================================================= */}

        {expandedGraphNode === "categories" && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "390px",
              transform: "translateX(-50%)",

              width: "650px",

              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: "10px",

              zIndex: 8,
            }}
          >
            {[
              ...new Set(
                allDecisions.map(
                  (d) => d.category || "General"
                )
              ),
            ].map((category) => {
              const count =
                allDecisions.filter(
                  (d) =>
                    (d.category || "General") ===
                    category
                ).length;

              return (
                <div
                  key={category}
                  style={{
                    minWidth: "120px",
                    padding: "12px 15px",

                    borderRadius: "12px",

                    background: "#ffffff",

                    border:
                      "1px solid #bfdbfe",

                    boxShadow:
                      "0 5px 15px rgba(15,23,42,0.08)",

                    textAlign: "center",

                    animation:
                      "graphFadeIn 0.25s ease",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: "700",
                      color: "#2563eb",
                    }}
                  >
                    {category}
                  </div>

                  <div
                    style={{
                      marginTop: "4px",
                      fontSize: "11px",
                      color: "#64748b",
                    }}
                  >
                    {count} decision
                    {count !== 1 ? "s" : ""}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* =================================================
            STATUS EXPANSION
        ================================================= */}

        {expandedGraphNode === "status" && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "390px",
              transform: "translateX(-50%)",

              width: "650px",

              display: "grid",
              gridTemplateColumns:
                "repeat(4, 1fr)",

              gap: "10px",

              zIndex: 8,
            }}
          >
            {[
              "Pending Review",
              "Under Review",
              "Approved",
              "Rejected",
            ].map((status) => {
              const count =
                allDecisions.filter(
                  (d) => d.status === status
                ).length;

              return (
                <div
                  key={status}
                  style={{
                    padding: "14px",

                    borderRadius: "12px",

                    background: "#ffffff",

                    border:
                      "1px solid #e2e8f0",

                    boxShadow:
                      "0 5px 15px rgba(15,23,42,0.08)",

                    textAlign: "center",

                    animation:
                      "graphFadeIn 0.25s ease",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#64748b",
                    }}
                  >
                    {status}
                  </div>

                  <div
                    style={{
                      marginTop: "5px",
                      fontSize: "22px",
                      fontWeight: "700",
                      color: "#2563eb",
                    }}
                  >
                    {count}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* =================================================
            PEOPLE EXPANSION
        ================================================= */}

        {expandedGraphNode === "people" && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "390px",
              transform: "translateX(-50%)",

              width: "700px",

              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: "9px",

              zIndex: 8,
            }}
          >
            {[
              ...new Set(
                allDecisions.flatMap((d) => {
                  const people = [];

                  if (d.createdBy) {
                    people.push(
                      d.createdBy.name ||
                        d.createdBy.email
                    );
                  }

                  if (d.reviewedBy) {
                    people.push(
                      d.reviewedBy.name ||
                        d.reviewedBy.email
                    );
                  }

                  if (d.approvedBy) {
                    people.push(
                      d.approvedBy.name ||
                        d.approvedBy.email
                    );
                  }

                  return people;
                })
              ),
            ].map((person) => (
              <div
                key={person}
                style={{
                  padding: "10px 14px",

                  borderRadius: "12px",

                  background: "#ffffff",

                  border:
                    "1px solid #e2e8f0",

                  boxShadow:
                    "0 4px 12px rgba(15,23,42,0.07)",

                  fontSize: "12px",

                  color: "#334155",

                  animation:
                    "graphFadeIn 0.25s ease",
                }}
              >
                👤 {person}
              </div>
            ))}
          </div>
        )}

        {/* =================================================
            DECISION LIST EXPANSION
        ================================================= */}

        {expandedGraphNode === "decisions" && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "460px",
              transform: "translateX(-50%)",

              width: "720px",

              zIndex: 8,
            }}
          >
            <div
              style={{
                marginBottom: "12px",

                textAlign: "center",

                fontSize: "13px",

                fontWeight: "700",

                color: "#0f172a",
              }}
            >
              Select a decision to explore its knowledge
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, 1fr)",

                gap: "10px",

                maxHeight: "250px",

                overflowY: "auto",

                padding: "4px",
              }}
            >
              {allDecisions.map(
                (decision, index) => (
                  <button
                    key={decision._id}
                    type="button"
                    onClick={() => {
                      setSelectedGraphDecision(
                        decision
                      );
                    }}
                    style={{
                      padding: "12px",

                      borderRadius: "12px",

                      border:
                        "1px solid #bfdbfe",

                      background: "#ffffff",

                      cursor: "pointer",

                      textAlign: "left",

                      display: "flex",

                      alignItems: "center",

                      gap: "10px",

                      boxShadow:
                        "0 4px 12px rgba(15,23,42,0.06)",

                      transition:
                        "all 0.2s ease",
                    }}
                  >
                    <div
                      style={{
                        minWidth: "30px",
                        height: "30px",

                        borderRadius: "50%",

                        background: "#eff6ff",

                        color: "#2563eb",

                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",

                        fontSize: "11px",

                        fontWeight: "700",
                      }}
                    >
                      {index + 1}
                    </div>

                    <div
                      style={{
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: "700",
                          color: "#0f172a",

                          overflow: "hidden",
                          textOverflow:
                            "ellipsis",
                          whiteSpace:
                            "nowrap",
                        }}
                      >
                        {decision.title ||
                          "Untitled Decision"}
                      </div>

                      <div
                        style={{
                          marginTop: "3px",
                          fontSize: "10px",
                          color: "#64748b",
                        }}
                      >
                        {decision.category ||
                          "General"}{" "}
                        •{" "}
                        {decision.status ||
                          "Recorded"}
                      </div>
                    </div>

                    <span
                      style={{
                        color: "#2563eb",
                        fontSize: "15px",
                      }}
                    >
                      →
                    </span>
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* =================================================
            SELECTED DECISION NODE
        ================================================= */}

        {selectedGraphDecision && (
          <>
            {/* MAIN SELECTED DECISION */}

            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "570px",
                transform:
                  "translate(-50%, -50%)",

                width: "240px",
                minHeight: "105px",

                padding: "14px",

                borderRadius: "18px",

                background:
                  "linear-gradient(135deg,#2563eb,#1d4ed8)",

                color: "#ffffff",

                boxShadow:
                  "0 12px 30px rgba(37,99,235,0.25)",

                textAlign: "center",

                zIndex: 10,

                animation:
                  "graphNodeAppear 0.3s ease",
              }}
            >
              <div
                style={{
                  fontSize: "10px",
                  opacity: 0.85,
                  textTransform: "uppercase",
                  fontWeight: "700",
                }}
              >
                Selected Decision
              </div>

              <div
                style={{
                  marginTop: "5px",
                  fontSize: "14px",
                  fontWeight: "700",
                  lineHeight: "1.35",
                }}
              >
                {selectedGraphDecision.title ||
                  "Untitled Decision"}
              </div>

              <div
                style={{
                  marginTop: "5px",
                  fontSize: "10px",
                  opacity: 0.9,
                }}
              >
                {selectedGraphDecision.status ||
                  "Recorded"}
              </div>
            </div>

            {/* =================================================
                PROBLEM NODE
            ================================================= */}

            <GraphDetailNode
              left="18%"
              top="650px"
              icon="❓"
              label="Problem"
              value={
                selectedGraphDecision.problemStatement ||
                selectedGraphDecision.description ||
                "No problem recorded."
              }
            />

            {/* =================================================
                CATEGORY NODE
            ================================================= */}

            <GraphDetailNode
              left="34%"
              top="690px"
              icon="🏷️"
              label="Category"
              value={
                selectedGraphDecision.category ||
                "General"
              }
            />

            {/* =================================================
                STATUS NODE
            ================================================= */}

            <GraphDetailNode
              left="50%"
              top="700px"
              icon="📌"
              label="Status"
              value={
                selectedGraphDecision.status ||
                "Recorded"
              }
            />

            {/* =================================================
                RECOMMENDATION NODE
            ================================================= */}

            <GraphDetailNode
              left="66%"
              top="690px"
              icon="💡"
              label="Recommendation"
              value={
                selectedGraphDecision.recommendation ||
                "No recommendation recorded."
              }
            />

            {/* =================================================
                REVIEW NODE
            ================================================= */}

            <GraphDetailNode
              left="82%"
              top="650px"
              icon="👤"
              label="Reviewer Feedback"
              value={
                selectedGraphDecision.reviewerFeedback ||
                "No reviewer feedback recorded."
              }
            />
          </>
        )}
      </>
    )}
  </div>

  {/* =====================================================
      EXTRA DECISION INFORMATION
      APPEARS INSIDE GRAPH CARD, NOT AS SEPARATE SECTION
  ===================================================== */}

  {selectedGraphDecision && (
    <div
      style={{
        borderTop: "1px solid #e2e8f0",
        padding: "16px 20px",
        background: "#f8fafc",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <div
          style={{
            fontSize: "13px",
            fontWeight: "700",
            color: "#0f172a",
          }}
        >
          Decision Information
        </div>

        <button
          type="button"
          onClick={() => {
            setSelectedGraphDecision(null);
          }}
          style={{
            border: "none",
            background: "#ffffff",
            borderRadius: "7px",
            padding: "6px 10px",
            cursor: "pointer",
            color: "#64748b",
          }}
        >
          ✕ Close
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(180px,1fr))",
          gap: "10px",
        }}
      >
        {/* CREATED BY */}

        <InfoBox
          label="Created By"
          value={
            selectedGraphDecision.createdBy?.name ||
            selectedGraphDecision.createdBy?.email ||
            "Not available"
          }
        />

        {/* REVIEWED BY */}

        <InfoBox
          label="Reviewed By"
          value={
            selectedGraphDecision.reviewedBy?.name ||
            selectedGraphDecision.reviewedBy?.email ||
            "Not reviewed"
          }
        />

        {/* APPROVED BY */}

        <InfoBox
          label="Approved By"
          value={
            selectedGraphDecision.approvedBy?.name ||
            selectedGraphDecision.approvedBy?.email ||
            "Not approved"
          }
        />

        {/* REVIEWER FEEDBACK */}

        <InfoBox
          label="Reviewer Feedback"
          value={
            selectedGraphDecision.reviewerFeedback ||
            "No reviewer feedback"
          }
        />

        {/* MANAGER FEEDBACK */}

        <InfoBox
          label="Manager Feedback"
          value={
            selectedGraphDecision.managerFeedback ||
            "No manager feedback"
          }
        />

        {/* RECOMMENDATION */}

        <InfoBox
          label="Recommendation"
          value={
            selectedGraphDecision.recommendation ||
            "No recommendation"
          }
        />

        {/* DOCUMENTS */}

        <InfoBox
          label="Documents"
          value={
            selectedGraphDecision.documents?.length
              ? `${selectedGraphDecision.documents.length} document(s)`
              : "No documents"
          }
        />

        {/* CATEGORY */}

        <InfoBox
          label="Category"
          value={
            selectedGraphDecision.category ||
            "General"
          }
        />
      </div>
    </div>
  )}

  {/* =====================================================
      FOOTER
  ===================================================== */}

  <div
    style={{
      padding: "10px 20px",
      borderTop: "1px solid #f1f5f9",
      background: "#f8fafc",
      fontSize: "12px",
      color: "#64748b",
    }}
  >
    💡 Click a group to expand it. Click <b>All Decisions</b>{" "}
    and then a decision to explore its complete decision history.
  </div>

  {/* =====================================================
      ANIMATIONS
  ===================================================== */}

  <style>
    {`
      @keyframes graphFadeIn {
        from {
          opacity: 0;
          transform: translateY(8px);
        }

        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes graphNodeAppear {
        from {
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.75);
        }

        to {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }
      }
    `}
  </style>
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
  container: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#f4f6fa",
    fontFamily: "Arial, sans-serif",
    color: "#1e293b",
  },

  /* SIDEBAR */

  sidebar: {
    width: "230px",
    minHeight: "100vh",
    backgroundColor: "#162131",
    color: "white",
    padding: "18px 12px",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    flexShrink: 0,
    position: "sticky",
    top: 0,
    alignSelf: "flex-start",
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "0 10px 22px",
    borderBottom:
      "1px solid #293548",
  },

  logoIcon: {
    width: "38px",
    height: "38px",
    borderRadius: "12px",
    backgroundColor: "#203a5c",
    color: "#60a5fa",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    flexShrink: 0,
  },

  brandTitle: {
    margin: 0,
    fontSize: "18px",
    lineHeight: "23px",
  },

  brandSub: {
    margin: 0,
    fontSize: "14px",
    color: "#cbd5e1",
    lineHeight: "20px",
  },

  navSection: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    marginTop: "20px",
  },

  menuButton: {
    border: "none",
    backgroundColor: "transparent",
    color: "#cbd5e1",
    padding: "14px 16px",
    borderRadius: "8px",
    textAlign: "left",
    cursor: "pointer",
    fontSize: "15px",
    display: "flex",
    gap: "14px",
    alignItems: "center",
  },

  activeMenu: {
    border: "1px solid #3b5d8c",
    backgroundColor: "#294467",
    color: "white",
    padding: "14px 16px",
    borderRadius: "8px",
    textAlign: "left",
    cursor: "pointer",
    fontSize: "15px",
    display: "flex",
    gap: "14px",
    alignItems: "center",
  },

  logoutButton: {
    marginTop: "auto",
    border: "none",
    backgroundColor: "#263548",
    color: "white",
    padding: "13px 14px",
    borderRadius: "8px",
    cursor: "pointer",
    textAlign: "left",
    display: "flex",
    gap: "12px",
    alignItems: "center",
    fontSize: "14px",
  },

  /* MAIN */

  main: {
    flex: 1,
    minWidth: 0,
  },

  topbar: {
    height: "62px",
    backgroundColor: "white",
    borderBottom:
      "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 30px",
  },

  profileArea: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  notification: {
    fontSize: "20px",
    marginRight: "12px",
  },

  avatar: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    backgroundColor: "#64748b",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
  },

  userName: {
    fontSize: "13px",
  },

  userRole: {
    margin: "3px 0 0",
    color: "#64748b",
    fontSize: "11px",
    textTransform: "capitalize",
  },

  content: {
    padding: "28px",
  },

  /* WELCOME */

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

  /* MESSAGE */

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
    border:
      "1px solid #bbf7d0",
  },

  errorMessage: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    border:
      "1px solid #fecaca",
  },

  /* STATS */

  stats: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(180px, 1fr))",
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
    backgroundColor:
      "rgba(255,255,255,0.7)",
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

  /* DASHBOARD GRID */

  dashboardGrid: {
    display: "grid",
    gridTemplateColumns:
      "minmax(0, 1fr) 300px",
    gap: "16px",
  },

  largePanel: {
    backgroundColor: "white",
    border:
      "1px solid #e2e8f0",
    borderRadius: "10px",
    overflow: "hidden",
  },

  activityPanel: {
    backgroundColor: "white",
    border:
      "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "18px",
  },

  panelHeader: {
    padding: "18px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    borderBottom:
      "1px solid #e2e8f0",
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
    color: "white",
    border: "none",
    borderRadius: "6px",
    padding: "9px 14px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  /* TABLE */

  tableWrapper: {
    overflowX: "auto",
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
    borderBottom:
      "1px solid #e2e8f0",
    fontSize: "13px",
  },

  tableRow: {
    borderBottom:
      "1px solid #eef2f7",
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
    border:
      "1px solid #bfdbfe",
    borderRadius: "6px",
    padding: "9px 16px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "bold",
  },

  /* DOCUMENTS */

  documentButton: {
    border:
      "1px solid #bfdbfe",
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
    border:
      "1px solid #e2e8f0",
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
    backgroundColor: "white",
    border:
      "1px solid #e2e8f0",
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
    border:
      "1px solid #bfdbfe",
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

  /* ACTIVITY */

  activityItem: {
    display: "flex",
    gap: "12px",
    padding: "16px 0",
    borderBottom:
      "1px solid #eef2f7",
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

  /* =====================================================
                         ANALYTICS
  ===================================================== */

  analyticsSection: {
    backgroundColor: "white",
    border:
      "1px solid #e2e8f0",
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
    color: "white",
    border: "none",
    borderRadius: "7px",
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: "bold",
    whiteSpace: "nowrap",
  },

  analyticsSummaryGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(180px, 1fr))",
    gap: "14px",
    marginBottom: "20px",
  },

  analyticsCard: {
    backgroundColor: "#f8fafc",
    border:
      "1px solid #e2e8f0",
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
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "16px",
  },

  chartCard: {
    backgroundColor: "#ffffff",
    border:
      "1px solid #e2e8f0",
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
    border:
      "1px solid #fecaca",
    fontSize: "14px",
    fontWeight: "bold",
  },

  /* =====================================================
                       FINAL REVIEW
  ===================================================== */

  reviewPanel: {
    backgroundColor: "white",
    border:
      "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "22px",
    marginTop: "16px",
  },

  reviewDetails: {
    marginTop: "20px",
    backgroundColor: "#f8fafc",
    padding: "20px",
    borderRadius: "8px",
    border:
      "1px solid #e2e8f0",
  },

  reviewHeader: {
    display: "flex",
    justifyContent: "space-between",
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
    gridTemplateColumns:
      "repeat(2, 1fr)",
    gap: "20px",
    marginTop: "20px",
  },

  infoLabel: {
    margin: "0 0 5px",
    color: "#64748b",
    fontSize: "12px",
  },

  /* REVIEWER FEEDBACK */

  reviewerBox: {
    marginTop: "18px",
    padding: "18px",
    backgroundColor: "#eff6ff",
    border:
      "1px solid #bfdbfe",
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

  /* MANAGER FORM */

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
    border:
      "1px solid #cbd5e1",
    borderRadius: "8px",
    fontFamily:
      "Arial, sans-serif",
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
    color: "white",
    border: "none",
    padding: "12px 18px",
    borderRadius: "7px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  rejectButton: {
    backgroundColor: "#dc2626",
    color: "white",
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
  // ==================================================
// NOTIFICATIONS
// ==================================================

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
  color: "white",
  fontSize: "10px",
  fontWeight: "bold",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "2px solid white",
  boxSizing: "border-box",
},

notificationDropdown: {
  position: "absolute",
  top: "52px",
  right: "0",
  width: "390px",
  maxWidth: "calc(100vw - 30px)",
  backgroundColor: "white",
  border: "1px solid #e2e8f0",
  borderRadius: "14px",
  boxShadow:
    "0 15px 40px rgba(15, 23, 42, 0.18)",
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
  backgroundColor: "white",
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
  backgroundColor: "white",
  color: "#334155",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: "bold",
},
/* ==================== MY TEAMS STYLES ==================== */

teamSection: {
  marginTop: "32px",
  padding: "28px",
  background: "#ffffff",
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
  background: "#166534",
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
  background: "#ffffff",
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
  background: "#ffffff",
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
  background: "transparent",
  color: "#166534",
  fontWeight: "700",
  cursor: "pointer",
},

teamTab: {
  padding: "10px 4px",
  border: "none",
  background: "transparent",
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
  background: "#ffffff",
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
  background: "#ecfdf5",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "21px",
},

activeTeamBadge: {
  padding: "5px 9px",
  borderRadius: "20px",
  background: "#ecfdf5",
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
  background: "#ffffff",
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
  background: "#ffffff",
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
  background: "#f0fdf4",
},

joinTeamIcon: {
  width: "48px",
  height: "48px",
  borderRadius: "50%",
  background: "#dcfce7",
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
  background: "#166534",
  color: "#ffffff",
  fontWeight: "600",
  cursor: "pointer",
},

teamBottomGrid: {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "20px",
  marginTop: "24px",
},

teamActivityCard: {
  padding: "20px",
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  background: "#ffffff",
},

bottomCardTitle: {
  margin: "0 0 18px",
  fontSize: "17px",
  fontWeight: "700",
  color: "#1f2937",
},

activityItem: {
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
  background: "#16a34a",
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
  background: "#f0fdf4",
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
  background: "#f9fafb",
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
  background: "#ffffff",
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
  background: "#f1f5f9",
  color: "#475569",
  fontSize: "13px",
  fontWeight: "600",
},

joinSuccessMessage: {
  marginBottom: "18px",
  padding: "12px 16px",
  borderRadius: "10px",
  background: "#ecfdf5",
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
  background: "#f8fafc",
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
  background: "#0f766e",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  cursor: "pointer",
},

joinedTeamButton: {
  background: "#dcfce7",
  color: "#15803d",
  cursor: "default",
},
};

export default ManagerDashboard;