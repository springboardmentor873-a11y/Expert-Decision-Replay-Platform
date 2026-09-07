-- ==========================================
-- Expert Decision Replay Platform
-- Milestone 2 - Document Attachment / File Uploads
-- Database Migration (applied to live DB)
-- ==========================================
--
-- An unused legacy table `decision_files` already existed
-- without a model, foreign keys, or any API integration.
-- It is left untouched. This migration creates the new,
-- fully-integrated `decision_documents` table.

CREATE TABLE IF NOT EXISTS decision_documents (
    document_id SERIAL PRIMARY KEY,
    decision_id INTEGER NOT NULL,
    uploaded_by INTEGER NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    original_file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    uploaded_at TIMESTAMP,

    FOREIGN KEY (decision_id)
        REFERENCES decisions(decision_id)
        ON DELETE CASCADE,

    FOREIGN KEY (uploaded_by)
        REFERENCES users(user_id)
);

CREATE INDEX IF NOT EXISTS ix_decision_documents_decision_id
    ON decision_documents (decision_id);

CREATE INDEX IF NOT EXISTS ix_decision_documents_uploaded_by
    ON decision_documents (uploaded_by);