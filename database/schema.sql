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

-- =====================================================================
-- End of schema.sql
-- =====================================================================
