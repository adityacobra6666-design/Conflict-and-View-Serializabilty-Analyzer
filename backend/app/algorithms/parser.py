import re
from typing import List, Dict, Any, Tuple
from dataclasses import dataclass, asdict

@dataclass
class Operation:
    id: int
    transaction: str
    type: str  # 'READ' or 'WRITE'
    data_item: str
    raw_text: str

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


def parse_operation_token(token: str, position: int) -> Tuple[Operation | None, str | None]:
    """
    Parse a single operation string token into an Operation object.
    Supports formats:
    - R1(X), W2(Y), r1[x], w2[y]
    - T1: R(X), T2: W(Y)
    - T1: READ(X), T2: WRITE(Y)
    """
    token_clean = token.strip()
    if not token_clean:
        return None, None

    # Ignore Commit/Abort tokens like C1, C2, A1
    if re.match(r'^[cCmAa]\d+$', token_clean):
        return None, None

    # Pattern 1: T1: R(X) or T1: READ(X) or T1: WRITE(Y)
    m1 = re.match(r'^T?(\d+)\s*:\s*([rR]|[wW]|READ|WRITE)\s*[\(\[]([a-zA-Z0-9_]+)[\)\]]$', token_clean, re.IGNORECASE)
    if m1:
        tx_num, op_type_str, item = m1.groups()
        op_type = 'READ' if op_type_str.upper().startswith('R') else 'WRITE'
        tx_id = f"T{tx_num}"
        item_id = item.upper()
        return Operation(
            id=position,
            transaction=tx_id,
            type=op_type,
            data_item=item_id,
            raw_text=f"{op_type[0]}{tx_num}({item_id})"
        ), None

    # Pattern 2: R1(X), W2(Y), r1[x], w2[y]
    m2 = re.match(r'^([rR]|[wW])(\d+)\s*[\(\[]([a-zA-Z0-9_]+)[\)\]]$', token_clean, re.IGNORECASE)
    if m2:
        op_type_str, tx_num, item = m2.groups()
        op_type = 'READ' if op_type_str.upper() == 'R' else 'WRITE'
        tx_id = f"T{tx_num}"
        item_id = item.upper()
        return Operation(
            id=position,
            transaction=tx_id,
            type=op_type,
            data_item=item_id,
            raw_text=f"{op_type[0]}{tx_num}({item_id})"
        ), None

    return None, f"Unrecognized operation format: '{token_clean}'. Expected forms like R1(X), W2(Y), or T1:R(X)."


def parse_schedule_text(schedule_text: str) -> Tuple[List[Operation], List[str]]:
    """
    Parse a full schedule string into a list of Operations and a list of syntax errors.
    Splits by newlines, semicolons, or commas.
    """
    if not schedule_text or not schedule_text.strip():
        return [], ["Schedule text cannot be empty."]

    # Normalize delimiters: replace newlines and semicolons with commas
    normalized = re.sub(r'[\n\r;]+', ',', schedule_text)
    # Also handle tokens separated by spaces if not comma-separated
    tokens = [t.strip() for t in normalized.split(',') if t.strip()]

    operations: List[Operation] = []
    errors: List[str] = []
    position = 1

    for token in tokens:
        op, err = parse_operation_token(token, position)
        if err:
            errors.append(err)
        elif op is not None:
            operations.append(op)
            position += 1

    return operations, errors
