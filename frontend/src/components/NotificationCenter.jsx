import React, { useState } from "react";
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MessageSquare,
  ShieldAlert,
  ExternalLink,
  Clock,
  X,
  Sparkles,
} from "lucide-react";

export default function NotificationCenter({
  notifications = [],
  unreadCount = 0,
  onClose,
  onMarkRead,
  onMarkAllRead,
  onSelectNotification,
}) {
  const [filter, setFilter] = useState("all");

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.is_read;
    if (filter === "approvals")
      return (
        n.type === "approval_request" ||
        n.type === "decision_approved" ||
        n.type === "decision_rejected"
      );
    if (filter === "escalations") return n.type === "escalation";
    return true;
  });

  const getIcon = (type) => {
    switch (type) {
      case "escalation":
        return <AlertTriangle size={17} color="#ef4444" />;
      case "decision_approved":
        return <CheckCircle2 size={17} color="#10b981" />;
      case "decision_rejected":
        return <XCircle size={17} color="#ef4444" />;
      case "changes_requested":
        return <AlertTriangle size={17} color="#f59e0b" />;
      case "comment":
        return <MessageSquare size={17} color="var(--primary)" />;
      default:
        return <Sparkles size={17} color="var(--primary)" />;
    }
  };

  const getBadgeStyle = (type) => {
    if (type === "escalation") {
      return { background: "rgba(239, 68, 68, 0.12)", color: "#dc2626" };
    }
    if (type === "decision_approved") {
      return { background: "rgba(16, 185, 129, 0.12)", color: "#059669" };
    }
    if (type === "decision_rejected" || type === "changes_requested") {
      return { background: "rgba(245, 158, 11, 0.12)", color: "#d97706" };
    }
    return { background: "var(--secondary-container)", color: "var(--on-secondary-container)" };
  };

  return (
    <div style={styles.dropdown} className="animate-fade-in">
      {/* Header */}
      <div style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={styles.iconCircle}>
            <Bell size={18} color="var(--primary)" />
          </div>
          <div>
            <div style={styles.title}>Notifications</div>
            <div style={styles.subtitle}>
              {unreadCount > 0
                ? `${unreadCount} unread update${unreadCount > 1 ? "s" : ""}`
                : "All caught up"}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              style={styles.markAllBtn}
              title="Mark all as read"
            >
              <CheckCheck size={14} />
              <span>Mark all read</span>
            </button>
          )}
          <button onClick={onClose} style={styles.closeBtn} title="Close">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={styles.tabRow}>
        {[
          { id: "all", label: "All" },
          { id: "unread", label: `Unread (${unreadCount})` },
          { id: "approvals", label: "Approvals" },
          { id: "escalations", label: "Escalated" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            style={{
              ...styles.filterPill,
              backgroundColor:
                filter === t.id
                  ? "var(--primary)"
                  : "var(--bg-surface-container-high)",
              color: filter === t.id ? "#ffffff" : "var(--text-secondary)",
              fontWeight: filter === t.id ? "600" : "500",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div style={styles.list}>
        {filtered.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIconWrap}>
              <Bell size={24} color="var(--text-secondary)" />
            </div>
            <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>
              No notifications here
            </div>
            <div style={{ fontSize: "12.5px", color: "var(--text-secondary)", marginTop: "4px" }}>
              You're completely up to date.
            </div>
          </div>
        ) : (
          filtered.map((n) => (
            <div
              key={n.id}
              style={{
                ...styles.item,
                backgroundColor: n.is_read
                  ? "transparent"
                  : "var(--bg-surface-container)",
                borderLeft: n.is_read
                  ? "3px solid transparent"
                  : "3px solid var(--primary)",
              }}
              onClick={() => {
                if (!n.is_read) onMarkRead(n.id);
                if (onSelectNotification) onSelectNotification(n);
              }}
            >
              <div style={styles.itemIconCol}>{getIcon(n.type)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <span style={styles.itemTitle}>{n.title}</span>
                  <span style={{ ...styles.typeTag, ...getBadgeStyle(n.type) }}>
                    {n.type.replace("_", " ").toUpperCase()}
                  </span>
                </div>
                <div style={styles.itemMessage}>{n.message}</div>
                <div style={styles.itemFooter}>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--text-secondary)" }}>
                    <Clock size={11} />
                    <span>
                      {n.created_at
                        ? new Date(n.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            month: "short",
                            day: "numeric",
                          })
                        : "Just now"}
                    </span>
                  </div>

                  {!n.is_read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkRead(n.id);
                      }}
                      style={styles.markBtn}
                      title="Mark read"
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
    </div>
  );
}

const styles = {
  dropdown: {
    position: "absolute",
    top: "54px",
    right: "0",
    width: "420px",
    maxWidth: "92vw",
    maxHeight: "560px",
    backgroundColor: "var(--bg-surface-container-high)",
    borderRadius: "20px",
    boxShadow: "var(--shadow-xl)",
    border: "1px solid var(--border-outline-variant)",
    display: "flex",
    flexDirection: "column",
    zIndex: 1000,
    overflow: "hidden",
  },
  header: {
    padding: "16px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid var(--border-outline-variant)",
    backgroundColor: "var(--bg-surface-container-highest)",
  },
  iconCircle: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    backgroundColor: "var(--secondary-container)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: "16px",
    fontWeight: "600",
    color: "var(--text-primary)",
  },
  subtitle: {
    fontSize: "12px",
    color: "var(--text-secondary)",
  },
  markAllBtn: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    background: "none",
    border: "none",
    fontSize: "12px",
    fontWeight: "600",
    color: "var(--primary)",
    cursor: "pointer",
    padding: "6px 10px",
    borderRadius: "8px",
    backgroundColor: "rgba(103, 80, 164, 0.08)",
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "var(--text-secondary)",
    cursor: "pointer",
    padding: "6px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  tabRow: {
    display: "flex",
    gap: "6px",
    padding: "10px 18px",
    borderBottom: "1px solid var(--border-outline-variant)",
    overflowX: "auto",
  },
  filterPill: {
    border: "none",
    padding: "5px 12px",
    borderRadius: "16px",
    fontSize: "12px",
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "all 0.15s ease",
  },
  list: {
    overflowY: "auto",
    maxHeight: "420px",
    display: "flex",
    flexDirection: "column",
  },
  empty: {
    padding: "48px 24px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  emptyIconWrap: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    backgroundColor: "var(--bg-surface-container)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "12px",
  },
  item: {
    padding: "14px 18px",
    display: "flex",
    gap: "12px",
    borderBottom: "1px solid var(--border-outline-variant)",
    cursor: "pointer",
    transition: "background-color 0.15s ease",
  },
  itemIconCol: {
    paddingTop: "2px",
  },
  itemTitle: {
    fontSize: "13.5px",
    fontWeight: "600",
    color: "var(--text-primary)",
  },
  typeTag: {
    fontSize: "9.5px",
    fontWeight: "700",
    padding: "2px 6px",
    borderRadius: "6px",
    letterSpacing: "0.5px",
  },
  itemMessage: {
    fontSize: "12.5px",
    color: "var(--text-secondary)",
    lineHeight: "1.45",
    marginBottom: "6px",
  },
  itemFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  markBtn: {
    border: "none",
    background: "none",
    fontSize: "11px",
    color: "var(--primary)",
    fontWeight: "600",
    cursor: "pointer",
    padding: "2px 6px",
  },
};
