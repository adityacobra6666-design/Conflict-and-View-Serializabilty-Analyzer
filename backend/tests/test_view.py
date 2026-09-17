from app.algorithms.parser import parse_schedule_text
from app.algorithms.view import compute_initial_reads, compute_reads_from, compute_final_writes, analyze_view_serializability

def test_initial_reads_and_reads_from():
    # S = W1(X), R2(X), W2(Y), R1(Y)
    text = "W1(X), R2(X), W2(Y), R1(Y)"
    ops, _ = parse_schedule_text(text)

    initial_reads = compute_initial_reads(ops)
    # R2(X) comes after W1(X), so not initial. R1(Y) comes after W2(Y), so not initial.
    assert len(initial_reads) == 0

    reads_from = compute_reads_from(ops)
    assert len(reads_from) == 2

    # R2(X) reads from T1
    rf_x = [rf for rf in reads_from if rf.data_item == "X"][0]
    assert rf_x.reader_tx == "T2"
    assert rf_x.writer_tx == "T1"

    # R1(Y) reads from T2
    rf_y = [rf for rf in reads_from if rf.data_item == "Y"][0]
    assert rf_y.reader_tx == "T1"
    assert rf_y.writer_tx == "T2"


def test_final_writes():
    text = "W1(X), W2(X), W3(Y)"
    ops, _ = parse_schedule_text(text)

    fw = compute_final_writes(ops)
    assert len(fw) == 2

    fw_x = [f for f in fw if f.data_item == "X"][0]
    assert fw_x.transaction == "T2"

    fw_y = [f for f in fw if f.data_item == "Y"][0]
    assert fw_y.transaction == "T3"
