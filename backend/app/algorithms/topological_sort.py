from typing import List, Dict, Set, Any

def find_all_topological_sorts(transactions: List[str], edges: List[Dict[str, Any]]) -> List[List[str]]:
    """
    Find all valid topological orderings of the precedence graph using backtracking.
    Returns empty list if graph contains a cycle.
    """
    in_degree: Dict[str, int] = {tx: 0 for tx in transactions}
    adj: Dict[str, List[str]] = {tx: [] for tx in transactions}

    for e in edges:
        src = e["data"]["source"]
        tgt = e["data"]["target"]
        if src in adj and tgt in adj:
            adj[src].append(tgt)
            in_degree[tgt] += 1

    results: List[List[str]] = []

    def backtrack(current_path: List[str], visited: Set[str]):
        if len(current_path) == len(transactions):
            results.append(list(current_path))
            return

        # Find nodes with 0 in-degree that haven't been visited
        for tx in transactions:
            if tx not in visited and in_degree[tx] == 0:
                # Choose tx
                visited.add(tx)
                current_path.append(tx)

                # Decrement in-degree of neighbors
                for nbr in adj[tx]:
                    in_degree[nbr] -= 1

                backtrack(current_path, visited)

                # Backtrack
                for nbr in adj[tx]:
                    in_degree[nbr] += 1
                current_path.pop()
                visited.remove(tx)

    backtrack([], set())
    return results
