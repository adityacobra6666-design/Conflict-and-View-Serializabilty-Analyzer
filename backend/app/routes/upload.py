import os
import base64
import io
from fastapi import APIRouter, UploadFile, File, HTTPException
from pypdf import PdfReader
from PIL import Image, ImageEnhance
import pytesseract
from app.algorithms.schedule_extractor import parse_schedule_from_text
import httpx

router = APIRouter(prefix="/api/upload", tags=["Document & Question Upload"])

SUPPORTED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".pdf"}

def extract_text_from_image_bytes(file_bytes: bytes) -> str:
    """
    Robust local OCR extraction from image bytes using PIL preprocessing and Tesseract.
    Handles transparency, scales small images, enhances contrast, and executes
    PSM modes optimized for document lines and full blocks.
    """
    try:
        image = Image.open(io.BytesIO(file_bytes))
        # Handle alpha channels (RGBA, LA, P)
        if image.mode in ('RGBA', 'LA', 'P'):
            rgb_img = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode == 'P':
                image = image.convert('RGBA')
            rgb_img.paste(image, mask=image.split()[-1] if 'A' in image.mode else None)
            image = rgb_img
        elif image.mode != 'RGB':
            image = image.convert('RGB')

        gray = image.convert('L')
        w, h = gray.size
        # Upscale if image resolution is low to improve OCR character detection
        if w < 1200 or h < 600:
            scale = max(2, min(4, int(1600 / max(w, 1))))
            gray = gray.resize((w * scale, h * scale), Image.Resampling.LANCZOS)

        enhancer = ImageEnhance.Contrast(gray)
        contrast_img = enhancer.enhance(1.8)

        # Run with single block (--psm 6) and auto segmentation (--psm 3)
        text_block = pytesseract.image_to_string(contrast_img, config='--psm 6')
        text_auto = pytesseract.image_to_string(gray, config='--psm 3')

        combined = f"{text_block}\n{text_auto}".strip()
        return combined
    except Exception as e:
        print(f"Local OCR error: {e}")
        return ""


@router.post("/question")
async def upload_question_endpoint(file: UploadFile = File(...)):
    """
    Accepts an uploaded PNG, JPG, JPEG, WEBP, or PDF question document.
    Extracts question text using local OCR (pytesseract) or PDF text extraction,
    with fallback to AI Vision (if GEMINI_API_KEY configured).
    Parses transaction operations into standard DBMS format: R1(X), W2(X), ...
    Returns extracted text and parsed schedule with validation results for user review.
    """
    filename = file.filename or "uploaded_file"
    ext = os.path.splitext(filename.lower())[1]

    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Supported formats: PNG, JPG, JPEG, WEBP, PDF."
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

            # Check if digital text contains operations; if not (e.g. scanned PDF), try OCR on embedded images
            parsed_initial = parse_schedule_from_text(extracted_text)
            if parsed_initial["operation_count"] == 0:
                ocr_texts = []
                for page in reader.pages:
                    for img_obj in page.images:
                        t = extract_text_from_image_bytes(img_obj.data)
                        if t:
                            ocr_texts.append(t)
                if ocr_texts:
                    extracted_text = "\n\n".join(ocr_texts).strip()
                    message = "Extracted text and schedule from scanned PDF images using local OCR."
                elif extracted_text:
                    message = "Extracted text from PDF document."
            else:
                message = "Extracted schedule successfully from PDF document."
        except Exception as e:
            extracted_text = ""
            message = f"Notice reading PDF: {str(e)}"

        # If PDF was scanned and local OCR found nothing, but AI is available, try Gemini
        parsed_pdf = parse_schedule_from_text(extracted_text)
        if parsed_pdf["operation_count"] == 0 and ai_available:
            ai_res = await call_gemini_vision(file_bytes, "application/pdf", gemini_key)
            if ai_res["success"] and ai_res["text"]:
                extracted_text = ai_res["text"]
                ai_used = True
                message = "Extracted text and schedule using AI Document Vision (Gemini)."

    # Case B: Image (PNG, JPG, JPEG, WEBP)
    else:
        # Run local OCR first (requires zero API key and works offline)
        extracted_text = extract_text_from_image_bytes(file_bytes)
        parsed_temp = parse_schedule_from_text(extracted_text)

        if parsed_temp["operation_count"] > 0:
            message = "Schedule successfully recognized and extracted using local OCR."
        elif ai_available:
            # Fall back to AI vision if local OCR didn't find operations
            mime_map = {
                ".png": "image/png",
                ".jpg": "image/jpeg",
                ".jpeg": "image/jpeg",
                ".webp": "image/webp"
            }
            mime_type = mime_map.get(ext, "image/png")
            ai_res = await call_gemini_vision(file_bytes, mime_type, gemini_key)
            if ai_res["success"] and ai_res["text"]:
                extracted_text = ai_res["text"]
                ai_used = True
                message = "Extracted text and schedule from image using AI Vision (Gemini)."
            else:
                message = "Local OCR did not detect operations. AI Vision also could not read the schedule."
        else:
            if extracted_text.strip():
                message = "Text was recognized from the image, but no valid DBMS transaction operations were found."
            else:
                message = "No text could be recognized from the image. Please upload a clear photo or screenshot."

    # Parse and validate schedule from extracted text using deterministic extractor & existing analyzer validator
    parse_result = parse_schedule_from_text(extracted_text)

    if parse_result["operation_count"] > 0:
        if not message:
            message = f"Found {parse_result['operation_count']} transaction operations in schedule."
    else:
        if not message:
            message = "No recognizable transaction operations found in the question."

    return {
        "success": True,
        "filename": filename,
        "file_type": "pdf" if ext == ".pdf" else "image",
        "raw_text": parse_result["raw_text"],
        "parsed_schedule": parse_result["parsed_schedule"],
        "candidate_schedules": parse_result["candidate_schedules"],
        "operation_count": parse_result["operation_count"],
        "uncertain_parts": parse_result["uncertain_parts"],
        "is_valid": parse_result["is_valid"],
        "validation_errors": parse_result["validation_errors"],
        "validation_warnings": parse_result["validation_warnings"],
        "ai_available": ai_available,
        "ai_used": ai_used,
        "message": message
    }


async def call_gemini_vision(file_bytes: bytes, mime_type: str, api_key: str) -> dict:
    """Safely calls Google Gemini Vision API as an AI enhancement when configured."""
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
