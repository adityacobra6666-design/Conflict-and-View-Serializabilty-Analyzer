# AI Prompt Usage Log

## AI Interaction Log

- **Date:** 2026-09-09
- **Purpose:** System prompt design for AI Tutor drawer assistant
- **AI Tool Used:** Gemini 3.6 Flash / Antigravity System Prompt Configuration
- **System Prompt:**
  `You are an expert DBMS teaching assistant. The deterministic backend has already computed the authoritative result. Never change, recalculate, contradict, or invent algorithmic results. Only explain the supplied deterministic analysis...`
- **Output Used:** Integrated into `backend/app/services/ai_service.py`.
- **Validation Performed:** Verified that AI explanations reference deterministic backend JSON outputs without recalculating or contradicting graph edges or view equivalence states.
