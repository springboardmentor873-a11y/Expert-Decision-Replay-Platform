import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../services/notification";
import "./NotificationBell.css";

export default function NotificationBell() {
  const { tokens } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  const refresh = useCallback(async () => {
    if (!tokens?.access_token) return;
    try {
      const [countData, listData] = await Promise.all([
        getUnreadCount(tokens.access_token),
        listNotifications(tokens.access_token, { limit: 5 }),
      ]);
      setUnreadCount(countData.count);
      setNotifications(listData.notifications);
    } catch {
      // ignore background refresh failures — the bell simply keeps its last state
    }
  }, [tokens]);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 20000);
    return () => clearInterval(timer);
  }, [refresh]);

  // Click-outside closes the dropdown
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  async function handleOpen() {
    setLoading(true);
    await refresh();
    setLoading(false);
    setOpen((prev) => !prev);
  }

  async function handleOpenNotification(notification) {
    if (!notification.is_read) {
      await markNotificationRead(notification.id, tokens.access_token).catch(() => {});
    }
    setOpen(false);
    if (notification.decision_id) {
      navigate(`/decisions/${notification.decision_id}`);
    } else {
      navigate("/notifications");
    }
  }

  async function handleMarkAll() {
    await markAllNotificationsRead(tokens.access_token).catch(() => {});
    await refresh();
  }

  return (
    <div className="notif-bell" ref={containerRef}>
      <button
        className="notif-bell__button"
        onClick={handleOpen}
        aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ""}`}
      >
        <svg
          className="notif-bell__icon"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && <span className="notif-bell__badge">{unreadCount}</span>}
      </button>

      {open && (
        <div className="notif-bell__panel">
          <div className="notif-bell__header">
            <span className="notif-bell__title">Notifications</span>
            {unreadCount > 0 && (
              <button className="notif-bell__mark-all" onClick={handleMarkAll}>
                Mark all read
              </button>
            )}
          </div>

          {loading ? (
            <p className="notif-bell__empty">Loading…</p>
          ) : notifications.length === 0 ? (
            <p className="notif-bell__empty">You're all caught up.</p>
          ) : (
            <ul className="notif-bell__list">
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <button
                    className={`notif-bell__item ${notification.is_read ? "" : "notif-bell__item--unread"}`}
                    onClick={() => handleOpenNotification(notification)}
                  >
                    <span className="notif-bell__item-title">{notification.title}</span>
                    <span className="notif-bell__item-message">{notification.message}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="notif-bell__footer">
            <button
              className="notif-bell__view-all"
              onClick={() => {
                setOpen(false);
                navigate("/notifications");
              }}
            >
              View all
            </button>
          </div>
        </div>
      )}
    </div>
  );
}