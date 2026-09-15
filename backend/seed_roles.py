from app.database import SessionLocal
from app.models import Role

db = SessionLocal()

roles = [
    "Employee",
    "Reviewer",
    "Manager",
    "Administrator"
]

for role_name in roles:
    existing_role = db.query(Role).filter(Role.name == role_name).first()

    if not existing_role:
        new_role = Role(name=role_name)
        db.add(new_role)

db.commit()
db.close()

print("Roles added successfully!")