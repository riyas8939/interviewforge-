import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base, get_db
from main import app
import os

# Create a test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_interviewforge.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def cleanup_db():
    # Cleanup before test
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    # Cleanup after test
    Base.metadata.drop_all(bind=engine)

def test_read_main():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"

def test_register_and_login():
    # Register
    register_data = {
        "email": "test@interviewforge.com",
        "password": "testpassword",
        "full_name": "Test User"
    }
    response = client.post("/api/auth/register", json=register_data)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@interviewforge.com"
    
    # Login
    login_data = {
        "email": "test@interviewforge.com",
        "password": "testpassword"
    }
    response = client.post("/api/auth/login", json=login_data)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    
    # Profile
    headers = {"Authorization": f"Bearer {data['access_token']}"}
    response = client.get("/api/auth/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@interviewforge.com"

def test_create_interview_unauthorized():
    response = client.post("/api/interview/start", json={
        "role": "Backend Developer",
        "experience": "Mid-level",
        "programming_language": "Python"
    })
    assert response.status_code == 401

def test_create_interview_authorized():
    # Register and login
    client.post("/api/auth/register", json={
        "email": "interviewer@test.com",
        "password": "password123",
        "full_name": "Interviewer"
    })
    login_resp = client.post("/api/auth/login", json={
        "email": "interviewer@test.com",
        "password": "password123"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create Interview
    response = client.post("/api/interview/start", json={
        "role": "Backend Developer",
        "experience": "Mid-level",
        "programming_language": "Python"
    }, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert data["status"] == "STARTED"
