import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useToast } from "../ToastContext.jsx";

export default function Notifications() {
  const { showToast } = useToast();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setNotes(await api.listNotifications());
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleMarkRead(id) {
    try {
      await api.markNotificationRead(id);
      setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function handleMarkAllRead() {
    try {
      await api.markAllNotificationsRead();
      setNotes((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  const unreadCount = notes.filter((n) => !n.is_read).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Notifications</h1>
          <p>Assignments, approvals, and escalations that concern you.</p>
        </div>
        {unreadCount > 0 && (
          <button className="btn" onClick={handleMarkAllRead}>Mark all as read</button>
        )}
      </div>

      {loading ? (
        <div className="loading-text">Loading notifications…</div>
      ) : notes.length === 0 ? (
        <div className="empty-state">
          <h3>No notifications</h3>
          <p>Approval assignments and decisions on your decisions will show up here.</p>
        </div>
      ) : (
        notes.map((n) => (
          <div className={`notification-item ${n.is_read ? "" : "unread"}`} key={n.id}>
            {!n.is_read && <div className="notification-dot" />}
            <div style={{ flex: 1 }}>
              <div>
                {n.entity_type === "decision" && n.entity_id ? (
                  <Link to={`/decisions/${n.entity_id}`} onClick={() => !n.is_read && handleMarkRead(n.id)}>
                    {n.message}
                  </Link>
                ) : (
                  n.message
                )}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>
                {new Date(n.created_at).toLocaleString()}
              </div>
            </div>
            {!n.is_read && (
              <button className="btn" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => handleMarkRead(n.id)}>
                Mark read
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}
