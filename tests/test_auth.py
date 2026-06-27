import os
import sqlite3
import sys

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.main import app


@pytest.fixture
def client():
    with sqlite3.connect(os.path.join(os.path.dirname(__file__), "..", "backend", "data", "users.db")) as conn:
        conn.execute("DELETE FROM auth_tokens")
        conn.execute("DELETE FROM users")
        conn.commit()

    with TestClient(app) as test_client:
        yield test_client


def test_register_and_get_profile(client):
    payload = {
        "full_name": "Иван Иванов",
        "username": "ivan",
        "email": "ivan@example.com",
        "password": "secret123",
        "confirm_password": "secret123",
        "interests": "Backend",
    }

    register_response = client.post("/api/auth/register", json=payload)
    assert register_response.status_code == 200
    body = register_response.json()
    assert body["user"]["email"] == payload["email"]
    assert body["user"]["interests"] == payload["interests"]

    token = body["token"]
    me_response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_response.status_code == 200
    assert me_response.json()["user"]["username"] == payload["username"]


def test_login_returns_user_profile(client):
    register_payload = {
        "full_name": "Мария Петрова",
        "username": "maria",
        "email": "maria@example.com",
        "password": "qwerty123",
        "confirm_password": "qwerty123",
        "interests": "Data Science",
    }
    client.post("/api/auth/register", json=register_payload)

    login_response = client.post(
        "/api/auth/login",
        json={"identifier": register_payload["email"], "password": register_payload["password"]},
    )
    assert login_response.status_code == 200
    assert login_response.json()["user"]["email"] == register_payload["email"]


def test_login_matches_username_case_insensitively(client):
    register_payload = {
        "full_name": "Артём Соколов",
        "username": "ArtemDev",
        "email": "artem@example.com",
        "password": "superpass123",
        "confirm_password": "superpass123",
        "interests": "Backend",
    }
    client.post("/api/auth/register", json=register_payload)

    login_response = client.post(
        "/api/auth/login",
        json={"identifier": "artemdev", "password": register_payload["password"]},
    )
    assert login_response.status_code == 200
    assert login_response.json()["user"]["username"] == register_payload["username"]
