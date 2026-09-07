-- Expert Decision Replay Platform - Milestone 2 Discussions Schema
-- PostgreSQL DDL Script for Discussions / Comments Table

CREATE TABLE IF NOT EXISTS discussions (
    id SERIAL PRIMARY KEY,
    decision_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    parent_id INTEGER,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_discussions_decision FOREIGN KEY (decision_id) REFERENCES decisions(id) ON DELETE CASCADE,
    CONSTRAINT fk_discussions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_discussions_parent FOREIGN KEY (parent_id) REFERENCES discussions(id) ON DELETE CASCADE
);

-- Indexes for querying performance
CREATE INDEX IF NOT EXISTS idx_discussions_decision_id ON discussions(decision_id);
CREATE INDEX IF NOT EXISTS idx_discussions_user_id ON discussions(user_id);
CREATE INDEX IF NOT EXISTS idx_discussions_parent_id ON discussions(parent_id);

-- Auto-update updated_at trigger
DROP TRIGGER IF EXISTS trg_discussions_updated_at ON discussions;
CREATE TRIGGER trg_discussions_updated_at
    BEFORE UPDATE ON discussions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
