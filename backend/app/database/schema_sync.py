import logging
from sqlalchemy import text, inspect
from app.database.database import Base

logger = logging.getLogger(__name__)


def sync_database_schema(engine):
    """
    Ensures all tables defined in SQLAlchemy models exist and any newly
    introduced columns (e.g. category_id, team_id on decisions) are safely
    added to existing tables without data loss.
    """
    try:
        # 1. Create any missing tables
        Base.metadata.create_all(bind=engine)
        
        # 2. Inspect existing tables and ensure all model columns exist
        with engine.begin() as conn:
            inspector = inspect(conn)
            table_names = inspector.get_table_names()
            dialect_name = engine.dialect.name
            
            if "decisions" in table_names:
                decision_cols = [c["name"] for c in inspector.get_columns("decisions")]
                
                # Check category_id
                if "category_id" not in decision_cols:
                    logger.info("Adding missing column 'category_id' to decisions table...")
                    if dialect_name == "postgresql":
                        conn.execute(text("ALTER TABLE decisions ADD COLUMN IF NOT EXISTS category_id INTEGER;"))
                        conn.execute(text("""
                            DO $$
                            BEGIN
                                IF NOT EXISTS (
                                    SELECT 1 FROM pg_constraint WHERE conname = 'fk_decisions_category_id'
                                ) THEN
                                    ALTER TABLE decisions 
                                    ADD CONSTRAINT fk_decisions_category_id 
                                    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;
                                END IF;
                            END $$;
                        """))
                        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_decisions_category_id ON decisions(category_id);"))
                    else:
                        conn.execute(text("ALTER TABLE decisions ADD COLUMN category_id INTEGER REFERENCES categories(id);"))
                        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_decisions_category_id ON decisions(category_id);"))
                    logger.info("Column 'category_id' successfully added to decisions table.")
                
                # Check team_id
                if "team_id" not in decision_cols:
                    logger.info("Adding missing column 'team_id' to decisions table...")
                    if dialect_name == "postgresql":
                        conn.execute(text("ALTER TABLE decisions ADD COLUMN IF NOT EXISTS team_id INTEGER;"))
                        conn.execute(text("""
                            DO $$
                            BEGIN
                                IF NOT EXISTS (
                                    SELECT 1 FROM pg_constraint WHERE conname = 'fk_decisions_team_id'
                                ) THEN
                                    ALTER TABLE decisions 
                                    ADD CONSTRAINT fk_decisions_team_id 
                                    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;
                                END IF;
                            END $$;
                        """))
                        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_decisions_team_id ON decisions(team_id);"))
                    else:
                        conn.execute(text("ALTER TABLE decisions ADD COLUMN team_id INTEGER REFERENCES teams(id);"))
                        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_decisions_team_id ON decisions(team_id);"))
                    logger.info("Column 'team_id' successfully added to decisions table.")

    except Exception as exc:
        logger.warning(f"Database schema sync encountered warning: {exc}")
        print(f"[Warning] Database schema sync: {exc}")
