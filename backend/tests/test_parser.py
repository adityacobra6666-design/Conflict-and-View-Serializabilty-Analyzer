from app.algorithms.parser import parse_schedule_text, parse_operation_token

def test_parse_operation_token_standard():
    op, err = parse_operation_token("R1(X)", 1)
    assert err is None
    assert op.transaction == "T1"
    assert op.type == "READ"
    assert op.data_item == "X"

def test_parse_operation_token_colon_format():
    op, err = parse_operation_token("T2: W(Y)", 2)
    assert err is None
    assert op.transaction == "T2"
    assert op.type == "WRITE"
    assert op.data_item == "Y"

def test_parse_schedule_text_multiline():
    text = "R1(X)\nW2(X)\nR2(Y)\nW1(Y)"
    ops, errs = parse_schedule_text(text)
    assert len(errs) == 0
    assert len(ops) == 4
    assert ops[0].raw_text == "R1(X)"
    assert ops[1].raw_text == "W2(X)"

def test_parse_schedule_text_invalid_token():
    text = "R1(X), INVALID_OP, W2(Y)"
    ops, errs = parse_schedule_text(text)
    assert len(errs) == 1
    assert len(ops) == 2
