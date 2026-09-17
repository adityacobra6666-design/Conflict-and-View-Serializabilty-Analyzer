import itertools
from typing import List, Dict, Any, Tuple, Set
from dataclasses import dataclass, asdict
from app.algorithms.parser import Operation

@dataclass
class InitialRead:
    data_item: str
    transaction: str
    op_id: int
    raw_text: str

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class ReadsFrom:
    read_op_id: int
    read_op_raw: str
    reader_tx: str
    data_item: str
    writer_tx: str | None  # None indicates reads initial value
    writer_op_id: int | None
    writer_op_raw: str | None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class FinalWrite:
    data_item: str
    transaction: str
    op_id: int
    raw_text: str

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


def compute_initial_reads(operations: List[Operation]) -> List[InitialRead]:
    """
    Find initial read for each data item.
    An operation Ri(X) reads initial value iff no Wk(X) precedes it.
    Every transaction Ri(X) executing before any Wk(X) reads the initial value of X.
    """
    initial_reads: List[InitialRead] = []
    seen_pairs: Set[Tuple[str, str]] = set()
    written_items: Set[str] = set()

    for op in operations:
        if op.type == 'WRITE':
            written_items.add(op.data_item)
        elif op.type == 'READ':
            if op.data_item not in written_items and (op.data_item, op.transaction) not in seen_pairs:
                seen_pairs.add((op.data_item, op.transaction))
                initial_reads.append(
                    InitialRead(
                        data_item=op.data_item,
                        transaction=op.transaction,
                        op_id=op.id,
                        raw_text=op.raw_text
                    )
                )

    return initial_reads


def compute_reads_from(operations: List[Operation]) -> List[ReadsFrom]:
    """
    Find reads-from relationship for every READ operation in the schedule.
    For each Ri(X), find latest preceding Wj(X).
    """
    reads_from_list: List[ReadsFrom] = []

    for i, op in enumerate(operations):
        if op.type == 'READ':
            writer_op = None
            # Scan backwards for latest write on same data item
            for j in range(i - 1, -1, -1):
                prev_op = operations[j]
                if prev_op.data_item == op.data_item and prev_op.type == 'WRITE':
                    writer_op = prev_op
                    break

            if writer_op:
                reads_from_list.append(
                    ReadsFrom(
                        read_op_id=op.id,
                        read_op_raw=op.raw_text,
                        reader_tx=op.transaction,
                        data_item=op.data_item,
                        writer_tx=writer_op.transaction,
                        writer_op_id=writer_op.id,
                        writer_op_raw=writer_op.raw_text
                    )
                )
            else:
                reads_from_list.append(
                    ReadsFrom(
                        read_op_id=op.id,
                        read_op_raw=op.raw_text,
                        reader_tx=op.transaction,
                        data_item=op.data_item,
                        writer_tx=None,
                        writer_op_id=None,
                        writer_op_raw=None
                    )
                )

    return reads_from_list


def compute_final_writes(operations: List[Operation]) -> List[FinalWrite]:
    """
    Find the final write operation for each data item written in the schedule.
    """
    final_writes_map: Dict[str, Operation] = {}

    for op in operations:
        if op.type == 'WRITE':
            final_writes_map[op.data_item] = op

    final_writes: List[FinalWrite] = []
    for item in sorted(final_writes_map.keys()):
        op = final_writes_map[item]
        final_writes.append(
            FinalWrite(
                data_item=item,
                transaction=op.transaction,
                op_id=op.id,
                raw_text=op.raw_text
            )
        )

    return final_writes


def construct_serial_schedule(operations: List[Operation], tx_order: List[str]) -> List[Operation]:
    """
    Construct a serial schedule for a candidate transaction order.
    Groups operations by transaction in the specified order, re-indexing positions.
    """
    tx_ops_map: Dict[str, List[Operation]] = {tx: [] for tx in tx_order}
    for op in operations:
        if op.transaction in tx_ops_map:
            tx_ops_map[op.transaction].append(op)

    serial_ops: List[Operation] = []
    pos = 1
    for tx in tx_order:
        for op in tx_ops_map[tx]:
            serial_ops.append(
                Operation(
                    id=pos,
                    transaction=op.transaction,
                    type=op.type,
                    data_item=op.data_item,
                    raw_text=f"{op.type[0]}{op.transaction[1:]}({op.data_item})"
                )
            )
            pos += 1

    return serial_ops


def analyze_view_serializability(operations: List[Operation], transactions: List[str]) -> Dict[str, Any]:
    """
    Perform exhaustive view serializability analysis.
    1. Compute initial reads, reads-from, and final writes for original schedule.
    2. For each candidate transaction permutation, construct serial schedule and test equivalence.
    3. Determine view_serializable boolean and return detailed breakdown.
    """
    orig_initial = compute_initial_reads(operations)
    orig_reads_from = compute_reads_from(operations)
    orig_final = compute_final_writes(operations)

    # Normalize baseline representations for fast matching
    orig_initial_sig = sorted([(ir.data_item, ir.transaction) for ir in orig_initial])
    orig_reads_from_sig = sorted([(rf.data_item, rf.reader_tx, rf.writer_tx or "INITIAL") for rf in orig_reads_from])
    orig_final_sig = sorted([(fw.data_item, fw.transaction) for fw in orig_final])

    candidate_permutations = list(itertools.permutations(transactions))
    candidate_results = []
    equivalent_orders = []

    for perm in candidate_permutations:
        tx_order = list(perm)
        serial_ops = construct_serial_schedule(operations, tx_order)

        ser_initial = compute_initial_reads(serial_ops)
        ser_reads_from = compute_reads_from(serial_ops)
        ser_final = compute_final_writes(serial_ops)

        ser_initial_sig = sorted([(ir.data_item, ir.transaction) for ir in ser_initial])
        ser_reads_from_sig = sorted([(rf.data_item, rf.reader_tx, rf.writer_tx or "INITIAL") for rf in ser_reads_from])
        ser_final_sig = sorted([(fw.data_item, fw.transaction) for fw in ser_final])

        match_initial = (orig_initial_sig == ser_initial_sig)
        match_reads_from = (orig_reads_from_sig == ser_reads_from_sig)
        match_final = (orig_final_sig == ser_final_sig)

        is_equivalent = match_initial and match_reads_from and match_final
        formatted_order = " → ".join(tx_order)

        if is_equivalent:
            equivalent_orders.append(formatted_order)

        candidate_results.append({
            "order": tx_order,
            "formatted_order": formatted_order,
            "is_equivalent": is_equivalent,
            "match_initial_reads": match_initial,
            "match_reads_from": match_reads_from,
            "match_final_writes": match_final,
            "serial_operations": [op.to_dict() for op in serial_ops]
        })

    view_serializable = len(equivalent_orders) > 0

    return {
        "view_serializable": view_serializable,
        "initial_reads": [ir.to_dict() for ir in orig_initial],
        "reads_from": [rf.to_dict() for rf in orig_reads_from],
        "final_writes": [fw.to_dict() for fw in orig_final],
        "equivalent_orders": equivalent_orders,
        "candidate_orders_count": len(candidate_permutations),
        "candidate_results": candidate_results
    }
