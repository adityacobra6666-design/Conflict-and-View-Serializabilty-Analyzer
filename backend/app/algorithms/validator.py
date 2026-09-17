from typing import List, Dict, Any, Tuple
from app.algorithms.parser import Operation

def validate_schedule(operations: List[Operation]) -> Tuple[bool, List[str], List[str]]:
    """
    Validate a list of Operation objects.
    Returns (is_valid, errors, warnings).
    """
    errors: List[str] = []
    warnings: List[str] = []

    if not operations:
        return False, ["Schedule must contain at least one valid READ or WRITE operation."], []

    transactions = set()
    data_items = set()

    for idx, op in enumerate(operations):
        if not op.transaction or not op.transaction.startswith('T'):
            errors.append(f"Operation #{idx+1} ({op.raw_text}) has an invalid transaction identifier.")
        else:
            transactions.add(op.transaction)

        if op.type not in ('READ', 'WRITE'):
            errors.append(f"Operation #{idx+1} ({op.raw_text}) has invalid type '{op.type}'. Must be READ or WRITE.")

        if not op.data_item or not op.data_item.isalnum():
            errors.append(f"Operation #{idx+1} ({op.raw_text}) has an invalid data item identifier.")
        else:
            data_items.add(op.data_item)

    if len(transactions) < 1:
        errors.append("Schedule must contain operations from at least one transaction.")

    if len(transactions) > 7:
        warnings.append(f"Schedule contains {len(transactions)} transactions. Exhaustive view serializability analysis has O(N!) complexity and may take slightly longer.")

    is_valid = len(errors) == 0
    return is_valid, errors, warnings
