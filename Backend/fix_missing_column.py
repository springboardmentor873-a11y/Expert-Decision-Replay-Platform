from sqlalchemy import text
from database import engine

with engine.connect() as conn:
    conn.execute(text(
        "ALTER TABLE decision_history ADD COLUMN IF NOT EXISTS changed_at TIMESTAMP DEFAULT NOW();"
    ))
    conn.commit()

print("Done: decision_history.changed_at added.")
