from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routes import analyze, compare, examples, history, export, ai, health

# Create SQLite database tables if not created
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Conflict & View Serializability Analyzer API",
    description="Deterministic DBMS Intelligence Platform Backend",
    version="1.0.0"
)

# CORS middleware for React frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(health.router)
app.include_router(analyze.router)
app.include_router(compare.router)
app.include_router(examples.router)
app.include_router(history.router)
app.include_router(export.router)
app.include_router(ai.router)

@app.get("/")
def root():
    return {
        "app": "Conflict & View Serializability Analyzer Backend",
        "docs": "/docs",
        "status": "running"
    }
