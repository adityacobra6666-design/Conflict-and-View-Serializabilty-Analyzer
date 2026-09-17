import os
from typing import Dict, Any

AI_SYSTEM_PROMPT = """
You are an expert DBMS teaching assistant and university professor.

CRITICAL RULE:
The deterministic backend has already computed the authoritative result.
NEVER change, recalculate, contradict, or invent algorithmic results.
Only explain the supplied deterministic analysis.
Use simple, clear, university-level DBMS language.

When explaining conflict serializability:
- Reference the exact operations, data items, and precedence edges.
- If a cycle exists, name the exact transactions in the cycle.

When explaining view serializability:
- Reference initial reads, reads-from relationships, and final writes.
- Reference candidate serial orders and state why they match or fail view equivalence.

If the schedule is View Serializable but NOT Conflict Serializable (Blind Write case):
- Explicitly highlight this as a key theoretical insight: conflict serializability is a sufficient condition, whereas view serializability is necessary & sufficient for view equivalence.
"""

def generate_ai_explanation(analysis_data: Dict[str, Any], prompt_type: str = "explain_result", custom_question: str | None = None) -> Dict[str, Any]:
    """
    Generate contextual AI tutoring response based on deterministic analysis data.
    Uses LLM API if key available, or intelligent fallback explainer engine.
    """
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("OPENAI_API_KEY")

    combined = analysis_data.get("combined_result", {})
    conflict_serializable = combined.get("conflict_serializable", False)
    view_serializable = combined.get("view_serializable", False)
    schedule = analysis_data.get("schedule_text", "")
    conflicts = analysis_data.get("conflicts", [])
    cycles = analysis_data.get("formatted_cycles", [])
    cycles_str = ", ".join(cycles) if cycles else "None"
    view_info = analysis_data.get("view_analysis", {})
    eq_orders = view_info.get("equivalent_orders", [])
    eq_orders_str = ", ".join(eq_orders) if eq_orders else "None"
    top_orders = analysis_data.get("formatted_topological_orders", [])
    top_orders_str = ", ".join(top_orders) if top_orders else "None"
    data_items_str = ", ".join(analysis_data.get("data_items", []))

    if prompt_type == "explain_result":
        if conflict_serializable and view_serializable:
            explanation_text = (
                f"### Analysis Overview for Schedule: `{schedule}`\n\n"
                f"**Result: Both Conflict & View Serializable!**\n\n"
                f"1. **Conflict Serializability:** The precedence graph contains no directed cycles. "
                f"All conflicting operations can be serialized in topological order(s): `{top_orders_str}`.\n"
                f"2. **View Serializability:** Since the schedule is Conflict Serializable, it is automatically View Serializable. "
                f"Equivalent serial order(s): `{eq_orders_str}`.\n\n"
                f"**Key Takeaway:** Any conflict-serializable schedule ensures view equivalence because it preserves all read/write precedence dependencies."
            )
        elif not conflict_serializable and view_serializable:
            explanation_text = (
                f"### Special Educational Case: View Serializable but NOT Conflict Serializable!\n\n"
                f"**Schedule:** `{schedule}`\n\n"
                f"1. **Why Conflict Analysis Fails:** The precedence graph contains a cycle: `{cycles_str}`. "
                f"Because of blind writes (operations writing without reading first or overwriting data), conflicting operations create a cycle.\n"
                f"2. **Why View Equivalence Succeeds:** Even though a graph cycle exists, candidate serial order `{eq_orders_str}` preserves:\n"
                f"   - **Initial Reads:** All transactions read initial values identically to the original schedule.\n"
                f"   - **Reads-From Relationships:** Every read reads from the exact same transaction as in the original schedule.\n"
                f"   - **Final Writes:** The final writer on every data item remains identical.\n\n"
                f"**DBMS Theory Highlight:** Conflict serializability is a *sufficient* condition for view serializability, but NOT a *necessary* condition. Blind-write schedules can be view serializable despite graph cycles!"
            )
        else:
            explanation_text = (
                f"### Analysis Overview for Schedule: `{schedule}`\n\n"
                f"**Result: Not Serializable Under Either Criterion**\n\n"
                f"1. **Conflict Serializability:** FAILED due to precedence graph cycle: `{cycles_str}`.\n"
                f"2. **View Serializability:** FAILED because no candidate serial permutation of transactions matches the initial reads, reads-from relationships, and final writes of the original schedule.\n\n"
                f"**Key Takeaway:** This non-serializable schedule risks database anomalies like Lost Updates or Dirty Reads if executed concurrently without concurrency control."
            )

    elif prompt_type == "beginner":
        circle_msg = "No circles found — everything runs cleanly!" if conflict_serializable else f"Circle detected ({cycles_str}) — order got entangled!"
        view_msg = f"Yes, it matches serial order {eq_orders_str}" if view_serializable else "No serial arrangement produces the same final result."
        explanation_text = (
            f"### Simplified Explanation (ELI5)\n\n"
            f"Imagine transactions like group members editing a shared document (`{data_items_str}`).\n\n"
            f"- **Conflict Serializability:** Checks if everyone worked without stepping on each other's toes in a circle. "
            f"{circle_msg}\n"
            f"- **View Serializability:** Checks if the final saved document and who read whose notes at the end is EXACTLY identical to running everyone one by one. "
            f"{view_msg}"
        )

    elif prompt_type == "conflicts":
        if conflicts:
            c_lines = [f"- `{c['op1_raw']}` vs `{c['op2_raw']}` ({c['conflict_type']}) on data item `{c['data_item']}` → Precedence Edge `{c['from_tx']} → {c['to_tx']}`" for c in conflicts]
            explanation_text = (
                f"### Detailed Conflict Breakdown ({len(conflicts)} Conflict(s))\n\n"
                + "\n".join(c_lines) + "\n\n"
                f"Two operations conflict if they belong to different transactions, access the same data item, and at least one is a WRITE."
            )
        else:
            explanation_text = "### Conflict Breakdown\n\nNo conflicting operations detected."

    elif prompt_type == "viva":
        q1_ans = "Yes, because the precedence graph is acyclic." if conflict_serializable else f"No, because the precedence graph contains a cycle: {cycles_str}."
        explanation_text = (
            f"### DBMS Viva & Exam Questions for this Schedule\n\n"
            f"**Q1: Is this schedule Conflict Serializable? Why or why not?**\n"
            f"**Answer:** {q1_ans}\n\n"
            f"**Q2: What is the relationship between Conflict and View Serializability?**\n"
            f"**Answer:** Every conflict-serializable schedule is view-serializable, but the converse is not true. Schedules with blind writes can be view-serializable without being conflict-serializable.\n\n"
            f"**Q3: Name the 3 conditions required for View Equivalence.**\n"
            f"**Answer:** 1. Initial Reads Condition, 2. Reads-From Condition, 3. Final Writes Condition."
        )

    else:
        explanation_text = (
            f"### AI Tutor Explanation for `{schedule}`\n\n"
            f"**Conflict Result:** {'Serializable' if conflict_serializable else 'Non-Serializable'}\n"
            f"**View Result:** {'Serializable' if view_serializable else 'Non-Serializable'}\n\n"
            f"**Explanation:** {combined.get('summary')}"
        )

    return {
        "success": True,
        "prompt_type": prompt_type,
        "explanation": explanation_text,
        "is_ai_generated": bool(api_key),
        "source": "Gemini API" if api_key else "Deterministic DBMS Explanation Engine"
    }
