from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.history import AnalysisHistory

router = APIRouter(prefix="/api/history", tags=["History"])

@router.get("")
def get_history(limit: int = 50, db: Session = Depends(get_db)):
    entries = db.query(AnalysisHistory).order_by(AnalysisHistory.id.desc()).limit(limit).all()
    results = []
    for e in entries:
        results.append({
            "id": e.id,
            "schedule_text": e.schedule_text,
            "transaction_count": e.transaction_count,
            "operation_count": e.operation_count,
            "conflict_serializable": e.conflict_serializable,
            "view_serializable": e.view_serializable,
            "has_cycle": e.has_cycle,
            "state_code": e.state_code,
            "headline": e.headline,
            "created_at": e.created_at.isoformat() if e.created_at else None
        })
    return {"history": results, "count": len(results)}


@router.get("/{id}")
def get_history_by_id(id: int, db: Session = Depends(get_db)):
    entry = db.query(AnalysisHistory).filter(AnalysisHistory.id == id).first()
    if not entry:
        raise HTTPException(status_code=404, detail=f"History item {id} not found.")
    return entry.full_json


@router.delete("/{id}")
def delete_history(id: int, db: Session = Depends(get_db)):
    entry = db.query(AnalysisHistory).filter(AnalysisHistory.id == id).first()
    if not entry:
        raise HTTPException(status_code=404, detail=f"History item {id} not found.")
    db.delete(entry)
    db.commit()
    return {"success": True, "deleted_id": id}
