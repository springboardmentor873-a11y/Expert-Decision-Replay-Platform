from sqlalchemy import text
from database import engine

with engine.connect() as conn:
    conn.execute(text(
        "ALTER TABLE decisions ADD COLUMN IF NOT EXISTS category VARCHAR(100);"
    ))
    conn.commit()

print("Done: decisions.category added.")