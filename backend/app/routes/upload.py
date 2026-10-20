import os
import base64
import io
from fastapi import APIRouter, UploadFile, File, HTTPException
from pypdf import PdfReader
from app.algorithms.schedule_extractor import parse_schedule_from_text
import httpx

router = APIRouter(prefix="/api/upload", tags=["Document & Question Upload"])

SUPPORTED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".pdf"}

@router.post("/question")
async def upload_question_endpoint(file: UploadFile = File(...)):
    """
    Accepts an uploaded PNG, JPG, JPEG, or PDF question document.
    Extracts question text using PDF text extraction or AI Vision (if configured).
    Parses transaction operations into standard DBMS format: R1(X), W2(X), ...
    Returns extracted text and parsed schedule for user verification before analysis.
    """
    filename = file.filename or "uploaded_file"
    ext = os.path.splitext(filename.lower())[1]

    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Supported formats: PNG, JPG, JPEG, PDF."
        )

    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
    ai_available = bool(gemini_key)
    ai_used = False
    extracted_text = ""
    message = ""

    # Case A: PDF Document
    if ext == ".pdf":
        try:
            reader = PdfReader(io.BytesIO(file_bytes))
            pages_text = []
            for page in reader.pages:
                t = page.extract_text()
                if t:
                    pages_text.append(t)
            extracted_text = "\n\n".join(pages_text).strip()
        except Exception as e:
            extracted_text = ""

        # If PDF was scanned (no direct text extracted) and AI is available, use Gemini
        if (not extracted_text or len(extracted_text) < 10) and ai_available:
            ai_res = await call_gemini_vision(file_bytes, "application/pdf", gemini_key)
            if ai_res["success"]:
                extracted_text = ai_res["text"]
                ai_used = True
                message = "Extracted text and schedule using AI Document Vision (Gemini)."
            else:
                message = f"AI processing notice: {ai_res.get('error', 'AI could not read scanned PDF.')}"
        elif extracted_text:
            message = "Extracted text successfully from PDF document."
        else:
            message = "No digital text found in PDF. For scanned PDFs, configure GEMINI_API_KEY in backend/.env for AI vision."

    # Case B: Image (PNG, JPG, JPEG)
    else:
        mime_type = "image/png" if ext == ".png" else "image/jpeg"
        if ai_available:
            ai_res = await call_gemini_vision(file_bytes, mime_type, gemini_key)
            if ai_res["success"]:
                extracted_text = ai_res["text"]
                ai_used = True
                message = "Extracted text and schedule from image using AI Vision (Gemini)."
            else:
                message = f"AI Vision Notice: {ai_res.get('error', 'Unable to process image with AI.')}"
        else:
            message = "No GEMINI_API_KEY configured in backend/.env. To enable AI Vision OCR for photographs and screenshots, add GEMINI_API_KEY to backend/.env. Manual schedule input remains fully available."

    # Parse schedule from extracted text using our deterministic extractor
    parse_result = parse_schedule_from_text(extracted_text)

    return {
        "success": True,
        "filename": filename,
        "file_type": "pdf" if ext == ".pdf" else "image",
        "raw_text": parse_result["raw_text"],
        "parsed_schedule": parse_result["parsed_schedule"],
        "candidate_schedules": parse_result["candidate_schedules"],
        "operation_count": parse_result["operation_count"],
        "uncertain_parts": parse_result["uncertain_parts"],
        "ai_available": ai_available,
        "ai_used": ai_used,
        "message": message
    }


async def call_gemini_vision(file_bytes: bytes, mime_type: str, api_key: str) -> dict:
    """Safely calls Google Gemini Vision API to transcribe and parse DBMS question from image/PDF."""
    b64_data = base64.b64encode(file_bytes).decode("utf-8")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"

    prompt = (
        "You are an expert DBMS professor. The user uploaded an image/document containing a transaction scheduling problem. "
        "1. Transcribe the full question text faithfully. "
        "2. Identify the transaction schedule operations (e.g., R1(X), W2(X), etc.) in their EXACT chronological order. "
        "Output the transcription followed by a line starting with: 'SCHEDULE: <operations separated by comma>'."
    )

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt},
                    {
                        "inline_data": {
                            "mime_type": mime_type,
                            "data": b64_data
                        }
                    }
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.1,
            "maxOutputTokens": 1024
        }
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                return {"success": True, "text": text}
            else:
                return {"success": False, "error": f"Gemini API returned HTTP {resp.status_code}"}
    except Exception as e:
        return {"success": False, "error": str(e)}
