from typing import List, Dict, Set, Any

def canonicalize_cycle(cycle: List[str]) -> List[str]:
    """
    Canonicalize a cycle [v0, v1, ..., vk, v0] by rotating [v0, ..., vk]
    so that the lexicographically smallest node appears first.
    """
    if len(cycle) <= 1 or cycle[0] != cycle[-1]:
        return cycle
    nodes = cycle[:-1]
    min_idx = min(range(len(nodes)), key=lambda i: nodes[i])
    rotated = nodes[min_idx:] + nodes[:min_idx]
    return rotated + [rotated[0]]


def detect_cycles(transactions: List[str], edges: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Detect cycles in the precedence graph using DFS back-edge searching.
    Returns has_cycle boolean and list of cycle paths.
    """
    adj: Dict[str, List[str]] = {tx: [] for tx in transactions}
    for e in edges:
        src = e["data"]["source"]
        tgt = e["data"]["target"]
        if src in adj and tgt in adj:
            adj[src].append(tgt)

    cycles: List[List[str]] = []
    visited: Dict[str, int] = {tx: 0 for tx in transactions}  # 0: unvisited, 1: visiting, 2: visited
    parent_path: List[str] = []

    def dfs(node: str):
        visited[node] = 1
        parent_path.append(node)

        for neighbor in adj[node]:
            if visited[neighbor] == 1:
                # Cycle detected! Extract cycle path from neighbor to end of parent_path + neighbor
                idx = parent_path.index(neighbor)
                raw_cycle = parent_path[idx:] + [neighbor]
                cycle = canonicalize_cycle(raw_cycle)
                # Avoid duplicate identical cycles
                if cycle not in cycles:
                    cycles.append(cycle)
            elif visited[neighbor] == 0:
                dfs(neighbor)

        parent_path.pop()
        visited[node] = 2

    for tx in transactions:
        if visited[tx] == 0:
            dfs(tx)

    has_cycle = len(cycles) > 0
    return {
        "has_cycle": has_cycle,
        "cycles": cycles,
        "formatted_cycles": [" → ".join(c) for c in cycles]
    }
