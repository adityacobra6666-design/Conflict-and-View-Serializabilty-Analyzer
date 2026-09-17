from app.algorithms.parser import parse_schedule_text
from app.algorithms.conflict import find_conflicts

def test_find_conflicts_rw_wr_ww():
    # S = R1(X), W2(X), W1(X)
    # R1(X) vs W2(X) -> RW conflict (T1 -> T2)
    # W2(X) vs W1(X) -> WW conflict (T2 -> T1)
    text = "R1(X), W2(X), W1(X)"
    ops, _ = parse_schedule_text(text)
    conflicts = find_conflicts(ops)

    assert len(conflicts) == 2

    c1 = conflicts[0]
    assert c1.from_tx == "T1"
    assert c1.to_tx == "T2"
    assert c1.conflict_type == "READ-WRITE"

    c2 = conflicts[1]
    assert c2.from_tx == "T2"
    assert c2.to_tx == "T1"
    assert c2.conflict_type == "WRITE-WRITE"


def test_no_rr_conflict():
    # R1(X), R2(X) should NOT conflict
    text = "R1(X), R2(X)"
    ops, _ = parse_schedule_text(text)
    conflicts = find_conflicts(ops)
    assert len(conflicts) == 0
