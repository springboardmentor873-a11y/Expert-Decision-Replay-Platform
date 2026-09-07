import React, { useState, useEffect } from 'react';
import {
  getDiscussions,
  createDiscussion,
  createReply,
  updateDiscussion,
  deleteDiscussion,
} from '../services/discussionService';
import { DiscussionComposer } from './DiscussionComposer';
import { DiscussionItem } from './DiscussionItem';
import {
  MessageSquare,
  Loader2,
  AlertCircle,
  RefreshCw,
  Sparkles
} from 'lucide-react';

export const DiscussionSection = ({ decisionId, currentUserId, isAdmin = false }) => {
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState('');

  const fetchDiscussions = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getDiscussions(decisionId);
      setDiscussions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load discussions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (decisionId) {
      fetchDiscussions();
    }
  }, [decisionId]);

  // Compute total comment count including nested replies
  const countTotalComments = (items) => {
    let total = items.length;
    for (const item of items) {
      if (item.replies && item.replies.length > 0) {
        total += item.replies.length;
      }
    }
    return total;
  };

  const handleCreateComment = async (content) => {
    setSubmitting(true);
    try {
      const newComment = await createDiscussion(decisionId, content);
      setDiscussions((prev) => [...prev, newComment]);
    } catch (err) {
      alert(err.message || 'Failed to post comment.');
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateReply = async (parentId, content) => {
    setActionLoadingId(parentId);
    try {
      const newReply = await createReply(decisionId, parentId, content);
      setDiscussions((prev) =>
        prev.map((item) => {
          if (item.id === parentId) {
            return {
              ...item,
              replies: [...(item.replies || []), newReply],
            };
          }
          return item;
        })
      );
    } catch (err) {
      alert(err.message || 'Failed to post reply.');
      throw err;
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUpdateComment = async (discussionId, content) => {
    setActionLoadingId(discussionId);
    try {
      const updated = await updateDiscussion(decisionId, discussionId, content);
      setDiscussions((prev) =>
        prev.map((item) => {
          if (item.id === discussionId) {
            return { ...item, content: updated.content, updated_at: updated.updated_at };
          }
          if (item.replies && item.replies.length > 0) {
            return {
              ...item,
              replies: item.replies.map((rep) =>
                rep.id === discussionId
                  ? { ...rep, content: updated.content, updated_at: updated.updated_at }
                  : rep
              ),
            };
          }
          return item;
        })
      );
    } catch (err) {
      alert(err.message || 'Failed to update comment.');
      throw err;
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteComment = async (discussionId) => {
    setActionLoadingId(discussionId);
    try {
      await deleteDiscussion(decisionId, discussionId);
      setDiscussions((prev) =>
        prev
          .filter((item) => item.id !== discussionId)
          .map((item) => ({
            ...item,
            replies: (item.replies || []).filter((rep) => rep.id !== discussionId),
          }))
      );
    } catch (err) {
      alert(err.message || 'Failed to delete comment.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const totalCount = countTotalComments(discussions);

  return (
    <section className="section-box discussions-section-container">
      {/* Header */}
      <div className="discussions-header-row">
        <div className="discussions-title-cluster">
          <div className="brand-icon-box" style={{ width: '28px', height: '28px' }}>
            <MessageSquare size={16} />
          </div>
          <h3 className="section-box-title" style={{ margin: 0 }}>
            Discussions & Collaboration
          </h3>
          <span className="discussions-count-badge">
            {totalCount} {totalCount === 1 ? 'Comment' : 'Comments'}
          </span>
        </div>

        <button
          type="button"
          className="btn-refresh-discussions"
          onClick={fetchDiscussions}
          disabled={loading}
          title="Refresh discussions"
        >
          <RefreshCw size={14} className={loading ? 'spinner-rotate' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
          <button
            type="button"
            className="btn btn-sm btn-secondary ml-auto"
            onClick={fetchDiscussions}
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Comment Composer */}
      <div className="main-composer-card">
        <DiscussionComposer
          onSubmit={handleCreateComment}
          loading={submitting}
          placeholder="Share your perspective, raise concerns, or suggest refinements..."
          submitLabel="Post Comment"
        />
      </div>

      {/* Comment Thread List */}
      <div className="discussions-threads-container">
        {loading ? (
          <div className="discussions-loading-card">
            <Loader2 size={28} className="spinner-rotate text-primary" />
            <span>Loading discussion comments...</span>
          </div>
        ) : discussions.length === 0 ? (
          <div className="discussions-empty-card">
            <MessageSquare size={38} className="empty-icon-muted" />
            <h4>No discussions yet</h4>
            <p>Be the first to share feedback, ask questions, or contribute to this decision.</p>
          </div>
        ) : (
          <div className="discussions-list">
            {discussions.map((item) => (
              <DiscussionItem
                key={item.id}
                discussion={item}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
                onReply={handleCreateReply}
                onEdit={handleUpdateComment}
                onDelete={handleDeleteComment}
                actionLoadingId={actionLoadingId}
                depth={0}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
