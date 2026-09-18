import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Filter,
  Check,
  ArrowLeft,
  Calendar,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from '../services/notificationService';
import { getNotificationIcon } from '../components/notifications/NotificationIcon';
import { formatTimeAgo } from '../utils/timeAgo';

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotificationList = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getNotifications({
        page,
        pageSize,
        unreadOnly,
      });
      setNotifications(data.items || []);
      setTotal(data.total || 0);
      setUnreadCount(data.unread_count || 0);
    } catch (err) {
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotificationList();
  }, [page, unreadOnly]);

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      if (unreadOnly) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        setTotal((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      alert(err.message || 'Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      if (unreadOnly) {
        setNotifications([]);
        setTotal(0);
      }
    } catch (err) {
      alert(err.message || 'Failed to mark all as read');
    }
  };

  const handleRowClick = async (notif) => {
    if (!notif.is_read) {
      try {
        await markAsRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        // Continue navigation
      }
    }
    if (notif.decision_id) {
      navigate(`/decisions/${notif.decision_id}`);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="notifications-page-container">
      {/* Page Header */}
      <div className="page-header-wrapper">
        <div className="page-header-content">
          <div className="page-header-badge">
            <span className="badge badge-primary">Milestone 3</span>
            <span className="badge badge-neutral">In-App Alerts</span>
          </div>
          <h1 className="page-header-title">Notifications &amp; Activity</h1>
          <p className="page-header-description">
            Track workflow events, approval decisions, team discussions, and decision updates.
          </p>
        </div>

        <div className="page-header-actions">
          {unreadCount > 0 && (
            <button
              type="button"
              className="btn btn-outline-primary btn-sm"
              onClick={handleMarkAllAsRead}
            >
              <CheckCheck size={16} style={{ marginRight: '6px' }} />
              Mark All as Read
            </button>
          )}
        </div>
      </div>

      {/* Control Bar: Filters & Tabs */}
      <div className="notifications-control-bar">
        <div className="notif-filter-tabs">
          <button
            type="button"
            className={`notif-tab-btn ${!unreadOnly ? 'active' : ''}`}
            onClick={() => {
              setUnreadOnly(false);
              setPage(1);
            }}
          >
            All Activity
          </button>
          <button
            type="button"
            className={`notif-tab-btn ${unreadOnly ? 'active' : ''}`}
            onClick={() => {
              setUnreadOnly(true);
              setPage(1);
            }}
          >
            Unread Only
            {unreadCount > 0 && (
              <span className="notif-tab-count-badge">{unreadCount}</span>
            )}
          </button>
        </div>

        <div className="notif-summary-meta">
          <span>
            Showing {notifications.length} of {total} notifications
          </span>
        </div>
      </div>

      {/* Main List Area */}
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="notif-full-state-card">
          <div className="spinner-border text-primary" role="status"></div>
          <p>Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="notif-full-state-card">
          <div className="notif-empty-icon-wrap">
            <Bell size={40} strokeWidth={1.5} />
          </div>
          <h3>{unreadOnly ? "You're all caught up!" : 'No notifications yet'}</h3>
          <p>
            {unreadOnly
              ? 'There are no unread notifications waiting for your attention.'
              : 'As decisions are submitted, approved, or discussed, activity alerts will appear here.'}
          </p>
          {unreadOnly && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setUnreadOnly(false)}
              style={{ marginTop: '12px' }}
            >
              View All Notifications
            </button>
          )}
        </div>
      ) : (
        <div className="notifications-table-card">
          <div className="notifications-list-group">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`notif-list-row ${!notif.is_read ? 'row-unread' : 'row-read'}`}
                onClick={() => handleRowClick(notif)}
              >
                <div className="notif-row-icon-col">
                  {getNotificationIcon(notif.notification_type)}
                </div>

                <div className="notif-row-main-col">
                  <div className="notif-row-top-line">
                    <span className="notif-row-title">{notif.title}</span>
                    <span className="notif-row-type-badge">
                      {notif.notification_type.replace(/_/g, ' ')}
                    </span>
                    <span className="notif-row-time">
                      {formatTimeAgo(notif.created_at)}
                    </span>
                  </div>

                  <p className="notif-row-message">{notif.message}</p>
                </div>

                <div className="notif-row-action-col">
                  {notif.decision_id && (
                    <span className="notif-link-indicator" title="Open related decision">
                      <ExternalLink size={16} />
                    </span>
                  )}
                  {!notif.is_read && (
                    <button
                      type="button"
                      className="btn btn-ghost-sm notif-read-btn"
                      title="Mark as read"
                      onClick={(e) => handleMarkAsRead(notif.id, e)}
                    >
                      <Check size={16} />
                      <span>Mark Read</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="notif-pagination-bar">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={16} />
                <span>Previous</span>
              </button>

              <span className="notif-page-indicator">
                Page {page} of {totalPages}
              </span>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
