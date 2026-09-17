from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["Health"])

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Conflict & View Serializability Analyzer Backend",
        "version": "1.0.0"
    }
