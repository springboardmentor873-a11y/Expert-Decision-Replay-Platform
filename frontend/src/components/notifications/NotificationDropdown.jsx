import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, CheckCheck, ExternalLink } from 'lucide-react';
import { getNotificationIcon } from './NotificationIcon';
import { formatTimeAgo } from '../../utils/timeAgo';

export default function NotificationDropdown({
  notifications,
  unreadCount,
  loading,
  error,
  onMarkAsRead,
  onMarkAllAsRead,
  onClose,
}) {
  const navigate = useNavigate();

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read && onMarkAsRead) {
      await onMarkAsRead(notif.id);
    }
    onClose();
    if (notif.decision_id) {
      navigate(`/decisions/${notif.decision_id}`);
    } else {
      navigate('/notifications');
    }
  };

  return (
    <div className="notification-dropdown-menu" onClick={(e) => e.stopPropagation()}>
      <div className="notif-dropdown-header">
        <div className="notif-header-title-wrap">
          <h4 className="notif-header-title">Notifications</h4>
          {unreadCount > 0 && (
            <span className="badge badge-primary notif-count-pill">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            className="notif-header-action-btn"
            onClick={onMarkAllAsRead}
            title="Mark all as read"
          >
            <CheckCheck size={14} />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      <div className="notif-dropdown-body">
        {loading ? (
          <div className="notif-state-message">
            <div className="spinner-border text-primary spinner-sm" role="status"></div>
            <p>Loading notifications...</p>
          </div>
        ) : error ? (
          <div className="notif-state-message notif-state-error">
            <p>{error}</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="notif-state-message notif-state-empty">
            <p>You're all caught up! No notifications yet.</p>
          </div>
        ) : (
          <div className="notif-items-list">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`notif-dropdown-item ${!notif.is_read ? 'unread' : 'read'}`}
                onClick={() => handleNotificationClick(notif)}
              >
                <div className="notif-icon-col">
                  {getNotificationIcon(notif.notification_type)}
                </div>
                <div className="notif-content-col">
                  <div className="notif-title-row">
                    <span className="notif-item-title">{notif.title}</span>
                    <span className="notif-item-time">{formatTimeAgo(notif.created_at)}</span>
                  </div>
                  <p className="notif-item-message">{notif.message}</p>
                </div>
                {!notif.is_read && (
                  <button
                    type="button"
                    className="notif-quick-read-btn"
                    title="Mark as read"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkAsRead(notif.id);
                    }}
                  >
                    <span className="unread-blue-dot" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="notif-dropdown-footer">
        <Link
          to="/notifications"
          className="notif-view-all-link"
          onClick={onClose}
        >
          <span>View All Notifications</span>
          <ExternalLink size={13} />
        </Link>
      </div>
    </div>
  );
}
