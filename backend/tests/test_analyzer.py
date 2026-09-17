from app.algorithms.analyzer import analyze_schedule

def test_case_a_conflict_yes_view_yes():
    # S = R1(X), W1(X), R2(X), W2(X)
    text = "R1(X), W1(X), R2(X), W2(X)"
    res = analyze_schedule(text)

    assert res["success"] is True
    assert res["conflict_serializable"] is True
    assert res["view_serializable"] is True
    assert res["has_cycle"] is False
    assert res["combined_result"]["state_code"] == "BOTH_SERIALIZABLE"
    assert len(res["topological_orders"]) >= 1


def test_case_b_blind_write_conflict_no_view_yes():
    # S = R1(X), W2(X), W1(X), W3(X)
    # Conflicts:
    # R1(X) vs W2(X) -> T1 -> T2
    # R1(X) vs W1(X) (same tx)
    # R1(X) vs W3(X) -> T1 -> T3
    # W2(X) vs W1(X) -> T2 -> T1  (Cycle T1 <-> T2!)
    # W2(X) vs W3(X) -> T2 -> T3
    # W1(X) vs W3(X) -> T1 -> T3
    # Graph has cycle T1 -> T2 -> T1 -> Conflict Serializable = NO
    # Candidate serial order T1 -> T2 -> T3:
    # T1: R1(X), W1(X); T2: W2(X); T3: W3(X)
    # Initial read X: in S, R1(X) is first op -> reads initial. In T1->T2->T3, R1(X) runs first -> reads initial. Match!
    # Reads-from: No reads from writes in S. No reads from writes in T1->T2->T3. Match!
    # Final write X: in S, last write is W3(X) (T3). In T1->T2->T3, last write is W3(X) (T3). Match!
    # Therefore T1 -> T2 -> T3 is VIEW EQUIVALENT! -> View Serializable = YES!
    text = "R1(X), W2(X), W1(X), W3(X)"
    res = analyze_schedule(text)

    assert res["success"] is True
    assert res["conflict_serializable"] is False
    assert res["view_serializable"] is True
    assert res["has_cycle"] is True
    assert res["combined_result"]["state_code"] == "VIEW_ONLY_SERIALIZABLE"
    assert res["combined_result"]["is_special_case"] is True
    assert "T1 → T2 → T3" in res["view_analysis"]["equivalent_orders"]


def test_case_c_conflict_no_view_no():
    # S = R1(X), W2(X), W1(Y), W2(Y), R1(Y), W2(X)
    # T1 -> T2 on X, T2 -> T1 on Y
    text = "R1(X), W2(X), W1(Y), R2(Y), W1(X)"
    res = analyze_schedule(text)

    assert res["success"] is True
    assert res["conflict_serializable"] is False
    assert res["has_cycle"] is True


def test_case_d_independent_transactions():
    # S = R1(X), W1(X), R2(Y), W2(Y)
    text = "R1(X), W1(X), R2(Y), W2(Y)"
    res = analyze_schedule(text)

    assert res["success"] is True
    assert res["conflict_serializable"] is True
    assert res["view_serializable"] is True
    # Two independent transactions allow both T1->T2 and T2->T1
    assert len(res["topological_orders"]) == 2


def test_case_f_three_transaction_cycle():
    # S = R1(X), W2(X), R2(Y), W3(Y), R3(Z), W1(Z)
    # T1 -> T2 -> T3 -> T1
    text = "R1(X), W2(X), R2(Y), W3(Y), R3(Z), W1(Z)"
    res = analyze_schedule(text)

    assert res["success"] is True
    assert res["conflict_serializable"] is False
    assert res["has_cycle"] is True
    assert len(res["cycles"]) >= 1
