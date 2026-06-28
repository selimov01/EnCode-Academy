import os
import sqlite3
import uuid
from datetime import datetime, timezone
from typing import Any

from pathlib import Path

import bcrypt
from fastapi import FastAPI, Header, Request
from fastapi.exceptions import HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, field_validator

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "users.db")
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

app = FastAPI(title="EnCode Academy API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:8002", "http://localhost:8002"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent

# static files
app.mount("/static", StaticFiles(directory=BASE_DIR.parent.parent / "src"), name="static")

# roadmap PDFs
ROADMAPS_DIR = BASE_DIR.parent.parent / "assets" / "roadmaps"
app.mount("/roadmaps", StaticFiles(directory=ROADMAPS_DIR), name="roadmaps")


# html pages
@app.get("/", response_class=HTMLResponse)
async def index():
    with open(BASE_DIR.parent.parent / "index.html", encoding="utf-8") as f:
        return f.read()

@app.get("/contacts", response_class=HTMLResponse)
async def contacts():
    with open(BASE_DIR.parent.parent / "src" / "contacts.html", encoding="utf-8") as f:
        return f.read()

@app.get("/faq", response_class=HTMLResponse)
async def faq():
    with open(BASE_DIR.parent.parent / "src" / "faq.html", encoding="utf-8") as f:
        return f.read()

@app.get("/profile", response_class=HTMLResponse)
async def profile():
    with open(BASE_DIR.parent.parent / "src" / "profile.html", encoding="utf-8") as f:
        return f.read()

@app.get("/backend-roadmap", response_class=HTMLResponse)
async def backend_roadmap():
    with open(BASE_DIR.parent.parent / "src" / "backend-roadmap.html", encoding="utf-8") as f:
        return f.read()


# 404 handler
@app.exception_handler(StarletteHTTPException)
async def not_found_handler(request: Request, exc: StarletteHTTPException):
    if exc.status_code == 404:
        with open(BASE_DIR.parent.parent / "src" / "404.html", encoding="utf-8") as f:
            return HTMLResponse(content=f.read(), status_code=404)
    from fastapi.responses import JSONResponse
    return JSONResponse({"detail": exc.detail}, status_code=exc.status_code)


# database
def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with get_db() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                full_name TEXT NOT NULL,
                username TEXT NOT NULL UNIQUE,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                interests TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS auth_tokens (
                token TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.commit()


init_db()


class RegisterPayload(BaseModel):
    full_name: str
    username: str
    email: EmailStr
    password: str
    confirm_password: str
    interests: str = ""

    @field_validator("username")
    @classmethod
    def username_must_not_be_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("username cannot be empty")
        return value.strip()

    @field_validator("full_name")
    @classmethod
    def full_name_must_not_be_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("full_name cannot be empty")
        return value.strip()


class LoginPayload(BaseModel):
    identifier: str
    password: str


class AuthUser(BaseModel):
    id: int
    full_name: str
    username: str
    email: str
    interests: str


class AuthResponse(BaseModel):
    token: str
    user: AuthUser


class ProfileResponse(BaseModel):
    user: AuthUser


class ErrorResponse(BaseModel):
    detail: str


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


def create_token(user_id: int) -> str:
    token = uuid.uuid4().hex
    with get_db() as conn:
        conn.execute(
            "INSERT INTO auth_tokens (token, user_id, created_at) VALUES (?, ?, ?)",
            (token, user_id, datetime.now(timezone.utc).isoformat()),
        )
        conn.commit()
    return token


def get_user_by_token(token: str) -> dict[str, Any] | None:
    with get_db() as conn:
        row = conn.execute(
            "SELECT users.id, users.full_name, users.username, users.email, users.interests FROM auth_tokens JOIN users ON users.id = auth_tokens.user_id WHERE auth_tokens.token = ?",
            (token,),
        ).fetchone()
        return dict(row) if row else None


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/auth/register", response_model=AuthResponse)
def register(payload: RegisterPayload) -> AuthResponse:
    if payload.password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    if len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    with get_db() as conn:
        existing = conn.execute(
            "SELECT id FROM users WHERE username = ? OR email = ?",
            (payload.username.strip(), payload.email.lower()),
        ).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="User with this username or email already exists")

        user_id = conn.execute(
            """
            INSERT INTO users (full_name, username, email, password_hash, interests, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                payload.full_name.strip(),
                payload.username.strip(),
                payload.email.lower(),
                hash_password(payload.password),
                payload.interests.strip(),
                datetime.now(timezone.utc).isoformat(),
            ),
        ).lastrowid
        conn.commit()

    token = create_token(int(user_id))
    user = get_user_by_token(token)
    if not user:
        raise HTTPException(status_code=500, detail="Unable to load created user")
    return AuthResponse(token=token, user=AuthUser(**user))


@app.post("/api/auth/login", response_model=AuthResponse)
def login(payload: LoginPayload) -> AuthResponse:
    identifier = payload.identifier.strip()
    normalized_identifier = identifier.lower()
    with get_db() as conn:
        row = conn.execute(
            "SELECT id, full_name, username, email, password_hash, interests FROM users WHERE LOWER(username) = ? OR LOWER(email) = ?",
            (normalized_identifier, normalized_identifier),
        ).fetchone()
        if not row or not verify_password(payload.password, row["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token(int(row["id"]))
    return AuthResponse(
        token=token,
        user=AuthUser(
            id=row["id"],
            full_name=row["full_name"],
            username=row["username"],
            email=row["email"],
            interests=row["interests"],
        ),
    )


@app.get("/api/auth/me", response_model=ProfileResponse)
def get_me(authorization: str | None = Header(default=None)) -> ProfileResponse:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    token = authorization.split(" ", 1)[1].strip()
    user = get_user_by_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return ProfileResponse(user=AuthUser(**user))
