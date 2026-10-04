-- =====================================================================
-- Expert Decision Replay Platform
-- Milestone 1 - Database Initialization Script
-- =====================================================================
-- This script creates the database (if it does not already exist) and
-- the three foundational tables required for Milestone 1:
--   1. teams
--   2. users
--   3. decisions
--
-- Run this script with:
--   mysql -u root -p < database/schema.sql
-- =====================================================================

CREATE DATABASE IF NOT EXISTS expert_decision_replay
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE expert_decision_replay;

-- ---------------------------------------------------------------------
-- Teams table
-- Created before users because users reference teams, and teams
-- optionally reference a manager (a user). The manager_id foreign key
-- is added later with ALTER TABLE to avoid a circular dependency at
-- creation time.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS teams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team_name VARCHAR(150) NOT NULL UNIQUE,
    manager_id INT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Users table
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('Employee', 'Reviewer', 'Manager', 'Administrator') NOT NULL DEFAULT 'Employee',
    team_id INT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_team
        FOREIGN KEY (team_id) REFERENCES teams(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Now that `users` exists, attach the manager_id foreign key on teams.
ALTER TABLE teams
    ADD CONSTRAINT fk_teams_manager
        FOREIGN KEY (manager_id) REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE;

-- ---------------------------------------------------------------------
-- Decisions table (Milestone 1 foundation only)
-- Full decision-management workflow (alternatives, criteria, risks,
-- approvals, discussions, etc.) belongs to later milestones.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS decisions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    problem_statement TEXT NOT NULL,
    category VARCHAR(100) NULL,
    status ENUM('Draft', 'Under Review', 'Approved', 'Rejected', 'Archived') NOT NULL DEFAULT 'Draft',
    created_by INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_decisions_creator
        FOREIGN KEY (created_by) REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Helpful indexes
-- ---------------------------------------------------------------------
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_decisions_status ON decisions(status);
CREATE INDEX idx_decisions_created_by ON decisions(created_by);

-- ---------------------------------------------------------------------
-- Milestone 2: decision alternatives
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS decision_alternatives (
    id INT AUTO_INCREMENT PRIMARY KEY,
    decision_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NULL,
    pros TEXT NULL,
    cons TEXT NULL,
    estimated_cost DECIMAL(15,2) NULL,
    feasibility VARCHAR(100) NULL,
    risk TEXT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_alternatives_decision FOREIGN KEY (decision_id) REFERENCES decisions(id) ON DELETE CASCADE,
    CONSTRAINT fk_alternatives_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS decision_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    decision_id INT NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    content_type VARCHAR(150) NULL,
    file_size BIGINT NULL,
    uploaded_by INT NOT NULL,
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_documents_decision FOREIGN KEY (decision_id) REFERENCES decisions(id) ON DELETE CASCADE,
    CONSTRAINT fk_documents_uploader FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS discussion_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    decision_id INT NOT NULL,
    parent_id INT NULL,
    comment_text TEXT NOT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_discussion_decision FOREIGN KEY (decision_id) REFERENCES decisions(id) ON DELETE CASCADE,
    CONSTRAINT fk_discussion_parent FOREIGN KEY (parent_id) REFERENCES discussion_comments(id) ON DELETE CASCADE,
    CONSTRAINT fk_discussion_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS decision_versions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    decision_id INT NOT NULL,
    version_number INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    problem_statement TEXT NOT NULL,
    category VARCHAR(100) NULL,
    status VARCHAR(50) NOT NULL,
    changed_by INT NOT NULL,
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_decision_version (decision_id, version_number),
    CONSTRAINT fk_versions_decision FOREIGN KEY (decision_id) REFERENCES decisions(id) ON DELETE CASCADE,
    CONSTRAINT fk_versions_user FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_alternatives_decision ON decision_alternatives(decision_id);
CREATE INDEX idx_documents_decision ON decision_documents(decision_id);
CREATE INDEX idx_discussion_decision ON discussion_comments(decision_id);
CREATE INDEX idx_versions_decision ON decision_versions(decision_id);

-- =====================================================================
-- End of schema.sql
-- =====================================================================
