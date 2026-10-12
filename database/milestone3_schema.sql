-- Milestone 3 database upgrade for an existing Milestone 1 + 2 database.
-- Run this file against the existing expert_decision_replay database.
USE expert_decision_replay;

CREATE TABLE IF NOT EXISTS approvals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    decision_id INT NOT NULL,
    reviewer_id INT NOT NULL,
    assigned_by INT NOT NULL,
    approval_level INT NOT NULL DEFAULT 1,
    status ENUM('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
    review_comment TEXT NULL,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    CONSTRAINT fk_approvals_decision FOREIGN KEY (decision_id) REFERENCES decisions(id) ON DELETE CASCADE,
    CONSTRAINT fk_approvals_reviewer FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_approvals_assigned_by FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS approval_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    approval_id INT NOT NULL,
    decision_id INT NOT NULL,
    reviewer_id INT NOT NULL,
    approval_level INT NOT NULL,
    action VARCHAR(30) NOT NULL,
    comment TEXT NULL,
    previous_decision_status VARCHAR(50) NULL,
    new_decision_status VARCHAR(50) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_approval_history_approval FOREIGN KEY (approval_id) REFERENCES approvals(id) ON DELETE CASCADE,
    CONSTRAINT fk_approval_history_decision FOREIGN KEY (decision_id) REFERENCES decisions(id) ON DELETE CASCADE,
    CONSTRAINT fk_approval_history_reviewer FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    decision_id INT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL DEFAULT 'info',
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_notifications_decision FOREIGN KEY (decision_id) REFERENCES decisions(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    module VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    entity_type VARCHAR(50) NULL,
    entity_id INT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_approvals_decision ON approvals(decision_id);
CREATE INDEX idx_approvals_reviewer_status ON approvals(reviewer_id, status);
CREATE INDEX idx_approval_history_decision ON approval_history(decision_id);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX idx_audit_user_created ON audit_logs(user_id, created_at);
CREATE INDEX idx_audit_module_created ON audit_logs(module, created_at);
