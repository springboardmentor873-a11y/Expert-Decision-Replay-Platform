from database import engine
import sqlalchemy as sa

with engine.begin() as conn:
    conn.execute(sa.text('ALTER TABLE decisions ADD COLUMN team_id INTEGER REFERENCES teams(id);'))
    print("Column added")
