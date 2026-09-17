# API Specification

## Endpoints

### 1. Analyze Schedule
`POST /api/analyze`
```json
{
  "schedule_text": "R1(X), W2(X), W1(X), W3(X)"
}
```

### 2. Preset Example Library
`GET /api/examples`

### 3. Persisted History
`GET /api/history`
`GET /api/history/{id}`
`DELETE /api/history/{id}`

### 4. PDF / JSON / CSV Exports
`POST /api/export/pdf`
`POST /api/export/json`
`POST /api/export/csv`

### 5. AI Tutor Assistant
`POST /api/ai/explain`
```json
{
  "analysis_data": { ... },
  "prompt_type": "explain_result"
}
```
