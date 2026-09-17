from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.schedule import ScheduleAnalyzeRequest
from app.algorithms.analyzer import analyze_schedule
from app.database import get_db
from app.models.history import AnalysisHistory

router = APIRouter(prefix="/api", tags=["Analyze"])

@router.post("/analyze")
def analyze_schedule_endpoint(payload: ScheduleAnalyzeRequest, db: Session = Depends(get_db)):
    if payload.schedule_text:
        result = analyze_schedule(payload.schedule_text)
    elif payload.operations:
        result = analyze_schedule(payload.operations)
    else:
        raise HTTPException(status_code=400, detail="Must provide either schedule_text or operations list.")

    if not result.get("success"):
        return result

    # Save analysis into SQLite history automatically
    try:
        combined = result["combined_result"]
        history_entry = AnalysisHistory(
            schedule_text=result.get("schedule_text", ""),
            transaction_count=result.get("transaction_count", 0),
            operation_count=result.get("operation_count", 0),
            conflict_serializable=combined.get("conflict_serializable", False),
            view_serializable=combined.get("view_serializable", False),
            has_cycle=result.get("has_cycle", False),
            state_code=combined.get("state_code", "UNKNOWN"),
            headline=combined.get("headline", ""),
            full_json=result
        )
        db.add(history_entry)
        db.commit()
        db.refresh(history_entry)
        result["history_id"] = history_entry.id
    except Exception as e:
        print(f"Error saving history: {e}")

    return result
