import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://127.0.0.1:8000";

function Notifications() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchNotifications() {
    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/notifications/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem("access_token");
        navigate("/");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to load notifications");
      }

      setNotifications(data);
    } catch (err) {
      console.error(err);
      setError(
        "Unable to load notifications. Please make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function markAsRead(notificationId) {
    const token = localStorage.getItem("access_token");

    try {
      const response = await fetch(
        `${API_URL}/notifications/${notificationId}/read`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to mark notification as read");
      }

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );
    } catch (err) {
      console.error(err);
    }
  }

  function formatDate(dateValue) {
    if (!dateValue) return "—";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleString();
  }

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  return (
    <div className="page-container notifications-page">
      <section className="page-header">
        <div>
          <span className="eyebrow">ACTIVITY</span>
          <h2>Notifications</h2>
          <p>
            Stay updated with approval decisions and important workflow
            activities.
          </p>
        </div>
      </section>

      {error && <div className="error-message">{error}</div>}

      {!loading && !error && (
        <>
          <section className="approval-stats">
            <div className="approval-stat-card">
              <span>Total Notifications</span>
              <strong>{notifications.length}</strong>
            </div>

            <div className="approval-stat-card pending-stat">
              <span>Unread</span>
              <strong>{unreadCount}</strong>
            </div>

            <div className="approval-stat-card approved-stat">
              <span>Read</span>
              <strong>{notifications.length - unreadCount}</strong>
            </div>
          </section>

          <section className="dashboard-section approvals-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">NOTIFICATION CENTER</span>
                <h2>Your Notifications</h2>
                <p>Recent updates related to your decisions and workflow.</p>
              </div>
            </div>

            {notifications.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">✓</div>
                <h3>No notifications</h3>
                <p>
                  You will receive notifications when important workflow
                  events occur.
                </p>

                <button
                  className="primary-button"
                  onClick={() => navigate("/dashboard")}
                >
                  Back to Dashboard
                </button>
              </div>
            ) : (
              <div className="approval-list">
                {notifications.map((notification) => (
                  <article
                    className={`approval-card ${
                      !notification.is_read ? "notification-unread" : ""
                    }`}
                    key={notification.id}
                  >
                    <div className="approval-main">
                      <div className="approval-icon">
                        {notification.notification_type === "Approval"
                          ? "✓"
                          : "!"}
                      </div>

                      <div className="approval-info">
                        <span className="approval-id">
                          {notification.notification_type}
                        </span>

                        <h3>{notification.message}</h3>

                        <p>
                          {formatDate(notification.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="approval-details">
                      <span
                        className={
                          notification.is_read
                            ? "approval-status approved"
                            : "approval-status pending"
                        }
                      >
                        {notification.is_read ? "Read" : "Unread"}
                      </span>

                      {!notification.is_read && (
                        <button
                          className="secondary-button"
                          onClick={() => markAsRead(notification.id)}
                        >
                          Mark as Read
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {loading && (
        <div className="loading-state">
          Loading notifications...
        </div>
      )}
    </div>
  );
}

export default Notifications;