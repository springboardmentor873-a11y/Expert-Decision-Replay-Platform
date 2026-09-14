import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import { useAuth } from "../../context/AuthContext";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../services/notification";
import "./Notifications.css";

export default function Notifications() {
  const { tokens } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await listNotifications(tokens.access_token, { limit: 100 });
        setNotifications(data.notifications);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [tokens]);

  async function handleOpen(notification) {
    if (!notification.is_read) {
      try {
        await markNotificationRead(notification.id, tokens.access_token);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
        );
      } catch (err) {
        setError(err.message);
        return;
      }
    }
    if (notification.decision_id) {
      navigate(`/decisions/${notification.decision_id}`);
    }
  }

  async function handleMarkAll() {
    try {
      await markAllNotificationsRead(tokens.access_token);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page">
      <Navbar />
      <main className="notifications">
        <div className="notifications__header">
          <h1 className="notifications__title">Notifications</h1>
          {notifications.some((n) => !n.is_read) && (
            <button className="notifications__mark-all" onClick={handleMarkAll}>
              Mark all read
            </button>
          )}
        </div>

        {error && <div className="notifications__error">{error}</div>}

        {loading ? (
          <p className="notifications__loading">Loading…</p>
        ) : notifications.length === 0 ? (
          <div className="notifications__empty">
            <p>No notifications yet.</p>
            <p className="notifications__empty-hint">
              You'll be notified as decisions move through the approval workflow.
            </p>
          </div>
        ) : (
          <ul className="notifications__list">
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className={`notifications__item ${notification.is_read ? "" : "notifications__item--unread"}`}
              >
                <button
                  className="notifications__item-body"
                  onClick={() => handleOpen(notification)}
                  disabled={!notification.decision_id}
                >
                  <span className="notifications__item-title">{notification.title}</span>
                  <span className="notifications__item-message">{notification.message}</span>
                  <span className="notifications__item-time">
                    {new Date(notification.created_at).toLocaleString()}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}