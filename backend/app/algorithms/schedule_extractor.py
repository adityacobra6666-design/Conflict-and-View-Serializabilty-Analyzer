import re
from typing import Dict, Any, List, Tuple
from app.algorithms.parser import parse_schedule_text
from app.algorithms.validator import validate_schedule

SUBSCRIPT_MAP = {
    '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4',
    '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9'
}

def normalize_text_notation(text: str) -> str:
    """Normalize subscript digits, unicode characters, and common OCR artifacts."""
    for sub, digit in SUBSCRIPT_MAP.items():
        text = text.replace(sub, digit)
    # Replace non-standard parens and brackets
    text = text.replace('（', '(').replace('）', ')')
    text = text.replace('［', '[').replace('］', ']')
    text = text.replace('｛', '{').replace('｝', '}')
    text = text.replace('’', "'").replace('“', '"').replace('”', '"')
    text = text.replace('—', '-').replace('–', '-')
    return text

def parse_schedule_from_text(text: str) -> Dict[str, Any]:
    """
    Intelligently extracts DBMS transaction schedule operations from freeform text,
    OCR output, or tabular schedules.
    Preserves exact chronological order of operations and handles variations.
    Validates extracted schedule against application rules.
    """
    cleaned = normalize_text_notation(text or "")
    candidate_schedules: List[Dict[str, Any]] = []
    seen_schedules = set()

    def add_candidate(label: str, ops: List[str]):
        if not ops:
            return
        sched_text = ", ".join(ops)
        if sched_text not in seen_schedules:
            seen_schedules.add(sched_text)
            candidate_schedules.append({
                "label": label,
                "schedule_text": sched_text,
                "operation_count": len(ops)
            })

    # 1. Check for labeled schedules: e.g. "S1 = ...", "S2: ...", "Schedule 1:"
    labeled_pattern = re.compile(
        r'(?:Schedule\s*([0-9A-Za-z]+)|S([0-9]+))\s*[:=]\s*([^\n\r;]+)',
        re.IGNORECASE
    )
    for match in labeled_pattern.finditer(cleaned):
        label_val = match.group(1) or match.group(2) or "S"
        content = match.group(3)
        ops = extract_operations_sequence(content)
        if len(ops) >= 1:
            add_candidate(f"Schedule {label_val.upper()}", ops)

    # 2. Check for Table format: Time/Step rows or T1 | T2 columns
    table_ops = extract_table_schedule(cleaned)
    if len(table_ops) >= 2:
        add_candidate("Tabular Schedule", table_ops)

    # 3. Global operation extractor across entire document
    all_ops = extract_operations_sequence(cleaned)
    if len(all_ops) >= 1:
        add_candidate("Full Extracted Schedule", all_ops)

    # Pick primary candidate: prefer first candidate with largest operation count or first labeled
    primary_schedule = ""
    if candidate_schedules:
        primary_schedule = candidate_schedules[0]["schedule_text"]
    
    # Identify uncertain / incomplete tokens:
    uncertain_parts: List[str] = []
    # 1. Operations missing transaction identifier: R(X) or W(X) not preceded by T<num> or digit
    for m in re.finditer(r'\b([RW])\s*[\(\[]\s*([A-Za-z0-9_]+)\s*[\)\]]', cleaned, re.IGNORECASE):
        prefix = cleaned[max(0, m.start() - 12):m.start()].strip()
        if not re.search(r'T\d+\s*[:.\-]?\s*$', prefix, re.IGNORECASE) and not re.search(r'[0-9]$', prefix):
            uncertain_parts.append(f"Incomplete operation '{m.group(0).strip()}' (missing transaction ID)")

    # 2. Incomplete tokens like R1 or W2 without parentheses/data item
    for m in re.finditer(r'\b([RW]\d+)(?!\s*[\(\[])\b', cleaned, re.IGNORECASE):
        token = m.group(1).upper()
        if not re.search(r'(?:STEP|ROW|COL|COLUMN|PAGE)\s*' + token, cleaned, re.IGNORECASE):
            uncertain_parts.append(f"Incomplete operation '{token}' (missing data item)")

    # Deduplicate uncertain parts
    uncertain_parts = list(dict.fromkeys(uncertain_parts))

    # Validate the primary schedule using existing analyzer validation rules
    if primary_schedule:
        parsed_ops, parse_errors = parse_schedule_text(primary_schedule)
        is_valid, val_errors, val_warnings = validate_schedule(parsed_ops)
        all_errors = parse_errors + val_errors
    else:
        is_valid = False
        all_errors = ["No recognizable transaction operations found. Please verify the uploaded question or enter operations manually."]
        val_warnings = []

    return {
        "raw_text": text.strip() if text else "",
        "parsed_schedule": primary_schedule,
        "candidate_schedules": candidate_schedules,
        "operation_count": len(primary_schedule.split(', ')) if primary_schedule else 0,
        "uncertain_parts": uncertain_parts,
        "is_valid": is_valid,
        "validation_errors": all_errors,
        "validation_warnings": val_warnings
    }

def extract_operations_sequence(text: str) -> List[str]:
    """
    Extracts ordered list of operations:
    Matches:
      - R1(X), W2(Y), r1(x), w2(y), R1[X], W2[X], R_1(X), R 1 ( X )
      - T1: R(X), T2: W(Y), T1: READ(X), T1: WRITE(Y)
    """
    operations: List[str] = []

    # Pattern A: Standard R1(X), W1(X), r1(x), R1[X], R 1 ( X )
    pattern_standard = re.compile(
        r'\b([rRwW])\s*[-_]?\s*([0-9]+)\s*[\(\[]\s*([A-Za-z0-9_]+)\s*[\)\]]',
        re.IGNORECASE
    )
    
    # Pattern B: T1: R(X) or T1: W(X) or T1: READ(X) or T1: WRITE(X)
    pattern_colon = re.compile(
        r'\bT([0-9]+)\s*[:.\-]?\s*([rRwW]|READ|WRITE)\s*[\(\[]\s*([A-Za-z0-9_]+)\s*[\)\]]',
        re.IGNORECASE
    )

    # Combined scanning by position in text to preserve chronological order
    matches: List[Tuple[int, str]] = []

    for m in pattern_standard.finditer(text):
        op_type = m.group(1).upper()
        tx = m.group(2)
        item = m.group(3).upper()
        formatted = f"{op_type}{tx}({item})"
        matches.append((m.start(), formatted))

    for m in pattern_colon.finditer(text):
        tx = m.group(1)
        raw_op = m.group(2).upper()
        op_type = 'R' if raw_op.startswith('R') else 'W'
        item = m.group(3).upper()
        formatted = f"{op_type}{tx}({item})"
        matches.append((m.start(), formatted))

    # Sort in exact order of appearance in the text
    matches.sort(key=lambda x: x[0])
    
    # Deduplicate overlapping matches at same start pos
    seen_pos = set()
    for pos, op_str in matches:
        if pos not in seen_pos:
            seen_pos.add(pos)
            operations.append(op_str)

    return operations

def extract_table_schedule(text: str) -> List[str]:
    """
    Parses schedules presented in column-based table format:
    e.g.
    T1      T2      T3
    R(X)
            W(X)
                    W(Y)
    """
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    if not lines:
        return []

    # Check if a header line defines transaction columns: e.g. "T1 | T2 | T3" or "Time  T1  T2"
    tx_header_match = None
    header_idx = -1

    for idx, line in enumerate(lines[:6]):
        tx_matches = list(re.finditer(r'\bT([0-9]+)\b', line, re.IGNORECASE))
        if len(tx_matches) >= 2:
            tx_header_match = [(m.start(), f"T{m.group(1)}") for m in tx_matches]
            header_idx = idx
            break

    if not tx_header_match or header_idx == -1:
        return []

    operations: List[str] = []

    # For subsequent rows, find operation and assign to closest column
    for line in lines[header_idx + 1:]:
        # Find R(X) or W(X) or [X]
        for m in re.finditer(r'([rRwW]|READ|WRITE)\s*[\(\[]\s*([A-Za-z0-9_]+)\s*[\)\]]', line, re.IGNORECASE):
            op_pos = m.start()
            raw_op = m.group(1).upper()
            op_type = 'R' if raw_op.startswith('R') else 'W'
            item = m.group(2).upper()

            # Find closest transaction header column by horizontal position
            closest_tx = min(tx_header_match, key=lambda x: abs(x[0] - op_pos))[1]
            tx_num = closest_tx.replace("T", "")
            operations.append(f"{op_type}{tx_num}({item})")

    return operations
