from fastapi.testclient import TestClient
from app.main import app
from app.algorithms.schedule_extractor import parse_schedule_from_text, extract_operations_sequence

client = TestClient(app)

def test_extract_operations_sequence_standard():
    text = "Consider schedule S = R1(X), W2(X), R1(Y), W2(Y). Test serializability."
    ops = extract_operations_sequence(text)
    assert ops == ["R1(X)", "W2(X)", "R1(Y)", "W2(Y)"]

def test_extract_operations_sequence_subscripts_and_lowercase():
    text = "r1(x), w2(x), r1(y), w2(y)"
    res = parse_schedule_from_text(text)
    assert res["parsed_schedule"] == "R1(X), W2(X), R1(Y), W2(Y)"

def test_extract_operations_colon_notation():
    text = "T1: R(X), T2: W(X), T1: W(X), T3: W(X)"
    res = parse_schedule_from_text(text)
    assert res["parsed_schedule"] == "R1(X), W2(X), W1(X), W3(X)"

def test_upload_invalid_extension():
    response = client.post(
        "/api/upload/question",
        files={"file": ("test.txt", b"R1(X), W2(X)", "text/plain")}
    )
    assert response.status_code == 400
    assert "Unsupported file format" in response.json()["detail"]

def test_upload_empty_file():
    response = client.post(
        "/api/upload/question",
        files={"file": ("test.png", b"", "image/png")}
    )
    assert response.status_code == 400
    assert "empty" in response.json()["detail"]
