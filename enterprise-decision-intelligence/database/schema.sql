-- =========================================
-- ENTERPRISE DECISION INTELLIGENCE PLATFORM
-- DATABASE SCHEMA
-- =========================================


-- =========================================
-- ENTITIES TABLE
-- =========================================

CREATE TABLE IF NOT EXISTS entities (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    name TEXT NOT NULL,

    type TEXT NOT NULL,

    description TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP

);



-- =========================================
-- RELATIONSHIPS TABLE
-- =========================================

CREATE TABLE IF NOT EXISTS relationships (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    source_entity TEXT NOT NULL,

    relationship_type TEXT NOT NULL,

    target_entity TEXT NOT NULL,

    strength TEXT DEFAULT 'Medium',

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP

);



-- =========================================
-- INDEXES
-- Improve Search Performance
-- =========================================

CREATE INDEX IF NOT EXISTS idx_entities_name
ON entities(name);



CREATE INDEX IF NOT EXISTS idx_entities_type
ON entities(type);



CREATE INDEX IF NOT EXISTS idx_relationship_source
ON relationships(source_entity);



CREATE INDEX IF NOT EXISTS idx_relationship_target
ON relationships(target_entity);