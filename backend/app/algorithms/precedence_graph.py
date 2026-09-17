from typing import List, Dict, Any, Set, Tuple
from app.algorithms.parser import Operation
from app.algorithms.conflict import Conflict

def build_precedence_graph(operations: List[Operation], conflicts: List[Conflict]) -> Dict[str, Any]:
    """
    Build precedence graph G = (V, E) from transactions and conflicts.
    Returns Cytoscape.js compatible nodes and edges structure.
    """
    # Extract unique transactions in order of appearance
    nodes_set = []
    seen = set()
    for op in operations:
        if op.transaction not in seen:
            seen.add(op.transaction)
            nodes_set.append(op.transaction)

    nodes = [{"data": {"id": tx, "label": tx}} for tx in nodes_set]

    # Map directed edges (from_tx, to_tx) to conflict lists
    edge_map: Dict[Tuple[str, str], List[Conflict]] = {}
    for c in conflicts:
        key = (c.from_tx, c.to_tx)
        if key not in edge_map:
            edge_map[key] = []
        edge_map[key].append(c)

    edges = []
    for (from_tx, to_tx), c_list in edge_map.items():
        conflict_types = sorted(list(set(c.conflict_type for c in c_list)))
        items = sorted(list(set(c.data_item for c in c_list)))

        edge_label = f"{', '.join(conflict_types)} ({', '.join(items)})"
        edge_id = f"e_{from_tx}_{to_tx}"

        edges.append({
            "data": {
                "id": edge_id,
                "source": from_tx,
                "target": to_tx,
                "label": edge_label,
                "conflict_types": conflict_types,
                "data_items": items,
                "conflicts": [c.to_dict() for c in c_list],
                "explanation": (
                    f"Precedence edge {from_tx} → {to_tx} exists because of {len(c_list)} conflict(s): "
                    + "; ".join(f"{c.op1_raw} vs {c.op2_raw} ({c.conflict_type})" for c in c_list)
                )
            }
        })

    return {
        "nodes": nodes,
        "edges": edges,
        "transaction_list": nodes_set,
        "edge_count": len(edges),
        "node_count": len(nodes)
    }
