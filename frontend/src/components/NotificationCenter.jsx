import React, { useState, useEffect } from "react";
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MessageSquare,
  ShieldAlert,
  Clock,
  X,
  ExternalLink,
  Sparkles,
  GitPullRequest
} from "lucide-react";

export default function NotificationCenter({
  apiBase = "http://127.0.0.1:8000",
  onClose,
  onNavigate,
  onCountUpdate,
}) {
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  // Default rich notifications in case backend list is empty or pending
  const defaultNotifications = [
    {
      id: 101,
      title: "Pending Stage 2 Approval",
      message: "Decision 'Relational Database Architecture Migration' is awaiting final executive sign-off.",
      type: "approval_request",
      link_url: "My Decisions",
      is_read: false,
      created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    },
    {
      id: 102,
      title: "Decision Escalated: SLA Exceeded",
      message: "Decision 'Cloud Deployment & Multi-Region Strategy' exceeded 48h SLA and was escalated.",
      type: "escalation",
      link_url: "Approvals",
      is_read: false,
      created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    },
    {
      id: 103,
      title: "Stage 1 Technical Review Completed",
      message: "RFC-101 passed peer technical review by Technical Reviewer. Ready for Stage 2 governance.",
      type: "decision_approved",
      link_url: "My Decisions",
      is_read: false,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    },
    {
      id: 104,
      title: "Compliance Audit Chain Verified",
      message: "Quarterly cryptographic ledger verified with 100% decision log integrity.",
      type: "system",
      link_url: "Audit & Compliance",
      is_read: true,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    },
  ];

  const [notifications, setNotifications] = useState(defaultNotifications);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      setLoading(true);
      const res = await fetch(`${apiBase}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const serverList = data.notifications || (Array.isArray(data) ? data : []);
        if (serverList.length > 0) {
          setNotifications(serverList);
          const unread = serverList.filter((n) => !n.is_read).length;
          if (onCountUpdate) onCountUpdate(unread);
        } else {
          // If server returned 0 items, keep rich defaults
          const unread = defaultNotifications.filter((n) => !n.is_read).length;
          if (onCountUpdate) onCountUpdate(unread);
        }
      }
    } catch (e) {
      console.error("Error fetching notifications from server:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    // Update local state immediately
    const updated = notifications.map((n) =>
      n.id === id ? { ...n, is_read: true } : n
    );
    setNotifications(updated);
    const unread = updated.filter((n) => !n.is_read).length;
    if (onCountUpdate) onCountUpdate(unread);

    // Call server API
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await fetch(`${apiBase}/notifications/${id}/read`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (e) {
      console.error("Error marking notification as read:", e);
    }
  };

  const handleMarkAllRead = async () => {
    const updated = notifications.map((n) => ({ ...n, is_read: true }));
    setNotifications(updated);
    if (onCountUpdate) onCountUpdate(0);

    try {
      const token = localStorage.getItem("token");
      if (token) {
        await fetch(`${apiBase}/notifications/mark-all-read`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (e) {
      console.error("Error marking all read:", e);
    }
  };

  const handleNotificationClick = (n) => {
    handleMarkRead(n.id);
    if (onNavigate) {
      if (n.link_url?.includes("audit") || n.type === "system") {
        onNavigate("Audit & Compliance");
      } else if (n.type === "escalation" || n.type === "approval_request") {
        onNavigate("Approvals");
      } else {
        onNavigate("My Decisions");
      }
    }
    if (onClose) onClose();
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.is_read;
    if (filter === "approvals") {
      return (
        n.type === "approval_request" ||
        n.type === "decision_approved" ||
        n.type === "decision_rejected"
      );
    }
    if (filter === "escalations") return n.type === "escalation";
    return true;
  });

  const getIcon = (type) => {
    switch (type) {
      case "escalation":
        return <AlertTriangle size={16} color="#dc2626" />;
      case "decision_approved":
        return <CheckCircle2 size={16} color="#059669" />;
      case "decision_rejected":
        return <XCircle size={16} color="#dc2626" />;
      case "approval_request":
        return <GitPullRequest size={16} color="#7c3aed" />;
      case "system":
        return <ShieldAlert size={16} color="#7c3aed" />;
      default:
        return <Sparkles size={16} color="#7c3aed" />;
    }
  };

  const getBadgeStyle = (type) => {
    if (type === "escalation") {
      return { backgroundColor: "#fee2e2", color: "#dc2626" };
    }
    if (type === "decision_approved") {
      return { backgroundColor: "#ecfdf5", color: "#059669" };
    }
    if (type === "approval_request") {
      return { backgroundColor: "#f3e8ff", color: "#7c3aed" };
    }
    return { backgroundColor: "#f5f0fb", color: "#6b21a8" };
  };

  return (
    <div
      style={styles.backdrop}
      onClick={onClose}
    >
      <div
        style={styles.modalBox}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={styles.header}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={styles.iconCircle}>
              <Bell size={17} color="#7c3aed" />
            </div>
            <div>
              <div style={styles.title}>Notifications</div>
              <div style={styles.subtitle}>
                {unreadCount > 0
                  ? `${unreadCount} unread decision update${unreadCount > 1 ? "s" : ""}`
                  : "All decision updates read"}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                style={styles.markAllBtn}
                title="Mark all notifications as read"
              >
                <CheckCheck size={14} />
                <span>Mark all read</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              style={styles.closeBtn}
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div style={styles.tabRow}>
          {[
            { id: "all", label: "All" },
            { id: "unread", label: `Unread (${unreadCount})` },
            { id: "approvals", label: "Approvals" },
            { id: "escalations", label: "Escalated" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setFilter(t.id)}
              style={{
                ...styles.filterPill,
                backgroundColor: filter === t.id ? "#7c3aed" : "transparent",
                color: filter === t.id ? "#ffffff" : "#6b21a8",
                fontWeight: filter === t.id ? "600" : "500",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div style={styles.list}>
          {filtered.length === 0 ? (
            <div style={styles.empty}>
              <div style={styles.emptyIconWrap}>
                <Bell size={22} color="#7c3aed" />
              </div>
              <div style={{ fontSize: "14px", fontWeight: "600", color: "#1e1438" }}>
                No notifications in this filter
              </div>
              <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "3px" }}>
                You're completely up to date with active decisions.
              </div>
            </div>
          ) : (
            filtered.map((n) => (
              <div
                key={n.id}
                style={{
                  ...styles.item,
                  backgroundColor: n.is_read ? "#ffffff" : "#faf7fd",
                  borderLeft: n.is_read
                    ? "3px solid transparent"
                    : "3px solid #7c3aed",
                }}
                onClick={() => handleNotificationClick(n)}
              >
                <div style={{ paddingTop: "2px" }}>{getIcon(n.type)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginBottom: "3px" }}>
                    <span style={{ fontSize: "13px", fontWeight: "700", color: "#1e1438" }}>
                      {n.title}
                    </span>
                    <span style={{ ...styles.typeTag, ...getBadgeStyle(n.type) }}>
                      {n.type.replace(/_/g, " ").toUpperCase()}
                    </span>
                  </div>

                  <div style={{ fontSize: "12.5px", color: "#4b5563", lineHeight: 1.4, marginBottom: "6px" }}>
                    {n.message}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#6b7280" }}>
                      <Clock size={11} />
                      <span>
                        {n.created_at
                          ? new Date(n.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                              month: "short",
                              day: "numeric",
                            })
                          : "Recently"}
                      </span>
                    </div>

                    {!n.is_read && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkRead(n.id);
                        }}
                        style={styles.markBtn}
                        title="Mark as read"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <button
            type="button"
            onClick={() => {
              if (onNavigate) onNavigate("Approvals");
              if (onClose) onClose();
            }}
            style={styles.viewApprovalsBtn}
          >
            Open Approvals Pipeline &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(24, 17, 38, 0.4)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "flex-end",
    zIndex: 2000,
    padding: "68px 24px 24px 24px",
  },
  modalBox: {
    width: "420px",
    maxWidth: "92vw",
    maxHeight: "82vh",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 16px 32px rgba(124, 58, 237, 0.15)",
    border: "1px solid #ede7f6",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    animation: "fadeIn 0.15s ease-out",
  },
  header: {
    padding: "14px 18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid #ede7f6",
    backgroundColor: "#faf7fd",
  },
  iconCircle: {
    width: "32px",
    height: "32px",
    borderRadius: "6px",
    backgroundColor: "#f5f0fb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#1e1438",
  },
  subtitle: {
    fontSize: "11.5px",
    color: "#7c3aed",
    marginTop: "1px",
  },
  markAllBtn: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    background: "none",
    border: "none",
    fontSize: "11.5px",
    fontWeight: "600",
    color: "#7c3aed",
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: "4px",
    backgroundColor: "#f5f0fb",
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#6b7280",
    cursor: "pointer",
    padding: "4px",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  tabRow: {
    display: "flex",
    gap: "6px",
    padding: "8px 16px",
    borderBottom: "1px solid #ede7f6",
    backgroundColor: "#ffffff",
    overflowX: "auto",
  },
  filterPill: {
    border: "none",
    padding: "4px 10px",
    borderRadius: "6px",
    fontSize: "12px",
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "all 0.15s ease",
  },
  list: {
    overflowY: "auto",
    maxHeight: "440px",
    display: "flex",
    flexDirection: "column",
  },
  empty: {
    padding: "40px 20px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  emptyIconWrap: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    backgroundColor: "#f5f0fb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "10px",
  },
  item: {
    padding: "12px 16px",
    display: "flex",
    gap: "10px",
    borderBottom: "1px solid #f5f0fb",
    cursor: "pointer",
    transition: "background-color 0.15s ease",
  },
  typeTag: {
    fontSize: "9.5px",
    fontWeight: "700",
    padding: "2px 6px",
    borderRadius: "4px",
    letterSpacing: "0.3px",
  },
  markBtn: {
    border: "none",
    background: "none",
    fontSize: "11px",
    color: "#7c3aed",
    fontWeight: "600",
    cursor: "pointer",
    padding: "2px 6px",
  },
  footer: {
    padding: "10px 16px",
    borderTop: "1px solid #ede7f6",
    backgroundColor: "#faf7fd",
    textAlign: "center",
  },
  viewApprovalsBtn: {
    background: "none",
    border: "none",
    color: "#7c3aed",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },
};
