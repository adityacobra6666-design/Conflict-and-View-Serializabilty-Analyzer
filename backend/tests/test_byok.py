import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.ai_service import test_ai_connection as service_test_ai_connection, generate_ai_explanation

client = TestClient(app)

def test_ai_connection_empty_key():
    res = service_test_ai_connection(provider="openai", api_key="")
    assert res["success"] is False
    assert "empty" in res["message"].lower()

def test_ai_connection_invalid_key():
    res = service_test_ai_connection(provider="openai", api_key="sk-invalidkey1234567890")
    assert res["success"] is False

def test_explain_endpoint_no_key():
    payload = {
        "analysis_data": {
            "schedule_text": "R1(X), W2(X)",
            "combined_result": {"conflict_serializable": False, "view_serializable": False}
        }
    }
    response = client.post("/api/ai/explain", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False
    assert data["error_code"] == "NO_KEY"
    assert "bring your own key" in data["explanation"].lower()

def test_explain_endpoint_invalid_byok():
    payload = {
        "analysis_data": {
            "schedule_text": "R1(X), W2(X)",
            "combined_result": {"conflict_serializable": False, "view_serializable": False}
        },
        "api_key": "sk-invalidkey1234567890",
        "provider": "openai",
        "model": "gpt-4o-mini"
    }
    response = client.post("/api/ai/explain", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False
    assert data["error_code"] == "INVALID_KEY"
    assert "api key" in data["explanation"].lower()

def test_test_connection_endpoint():
    payload = {
        "provider": "openai",
        "api_key": "sk-invalidkey1234567890",
        "model": "gpt-4o-mini"
    }
    response = client.post("/api/ai/test-connection", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False

def test_openrouter_test_connection():
    res = service_test_ai_connection(provider="openrouter", api_key="sk-or-v1-invalidkey12345")
    assert res["success"] is False
    assert "invalid" in res["message"].lower() or "unable" in res["message"].lower()

def test_explain_endpoint_openrouter_invalid():
    payload = {
        "analysis_data": {
            "schedule_text": "R1(X), W2(X)",
            "combined_result": {"conflict_serializable": False, "view_serializable": False}
        },
        "api_key": "sk-or-v1-invalidkey12345",
        "provider": "openrouter",
        "model": "openai/gpt-4o-mini"
    }
    response = client.post("/api/ai/explain", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False
    assert data["error_code"] == "INVALID_KEY"
    assert "invalid openrouter api key" in data["explanation"].lower()


