from typing import List, Dict, Any

def compare_schedules(orig_ops: List[Dict[str, Any]], mod_ops: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Compare operation sequences of original vs modified schedule.
    Returns list of position-by-position operation diffs.
    """
    diffs = []
    max_len = max(len(orig_ops), len(mod_ops))

    for i in range(max_len):
        op1 = orig_ops[i] if i < len(orig_ops) else None
        op2 = mod_ops[i] if i < len(mod_ops) else None

        if op1 and op2:
            if op1.get("raw_text") == op2.get("raw_text"):
                diffs.append({
                    "position": i + 1,
                    "change_type": "UNCHANGED",
                    "orig_raw": op1.get("raw_text"),
                    "mod_raw": op2.get("raw_text"),
                    "description": f"Position #{i+1}: {op1.get('raw_text')} remains unchanged."
                })
            else:
                diffs.append({
                    "position": i + 1,
                    "change_type": "MODIFIED",
                    "orig_raw": op1.get("raw_text"),
                    "mod_raw": op2.get("raw_text"),
                    "description": f"Position #{i+1}: Changed {op1.get('raw_text')} → {op2.get('raw_text')}."
                })
        elif op2 and not op1:
            diffs.append({
                "position": i + 1,
                "change_type": "ADDED",
                "orig_raw": None,
                "mod_raw": op2.get("raw_text"),
                "description": f"Position #{i+1}: Added operation {op2.get('raw_text')}."
            })
        elif op1 and not op2:
            diffs.append({
                "position": i + 1,
                "change_type": "REMOVED",
                "orig_raw": op1.get("raw_text"),
                "mod_raw": None,
                "description": f"Position #{i+1}: Removed operation {op1.get('raw_text')}."
            })

    return diffs


def compare_graphs(orig_graph: Dict[str, Any], mod_graph: Dict[str, Any]) -> Dict[str, Any]:
    """
    Compare precedence graph edges of original vs modified graph.
    Returns categorized edges (unchanged, added, removed).
    """
    orig_edges = orig_graph.get("edges", [])
    mod_edges = mod_graph.get("edges", [])

    orig_edge_map = { (e["data"]["source"], e["data"]["target"]): e for e in orig_edges }
    mod_edge_map = { (e["data"]["source"], e["data"]["target"]): e for e in mod_edges }

    orig_keys = set(orig_edge_map.keys())
    mod_keys = set(mod_edge_map.keys())

    unchanged_keys = orig_keys.intersection(mod_keys)
    added_keys = mod_keys - orig_keys
    removed_keys = orig_keys - mod_keys

    return {
        "unchanged": [
            {
                "source": k[0],
                "target": k[1],
                "label": f"{k[0]} → {k[1]}",
                "details": mod_edge_map[k]["data"].get("explanation", "")
            } for k in sorted(list(unchanged_keys))
        ],
        "added": [
            {
                "source": k[0],
                "target": k[1],
                "label": f"{k[0]} → {k[1]}",
                "details": mod_edge_map[k]["data"].get("explanation", "")
            } for k in sorted(list(added_keys))
        ],
        "removed": [
            {
                "source": k[0],
                "target": k[1],
                "label": f"{k[0]} → {k[1]}",
                "details": orig_edge_map[k]["data"].get("explanation", "")
            } for k in sorted(list(removed_keys))
        ],
        "unchanged_count": len(unchanged_keys),
        "added_count": len(added_keys),
        "removed_count": len(removed_keys)
    }


def compare_analysis_results(orig_res: Dict[str, Any], mod_res: Dict[str, Any]) -> Dict[str, Any]:
    """
    Unified analysis comparison controller.
    Computes deterministic diffs across operations, precedence graphs, cycles, conflict serializability,
    and view serializability.
    """
    orig_ops = orig_res.get("operations", [])
    mod_ops = mod_res.get("operations", [])
    op_diffs = compare_schedules(orig_ops, mod_ops)

    orig_graph = orig_res.get("precedence_graph", {})
    mod_graph = mod_res.get("precedence_graph", {})
    graph_diff = compare_graphs(orig_graph, mod_graph)

    # Conflict Serializability Diff
    orig_conflict = orig_res.get("conflict_serializable", False)
    mod_conflict = mod_res.get("conflict_serializable", False)
    if orig_conflict == mod_conflict:
        conflict_state = "UNCHANGED"
    elif not orig_conflict and mod_conflict:
        conflict_state = "IMPROVED"
    else:
        conflict_state = "DEGRADED"

    # Cycle Diff
    orig_cycle = orig_res.get("has_cycle", False)
    mod_cycle = mod_res.get("has_cycle", False)
    orig_cycles_list = orig_res.get("formatted_cycles", [])
    mod_cycles_list = mod_res.get("formatted_cycles", [])

    if not orig_cycle and mod_cycle:
        cycle_state = "APPEARED"
    elif orig_cycle and not mod_cycle:
        cycle_state = "DISAPPEARED"
    elif orig_cycle and mod_cycle:
        cycle_state = "MODIFIED" if orig_cycles_list != mod_cycles_list else "UNCHANGED"
    else:
        cycle_state = "NONE"

    # View Serializability Diff
    orig_view = orig_res.get("view_serializable", False)
    mod_view = mod_res.get("view_serializable", False)
    if orig_view == mod_view:
        view_state = "UNCHANGED"
    elif not orig_view and mod_view:
        view_state = "IMPROVED"
    else:
        view_state = "DEGRADED"

    orig_eq = orig_res.get("view_analysis", {}).get("equivalent_orders", [])
    mod_eq = mod_res.get("view_analysis", {}).get("equivalent_orders", [])

    # Educational Change Rationale Generation
    explanation_parts = []

    modified_count = len([d for d in op_diffs if d["change_type"] != "UNCHANGED"])
    if modified_count == 0:
        explanation_parts.append("No operation modifications were made between the original and experimental schedule.")
    else:
        changed_descs = [d["description"] for d in op_diffs if d["change_type"] != "UNCHANGED"]
        explanation_parts.append(f"Operation Modification: {'; '.join(changed_descs)}.")

    if graph_diff["added_count"] > 0 or graph_diff["removed_count"] > 0:
        added_str = ", ".join(e["label"] for e in graph_diff["added"])
        removed_str = ", ".join(e["label"] for e in graph_diff["removed"])
        graph_desc = []
        if added_str:
            graph_desc.append(f"Added edge(s): {added_str}")
        if removed_str:
            graph_desc.append(f"Removed edge(s): {removed_str}")
        explanation_parts.append(f"Precedence Graph Impact: {'; '.join(graph_desc)}.")

    if conflict_state == "DEGRADED":
        explanation_parts.append(f"Conflict Serializability Impact: Changing operations created a directed cycle ({', '.join(mod_cycles_list)}), causing Conflict Serializability to degrade from YES to NO.")
    elif conflict_state == "IMPROVED":
        explanation_parts.append("Conflict Serializability Impact: The modification eliminated graph cycle(s), making the schedule Conflict Serializable!")
    else:
        explanation_parts.append(f"Conflict Serializability remained { 'YES' if orig_conflict else 'NO' }.")

    if view_state == "DEGRADED":
        explanation_parts.append("View Serializability Impact: Candidate transaction orders failed initial reads, reads-from, or final writes equivalence checks, degrading View Serializability from YES to NO.")
    elif view_state == "IMPROVED":
        explanation_parts.append(f"View Serializability Impact: A view-equivalent serial order ({', '.join(mod_eq)}) was discovered, making the modified schedule View Serializable!")
    else:
        explanation_parts.append(f"View Serializability remained { 'YES' if orig_view else 'NO' }.")

    explanation = " ".join(explanation_parts)

    return {
        "schedule_diffs": op_diffs,
        "modified_op_count": modified_count,
        "graph_diff": graph_diff,
        "conflict_diff": {
            "orig_conflict_serializable": orig_conflict,
            "mod_conflict_serializable": mod_conflict,
            "state_change": conflict_state,
            "orig_conflict_count": orig_res.get("conflict_count", 0),
            "mod_conflict_count": mod_res.get("conflict_count", 0)
        },
        "cycle_diff": {
            "orig_has_cycle": orig_cycle,
            "mod_has_cycle": mod_cycle,
            "orig_cycles": orig_cycles_list,
            "mod_cycles": mod_cycles_list,
            "state_change": cycle_state
        },
        "view_diff": {
            "orig_view_serializable": orig_view,
            "mod_view_serializable": mod_view,
            "state_change": view_state,
            "orig_equivalent_orders": orig_eq,
            "mod_equivalent_orders": mod_eq
        },
        "explanation": explanation
    }
