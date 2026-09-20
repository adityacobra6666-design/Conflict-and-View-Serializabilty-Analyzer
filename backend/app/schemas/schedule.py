from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class ScheduleAnalyzeRequest(BaseModel):
    schedule_text: Optional[str] = Field(None, json_schema_extra={"example": "R1(X), W2(X), W1(X), W3(X)"})
    operations: Optional[List[Dict[str, Any]]] = Field(None, json_schema_extra={"example": [
        {"transaction": "T1", "type": "READ", "data_item": "X"},
        {"transaction": "T2", "type": "WRITE", "data_item": "X"}
    ]})

class ExportPdfRequest(BaseModel):
    analysis_data: Dict[str, Any]
    title: Optional[str] = "Conflict & View Serializability Analysis Report"

class AiExplainRequest(BaseModel):
    analysis_data: Optional[Dict[str, Any]] = None
    prompt_type: Optional[str] = "explain_result"
    custom_question: Optional[str] = None
    messages: Optional[List[Dict[str, str]]] = None
    api_key: Optional[str] = None
    provider: Optional[str] = None
    base_url: Optional[str] = None
    model: Optional[str] = None

class AiTestConnectionRequest(BaseModel):
    provider: str
    api_key: str
    base_url: Optional[str] = None
    model: Optional[str] = None

class AiDiscoverModelsRequest(BaseModel):
    provider: str
    api_key: str
    base_url: Optional[str] = None


