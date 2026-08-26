-- ==========================================
-- Expert Decision Replay Platform
-- Milestone 1 - Database Schema
-- ==========================================

-- 1. Roles Table
CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL
);

-- Insert project roles
INSERT INTO roles (role_name) VALUES
('Employee'),
('Reviewer'),
('Manager'),
('Administrator');


-- 2. Teams Table
CREATE TABLE teams (
    team_id SERIAL PRIMARY KEY,
    team_name VARCHAR(100) UNIQUE NOT NULL
);


-- 3. Users Table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INTEGER NOT NULL,
    team_id INTEGER,

    FOREIGN KEY (role_id)
        REFERENCES roles(role_id),

    FOREIGN KEY (team_id)
        REFERENCES teams(team_id)
);


-- 4. User Profiles Table
CREATE TABLE user_profiles (
    profile_id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL,
    phone VARCHAR(20),
    department VARCHAR(100),
    designation VARCHAR(100),
    profile_image VARCHAR(255),

    FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);