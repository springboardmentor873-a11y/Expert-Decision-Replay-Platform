import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DecisionKnowledgeGraph from "../components/DecisionKnowledgeGraph";
import {Search} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
const API_URL = "http://localhost:5173";
function ReviewerDashboard() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
 const [activeSection, setActiveSection] = useState("pending");
  const [selectedDecision, setSelectedDecision] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [message, setMessage] = useState("");
  const [reviewedCount, setReviewedCount] = useState(0);

  // ============================================================
  // NOTIFICATIONS
  // ============================================================
  const loadAllDecisions = async () => {
  try {
    const token = localStorage.getItem("token");

    const response = await fetch(
      "http://localhost:5173/api/decisions/all",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch decisions");
    }

    const data = await response.json();

    setAllDecisions(data.decisions || []);
  } catch (error) {
    console.error("Error loading knowledge graph:", error);
    setAllDecisions([]);
  }
};

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);

  // ============================================================
  // AUDIT HISTORY
  // ============================================================

  const [auditDecision, setAuditDecision] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditMessage, setAuditMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
const [searchResults, setSearchResults] = useState([]);
const [selectedCategory, setSelectedCategory] = useState("All");
const [allDecisions, setAllDecisions] = useState([]);
const [expandedGraphNode, setExpandedGraphNode] = useState(null);
const [selectedGraphDecision, setSelectedGraphDecision] = useState(null);
const [activeReport, setActiveReport] = useState("decisions");
const [reportData, setReportData] = useState(null);
const [reportLoading, setReportLoading] = useState(false);
const [reportError, setReportError] = useState("");
  // ============================================================
  // FETCH PENDING DECISIONS
  // ============================================================
const searchDecisions = async () => {
  try {
    const token = localStorage.getItem("token");

    const params = new URLSearchParams();

    if (searchQuery.trim()) {
      params.append("query", searchQuery.trim());
    }

    if (selectedCategory && selectedCategory !== "All") {
      params.append("category", selectedCategory);
    }

    const response = await fetch(
      `http://localhost:5173/api/decisions/search?${params.toString()}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Search failed");
    }

    console.log("Search response:", data);

    setSearchResults(data.decisions || []);
  } catch (error) {
    console.error("Search error:", error);
    setSearchResults([]);
  }
};
  const fetchDecisions = async () => {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(
        "http://localhost:5173/api/decisions/review",
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

  // ============================================================
  // FETCH NOTIFICATIONS
  // ============================================================

  const fetchNotifications = async () => {
    try {
      setNotificationLoading(true);

      const response = await fetch(
        "http://localhost:5173/api/notifications",
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

      const notificationData = Array.isArray(data) ? data : [];

      setNotifications(notificationData);

      const unread = notificationData.filter(
        (notification) => !notification.isRead
      ).length;

      setUnreadCount(unread);
    } catch (error) {
      console.error("Fetch notifications error:", error);
    } finally {
      setNotificationLoading(false);
    }
  };

  // ============================================================
  // MARK ONE NOTIFICATION AS READ
  // ============================================================

  const markNotificationAsRead = async (notificationId) => {
    try {
      const notification = notifications.find(
        (item) => item._id === notificationId
      );

      if (!notification || notification.isRead) {
        return;
      }

      const response = await fetch(
        `http://localhost:5173/api/notifications/${notificationId}/read`,
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
        previousNotifications.map((item) =>
          item._id === notificationId
            ? {
                ...item,
                isRead: true,
              }
            : item
        )
      );

      setUnreadCount((previousCount) =>
        Math.max(0, previousCount - 1)
      );
    } catch (error) {
      console.error(
        "Mark notification read error:",
        error
      );
    }
  };

  // ============================================================
  // MARK ALL NOTIFICATIONS AS READ
  // ============================================================

  const markAllNotificationsAsRead = async () => {
    try {
      if (unreadCount === 0) {
        return;
      }

      const response = await fetch(
        "http://localhost:5173/api/notifications/read-all",
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
  // FORMAT NOTIFICATION DATE
  // ============================================================

  const formatNotificationDate = (date) => {
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
  // AUDIT HISTORY
  // ============================================================

  const fetchAuditHistory = async (decision) => {
    if (!decision?._id) {
      return;
    }

    try {
      setAuditLoading(true);
      setAuditMessage("");
      setAuditDecision(decision);
      setAuditLogs([]);

      const response = await fetch(
        `http://localhost:5173/api/audit-logs/decision/${decision._id}`,
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

  // ============================================================
  // CLOSE AUDIT HISTORY
  // ============================================================

  const closeAuditHistory = () => {
    setAuditDecision(null);
    setAuditLogs([]);
    setAuditMessage("");
    setAuditLoading(false);
  };

  // ============================================================
  // FORMAT AUDIT DATE
  // ============================================================

  const formatAuditDate = (date) => {
    if (!date) {
      return "-";
    }

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ============================================================
  // INITIAL DATA LOAD
  // ============================================================

  useEffect(() => {
    fetchDecisions();
    fetchNotifications();
    loadAllDecisions();
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


  // ============================================================
  // SUBMIT REVIEWER FEEDBACK
  // ============================================================

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    if (!selectedDecision) {
      return;
    }

    if (!feedback.trim()) {
      setMessage("Reviewer feedback is required");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5173/api/decisions/${selectedDecision._id}/review`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            reviewerFeedback: feedback,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to submit review"
        );
      }

      setMessage("Review submitted successfully!");
      setReviewedCount((prev) => prev + 1);
      setFeedback("");
      setSelectedDecision(null);

      fetchDecisions();
      fetchNotifications();
    } catch (error) {
      console.error(error);
      setMessage(error.message);
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
  // SCROLL TO SECTION
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
  // OPEN DOCUMENT
  // ============================================================

  const handleViewDocument = (document) => {
    if (!document?.filePath) {
      setMessage("Document file is not available");
      return;
    }

    const fileUrl = `http://localhost:5173/${document.filePath.replace(
      /\\/g,
      "/"
    )}`;

    window.open(fileUrl, "_blank");
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div style={styles.container}>
      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      <div style={styles.sidebar}>
        <h2 style={styles.logo}>
          🔍 Decision Replay
        </h2>

        <button
          style={styles.menuButton}
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: "smooth",
            })
          }
        >
          🏠 Dashboard
        </button>

        <button
          style={styles.menuButton}
          onClick={() =>
            scrollToSection("pending-reviews")
          }
        >
          📥 Pending Reviews
        </button>

        <button
          style={styles.menuButton}
          onClick={() =>
            scrollToSection("review-form")
          }
        >
          📝 Review Decision
        </button>

        <button
          style={styles.menuButton}
          onClick={() =>
            scrollToSection("pending-reviews")
          }
        >
          📋 Assigned Decisions
        </button>

        <button
          style={styles.menuButton}
          onClick={() =>
            scrollToSection("review-form")
          }
        >
          💬 Feedback
        </button>

        <button
          style={styles.menuButton}
          onClick={() => {
            if (decisions.length > 0) {
              fetchAuditHistory(decisions[0]);
            } else {
              setMessage(
                "There are no decisions available to view audit history."
              );
            }
          }}
        >
          📜 Audit History
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

        <button
          style={styles.logoutButton}
          onClick={handleLogout}
        >
          🚪 Logout
        </button>
      </div>

      {/* ======================================================
          MAIN CONTENT
      ====================================================== */}

      <div style={styles.main}>
        {/* ====================================================
            HEADER
        ==================================================== */}

        <div style={styles.header}>
          <div>
            <h1 style={styles.pageTitle}>
              Reviewer Dashboard
            </h1>

            <p style={styles.subtitle}>
              Welcome back, {user?.name} 👋
            </p>
          </div>

          <div style={styles.headerRight}>
            {/* Notification Bell */}

            <div
              style={styles.notificationWrapper}
              onClick={() => {
                setNotificationOpen(
                  (previous) => !previous
                );

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
                  {unreadCount > 99
                    ? "99+"
                    : unreadCount}
                </span>
              )}

              {notificationOpen && (
                <div
                  style={styles.notificationDropdown}
                  onClick={(event) =>
                    event.stopPropagation()
                  }
                >
                  {/* Notification Header */}

                  <div
                    style={styles.notificationHeader}
                  >
                    <div>
                      <strong>
                        Notifications
                      </strong>

                      {unreadCount > 0 && (
                        <span
                          style={
                            styles.notificationUnreadText
                          }
                        >
                          {unreadCount} unread
                        </span>
                      )}
                    </div>

                    {unreadCount > 0 && (
                      <button
                        style={styles.markAllButton}
                        onClick={
                          markAllNotificationsAsRead
                        }
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  {/* Notification List */}

                  <div
                    style={styles.notificationList}
                  >
                    {notificationLoading ? (
                      <div
                        style={
                          styles.notificationEmpty
                        }
                      >
                        Loading notifications...
                      </div>
                    ) : notifications.length === 0 ? (
                      <div
                        style={
                          styles.notificationEmpty
                        }
                      >
                        <div
                          style={
                            styles.emptyNotificationIcon
                          }
                        >
                          🔔
                        </div>

                        <p>
                          No notifications yet.
                        </p>
                      </div>
                    ) : (
                      notifications.map(
                        (notification) => (
                          <div
                            key={notification._id}
                            style={{
                              ...styles.notificationItem,
                              backgroundColor:
                                notification.isRead
                                  ? "#ffffff"
                                  : "#f8fafc",
                            }}
                            onClick={() =>
                              markNotificationAsRead(
                                notification._id
                              )
                            }
                          >
                            <div
                              style={
                                styles.notificationItemIcon
                              }
                            >
                              {notification.type ===
                              "Decision Approved"
                                ? "✓"
                                : notification.type ===
                                  "Decision Rejected"
                                ? "✕"
                                : notification.type ===
                                  "Decision Reviewed"
                                ? "📋"
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
                                  {
                                    notification.type
                                  }
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
                                {
                                  notification.message
                                }
                              </p>

                              <span
                                style={
                                  styles.notificationDate
                                }
                              >
                                {formatNotificationDate(
                                  notification.createdAt
                                )}
                              </span>
                            </div>
                          </div>
                        )
                      )
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Role Badge */}

            <div style={styles.roleBadge}>
              {user?.role}
            </div>
          </div>
        </div>

        {/* ====================================================
            STATISTICS
        ==================================================== */}

        <div style={styles.stats}>
          <div style={styles.card}>
            <p style={styles.cardLabel}>
              Pending Reviews
            </p>

            <h2 style={styles.cardNumber}>
              {decisions.length}
            </h2>

            <p style={styles.cardDescription}>
              Decisions waiting for review
            </p>
          </div>

          <div style={styles.card}>
            <p style={styles.cardLabel}>
              Reviewed This Session
            </p>

            <h2 style={styles.cardNumber}>
              {reviewedCount}
            </h2>

            <p style={styles.cardDescription}>
              Reviews completed this session
            </p>
          </div>

          <div style={styles.card}>
            <p style={styles.cardLabel}>
              Selected Decision
            </p>

            <h2 style={styles.cardNumber}>
              {selectedDecision ? "1" : "0"}
            </h2>

            <p style={styles.cardDescription}>
              Currently being reviewed
            </p>
          </div>
        </div>

        {/* ====================================================
            QUICK ACTIONS
        ==================================================== */}

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            Quick Actions
          </h2>

          <p style={styles.sectionText}>
            Quickly access your review tasks.
          </p>

          <div style={styles.actionContainer}>
            <button
              style={styles.primaryActionButton}
              onClick={() =>
                scrollToSection("pending-reviews")
              }
            >
              📥 View Pending Reviews
            </button>

            <button
              style={styles.actionButton}
              onClick={() =>
                scrollToSection("review-form")
              }
            >
              📝 Review Selected Decision
            </button>

            <button
              style={styles.actionButton}
              onClick={() => {
                if (decisions.length > 0) {
                  fetchAuditHistory(decisions[0]);
                } else {
                  setMessage(
                    "There are no decisions available to view audit history."
                  );
                }
              }}
            >
              📜 View Audit History
            </button>
          </div>
        </div>
 {/* ====================================================
            PENDING REVIEWS
        ==================================================== */}

        <div
          id="pending-reviews"
          style={styles.section}
        >
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>
                Pending Reviews
              </h2>

              <p style={styles.sectionText}>
                Select a decision to review and provide
                feedback.
              </p>
            </div>

            <button
              style={styles.refreshButton}
              onClick={fetchDecisions}
            >
              🔄 Refresh
            </button>
          </div>
          {loading ? (
            <p style={styles.emptyText}>
              Loading decisions...
            </p>
          ) : decisions.length === 0 ? (
            <p style={styles.emptyText}>
              🎉 No pending decisions to review.
            </p>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>
                      Decision
                    </th>

                    <th style={styles.th}>
                      Created By
                    </th>

                    <th style={styles.th}>
                      Documents
                    </th>

                    <th style={styles.th}>
                      Status
                    </th>

                    <th style={styles.th}>
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
  {decisions.map((decision) => (
    <tr key={decision._id}>
      <td style={styles.td}>
        <strong>
          {decision.title}
        </strong>

        <p style={styles.description}>
          {decision.description}
        </p>
      </td>

      <td style={styles.td}>
        <strong>
          {decision.createdBy?.name || "Unknown"}
        </strong>

        <p style={styles.email}>
          {decision.createdBy?.email || ""}
        </p>
      </td>

      {/* Documents */}
      <td style={styles.td}>
        {!decision.documents ||
        decision.documents.length === 0 ? (
          <span style={styles.noDocument}>
            No documents
          </span>
        ) : (
          <div style={styles.documentList}>
            {decision.documents.map((document) => (
              <div
                key={document._id}
                style={styles.documentItem}
              >
                <span style={styles.documentName}>
                  📄 {document.fileName}
                </span>

                <button
                  style={styles.viewDocumentButton}
                  onClick={() =>
                    handleViewDocument(document)
                  }
                >
                  👁 View
                </button>
              </div>
            ))}
          </div>
        )}
      </td>

      {/* Status */}
      <td style={styles.td}>
        <span style={styles.pendingBadge}>
          {decision.status}
        </span>
      </td>

      {/* Actions */}
      <td style={styles.td}>
        <div style={styles.actionButtons}>
          <button
            style={styles.reviewButton}
            onClick={() => {
              setSelectedDecision(decision);
              setFeedback("");
              setMessage("");

              setTimeout(() => {
                scrollToSection("review-form");
              }, 100);
            }}
          >
            Review
          </button>

          <button
            style={styles.historyButton}
            onClick={() =>
              fetchAuditHistory(decision)
            }
          >
            📜 History
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
{/* KNOWLEDGE REPOSITORY */}
<section
  id="repository"
  style={{
    ...styles.section,
    paddingBottom: "40px",
    scrollMarginTop: "85px",
  }}
>
  {/* SECTION HEADER */}
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

  {/* REPOSITORY CARD */}
  <div
    style={{
      ...styles.tableCard,
      padding: "24px",
      overflow: "visible",
    }}
  >
    {/* SEARCH AND FILTER CONTROLS */}
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        flexWrap: "wrap",
        marginBottom:
          searchResults.length > 0 ||
          searchQuery.trim() ||
          selectedCategory !== "All"
            ? "24px"
            : "0",
      }}
    >
      {/* SEARCH INPUT */}
      <div
        style={{
          ...styles.searchContainer,
          position: "relative",
          flex: "1 1 280px",
          minWidth: "220px",
          maxWidth: "none",
        }}
      >
        <Search
          size={18}
          color="#64748b"
          style={{
            ...styles.searchIcon,
            position: "absolute",
            left: "15px",
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />

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
            ...styles.searchInput,
            width: "100%",
            height: "46px",
            boxSizing: "border-box",
            padding: "0 14px 0 44px",
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
        aria-label="Filter by category"
        style={{
          flex: "0 1 180px",
          width: "180px",
          minWidth: "150px",
          height: "46px",
          boxSizing: "border-box",
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
          flexShrink: 0,
        }}
      >
        <Search
          size={16}
          style={{
            marginRight: "8px",
            verticalAlign: "middle",
          }}
        />
        Search
      </button>
    </div>

    {/* SEARCH RESULTS */}
    {searchResults.length > 0 && (
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
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
                  flexWrap: "wrap",
                }}
              >
                <div style={{ flex: "1 1 250px" }}>
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
                      overflowWrap: "anywhere",
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

    {/* NO RESULTS */}
    {(searchQuery.trim() ||
      selectedCategory !== "All") &&
      searchResults.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "35px 20px",
            color: "#6b7280",
          }}
        >
          <Search
            size={30}
            color="#9ca3af"
            style={{ marginBottom: "10px" }}
          />

          <p
            style={{
              margin: 0,
              fontSize: "14px",
            }}
          >
            No decisions found
            {searchQuery.trim()
              ? ` for "${searchQuery}"`
              : ""}
            {selectedCategory !== "All"
              ? ` in ${selectedCategory}`
              : ""}
          </p>
        </div>
      )}

    {/* DECISION KNOWLEDGE GRAPH */}
    <div style={{ marginTop: "24px" }}>
      <DecisionKnowledgeGraph
        allDecisions={allDecisions}
      />
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
        {/* ====================================================
            REVIEW FORM
        ==================================================== */}

        <div
          id="review-form"
          style={styles.section}
        >
          <h2 style={styles.sectionTitle}>
            Review Decision
          </h2>

          <p style={styles.sectionText}>
            Review the selected decision, examine its
            documents, and provide your recommendations.
          </p>

          {!selectedDecision ? (
            <p style={styles.emptyText}>
              Select a decision from the Pending Reviews
              table.
            </p>
          ) : (
            <>
              {/* Selected Decision */}

              <div style={styles.selectedDecision}>
                <div style={styles.selectedHeader}>
                  <div>
                    <h3
                      style={
                        styles.selectedTitle
                      }
                    >
                      {selectedDecision.title}
                    </h3>

                    <p
                      style={
                        styles.selectedDescription
                      }
                    >
                      {
                        selectedDecision.description
                      }
                    </p>
                  </div>

                  <span
                    style={
                      styles.pendingBadge
                    }
                  >
                    {selectedDecision.status}
                  </span>
                </div>

                <p style={styles.createdBy}>
                  <strong>Created by:</strong>{" "}
                  {selectedDecision.createdBy?.name ||
                    "Unknown"}
                </p>

                <p style={styles.createdBy}>
                  <strong>Email:</strong>{" "}
                  {selectedDecision.createdBy?.email ||
                    ""}
                </p>

                {/* Documents */}

                <div
                  style={styles.documentSection}
                >
                  <h4
                    style={
                      styles.documentHeading
                    }
                  >
                    📎 Supporting Documents
                  </h4>

                  {!selectedDecision.documents ||
                  selectedDecision.documents.length ===
                    0 ? (
                    <p
                      style={
                        styles.noDocumentText
                      }
                    >
                      No documents were uploaded with
                      this decision.
                    </p>
                  ) : (
                    <div
                      style={
                        styles.selectedDocuments
                      }
                    >
                      {selectedDecision.documents.map(
                        (document) => (
                          <div
                            key={document._id}
                            style={
                              styles.selectedDocumentCard
                            }
                          >
                            <div>
                              <div
                                style={
                                  styles.selectedDocumentName
                                }
                              >
                                📄{" "}
                                {document.fileName}
                              </div>

                              <div
                                style={
                                  styles.documentType
                                }
                              >
                                {document.fileType ||
                                  "Document"}
                              </div>
                            </div>

                            <div
                              style={
                                styles.documentActions
                              }
                            >
                              <button
                                type="button"
                                style={
                                  styles.viewDocumentButton
                                }
                                onClick={() =>
                                  handleViewDocument(
                                    document
                                  )
                                }
                              >
                                👁 View
                              </button>

                              <a
                                href={`http://localhost:5173/${document.filePath.replace(
                                  /\\/g,
                                  "/"
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={
                                  styles.downloadButton
                                }
                              >
                                📥 Open
                              </a>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Feedback Form */}

              <form
                onSubmit={handleSubmitReview}
                style={styles.form}
              >
                <div>
                  <label style={styles.label}>
                    Reviewer Feedback
                  </label>

                  <textarea
                    rows="6"
                    placeholder="Provide your review and recommendations..."
                    value={feedback}
                    onChange={(e) =>
                      setFeedback(e.target.value)
                    }
                    style={styles.textarea}
                    required
                  />
                </div>

                <div style={styles.formActions}>
                  <button
                    type="submit"
                    style={styles.submitButton}
                  >
                    ✓ Submit Review
                  </button>

                  <button
                    type="button"
                    style={styles.cancelButton}
                    onClick={() => {
                      setSelectedDecision(null);
                      setFeedback("");
                      setMessage("");
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    style={styles.historyActionButton}
                    onClick={() =>
                      fetchAuditHistory(
                        selectedDecision
                      )
                    }
                  >
                    📜 View Audit History
                  </button>
                </div>
              </form>
            </>
          )}

          {message && (
            <p
              style={{
                ...styles.message,
                color: message
                  .toLowerCase()
                  .includes("success")
                  ? "#15803d"
                  : "#dc2626",
              }}
            >
              {message}
            </p>
          )}
        </div>
      </div>

      {/* ======================================================
          AUDIT HISTORY MODAL
      ====================================================== */}

      {auditDecision && (
        <div
          style={styles.modalOverlay}
          onClick={closeAuditHistory}
        >
          <div
            style={styles.auditModal}
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            {/* Modal Header */}

            <div style={styles.auditModalHeader}>
              <div>
                <h2 style={styles.auditModalTitle}>
                  📜 Audit History
                </h2>

                <p style={styles.auditModalSubtitle}>
                  {auditDecision.title}
                </p>
              </div>

              <button
                style={styles.closeModalButton}
                onClick={closeAuditHistory}
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}

            <div style={styles.auditModalContent}>
              {auditLoading ? (
                <div style={styles.auditLoading}>
                  <div
                    style={styles.auditSpinner}
                  />
                  <p>
                    Loading audit history...
                  </p>
                </div>
              ) : auditMessage ? (
                <div style={styles.auditError}>
                  <p>{auditMessage}</p>
                </div>
              ) : auditLogs.length === 0 ? (
                <div style={styles.auditEmpty}>
                  <div
                    style={styles.auditEmptyIcon}
                  >
                    📜
                  </div>

                  <h3>
                    No Audit History
                  </h3>

                  <p>
                    No audit records have been
                    created for this decision yet.
                  </p>
                </div>
              ) : (
                <div style={styles.auditTimeline}>
                  {auditLogs.map((log, index) => (
                    <div
                      key={log._id}
                      style={
                        styles.auditTimelineItem
                      }
                    >
                      <div
                        style={
                          styles.auditTimelineMarker
                        }
                      >
                        <span>
                          {index + 1}
                        </span>
                      </div>

                      <div
                        style={
                          styles.auditTimelineContent
                        }
                      >
                        <div
                          style={
                            styles.auditLogHeader
                          }
                        >
                          <div>
                            <h3
                              style={
                                styles.auditAction
                              }
                            >
                              {log.action}
                            </h3>

                            <p
                              style={
                                styles.auditPerformedBy
                              }
                            >
                              Performed by{" "}
                              <strong>
                                {log.performedBy?.name ||
                                  "Unknown User"}
                              </strong>

                              {log.performedBy?.role
                                ? ` (${log.performedBy.role})`
                                : ""}
                            </p>
                          </div>

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

                        {/* Status Change */}

                        {(log.previousStatus ||
                          log.newStatus) && (
                          <div
                            style={
                              styles.statusChange
                            }
                          >
                            <span
                              style={
                                styles.statusLabel
                              }
                            >
                              Status:
                            </span>

                            <span
                              style={
                                styles.oldStatus
                              }
                            >
                              {log.previousStatus ||
                                "Initial"}
                            </span>

                            <span
                              style={
                                styles.statusArrow
                              }
                            >
                              →
                            </span>

                            <span
                              style={
                                styles.newStatus
                              }
                            >
                              {log.newStatus ||
                                "-"}
                            </span>
                          </div>
                        )}

                        {/* Details */}

                        {log.details && (
                          <div
                            style={
                              styles.auditDetails
                            }
                          >
                            <strong>
                              Details:
                            </strong>

                            <p>
                              {log.details}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}

            <div style={styles.auditModalFooter}>
              <button
                style={styles.closeAuditButton}
                onClick={closeAuditHistory}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#f1f5f9",
  },

  sidebar: {
    width: "250px",
    minHeight: "100vh",
    padding: "24px 16px",
    backgroundColor: "#111827",
    color: "white",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    position: "sticky",
    top: 0,
    alignSelf: "flex-start",
    boxSizing: "border-box",
  },

  logo: {
    marginBottom: "28px",
    fontSize: "21px",
  },

  menuButton: {
    padding: "14px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    textAlign: "left",
    backgroundColor: "transparent",
    color: "#d1d5db",
    fontSize: "15px",
  },

  logoutButton: {
    marginTop: "auto",
    padding: "14px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    backgroundColor: "#374151",
    color: "white",
    textAlign: "left",
    fontSize: "15px",
  },

  main: {
    flex: 1,
    padding: "32px",
    minWidth: 0,
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
  },

  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
  },

  pageTitle: {
    margin: 0,
    color: "#111827",
    fontSize: "32px",
  },

  subtitle: {
    color: "#6b7280",
    marginTop: "8px",
    fontSize: "16px",
  },

  roleBadge: {
    backgroundColor: "#e0e7ff",
    color: "#4338ca",
    padding: "10px 18px",
    borderRadius: "20px",
    fontWeight: "bold",
    fontSize: "14px",
    textTransform: "capitalize",
  },

  // ============================================================
  // NOTIFICATION STYLES
  // ============================================================

  notificationWrapper: {
    position: "relative",
    cursor: "pointer",
  },

  notification: {
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "21px",
    color: "#64748b",
    borderRadius: "50%",
  },

  notificationBadge: {
    position: "absolute",
    top: "-3px",
    right: "-4px",
    minWidth: "19px",
    height: "19px",
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
    boxShadow:
      "0 10px 30px rgba(15, 23, 42, 0.15)",
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

  // ============================================================
  // EXISTING STYLES
  // ============================================================

  stats: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
  },

  card: {
    backgroundColor: "white",
    padding: "24px",
    borderRadius: "12px",
    boxShadow:
      "0 1px 3px rgba(0,0,0,0.08)",
  },

  cardLabel: {
    color: "#6b7280",
    margin: 0,
    fontSize: "16px",
  },

  cardNumber: {
    margin: "10px 0",
    fontSize: "34px",
    color: "#111827",
  },

  cardDescription: {
    margin: 0,
    color: "#9ca3af",
    fontSize: "13px",
  },

  section: {
    backgroundColor: "white",
    padding: "26px",
    marginTop: "25px",
    borderRadius: "12px",
    boxShadow:
      "0 1px 3px rgba(0,0,0,0.08)",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
  },

  sectionTitle: {
    margin: 0,
    color: "#111827",
    fontSize: "22px",
  },

  actionContainer: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "20px",
  },

  primaryActionButton: {
    padding: "13px 20px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#4f46e5",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "15px",
  },

  actionButton: {
    padding: "13px 20px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    backgroundColor: "white",
    color: "#374151",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "15px",
  },

  refreshButton: {
    padding: "11px 16px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    backgroundColor: "white",
    cursor: "pointer",
    fontSize: "14px",
  },

  tableWrapper: {
    overflowX: "auto",
    marginTop: "20px",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1100px",
  },

  th: {
    textAlign: "left",
    padding: "15px",
    backgroundColor: "#f8fafc",
    color: "#475569",
    borderBottom: "1px solid #e5e7eb",
    fontSize: "14px",
  },

  td: {
    padding: "17px 15px",
    borderBottom: "1px solid #e5e7eb",
    color: "#374151",
    fontSize: "15px",
    verticalAlign: "top",
  },

  description: {
    margin: "7px 0 0",
    color: "#6b7280",
    fontSize: "14px",
    maxWidth: "400px",
    lineHeight: "1.5",
  },

  email: {
    margin: "5px 0 0",
    color: "#6b7280",
    fontSize: "13px",
  },

  pendingBadge: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
    padding: "7px 11px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "bold",
    whiteSpace: "nowrap",
  },

  actionButtons: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    minWidth: "110px",
  },

  reviewButton: {
    padding: "10px 16px",
    border: "none",
    borderRadius: "7px",
    backgroundColor: "#4f46e5",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
  },

  historyButton: {
    padding: "9px 12px",
    border: "1px solid #c7d2fe",
    borderRadius: "7px",
    backgroundColor: "#eef2ff",
    color: "#4338ca",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "12px",
  },

  documentList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    minWidth: "190px",
  },

  documentItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
    padding: "8px",
    backgroundColor: "#f8fafc",
    borderRadius: "7px",
    border: "1px solid #e5e7eb",
  },

  documentName: {
    fontSize: "12px",
    color: "#374151",
    maxWidth: "130px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  viewDocumentButton: {
    padding: "7px 10px",
    border: "none",
    borderRadius: "6px",
    backgroundColor: "#4f46e5",
    color: "white",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "bold",
    whiteSpace: "nowrap",
  },

  noDocument: {
    color: "#9ca3af",
    fontSize: "13px",
  },

  selectedDecision: {
    marginTop: "22px",
    padding: "22px",
    backgroundColor: "#f8fafc",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
  },

  selectedHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
  },

  selectedTitle: {
    margin: 0,
    color: "#111827",
    fontSize: "20px",
  },

  selectedDescription: {
    color: "#4b5563",
    lineHeight: "1.6",
    marginTop: "12px",
    fontSize: "15px",
  },

  createdBy: {
    color: "#6b7280",
    fontSize: "14px",
    marginTop: "12px",
  },

  documentSection: {
    marginTop: "24px",
    paddingTop: "20px",
    borderTop: "1px solid #e5e7eb",
  },

  documentHeading: {
    margin: "0 0 15px",
    color: "#111827",
    fontSize: "17px",
  },

  noDocumentText: {
    color: "#9ca3af",
    fontSize: "14px",
  },

  selectedDocuments: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  selectedDocumentCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    padding: "14px",
    backgroundColor: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
  },

  selectedDocumentName: {
    color: "#111827",
    fontWeight: "bold",
    fontSize: "14px",
  },

  documentType: {
    marginTop: "5px",
    color: "#9ca3af",
    fontSize: "12px",
  },

  documentActions: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },

  downloadButton: {
    display: "inline-block",
    padding: "7px 10px",
    borderRadius: "6px",
    backgroundColor: "#e0e7ff",
    color: "#4338ca",
    textDecoration: "none",
    fontSize: "12px",
    fontWeight: "bold",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
    marginTop: "22px",
  },

  label: {
    display: "block",
    marginBottom: "9px",
    color: "#374151",
    fontWeight: "bold",
    fontSize: "15px",
  },

  textarea: {
    width: "100%",
    padding: "14px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "15px",
    resize: "vertical",
    boxSizing: "border-box",
    fontFamily: "Arial, sans-serif",
  },

  formActions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },

  submitButton: {
    padding: "13px 22px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#4f46e5",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "15px",
  },

  cancelButton: {
    padding: "13px 22px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    backgroundColor: "white",
    color: "#374151",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "15px",
  },

  historyActionButton: {
    padding: "13px 22px",
    border: "1px solid #c7d2fe",
    borderRadius: "8px",
    backgroundColor: "#eef2ff",
    color: "#4338ca",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "15px",
  },

  message: {
    marginTop: "18px",
    fontWeight: "bold",
    fontSize: "15px",
  },

  emptyText: {
    marginTop: "20px",
    color: "#6b7280",
    fontSize: "15px",
  },

  // ============================================================
  // AUDIT HISTORY MODAL STYLES
  // ============================================================

  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    zIndex: 2000,
    boxSizing: "border-box",
  },

  auditModal: {
    width: "100%",
    maxWidth: "950px",
    maxHeight: "90vh",
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    boxShadow:
      "0 25px 60px rgba(15, 23, 42, 0.25)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },

  auditModalHeader: {
    padding: "22px 26px",
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "20px",
  },

  auditModalTitle: {
    margin: 0,
    color: "#111827",
    fontSize: "22px",
  },

  auditModalSubtitle: {
    margin: "7px 0 0",
    color: "#64748b",
    fontSize: "14px",
  },

  closeModalButton: {
    width: "36px",
    height: "36px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#f1f5f9",
    color: "#475569",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
  },

  auditModalContent: {
    padding: "26px",
    overflowY: "auto",
    flex: 1,
  },

  auditLoading: {
    minHeight: "220px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "#64748b",
  },

  auditSpinner: {
    width: "34px",
    height: "34px",
    border: "4px solid #e5e7eb",
    borderTop: "4px solid #4f46e5",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "14px",
  },

  auditError: {
    padding: "30px",
    textAlign: "center",
    color: "#dc2626",
    backgroundColor: "#fef2f2",
    borderRadius: "10px",
  },

  auditEmpty: {
    minHeight: "220px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    color: "#64748b",
  },

  auditEmptyIcon: {
    fontSize: "40px",
    marginBottom: "10px",
  },

  auditTimeline: {
    display: "flex",
    flexDirection: "column",
  },

  auditTimelineItem: {
    display: "flex",
    gap: "18px",
    position: "relative",
    paddingBottom: "24px",
  },

  auditTimelineMarker: {
    width: "36px",
    height: "36px",
    minWidth: "36px",
    borderRadius: "50%",
    backgroundColor: "#eef2ff",
    color: "#4338ca",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: "13px",
    position: "relative",
    zIndex: 2,
  },

  auditTimelineContent: {
    flex: 1,
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "17px",
    backgroundColor: "#f8fafc",
  },

  auditLogHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
  },

  auditAction: {
    margin: 0,
    color: "#111827",
    fontSize: "16px",
  },

  auditPerformedBy: {
    margin: "6px 0 0",
    color: "#64748b",
    fontSize: "12px",
  },

  auditDate: {
    color: "#94a3b8",
    fontSize: "11px",
    whiteSpace: "nowrap",
  },

  statusChange: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
    marginTop: "14px",
    padding: "10px 12px",
    backgroundColor: "#ffffff",
    borderRadius: "7px",
    border: "1px solid #e5e7eb",
  },

  statusLabel: {
    color: "#64748b",
    fontSize: "12px",
    fontWeight: "bold",
  },

  oldStatus: {
    padding: "5px 9px",
    borderRadius: "15px",
    backgroundColor: "#fef3c7",
    color: "#92400e",
    fontSize: "11px",
    fontWeight: "bold",
  },

  statusArrow: {
    color: "#94a3b8",
    fontWeight: "bold",
  },

  newStatus: {
    padding: "5px 9px",
    borderRadius: "15px",
    backgroundColor: "#dcfce7",
    color: "#166534",
    fontSize: "11px",
    fontWeight: "bold",
  },

  auditDetails: {
    marginTop: "13px",
    paddingTop: "12px",
    borderTop: "1px solid #e5e7eb",
    color: "#475569",
    fontSize: "13px",
    lineHeight: "1.5",
  },

  auditDetails: {
    marginTop: "13px",
    paddingTop: "12px",
    borderTop: "1px solid #e5e7eb",
    color: "#475569",
    fontSize: "13px",
    lineHeight: "1.5",
  },

  auditModalFooter: {
    padding: "16px 26px",
    borderTop: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "flex-end",
  },

  closeAuditButton: {
    padding: "10px 20px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    backgroundColor: "#ffffff",
    color: "#374151",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
  },
  searchContainer: {
  position: "relative",
  width: "100%",
  maxWidth: "600px",
},

searchIcon: {
  position: "absolute",
  left: "16px",
  top: "50%",
  transform: "translateY(-50%)",
  pointerEvents: "none",
},

searchInput: {
  width: "100%",
  boxSizing: "border-box",
  padding: "14px 16px 14px 44px",
  border: "1px solid #d1d5db",
  borderRadius: "10px",
  background: "#ffffff",
  color: "#1f2937",
  fontSize: "14px",
  outline: "none",
},

categorySelect: {
  padding: "12px 14px",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  backgroundColor: "white",
  color: "#374151",
  fontSize: "14px",
  cursor: "pointer",
},

searchButton: {
  padding: "12px 20px",
  border: "none",
  borderRadius: "8px",
  backgroundColor: "#4f46e5",
  color: "white",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "14px",
},
sectionText: {
  color: "#6b7280",
  marginTop: "8px",
  fontSize: "15px",
},

sectionSubtitle: {
  color: "#6b7280",
  marginTop: "8px",
  fontSize: "14px",
},

tableCard: {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
},
tableHeader: {
  textAlign: "left",
  padding: "15px",
  backgroundColor: "#f8fafc",
  color: "#475569",
  borderBottom: "1px solid #e5e7eb",
  fontSize: "12px",
  fontWeight: "700",
  whiteSpace: "nowrap",
},

tableCell: {
  padding: "15px",
  borderBottom: "1px solid #e5e7eb",
  color: "#374151",
  fontSize: "13px",
  verticalAlign: "top",
},
};

export default ReviewerDashboard;