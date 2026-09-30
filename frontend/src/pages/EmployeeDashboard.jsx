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
} from "recharts";

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
  // ============================================================
  // AUDIT HISTORY
  // ============================================================

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

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
    });
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
              scrollToSection("new-decision")
            }
          >
            <span>＋</span>
            New Decision
          </button>

          <button
            style={styles.menuButton}
            onClick={() =>
              scrollToSection("my-decisions")
            }
          >
            <span>▣</span>
            My Decisions
          </button>

          <button
            style={styles.menuButton}
            onClick={() =>
              scrollToSection("my-decisions")
            }
          >
            <span>◷</span>
            Decision History
          </button>

          <button
            style={styles.menuButton}
            onClick={() =>
              scrollToSection("documents")
            }
          >
            📎 Documents
          </button>

          <button
            style={styles.menuButton}
            onClick={() =>
              scrollToSection("discussions")
            }
          >
            💬 Discussions
          </button>

          <button
            style={styles.menuButton}
            onClick={() =>
              scrollToSection("alternatives")
            }
          >
            📊 Compare Alternatives
          </button>
          <button
  style={styles.menuButton}
  onClick={() =>
    scrollToSection("repository")
  }
>
  <span>🔍</span>
  Knowledge Repository
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
                Welcome back,{" "}
                {user?.name || "Employee"}!
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
                height={300}
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

  <div
    style={{
      ...styles.tableCard,
      padding: "24px",
    }}
  >
    {/* Search Area */}
    {/* Search Area */}
<div
  style={{
    display: "flex",
    gap: "12px",
    alignItems: "center",
    marginBottom: searchResults.length > 0 ? "24px" : "0",
  }}
>
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
        fontSize: "17px",
        color: "#6b7280",
      }}
    >
      🔍
    </span>

    <input
      type="text"
      placeholder="Search decisions by title or description..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          searchDecisions();
        }
      }}
    />
  </div>

  {/* CATEGORY FILTER — PUT IT HERE */}
  <select
    value={selectedCategory}
    onChange={(e) => setSelectedCategory(e.target.value)}
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
    }}
  >
    <option value="All">All Categories</option>
    <option value="Technical">Technical</option>
    <option value="Business">Business</option>
    <option value="Financial">Financial</option>
    <option value="HR">HR</option>
    <option value="Operational">Operational</option>
    <option value="General">General</option>
  </select>

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
    }}
  >
    Search
  </button>
</div>

    {/* Search Results */}
    {searchResults.length > 0 && (
      <div>
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
                <div style={{ flex: 1 }}>
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
                      margin: "0",
                      color: "#6b7280",
                      lineHeight: "1.6",
                      fontSize: "14px",
                    }}
                  >
                    {decision.description}
                  </p>
                </div>

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
                  {decision.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* No Results */}
    {searchQuery && searchResults.length === 0 && (
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
          No decisions found for "{searchQuery}"
        </p>
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
      </main>
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
          marginTop: "6px",
          color: "#6b7280",
        }}
      >
        Collaborate with teams and participate in
        organizational decisions.
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


  {/* =====================================================
      MY CURRENT TEAMS
  ===================================================== */}

  <h3
    style={{
      fontSize: "18px",
      marginBottom: "15px",
      color: "#374151",
    }}
  >
    My Current Teams
  </h3>

  {teamLoading ? (
    <p>Loading teams...</p>
  ) : myTeams.length === 0 ? (

    <div
      style={{
        padding: "25px",
        textAlign: "center",
        background: "#f9fafb",
        borderRadius: "10px",
        color: "#6b7280",
        marginBottom: "35px",
      }}
    >
      You are not a member of any team yet.
    </div>

  ) : (

    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "20px",
        marginBottom: "35px",
      }}
    >

      {myTeams.map((team) => (

        <div
          key={team._id}
          style={{
            padding: "22px",
            borderRadius: "12px",
            border: "1px solid #d1fae5",
            background: "#f0fdf4",
          }}
        >

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "15px",
            }}
          >

            <div
              style={{
                fontSize: "32px",
              }}
            >
              {team.icon || "👥"}
            </div>

            <span
              style={{
                padding: "5px 10px",
                borderRadius: "20px",
                background: "#dcfce7",
                color: "#15803d",
                fontSize: "12px",
                fontWeight: "600",
              }}
            >
              ● Active
            </span>

          </div>

          <h4
            style={{
              margin: "0 0 8px",
              fontSize: "18px",
              color: "#1f2937",
            }}
          >
            {team.name}
          </h4>

          <p
            style={{
              color: "#6b7280",
              fontSize: "14px",
              minHeight: "42px",
            }}
          >
            {team.description}
          </p>

          <div
            style={{
              marginTop: "15px",
              color: "#4b5563",
              fontSize: "14px",
            }}
          >
            👤 {team.members?.length || 0} Members
          </div>

          {team.manager && (
            <div
              style={{
                marginTop: "8px",
                color: "#6b7280",
                fontSize: "13px",
              }}
            >
              Manager: {team.manager.name}
            </div>
          )}

        </div>

      ))}

    </div>

  )}


  {/* =====================================================
      AVAILABLE TEAMS
  ===================================================== */}

  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "15px",
      gap: "15px",
      flexWrap: "wrap",
    }}
  >

    <h3
      style={{
        fontSize: "18px",
        margin: 0,
        color: "#374151",
      }}
    >
      Available Teams
    </h3>

    <input
      type="text"
      placeholder="Search teams..."
      value={teamSearch}
      onChange={(e) =>
        setTeamSearch(e.target.value)
      }
      style={{
        padding: "10px 14px",
        borderRadius: "8px",
        border: "1px solid #d1d5db",
        outline: "none",
        width: "220px",
      }}
    />

  </div>


  <div
    style={{
      display: "grid",
      gridTemplateColumns:
        "repeat(auto-fit, minmax(280px, 1fr))",
      gap: "20px",
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
            String(myTeam._id) ===
            String(team._id)
        );

        const requestSent =
          requestedTeams.includes(team._id);

        return (

          <div
            key={team._id}
            style={{
              padding: "22px",
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
              background: "#ffffff",
            }}
          >

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px",
              }}
            >

              <div
                style={{
                  fontSize: "32px",
                }}
              >
                {team.icon || "👥"}
              </div>

              <span
                style={{
                  padding: "5px 10px",
                  borderRadius: "20px",
                  background: "#ecfdf5",
                  color: "#15803d",
                  fontSize: "12px",
                  fontWeight: "600",
                }}
              >
                ● Active
              </span>

            </div>


            <h4
              style={{
                margin: "0 0 8px",
                fontSize: "18px",
                color: "#1f2937",
              }}
            >
              {team.name}
            </h4>


            <p
              style={{
                color: "#6b7280",
                fontSize: "14px",
                minHeight: "42px",
              }}
            >
              {team.description}
            </p>


            <div
              style={{
                marginTop: "15px",
                color: "#4b5563",
                fontSize: "14px",
              }}
            >
              👤 {team.members?.length || 0} Members
            </div>


            <button
              type="button"
              disabled={
                alreadyMember || requestSent
              }
              onClick={() =>
                requestToJoinTeam(team._id)
              }
              style={{
                marginTop: "18px",
                width: "100%",
                padding: "11px",
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


  {teams.length === 0 && !teamLoading && (
    <div
      style={{
        padding: "30px",
        textAlign: "center",
        color: "#6b7280",
      }}
    >
      No teams are currently available.
    </div>
  )}

</section>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#f8fafc",
    color: "#1e293b",
    fontFamily:
      "Inter, Arial, Helvetica, sans-serif",
  },

  sidebar: {
    width: "250px",
    backgroundColor: "#ffffff",
    borderRight: "1px solid #e2e8f0",
    display: "flex",
    flexDirection: "column",
    position: "fixed",
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 100,
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "25px 20px",
    borderBottom: "1px solid #e2e8f0",
  },

  logoIcon: {
    width: "42px",
    height: "42px",
    borderRadius: "10px",
    backgroundColor: "#4f46e5",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    fontWeight: "bold",
  },

  brandTitle: {
    margin: 0,
    fontSize: "15px",
    fontWeight: "800",
    color: "#1e293b",
  },

  brandSub: {
    margin: "3px 0 0",
    fontSize: "11px",
    color: "#64748b",
  },

  navSection: {
    padding: "20px 12px",
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },

  menuButton: {
    border: "none",
    backgroundColor: "transparent",
    padding: "12px 14px",
    borderRadius: "8px",
    textAlign: "left",
    color: "#64748b",
    cursor: "pointer",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  activeMenu: {
    border: "none",
    backgroundColor: "#eef2ff",
    padding: "12px 14px",
    borderRadius: "8px",
    textAlign: "left",
    color: "#4338ca",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  logoutButton: {
    margin: "auto 12px 20px",
    border: "1px solid #e2e8f0",
    backgroundColor: "#ffffff",
    padding: "12px 14px",
    borderRadius: "8px",
    textAlign: "left",
    color: "#dc2626",
    cursor: "pointer",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  main: {
    marginLeft: "250px",
    width: "calc(100% - 250px)",
    minHeight: "100vh",
  },

  topbar: {
    height: "70px",
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 30px",
    boxSizing: "border-box",
  },

  profileArea: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

 notificationWrapper: {
  position: "relative",
  cursor: "pointer",
},

notification: {
  width: "38px",
  height: "38px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "21px",
  color: "#64748b",
  borderRadius: "50%",
  transition: "background-color 0.2s",
},

notificationBadge: {
  position: "absolute",
  top: "-2px",
  right: "-2px",
  minWidth: "18px",
  height: "18px",
  padding: "0 4px",
  borderRadius: "10px",
  backgroundColor: "#ef4444",
  color: "#ffffff",
  fontSize: "10px",
  fontWeight: "700",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  border: "2px solid #ffffff",
},

notificationDropdown: {
  position: "absolute",
  top: "48px",
  right: "0",
  width: "380px",
  maxHeight: "480px",
  backgroundColor: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.15)",
  zIndex: 1000,
  overflow: "hidden",
},

notificationHeader: {
  padding: "16px 18px",
  borderBottom: "1px solid #e2e8f0",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
},

notificationUnreadText: {
  display: "block",
  marginTop: "3px",
  fontSize: "12px",
  color: "#64748b",
  fontWeight: "400",
},

markAllButton: {
  border: "none",
  backgroundColor: "transparent",
  color: "#4f46e5",
  fontSize: "12px",
  fontWeight: "600",
  cursor: "pointer",
  padding: "4px",
},

notificationList: {
  maxHeight: "410px",
  overflowY: "auto",
},

notificationItem: {
  display: "flex",
  gap: "12px",
  padding: "14px 18px",
  borderBottom: "1px solid #f1f5f9",
  cursor: "pointer",
  transition: "background-color 0.2s",
},

notificationItemIcon: {
  width: "34px",
  height: "34px",
  minWidth: "34px",
  borderRadius: "50%",
  backgroundColor: "#eef2ff",
  color: "#4f46e5",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "15px",
  fontWeight: "700",
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
  fontSize: "13px",
  color: "#1e293b",
},

notificationMessage: {
  margin: "5px 0",
  fontSize: "12px",
  lineHeight: "1.5",
  color: "#64748b",
},

notificationDate: {
  fontSize: "10px",
  color: "#94a3b8",
},

unreadDot: {
  width: "7px",
  height: "7px",
  minWidth: "7px",
  borderRadius: "50%",
  backgroundColor: "#4f46e5",
},

notificationEmpty: {
  padding: "40px 20px",
  textAlign: "center",
  color: "#64748b",
  fontSize: "13px",
},

emptyNotificationIcon: {
  fontSize: "28px",
  marginBottom: "8px",
},

  avatar: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    backgroundColor: "#4f46e5",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
  },

  userName: {
    display: "block",
    fontSize: "14px",
    color: "#1e293b",
  },

  userRole: {
    margin: "2px 0 0",
    fontSize: "12px",
    color: "#64748b",
  },

  content: {
    padding: "30px",
    maxWidth: "1500px",
    margin: "0 auto",
  },

  welcome: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: "25px",
  },

  welcomeTitle: {
    margin: 0,
    fontSize: "30px",
    color: "#0f172a",
  },

  welcomeText: {
    margin: "8px 0 0",
    color: "#64748b",
    fontSize: "15px",
  },

  date: {
    margin: 0,
    color: "#64748b",
    fontSize: "13px",
  },

  stats: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(210px, 1fr))",
    gap: "18px",
    marginBottom: "25px",
  },

  statCard: {
    backgroundColor: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "15px",
    boxSizing: "border-box",
  },

  totalCard: {
    borderTop: "4px solid #4f46e5",
  },

  pendingCard: {
    borderTop: "4px solid #f59e0b",
  },

  approvedCard: {
    borderTop: "4px solid #16a34a",
  },

  rejectedCard: {
    borderTop: "4px solid #dc2626",
  },

  statIcon: {
    width: "45px",
    height: "45px",
    borderRadius: "10px",
    backgroundColor: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    color: "#475569",
  },

  statNumber: {
    margin: 0,
    fontSize: "25px",
    color: "#0f172a",
  },

  statLabel: {
    margin: "2px 0 0",
    fontWeight: "700",
    fontSize: "14px",
    color: "#334155",
  },

  smallText: {
    margin: "4px 0 0",
    color: "#94a3b8",
    fontSize: "11px",
  },

  section: {
    marginBottom: "30px",
    scrollMarginTop: "25px",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "15px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "21px",
    color: "#1e293b",
  },

  sectionSubtitle: {
    margin: "5px 0 0",
    color: "#64748b",
    fontSize: "13px",
  },

  chartContainer: {
    backgroundColor: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "20px",
    boxSizing: "border-box",
  },

  quickPanel: {
    backgroundColor: "#eef2ff",
    border: "1px solid #c7d2fe",
    borderRadius: "12px",
    padding: "22px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "30px",
  },

  panelTitle: {
    margin: 0,
    fontSize: "19px",
    color: "#312e81",
  },

  panelText: {
    margin: "5px 0 0",
    color: "#4f46e5",
    fontSize: "13px",
  },

  primaryButton: {
    padding: "11px 18px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#4f46e5",
    color: "white",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "14px",
    whiteSpace: "nowrap",
  },

  formCard: {
    backgroundColor: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "22px",
    boxSizing: "border-box",
  },

  formGroup: {
    marginBottom: "18px",
  },

  label: {
    display: "block",
    marginBottom: "7px",
    fontSize: "13px",
    fontWeight: "700",
    color: "#334155",
  },

  input: {
    width: "100%",
    padding: "11px 13px",
    border: "1px solid #cbd5e1",
    borderRadius: "7px",
    fontSize: "14px",
    color: "#1e293b",
    backgroundColor: "white",
    boxSizing: "border-box",
    outline: "none",
  },

  textarea: {
    width: "100%",
    padding: "11px 13px",
    border: "1px solid #cbd5e1",
    borderRadius: "7px",
    fontSize: "14px",
    color: "#1e293b",
    backgroundColor: "white",
    boxSizing: "border-box",
    resize: "vertical",
    fontFamily:
      "Inter, Arial, Helvetica, sans-serif",
    outline: "none",
  },

  fileInput: {
    width: "100%",
    padding: "10px",
    border: "1px dashed #94a3b8",
    borderRadius: "7px",
    backgroundColor: "#f8fafc",
    boxSizing: "border-box",
    fontSize: "13px",
  },

  helperText: {
    margin: "7px 0 0",
    fontSize: "11px",
    color: "#64748b",
  },

  selectedFilesContainer: {
    marginTop: "12px",
    padding: "12px",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
  },

  selectedFilesTitle: {
    margin: "0 0 8px",
    fontWeight: "700",
    fontSize: "12px",
    color: "#475569",
  },

  selectedFileItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    padding: "7px 0",
    borderBottom: "1px solid #e2e8f0",
    fontSize: "12px",
    color: "#334155",
  },

  fileSize: {
    color: "#64748b",
    whiteSpace: "nowrap",
  },

  successMessage: {
    padding: "11px 13px",
    marginBottom: "15px",
    backgroundColor: "#dcfce7",
    border: "1px solid #bbf7d0",
    color: "#166534",
    borderRadius: "7px",
    fontSize: "13px",
    fontWeight: "600",
  },

  tableCard: {
    backgroundColor: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    overflow: "hidden",
  },

  tableWrapper: {
    width: "100%",
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "850px",
  },

  th: {
    padding: "14px 16px",
    textAlign: "left",
    backgroundColor: "#f8fafc",
    color: "#475569",
    fontSize: "12px",
    fontWeight: "800",
    borderBottom: "1px solid #e2e8f0",
    textTransform: "uppercase",
    letterSpacing: "0.3px",
  },

  td: {
    padding: "16px",
    borderBottom: "1px solid #e2e8f0",
    verticalAlign: "top",
    fontSize: "13px",
    color: "#475569",
  },

  decisionTitle: {
    color: "#1e293b",
    fontSize: "14px",
  },

  decisionDescription: {
    margin: "5px 0 0",
    maxWidth: "400px",
    color: "#64748b",
    lineHeight: "1.5",
    fontSize: "12px",
  },

  statusBadge: {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },

  approvedBadge: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },

  rejectedBadge: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },

  reviewBadge: {
    backgroundColor: "#e0e7ff",
    color: "#3730a3",
  },

  pendingBadge: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
  },

  historyButton: {
    padding: "9px 13px",
    backgroundColor: "#eef2ff",
    color: "#4338ca",
    border: "1px solid #c7d2fe",
    borderRadius: "7px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "bold",
    whiteSpace: "nowrap",
  },

  loading: {
    padding: "50px",
    textAlign: "center",
    color: "#64748b",
    fontSize: "14px",
  },

  emptyState: {
    padding: "55px 30px",
    textAlign: "center",
  },

  emptyIcon: {
    width: "55px",
    height: "55px",
    borderRadius: "50%",
    margin: "0 auto 15px",
    backgroundColor: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
  },

  emptyTitle: {
    margin: 0,
    fontSize: "17px",
    color: "#334155",
  },

  emptyText: {
    margin: "7px auto 0",
    maxWidth: "400px",
    color: "#64748b",
    fontSize: "13px",
  },

  twoColumnGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "20px",
  },

  cardTitle: {
    margin: "0 0 18px",
    fontSize: "17px",
    color: "#1e293b",
  },

  selectedFileBox: {
    padding: "10px 12px",
    marginBottom: "15px",
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "7px",
    fontSize: "13px",
    color: "#475569",
  },

  mutedText: {
    color: "#64748b",
    fontSize: "13px",
    margin: 0,
  },

  documentList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    maxHeight: "400px",
    overflowY: "auto",
  },

  documentItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "15px",
    padding: "12px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    backgroundColor: "#f8fafc",
  },

  documentInfo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    minWidth: 0,
  },

  documentIcon: {
    width: "35px",
    height: "35px",
    borderRadius: "7px",
    backgroundColor: "#e0e7ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  documentName: {
    display: "block",
    color: "#334155",
    fontSize: "13px",
    wordBreak: "break-word",
  },

  documentDate: {
    margin: "3px 0 0",
    color: "#94a3b8",
    fontSize: "11px",
  },

  documentActions: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flexShrink: 0,
  },

  viewButton: {
    padding: "7px 9px",
    borderRadius: "6px",
    backgroundColor: "#e0e7ff",
    color: "#3730a3",
    textDecoration: "none",
    fontSize: "11px",
    fontWeight: "700",
  },

  downloadButton: {
    padding: "7px 9px",
    borderRadius: "6px",
    backgroundColor: "#dcfce7",
    color: "#166534",
    textDecoration: "none",
    fontSize: "11px",
    fontWeight: "700",
  },

  deleteButton: {
    padding: "7px 9px",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    cursor: "pointer",
    fontSize: "11px",
    fontWeight: "700",
  },

  discussionList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    maxHeight: "450px",
    overflowY: "auto",
  },

  discussionItem: {
    padding: "13px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    backgroundColor: "#f8fafc",
  },

  discussionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "10px",
    marginBottom: "8px",
  },

  discussionUser: {
    color: "#334155",
    fontSize: "13px",
  },

  discussionRole: {
    marginLeft: "7px",
    padding: "3px 6px",
    borderRadius: "10px",
    backgroundColor: "#e0e7ff",
    color: "#3730a3",
    fontSize: "9px",
    fontWeight: "700",
  },

  discussionDate: {
    color: "#94a3b8",
    fontSize: "10px",
    whiteSpace: "nowrap",
  },

  discussionText: {
    margin: 0,
    color: "#475569",
    fontSize: "13px",
    lineHeight: "1.5",
    whiteSpace: "pre-wrap",
  },

  emptyMiniState: {
    padding: "35px 15px",
    textAlign: "center",
  },

  emptyMiniIcon: {
    fontSize: "28px",
    marginBottom: "8px",
  },

  alternativeLayout: {
    display: "grid",
    gridTemplateColumns:
      "minmax(300px, 0.8fr) minmax(500px, 1.2fr)",
    gap: "20px",
    alignItems: "start",
  },

  formRow: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "12px",
  },

  comparisonTableWrapper: {
    width: "100%",
    overflowX: "auto",
  },

  comparisonTable: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "600px",
  },

  comparisonTh: {
    padding: "11px",
    backgroundColor: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    color: "#475569",
    textAlign: "left",
    fontSize: "11px",
    textTransform: "uppercase",
  },

  comparisonTd: {
    padding: "12px 11px",
    borderBottom: "1px solid #e2e8f0",
    color: "#475569",
    fontSize: "12px",
    verticalAlign: "top",
  },

  alternativeDescription: {
    margin: "4px 0 0",
    color: "#64748b",
    fontSize: "11px",
    lineHeight: "1.4",
  },

  // ============================================================
  // AUDIT HISTORY STYLES
  // ============================================================

  modalOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor:
      "rgba(15, 23, 42, 0.65)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    zIndex: 1000,
    boxSizing: "border-box",
  },

  auditModal: {
    width: "100%",
    maxWidth: "850px",
    maxHeight: "90vh",
    backgroundColor: "white",
    borderRadius: "14px",
    boxShadow:
      "0 20px 60px rgba(15, 23, 42, 0.25)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },

  auditModalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    padding: "24px 26px",
    borderBottom: "1px solid #e2e8f0",
  },

  auditModalTitle: {
    margin: 0,
    fontSize: "23px",
    color: "#1e293b",
  },

  auditDecisionTitle: {
    margin: "8px 0 0",
    color: "#475569",
    fontSize: "15px",
    fontWeight: "bold",
  },

  closeModalButton: {
    border: "none",
    backgroundColor: "#f1f5f9",
    color: "#475569",
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    cursor: "pointer",
    fontSize: "18px",
    flexShrink: 0,
  },

  auditModalBody: {
    padding: "24px 26px",
    overflowY: "auto",
  },

  auditLoading: {
    padding: "40px",
    textAlign: "center",
    color: "#64748b",
    fontSize: "15px",
  },

  auditError: {
    padding: "15px",
    borderRadius: "8px",
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    fontWeight: "bold",
  },

  auditEmpty: {
    padding: "40px",
    textAlign: "center",
    color: "#64748b",
    backgroundColor: "#f8fafc",
    borderRadius: "10px",
  },

  auditTimeline: {
    display: "flex",
    flexDirection: "column",
  },

  auditTimelineItem: {
    display: "flex",
    gap: "16px",
    minHeight: "130px",
  },

  auditTimelineMarker: {
    width: "22px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    flexShrink: 0,
  },

  auditDot: {
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    backgroundColor: "#4f46e5",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
    flexShrink: 0,
  },

  auditLine: {
    width: "2px",
    flex: 1,
    backgroundColor: "#cbd5e1",
    marginTop: "4px",
    marginBottom: "-1px",
  },

  auditCard: {
    flex: 1,
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "17px",
    marginBottom: "18px",
    backgroundColor: "#f8fafc",
    boxSizing: "border-box",
  },

  auditCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "15px",
    flexWrap: "wrap",
    marginBottom: "15px",
  },

  auditAction: {
    margin: 0,
    color: "#1e293b",
    fontSize: "17px",
  },

  auditDate: {
    color: "#64748b",
    fontSize: "12px",
    whiteSpace: "nowrap",
  },

  auditInfoGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "15px",
  },

  auditLabel: {
    display: "block",
    marginBottom: "5px",
    color: "#64748b",
    fontSize: "12px",
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: "0.3px",
  },

  auditValue: {
    display: "block",
    color: "#334155",
    fontSize: "14px",
  },

  auditDetails: {
    marginTop: "16px",
    paddingTop: "14px",
    borderTop: "1px solid #e2e8f0",
  },

  auditDetailsText: {
    margin: 0,
    color: "#475569",
    fontSize: "14px",
    lineHeight: "1.5",
    whiteSpace: "pre-wrap",
  },

  auditModalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    padding: "16px 26px",
    borderTop: "1px solid #e2e8f0",
    backgroundColor: "#f8fafc",
  },

  closeAuditButton: {
    padding: "10px 18px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#334155",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
  },
    // ============================================================
  // REVIEW + FEEDBACK STYLES
  // ============================================================

  decisionActionButtons: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    alignItems: "flex-start",
  },

  feedbackButton: {
    padding: "9px 13px",
    backgroundColor: "#f0fdf4",
    color: "#166534",
    border: "1px solid #bbf7d0",
    borderRadius: "7px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "bold",
    whiteSpace: "nowrap",
  },

  feedbackModal: {
    width: "100%",
    maxWidth: "800px",
    maxHeight: "90vh",
    backgroundColor: "white",
    borderRadius: "14px",
    boxShadow:
      "0 20px 60px rgba(15, 23, 42, 0.25)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },

  feedbackModalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    padding: "24px 26px",
    borderBottom: "1px solid #e2e8f0",
  },

  feedbackModalTitle: {
    margin: 0,
    fontSize: "23px",
    color: "#1e293b",
  },

  feedbackDecisionTitle: {
    margin: "8px 0 0",
    color: "#475569",
    fontSize: "15px",
    fontWeight: "bold",
  },

  feedbackModalBody: {
    padding: "24px 26px",
    overflowY: "auto",
  },

  feedbackStatusBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "15px",
    padding: "15px 17px",
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    marginBottom: "20px",
  },

  feedbackLabel: {
    fontSize: "13px",
    fontWeight: "800",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: "0.3px",
  },

  feedbackSection: {
    marginBottom: "20px",
  },

  feedbackSectionHeader: {
    marginBottom: "10px",
  },

  feedbackSectionTitle: {
    margin: 0,
    fontSize: "17px",
    color: "#1e293b",
  },

  feedbackSectionSubtitle: {
    margin: "4px 0 0",
    color: "#64748b",
    fontSize: "12px",
  },

  feedbackContentBox: {
    padding: "17px",
    backgroundColor: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "10px",
  },

  managerFeedbackContentBox: {
    padding: "17px",
    backgroundColor: "#eef2ff",
    border: "1px solid #c7d2fe",
    borderRadius: "10px",
  },

  feedbackText: {
    margin: 0,
    color: "#334155",
    fontSize: "14px",
    lineHeight: "1.6",
    whiteSpace: "pre-wrap",
  },

  feedbackPerson: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginTop: "16px",
    paddingTop: "14px",
    borderTop: "1px solid #dbe4ea",
  },

  feedbackAvatar: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    backgroundColor: "#dcfce7",
    color: "#166534",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
    fontSize: "14px",
    flexShrink: 0,
  },

  managerFeedbackAvatar: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    backgroundColor: "#e0e7ff",
    color: "#3730a3",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
    fontSize: "14px",
    flexShrink: 0,
  },

  feedbackPersonName: {
    display: "block",
    color: "#334155",
    fontSize: "13px",
  },

  feedbackPersonRole: {
    display: "inline-block",
    marginTop: "2px",
    color: "#64748b",
    fontSize: "11px",
  },

  feedbackPersonEmail: {
    display: "block",
    marginTop: "2px",
    color: "#94a3b8",
    fontSize: "10px",
  },

  noFeedbackBox: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "16px",
    backgroundColor: "#f8fafc",
    border: "1px dashed #cbd5e1",
    borderRadius: "10px",
  },

  noFeedbackIcon: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    backgroundColor: "#e2e8f0",
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    flexShrink: 0,
  },

  noFeedbackTitle: {
    display: "block",
    color: "#475569",
    fontSize: "13px",
  },

  noFeedbackText: {
    margin: "4px 0 0",
    color: "#94a3b8",
    fontSize: "11px",
    lineHeight: "1.4",
  },

  finalResultBox: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "17px",
    borderRadius: "10px",
    marginTop: "5px",
  },

  finalApprovedBox: {
    backgroundColor: "#dcfce7",
    border: "1px solid #bbf7d0",
  },

  finalRejectedBox: {
    backgroundColor: "#fee2e2",
    border: "1px solid #fecaca",
  },

  finalResultIcon: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    backgroundColor: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    fontWeight: "bold",
    flexShrink: 0,
  },

  finalResultTitle: {
    display: "block",
    color: "#1e293b",
    fontSize: "15px",
  },

  finalResultText: {
    margin: "4px 0 0",
    color: "#475569",
    fontSize: "12px",
    lineHeight: "1.4",
  },

  feedbackModalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    padding: "16px 26px",
    borderTop: "1px solid #e2e8f0",
    backgroundColor: "#f8fafc",
  },
};

export default EmployeeDashboard;