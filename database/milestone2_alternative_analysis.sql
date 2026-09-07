-- ==========================================
-- Expert Decision Replay Platform
-- Milestone 2 - Alternative Analysis / Comparison
-- Database Migration (applied to live DB)
-- ==========================================
--
-- Adds cost / feasibility / risk / recommended
-- columns to the existing decision_alternatives table.
-- No duplicate tables are created; the existing
-- decision_alternatives table is extended in place.

ALTER TABLE decision_alternatives
    ADD COLUMN IF NOT EXISTS estimated_cost NUMERIC(12,2);

ALTER TABLE decision_alternatives
    ADD COLUMN IF NOT EXISTS feasibility VARCHAR(50);

ALTER TABLE decision_alternatives
    ADD COLUMN IF NOT EXISTS risk_level VARCHAR(50);

ALTER TABLE decision_alternatives
    ADD COLUMN IF NOT EXISTS risk_explanation TEXT;

ALTER TABLE decision_alternatives
    ADD COLUMN IF NOT EXISTS is_recommended BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE decision_alternatives
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;