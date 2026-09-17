from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["Examples"])

EXAMPLES_LIBRARY = [
    {
        "id": "ex-1",
        "title": "Simple Conflict Serializable",
        "category": "Basic",
        "difficulty": "Easy",
        "schedule_text": "R1(X), W1(X), R2(X), W2(X)",
        "expected_conflict": True,
        "expected_view": True,
        "description": "Sequential operations where T1 completes before T2 accesses item X. No cycle exists.",
        "theory_note": "A classic serializable schedule with precedence T1 → T2."
    },
    {
        "id": "ex-2",
        "title": "View Serializable but NOT Conflict Serializable (Blind Write)",
        "category": "Special Case",
        "difficulty": "Advanced",
        "schedule_text": "R1(X), W2(X), W1(X), W3(X)",
        "expected_conflict": False,
        "expected_view": True,
        "description": "T2 performs a blind write on X between T1's read and write, causing cycle T1 ↔ T2. However, serial order T1 → T2 → T3 is view equivalent!",
        "theory_note": "Demonstrates why view serializability is more general than conflict serializability."
    },
    {
        "id": "ex-3",
        "title": "Cyclic Non-Serializable Schedule",
        "category": "Cycles",
        "difficulty": "Easy",
        "schedule_text": "R1(X), W2(X), W1(X), R2(X)",
        "expected_conflict": False,
        "expected_view": False,
        "description": "Interleaved operations create mutual dependencies T1 → T2 and T2 → T1.",
        "theory_note": "Direct cycle T1 ↔ T2 renders the schedule completely non-serializable."
    },
    {
        "id": "ex-4",
        "title": "Independent Parallel Transactions",
        "category": "Multi-Item",
        "difficulty": "Easy",
        "schedule_text": "R1(X), W1(X), R2(Y), W2(Y)",
        "expected_conflict": True,
        "expected_view": True,
        "description": "T1 operates solely on X while T2 operates solely on Y. Zero conflicting operations exist.",
        "theory_note": "Permits both serial orderings: T1 → T2 and T2 → T1."
    },
    {
        "id": "ex-5",
        "title": "3-Transaction Chain Dependency",
        "category": "Multi-Transaction",
        "difficulty": "Medium",
        "schedule_text": "R1(X), W2(X), R2(Y), W3(Y)",
        "expected_conflict": True,
        "expected_view": True,
        "description": "Linear chain dependency T1 → T2 → T3 with zero cycles.",
        "theory_note": "Topological sort produces a single valid serial order: T1 → T2 → T3."
    },
    {
        "id": "ex-6",
        "title": "Complex Multi-Item Interleaved Schedule",
        "category": "Complex",
        "difficulty": "Hard",
        "schedule_text": "R1(X), W2(Y), W3(X), R2(X), W1(Y), W3(Z)",
        "expected_conflict": False,
        "expected_view": False,
        "description": "Multiple data items (X, Y, Z) with cross-transaction interleaving causing multiple graph cycles.",
        "theory_note": "Tests complex multi-node cycle detection and exhaustive candidate checking."
    }
]

@router.get("/examples")
def get_examples():
    return {"examples": EXAMPLES_LIBRARY, "count": len(EXAMPLES_LIBRARY)}
