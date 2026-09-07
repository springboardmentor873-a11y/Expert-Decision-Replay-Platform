import React, { useState } from 'react';
import { DiscussionComposer } from './DiscussionComposer';
import {
  MessageSquare,
  CornerDownRight,
  Edit2,
  Trash2,
  Clock,
  User,
  Loader2
} from 'lucide-react';

export const DiscussionItem = ({
  discussion,
  currentUserId,
  isAdmin = false,
  onReply,
  onEdit,
  onDelete,
  actionLoadingId = null,
  depth = 0
}) => {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  const isAuthor = currentUserId === discussion.user_id;
  const canEdit = isAuthor;
  const canDelete = isAuthor || isAdmin;
  const isActionLoading = actionLoadingId === discussion.id;

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    return parts.map((p) => p[0]).join('').substring(0, 2).toUpperCase();
  };

  const getRelativeTime = (isoString) => {
    if (!isoString) return '';
    const now = new Date();
    const past = new Date(isoString);
    const diffSec = Math.floor((now - past) / 1000);

    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return past.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isEdited =
    discussion.updated_at &&
    discussion.created_at &&
    new Date(discussion.updated_at).getTime() - new Date(discussion.created_at).getTime() > 1000;

  const handleReplySubmit = async (content) => {
    setReplyLoading(true);
    try {
      await onReply(discussion.id, content);
      setIsReplying(false);
    } finally {
      setReplyLoading(false);
    }
  };

  const handleEditSubmit = async (content) => {
    setEditLoading(true);
    try {
      await onEdit(discussion.id, content);
      setIsEditing(false);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      onDelete(discussion.id);
    }
  };

  const authorName = discussion.user?.full_name || `User #${discussion.user_id}`;

  return (
    <div className={`discussion-item-node ${depth > 0 ? 'reply-node' : 'root-node'}`}>
      <div className="discussion-item-main">
        {/* Author Avatar */}
        <div className="discussion-avatar">
          {getInitials(authorName)}
        </div>

        <div className="discussion-bubble">
          {/* Header row with author, date, and actions */}
          <div className="discussion-bubble-header">
            <div className="author-meta-cluster">
              <span className="author-name">{authorName}</span>
              {discussion.user?.role_name && (
                <span className="author-role-tag">{discussion.user.role_name}</span>
              )}
              <span className="discussion-time">
                <Clock size={12} />
                <span>{getRelativeTime(discussion.created_at)}</span>
              </span>
              {isEdited && <span className="edited-indicator">(edited)</span>}
            </div>

            {/* Actions for authorized users */}
            <div className="discussion-actions-menu">
              {canEdit && !isEditing && (
                <button
                  type="button"
                  className="btn-text-action"
                  onClick={() => setIsEditing(true)}
                  disabled={isActionLoading}
                  title="Edit comment"
                >
                  <Edit2 size={13} />
                  <span>Edit</span>
                </button>
              )}

              {canDelete && !isEditing && (
                <button
                  type="button"
                  className="btn-text-action action-delete"
                  onClick={handleDelete}
                  disabled={isActionLoading}
                  title="Delete comment"
                >
                  {isActionLoading ? (
                    <Loader2 size={13} className="spinner-rotate" />
                  ) : (
                    <>
                      <Trash2 size={13} />
                      <span>Delete</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Comment Content or Inline Edit Composer */}
          {isEditing ? (
            <div className="inline-composer-wrapper">
              <DiscussionComposer
                initialContent={discussion.content}
                onSubmit={handleEditSubmit}
                onCancel={() => setIsEditing(false)}
                submitLabel="Save"
                loading={editLoading}
                autoFocus
              />
            </div>
          ) : (
            <div className="discussion-content-text">
              {discussion.content}
            </div>
          )}

          {/* Reply Toggle Action */}
          {!isEditing && depth === 0 && (
            <div className="discussion-bubble-footer">
              <button
                type="button"
                className={`btn-reply-toggle ${isReplying ? 'active' : ''}`}
                onClick={() => setIsReplying(!isReplying)}
              >
                <CornerDownRight size={13} />
                <span>{isReplying ? 'Cancel Reply' : 'Reply'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Inline Reply Composer */}
      {isReplying && (
        <div className="nested-composer-row">
          <div className="reply-arrow-indicator">
            <CornerDownRight size={16} />
          </div>
          <div className="nested-composer-body">
            <DiscussionComposer
              placeholder={`Replying to ${authorName}...`}
              onSubmit={handleReplySubmit}
              onCancel={() => setIsReplying(false)}
              submitLabel="Post Reply"
              loading={replyLoading}
              autoFocus
            />
          </div>
        </div>
      )}

      {/* Nested Replies Thread */}
      {discussion.replies && discussion.replies.length > 0 && (
        <div className="discussion-replies-list">
          {discussion.replies.map((reply) => (
            <DiscussionItem
              key={reply.id}
              discussion={reply}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              actionLoadingId={actionLoadingId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};
