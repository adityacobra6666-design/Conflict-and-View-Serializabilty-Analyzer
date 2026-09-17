from typing import List, Dict, Any
from dataclasses import dataclass, asdict
from app.algorithms.parser import Operation

@dataclass
class Conflict:
    op1_id: int
    op1_raw: str
    op1_tx: str
    op1_type: str

    op2_id: int
    op2_raw: str
    op2_tx: str
    op2_type: str

    data_item: str
    conflict_type: str  # 'READ-WRITE', 'WRITE-READ', 'WRITE-WRITE'
    from_tx: str        # op1_tx
    to_tx: str          # op2_tx
    description: str

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


def find_conflicts(operations: List[Operation]) -> List[Conflict]:
    """
    Find all conflicting operation pairs in the schedule.
    For two operations op1 at position i and op2 at position j (i < j):
    They conflict iff op1.tx != op2.tx AND op1.item == op2.item AND (op1.type == 'WRITE' or op2.type == 'WRITE').
    """
    conflicts: List[Conflict] = []
    n = len(operations)

    for i in range(n):
        op1 = operations[i]
        for j in range(i + 1, n):
            op2 = operations[j]

            # Condition 1: Different transactions
            if op1.transaction == op2.transaction:
                continue

            # Condition 2: Same data item
            if op1.data_item != op2.data_item:
                continue

            # Condition 3: At least one WRITE
            if op1.type == 'READ' and op2.type == 'READ':
                continue  # READ-READ is not a conflict

            # Determine conflict type
            if op1.type == 'READ' and op2.type == 'WRITE':
                c_type = 'READ-WRITE'
            elif op1.type == 'WRITE' and op2.type == 'READ':
                c_type = 'WRITE-READ'
            else:  # WRITE-WRITE
                c_type = 'WRITE-WRITE'

            desc = (
                f"{op1.transaction}'s {op1.type} on {op1.data_item} (op #{op1.id}) precedes "
                f"{op2.transaction}'s {op2.type} on {op2.data_item} (op #{op2.id}), creating dependency {op1.transaction} → {op2.transaction}."
            )

            conflicts.append(
                Conflict(
                    op1_id=op1.id,
                    op1_raw=op1.raw_text,
                    op1_tx=op1.transaction,
                    op1_type=op1.type,
                    op2_id=op2.id,
                    op2_raw=op2.raw_text,
                    op2_tx=op2.transaction,
                    op2_type=op2.type,
                    data_item=op1.data_item,
                    conflict_type=c_type,
                    from_tx=op1.transaction,
                    to_tx=op2.transaction,
                    description=desc,
                )
            )

    return conflicts
