from fastapi import APIRouter, HTTPException, Body
from typing import Dict, Any
from app.algorithms.comparison import compare_analysis_results

router = APIRouter(prefix="/api", tags=["Compare"])

@router.post("/compare")
def compare_schedules_endpoint(payload: Dict[str, Any] = Body(...)):
    original = payload.get("original")
    modified = payload.get("modified")

    if not original or not modified:
        raise HTTPException(status_code=400, detail="Must provide both 'original' and 'modified' analysis results.")

    try:
        comparison_res = compare_analysis_results(original, modified)
        return {
            "success": True,
            "comparison": comparison_res
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error comparing analysis results: {str(e)}")
