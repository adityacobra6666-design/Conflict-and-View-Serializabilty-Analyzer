from typing import List, Dict, Any
from app.algorithms.parser import parse_schedule_text, Operation
from app.algorithms.validator import validate_schedule
from app.algorithms.conflict import find_conflicts
from app.algorithms.precedence_graph import build_precedence_graph
from app.algorithms.cycle_detection import detect_cycles
from app.algorithms.topological_sort import find_all_topological_sorts
from app.algorithms.view import analyze_view_serializability

def analyze_schedule(schedule_input: str | List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Unified analysis controller.
    Runs parsing, validation, conflict engine, graph engine, cycle detector, topological sorter,
    view engine, and returns complete deterministic analysis.
    """
    if isinstance(schedule_input, list):
        # Already formatted operations list
        operations = []
        for idx, item in enumerate(schedule_input):
            tx_raw = str(item.get("transaction") or item.get("tx") or "1").strip()
            tx_id = tx_raw.upper() if tx_raw.upper().startswith("T") else f"T{tx_raw}"
            op_type = str(item.get("type", "READ")).upper()
            data_item = str(item.get("data_item") or item.get("item") or "X").upper()
            raw_text = item.get("raw_text") or f"{op_type[0]}{tx_id[1:]}({data_item})"
            op = Operation(
                id=idx + 1,
                transaction=tx_id,
                type=op_type,
                data_item=data_item,
                raw_text=raw_text
            )
            operations.append(op)
        parse_errors = []
    else:
        operations, parse_errors = parse_schedule_text(schedule_input)

    is_valid, validation_errors, warnings = validate_schedule(operations)
    all_errors = parse_errors + validation_errors

    if not is_valid or len(all_errors) > 0:
        return {
            "success": False,
            "errors": all_errors,
            "warnings": warnings,
            "operations": [op.to_dict() for op in operations]
        }

    # Extract unique transactions in order
    transactions = []
    seen = set()
    for op in operations:
        if op.transaction not in seen:
            seen.add(op.transaction)
            transactions.append(op.transaction)

    # 1. Conflict Analysis
    conflicts = find_conflicts(operations)

    # 2. Precedence Graph
    precedence_graph = build_precedence_graph(operations, conflicts)

    # 3. Cycle Detection
    cycle_res = detect_cycles(transactions, precedence_graph["edges"])
    has_cycle = cycle_res["has_cycle"]
    conflict_serializable = not has_cycle

    # 4. Topological Sorting
    topological_orders = []
    if conflict_serializable:
        topological_orders = find_all_topological_sorts(transactions, precedence_graph["edges"])

    # 5. View Serializability Engine
    view_res = analyze_view_serializability(operations, transactions)
    view_serializable = view_res["view_serializable"]

    # 6. Combined State Determination
    if conflict_serializable and view_serializable:
        state_code = "BOTH_SERIALIZABLE"
        headline = "Serializable Under Both Criteria"
        summary = "This schedule is both Conflict Serializable and View Serializable. Its precedence graph is acyclic, and its operation order matches equivalent serial order(s)."
    elif not conflict_serializable and view_serializable:
        state_code = "VIEW_ONLY_SERIALIZABLE"
        headline = "View Serializable but NOT Conflict Serializable"
        summary = "Interesting Result: Conflict serializability is stricter than view serializability. This schedule contains a precedence graph cycle (blind writes / overwritten operations), yet a view-equivalent serial schedule exists!"
    elif not conflict_serializable and not view_serializable:
        state_code = "NEITHER_SERIALIZABLE"
        headline = "Not Serializable Under Either Criterion"
        summary = "This schedule is neither Conflict Serializable nor View Serializable. A cycle exists in the precedence graph, and no transaction serial order preserves initial reads, reads-from, and final writes."
    else:  # Conflict = YES, View = NO (Correctness Safety Violation)
        state_code = "CORRECTNESS_ERROR"
        headline = "Theoretical Inconsistency Detected"
        summary = "Warning: Conflict serializability mathematically implies view serializability. Please inspect schedule parameters."

    return {
        "success": True,
        "schedule_text": ", ".join(op.raw_text for op in operations),
        "operations": [op.to_dict() for op in operations],
        "transactions": transactions,
        "data_items": sorted(list(set(op.data_item for op in operations))),
        "operation_count": len(operations),
        "transaction_count": len(transactions),

        "conflicts": [c.to_dict() for c in conflicts],
        "conflict_count": len(conflicts),

        "precedence_graph": precedence_graph,
        "cycles": cycle_res["cycles"],
        "formatted_cycles": cycle_res["formatted_cycles"],
        "has_cycle": has_cycle,
        "conflict_serializable": conflict_serializable,

        "topological_orders": topological_orders,
        "formatted_topological_orders": [" → ".join(order) for order in topological_orders],

        "view_analysis": view_res,
        "view_serializable": view_serializable,

        "combined_result": {
            "state_code": state_code,
            "headline": headline,
            "summary": summary,
            "conflict_serializable": conflict_serializable,
            "view_serializable": view_serializable,
            "is_special_case": (not conflict_serializable and view_serializable)
        },
        "warnings": warnings
    }
