import pytest
from app.algorithms.analyzer import analyze_schedule
from app.algorithms.parser import parse_schedule_text
from app.algorithms.conflict import find_conflicts
from app.algorithms.precedence_graph import build_precedence_graph
from app.algorithms.cycle_detection import detect_cycles, canonicalize_cycle
from app.algorithms.topological_sort import find_all_topological_sorts
from app.algorithms.view import compute_initial_reads, compute_reads_from, compute_final_writes, analyze_view_serializability


def test_edge_case_multiple_initial_reads_different_transactions():
    """
    S = R1(X), R2(X)
    Both T1 and T2 read the initial value of X before any writes.
    Both candidate serial orders T1 -> T2 and T2 -> T1 must be view equivalent!
    """
    text = "R1(X), R2(X)"
    res = analyze_schedule(text)

    assert res["success"] is True
    assert res["conflict_serializable"] is True
    assert res["view_serializable"] is True

    # Check initial reads
    init_reads = res["view_analysis"]["initial_reads"]
    txs_initial = set(ir["transaction"] for ir in init_reads if ir["data_item"] == "X")
    assert txs_initial == {"T1", "T2"}

    # Both permutations must be present in equivalent_orders
    eq_orders = res["view_analysis"]["equivalent_orders"]
    assert "T1 → T2" in eq_orders
    assert "T2 → T1" in eq_orders


def test_edge_case_multiple_initial_reads_same_transaction():
    """
    S = R1(X), R1(X), W2(X)
    T1 reads initial X twice before W2(X).
    """
    text = "R1(X), R1(X), W2(X)"
    ops, _ = parse_schedule_text(text)
    
    init_reads = compute_initial_reads(ops)
    assert len(init_reads) == 1
    assert init_reads[0].transaction == "T1"
    assert init_reads[0].data_item == "X"

    reads_from = compute_reads_from(ops)
    assert len(reads_from) == 2
    for rf in reads_from:
        assert rf.reader_tx == "T1"
        assert rf.writer_tx is None


def test_edge_case_initial_read_and_writer_read_signature_sorting():
    """
    S = R1(X), W2(Y), R1(Y)
    R1(X) reads initial value (writer_tx = None).
    R1(Y) reads value written by T2 (writer_tx = 'T2').
    Tests that signature sorting does not crash with TypeError (None vs str).
    """
    text = "R1(X), W2(Y), R1(Y)"
    res = analyze_schedule(text)

    assert res["success"] is True
    reads_from = res["view_analysis"]["reads_from"]
    assert len(reads_from) == 2
    
    rf_x = [rf for rf in reads_from if rf["data_item"] == "X"][0]
    assert rf_x["writer_tx"] is None

    rf_y = [rf for rf in reads_from if rf["data_item"] == "Y"][0]
    assert rf_y["writer_tx"] == "T2"


def test_edge_case_blind_writes_three_transactions():
    """
    S = W1(X), W2(X), W3(X)
    All 3 transactions perform blind writes on X.
    Conflict serializable: YES (T1 -> T2 -> T3)
    View serializable: YES
    Final write: T3 on X.
    """
    text = "W1(X), W2(X), W3(X)"
    res = analyze_schedule(text)

    assert res["success"] is True
    assert res["conflict_serializable"] is True
    assert res["view_serializable"] is True

    fw = res["view_analysis"]["final_writes"]
    assert len(fw) == 1
    assert fw[0]["data_item"] == "X"
    assert fw[0]["transaction"] == "T3"


def test_edge_case_blind_writes_view_only_serializable():
    """
    S = R1(X), W2(X), W1(X), W3(X)
    Conflicts:
    - R1(X) vs W2(X) => T1 -> T2
    - W2(X) vs W1(X) => T2 -> T1  (Cycle T1 <-> T2)
    - W2(X) vs W3(X) => T2 -> T3
    - W1(X) vs W3(X) => T1 -> T3
    Conflict Serializable: NO
    View Serializable: YES (T1 -> T2 -> T3 is equivalent)
    """
    text = "R1(X), W2(X), W1(X), W3(X)"
    res = analyze_schedule(text)

    assert res["success"] is True
    assert res["conflict_serializable"] is False
    assert res["view_serializable"] is True
    assert res["combined_result"]["state_code"] == "VIEW_ONLY_SERIALIZABLE"
    assert "T1 → T2 → T3" in res["view_analysis"]["equivalent_orders"]


def test_edge_case_multiple_writes_overwrites_neither_serializable():
    """
    S = R1(X), W2(X), W1(X), W2(Y), W1(Y)
    T1 reads initial X.
    Both T1 and T2 overwrite X and Y.
    In T1 -> T2, T2 performs final writes (violating final write).
    In T2 -> T1, W2(X) precedes R1(X) (violating initial read).
    Therefore, no serial order is view equivalent => Neither conflict nor view serializable!
    """
    text = "R1(X), W2(X), W1(X), W2(Y), W1(Y)"
    res = analyze_schedule(text)

    assert res["success"] is True
    assert res["conflict_serializable"] is False
    assert res["view_serializable"] is False
    assert res["combined_result"]["state_code"] == "NEITHER_SERIALIZABLE"


def test_edge_case_repeated_data_items_multiple_transactions():
    """
    S = R1(X), W1(X), R2(X), W2(Y), R3(Y), W3(Z), R4(Z), W4(X)
    Chain of conflicts: T1 -> T2 -> T3 -> T4.
    Acyclic, both Conflict & View Serializable.
    """
    text = "R1(X), W1(X), R2(X), W2(Y), R3(Y), W3(Z), R4(Z), W4(X)"
    res = analyze_schedule(text)

    assert res["success"] is True
    assert res["conflict_serializable"] is True
    assert res["view_serializable"] is True
    assert res["topological_orders"] == [["T1", "T2", "T3", "T4"]]


def test_edge_case_canonicalize_cycle():
    """
    Tests canonicalization of cycle representations.
    Rotates cycle paths so the lexicographically smallest transaction ID comes first.
    """
    assert canonicalize_cycle(["T2", "T1", "T2"]) == ["T1", "T2", "T1"]
    assert canonicalize_cycle(["T3", "T1", "T2", "T3"]) == ["T1", "T2", "T3", "T1"]
    assert canonicalize_cycle(["T1", "T2", "T1"]) == ["T1", "T2", "T1"]


def test_edge_case_disjoint_cycles():
    """
    S = R1(X), W2(X), W1(X), R3(Y), W4(Y), W3(Y)
    Graph contains two separate 2-cycles: (T1 <-> T2) and (T3 <-> T4).
    """
    text = "R1(X), W2(X), W1(X), R3(Y), W4(Y), W3(Y)"
    res = analyze_schedule(text)

    assert res["success"] is True
    assert res["conflict_serializable"] is False
    assert res["has_cycle"] is True
    assert len(res["cycles"]) >= 2


def test_edge_case_multiple_conflicts_single_edge():
    """
    S = R1(X), W1(X), R2(X), W2(X)
    Between T1 and T2 there are 3 conflicts:
    - R1(X) vs W2(X) (READ-WRITE)
    - W1(X) vs R2(X) (WRITE-READ)
    - W1(X) vs W2(X) (WRITE-WRITE)
    Precedence graph should collapse these into 1 directed edge T1 -> T2 with 3 conflict objects.
    """
    text = "R1(X), W1(X), R2(X), W2(X)"
    res = analyze_schedule(text)

    assert res["success"] is True
    edges = res["precedence_graph"]["edges"]
    assert len(edges) == 1
    edge = edges[0]["data"]
    assert edge["source"] == "T1"
    assert edge["target"] == "T2"
    assert len(edge["conflicts"]) == 3
    assert set(edge["conflict_types"]) == {"READ-WRITE", "WRITE-READ", "WRITE-WRITE"}


def test_edge_case_three_independent_transactions_topological_sorts():
    """
    S = R1(X), W1(X), R2(Y), W2(Y), R3(Z), W3(Z)
    3 independent transactions on disjoint data items.
    Should yield 3! = 6 valid topological orders.
    """
    text = "R1(X), W1(X), R2(Y), W2(Y), R3(Z), W3(Z)"
    res = analyze_schedule(text)

    assert res["success"] is True
    assert res["conflict_serializable"] is True
    assert len(res["topological_orders"]) == 6
