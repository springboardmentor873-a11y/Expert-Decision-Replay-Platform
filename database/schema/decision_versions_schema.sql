-- Expert Decision Replay Platform - Milestone 2 Decision Versions Schema
-- PostgreSQL DDL Script for Decision Versions / Historical Snapshots Table

CREATE TABLE IF NOT EXISTS decision_versions (
    id SERIAL PRIMARY KEY,
    decision_id INTEGER NOT NULL,
    version_number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    problem_statement TEXT NOT NULL,
    context TEXT NOT NULL,
    decision_taken TEXT NOT NULL,
    reasoning TEXT NOT NULL,
    expected_outcome TEXT,
    actual_outcome TEXT,
    status VARCHAR(50) NOT NULL,
    changed_by INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    change_summary TEXT NOT NULL,
    CONSTRAINT fk_decision_versions_decision FOREIGN KEY (decision_id) REFERENCES decisions(id) ON DELETE CASCADE,
    CONSTRAINT fk_decision_versions_changed_by FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT uq_decision_versions_decision_version UNIQUE (decision_id, version_number)
);

-- Indexes for fast retrieval and version ordering
CREATE INDEX IF NOT EXISTS idx_decision_versions_decision_id ON decision_versions(decision_id);
CREATE INDEX IF NOT EXISTS idx_decision_versions_version_number ON decision_versions(version_number);
CREATE INDEX IF NOT EXISTS idx_decision_versions_changed_by ON decision_versions(changed_by);
CREATE INDEX IF NOT EXISTS idx_decision_versions_created_at ON decision_versions(created_at);
