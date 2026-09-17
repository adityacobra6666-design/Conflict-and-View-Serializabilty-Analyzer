from fastapi import APIRouter, Response, HTTPException
from app.schemas.schedule import ExportPdfRequest
from app.services.export_service import generate_pdf_report, generate_json_export, generate_csv_export
from typing import Dict, Any

router = APIRouter(prefix="/api/export", tags=["Export"])

@router.post("/pdf")
def export_pdf_endpoint(payload: ExportPdfRequest):
    try:
        pdf_bytes = generate_pdf_report(payload.analysis_data, title=payload.title or "Analysis Report")
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": 'attachment; filename="serializability_report.pdf"'}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")


@router.post("/json")
def export_json_endpoint(payload: Dict[str, Any]):
    json_str = generate_json_export(payload)
    return Response(
        content=json_str,
        media_type="application/json",
        headers={"Content-Disposition": 'attachment; filename="serializability_analysis.json"'}
    )


@router.post("/csv")
def export_csv_endpoint(payload: Dict[str, Any]):
    csv_str = generate_csv_export(payload)
    return Response(
        content=csv_str,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="serializability_analysis.csv"'}
    )
