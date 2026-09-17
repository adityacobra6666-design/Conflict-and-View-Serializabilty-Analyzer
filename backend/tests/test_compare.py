import pytest
from app.algorithms.analyzer import analyze_schedule
from app.algorithms.comparison import compare_analysis_results


def test_compare_no_changes():
    orig_text = "R1(X), W1(X), R2(X), W2(X)"
    orig_res = analyze_schedule(orig_text)
    mod_res = analyze_schedule(orig_text)

    diff = compare_analysis_results(orig_res, mod_res)

    assert diff["modified_op_count"] == 0
    assert diff["graph_diff"]["added_count"] == 0
    assert diff["graph_diff"]["removed_count"] == 0
    assert diff["conflict_diff"]["state_change"] == "UNCHANGED"
    assert diff["view_diff"]["state_change"] == "UNCHANGED"


def test_compare_item_change_conflict_degraded():
    orig_text = "R1(X), W1(X), R2(Y), W2(Y)"  # Independent transactions: Conflict YES
    mod_text = "R1(X), W2(X), W1(X)"           # Cycle T1 <-> T2: Conflict NO

    orig_res = analyze_schedule(orig_text)
    mod_res = analyze_schedule(mod_text)

    diff = compare_analysis_results(orig_res, mod_res)

    assert diff["modified_op_count"] > 0
    assert diff["conflict_diff"]["orig_conflict_serializable"] is True
    assert diff["conflict_diff"]["mod_conflict_serializable"] is False
    assert diff["conflict_diff"]["state_change"] == "DEGRADED"
    assert diff["cycle_diff"]["state_change"] == "APPEARED"
    assert "Conflict Serializability Impact" in diff["explanation"]


def test_compare_conflict_improved():
    orig_text = "R1(X), W2(X), W1(X)"           # Conflict NO
    mod_text = "R1(X), W1(X), R2(X), W2(X)"  # Conflict YES

    orig_res = analyze_schedule(orig_text)
    mod_res = analyze_schedule(mod_text)

    diff = compare_analysis_results(orig_res, mod_res)

    assert diff["conflict_diff"]["orig_conflict_serializable"] is False
    assert diff["conflict_diff"]["mod_conflict_serializable"] is True
    assert diff["conflict_diff"]["state_change"] == "IMPROVED"
    assert diff["cycle_diff"]["state_change"] == "DISAPPEARED"


def test_compare_graph_edges_added_and_removed():
    orig_text = "R1(X), W2(X)"  # Edge T1 -> T2
    mod_text = "R2(Y), W1(Y)"   # Edge T2 -> T1

    orig_res = analyze_schedule(orig_text)
    mod_res = analyze_schedule(mod_text)

    diff = compare_analysis_results(orig_res, mod_res)

    assert diff["graph_diff"]["added_count"] == 1
    assert diff["graph_diff"]["removed_count"] == 1
    assert diff["graph_diff"]["added"][0]["source"] == "T2"
    assert diff["graph_diff"]["added"][0]["target"] == "T1"
    assert diff["graph_diff"]["removed"][0]["source"] == "T1"
    assert diff["graph_diff"]["removed"][0]["target"] == "T2"


def test_baseline_immutability():
    orig_text = "R1(X), W2(X)"
    orig_res = analyze_schedule(orig_text)
    orig_res_copy = dict(orig_res)

    mod_text = "R1(X), W2(X), W1(X), W3(X)"
    mod_res = analyze_schedule(mod_text)

    _ = compare_analysis_results(orig_res, mod_res)

    # Baseline res object must not be mutated
    assert orig_res == orig_res_copy
