from app.database.database import engine
from sqlalchemy import text, inspect

def run_migration():
    inspector = inspect(engine)
    cols = [c['name'] for c in inspector.get_columns('decisions')]
    print('Current decisions columns:', cols)

    with engine.begin() as conn:
        if 'category_id' not in cols:
            print('Adding category_id column...')
            conn.execute(text('ALTER TABLE decisions ADD COLUMN category_id INTEGER;'))
            conn.execute(text('''
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
            '''))
            conn.execute(text('CREATE INDEX IF NOT EXISTS ix_decisions_category_id ON decisions(category_id);'))
            print('category_id added.')
        else:
            print('category_id already exists.')

        if 'team_id' not in cols:
            print('Adding team_id column...')
            conn.execute(text('ALTER TABLE decisions ADD COLUMN team_id INTEGER;'))
            conn.execute(text('''
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
            '''))
            conn.execute(text('CREATE INDEX IF NOT EXISTS ix_decisions_team_id ON decisions(team_id);'))
            print('team_id added.')
        else:
            print('team_id already exists.')

    inspector = inspect(engine)
    new_cols = [c['name'] for c in inspector.get_columns('decisions')]
    print('Updated decisions columns:', new_cols)

if __name__ == '__main__':
    run_migration()
