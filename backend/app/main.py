import bcrypt

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.database.connection import engine, Base
from backend.app.models.user import User
from backend.app.schemas.user import UserCreate, UserLogin


# Create database tables
Base.metadata.create_all(bind=engine)


# Create FastAPI application
app = FastAPI(title="Expert Decision Replay Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# -----------------------------
# Register User
# -----------------------------

@app.post("/register")
def register_user(user: UserCreate):

    with engine.begin() as connection:

        connection.execute(
            User.__table__.insert().values(
                name=user.name,
                email=user.email,
                password=bcrypt.hashpw(
                    user.password.encode("utf-8"),
                    bcrypt.gensalt()
                ).decode("utf-8"),
                role=user.role,
                team=user.team
            )
        )

    return {
        "message": "User registered successfully",
        "email": user.email
    }


# -----------------------------
# Login User
# -----------------------------

@app.post("/login")
def login_user(user: UserLogin):

    with engine.connect() as connection:

        result = connection.execute(
            User.__table__.select().where(
                User.email == user.email
            )
        ).first()

    if result is None:
        return {
            "message": "Invalid email or password"
        }

    password_is_correct = bcrypt.checkpw(
        user.password.encode("utf-8"),
        result.password.encode("utf-8")
    )

    if not password_is_correct:
        return {
            "message": "Invalid email or password"
        }

    return {
        "message": "Login successful",
        "email": result.email,
        "name": result.name,
        "role": result.role,
        "team": result.team
    }