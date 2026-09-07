-- ==========================================
-- Expert Decision Replay Platform
-- Milestone 2 - Discussion Module
-- Database Migration (applied to live DB)
-- ==========================================
--
-- Adds the `decision_comments` table powering the
-- Discussion module (threaded comments on a decision).

CREATE TABLE IF NOT EXISTS decision_comments (
    comment_id SERIAL PRIMARY KEY,
    decision_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    FOREIGN KEY (decision_id)
        REFERENCES decisions(decision_id)
        ON DELETE CASCADE,

    FOREIGN KEY (user_id)
        REFERENCES users(user_id)
);

CREATE INDEX IF NOT EXISTS ix_decision_comments_decision_id
    ON decision_comments (decision_id);

CREATE INDEX IF NOT EXISTS ix_decision_comments_user_id
    ON decision_comments (user_id);
