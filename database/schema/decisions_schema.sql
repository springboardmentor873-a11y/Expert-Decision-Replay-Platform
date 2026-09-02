-- Expert Decision Replay Platform - Milestone 2 Decisions Schema
-- PostgreSQL DDL Script for Decisions Table

CREATE TABLE IF NOT EXISTS decisions (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    problem_statement TEXT NOT NULL,
    context TEXT NOT NULL,
    decision_taken TEXT NOT NULL,
    reasoning TEXT NOT NULL,
    expected_outcome TEXT,
    actual_outcome TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Draft',
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_decisions_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_decisions_title ON decisions(title);
CREATE INDEX IF NOT EXISTS idx_decisions_status ON decisions(status);
CREATE INDEX IF NOT EXISTS idx_decisions_created_by ON decisions(created_by);

-- Auto-update updated_at trigger for decisions
DROP TRIGGER IF EXISTS trg_decisions_updated_at ON decisions;
CREATE TRIGGER trg_decisions_updated_at
    BEFORE UPDATE ON decisions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();