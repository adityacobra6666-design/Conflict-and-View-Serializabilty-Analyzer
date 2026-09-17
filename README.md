# Conflict & View Serializability Analyzer
> **Interactive DBMS Schedule Intelligence Platform**

An interactive, production-quality educational web application that analyzes transaction schedules under **BOTH Conflict Serializability and View Serializability criteria simultaneously**.

---

## 🌟 Key Features

- **Unified Dual Analysis**: Analyzes every schedule using both Conflict and View engines and displays a combined comparative verdict.
- **Deterministic Source of Truth**: Backend Python algorithms compute all conflicts, precedence graphs, cycles, topological sorts, initial reads, reads-from relationships, final writes, and candidate serial order equivalences.
- **Interactive Visualizations**:
  - **Cytoscape.js Directed Precedence Graph**: Drag, zoom, fit, click edges to inspect conflict causes, and highlight cycle paths.
  - **Chronological Timeline**: Step-by-step transaction execution matrix with operation details.
  - **View Equivalence Pipeline**: Initial Reads, Reads-From, Final Writes, and Candidate Serial Order permutation tables.
- **Simulation Stepper**: 8-stage interactive stepper with Play/Pause/Prev/Next controls.
- **Verified Blind-Write Case**: Featured interactive demonstration of schedules that are View Serializable but NOT Conflict Serializable (`R1(X), W2(X), W1(X), W3(X)`).
- **AI Tutor Assistant**: Contextual explanation assistant answering questions, generating viva questions, and explaining beginner concepts without changing backend calculations.
- **Exports & Persistence**: SQLite history tracking with ReportLab PDF, JSON, and CSV export capabilities.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Cytoscape.js, Framer Motion, Lucide Icons.
- **Backend**: Python 3.14, FastAPI, Pydantic v2, SQLAlchemy.
- **Database**: SQLite.
- **Testing**: Pytest (backend), Vitest & TypeScript Compiler (frontend).
- **Reports**: ReportLab (PDF), JSON, CSV.

---

## 🚀 Quick Start

### 1. Run Backend Server
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2. Run Frontend Web App
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Running Automated Tests

```bash
# Backend Pytest suite (19 unit & API integration tests)
cd backend && ./venv/bin/pytest -v

# Frontend TypeScript build & type check
cd frontend && npm run build
```

---

## 📄 License & Credits
Built for DBMS laboratory courses, academic research, and university computer science curricula.
