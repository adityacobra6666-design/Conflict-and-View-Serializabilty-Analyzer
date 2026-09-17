from fastapi import APIRouter
from app.schemas.schedule import AiExplainRequest
from app.services.ai_service import generate_ai_explanation

router = APIRouter(prefix="/api/ai", tags=["AI Tutor"])

@router.post("/explain")
def explain_endpoint(payload: AiExplainRequest):
    return generate_ai_explanation(
        analysis_data=payload.analysis_data,
        prompt_type=payload.prompt_type or "explain_result",
        custom_question=payload.custom_question
    )
