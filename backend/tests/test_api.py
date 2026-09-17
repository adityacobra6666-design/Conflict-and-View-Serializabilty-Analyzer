# pyrefly: ignore [missing-import]
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_examples_endpoint():
    response = client.get("/api/examples")
    assert response.status_code == 200
    data = response.json()
    assert "examples" in data
    assert data["count"] >= 6

def test_analyze_endpoint_post():
    payload = {"schedule_text": "R1(X), W2(X), W1(X), W3(X)"}
    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["conflict_serializable"] is False
    assert data["view_serializable"] is True
    assert "history_id" in data

def test_history_endpoints():
    # Fetch history
    response = client.get("/api/history")
    assert response.status_code == 200
    history_list = response.json()["history"]
    assert len(history_list) >= 1

    history_id = history_list[0]["id"]
    # Fetch specific item
    resp_item = client.get(f"/api/history/{history_id}")
    assert resp_item.status_code == 200
    assert resp_item.json()["success"] is True

def test_ai_explain_endpoint():
    analyze_resp = client.post("/api/analyze", json={"schedule_text": "R1(X), W1(X)"})
    analysis_data = analyze_resp.json()

    ai_resp = client.post("/api/ai/explain", json={"analysis_data": analysis_data, "prompt_type": "explain_result"})
    assert ai_resp.status_code == 200
    assert "explanation" in ai_resp.json()

def test_export_pdf_and_json():
    analyze_resp = client.post("/api/analyze", json={"schedule_text": "R1(X), W1(X)"})
    analysis_data = analyze_resp.json()

    pdf_resp = client.post("/api/export/pdf", json={"analysis_data": analysis_data})
    assert pdf_resp.status_code == 200
    assert pdf_resp.headers["content-type"] == "application/pdf"

    json_resp = client.post("/api/export/json", json=analysis_data)
    assert json_resp.status_code == 200
    assert json_resp.headers["content-type"] == "application/json"
