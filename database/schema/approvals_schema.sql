-- Expert Decision Replay Platform - Milestone 3 Approvals Schema
-- PostgreSQL DDL Script for Approvals & Workflow History Table

CREATE TABLE IF NOT EXISTS approvals (
    id SERIAL PRIMARY KEY,
    decision_id INTEGER NOT NULL,
    reviewer_id INTEGER NOT NULL,
    action VARCHAR(50) NOT NULL,
    previous_status VARCHAR(50) NOT NULL,
    new_status VARCHAR(50) NOT NULL,
    rejection_reason TEXT,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_approvals_decision FOREIGN KEY (decision_id) REFERENCES decisions(id) ON DELETE CASCADE,
    CONSTRAINT fk_approvals_reviewer FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- Indexes for querying workflow history and pending decisions
CREATE INDEX IF NOT EXISTS idx_approvals_decision_id ON approvals(decision_id);
CREATE INDEX IF NOT EXISTS idx_approvals_reviewer_id ON approvals(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_approvals_created_at ON approvals(created_at);
CREATE INDEX IF NOT EXISTS idx_approvals_action ON approvals(action);
