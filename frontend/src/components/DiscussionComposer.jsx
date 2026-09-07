import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, X } from 'lucide-react';

const MAX_CHARS = 2000;

export const DiscussionComposer = ({
  onSubmit,
  initialContent = '',
  placeholder = 'Write a comment or share an insight on this decision...',
  submitLabel = 'Post Comment',
  onCancel = null,
  loading = false,
  autoFocus = false
}) => {
  const [content, setContent] = useState(initialContent);
  const textareaRef = useRef(null);

  useEffect(() => {
    setContent(initialContent);
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [initialContent, autoFocus]);

  const trimmed = content.trim();
  const isTooLong = content.length > MAX_CHARS;
  const canSubmit = trimmed.length > 0 && !isTooLong && !loading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      await onSubmit(trimmed);
      if (!initialContent) {
        setContent('');
      }
    } catch (err) {
      // Error handled by caller
    }
  };

  const handleKeyDown = (e) => {
    // Ctrl+Enter or Cmd+Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (canSubmit) {
        handleSubmit(e);
      }
    }
  };

  return (
    <form className="discussion-composer-form" onSubmit={handleSubmit}>
      <div className="composer-input-wrapper">
        <textarea
          ref={textareaRef}
          className={`composer-textarea ${isTooLong ? 'input-error' : ''}`}
          placeholder={placeholder}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          disabled={loading}
        />
      </div>

      <div className="composer-footer-row">
        <span className={`composer-char-count ${isTooLong ? 'count-overflow' : ''}`}>
          {content.length} / {MAX_CHARS}
        </span>

        <div className="composer-actions-group">
          {onCancel && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onCancel}
              disabled={loading}
            >
              <X size={14} />
              <span>Cancel</span>
            </button>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={!canSubmit}
          >
            {loading ? (
              <>
                <Loader2 size={14} className="spinner-rotate" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Send size={14} />
                <span>{submitLabel}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};
