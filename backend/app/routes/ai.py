from fastapi import APIRouter
from app.schemas.schedule import AiExplainRequest, AiTestConnectionRequest, AiDiscoverModelsRequest
from app.services.ai_service import generate_ai_explanation, test_ai_connection, discover_ai_models

router = APIRouter(prefix="/api/ai", tags=["AI Tutor"])

@router.post("/explain")
def explain_endpoint(payload: AiExplainRequest):
    return generate_ai_explanation(
        analysis_data=payload.analysis_data,
        prompt_type=payload.prompt_type or "explain_result",
        custom_question=payload.custom_question,
        messages=payload.messages,
        api_key=payload.api_key,
        provider=payload.provider,
        base_url=payload.base_url,
        model=payload.model
    )

@router.post("/test-connection")
def test_connection_endpoint(payload: AiTestConnectionRequest):
    return test_ai_connection(
        provider=payload.provider,
        api_key=payload.api_key,
        base_url=payload.base_url,
        model=payload.model
    )

@router.post("/discover-models")
def discover_models_endpoint(payload: AiDiscoverModelsRequest):
    return discover_ai_models(
        provider=payload.provider,
        api_key=payload.api_key,
        base_url=payload.base_url
    )


