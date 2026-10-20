import re
from typing import Dict, Any, List, Tuple

SUBSCRIPT_MAP = {
    '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4',
    '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9'
}

def normalize_text_notation(text: str) -> str:
    """Normalize subscript digits, unicode characters, and common OCR artifacts."""
    for sub, digit in SUBSCRIPT_MAP.items():
        text = text.replace(sub, digit)
    # Replace non-standard parens
    text = text.replace('（', '(').replace('）', ')')
    text = text.replace('［', '[').replace('］', ']')
    text = text.replace('’', "'").replace('“', '"').replace('”', '"')
    return text

def parse_schedule_from_text(text: str) -> Dict[str, Any]:
    """
    Intelligently extracts DBMS transaction schedule operations from freeform text,
    OCR output, or tabular schedules.
    Preserves exact chronological order of operations and handles variations.
    """
    cleaned = normalize_text_notation(text)
    candidate_schedules: List[Dict[str, Any]] = []

    # 1. Check for labeled schedules: e.g. "S1 = ...", "S2: ...", "Schedule 1:"
    labeled_pattern = re.compile(
        r'(?:Schedule\s*([0-9A-Za-z]+)|S([0-9]+))\s*[:=]\s*([^\n\r;]+)',
        re.IGNORECASE
    )
    for match in labeled_pattern.finditer(cleaned):
        label = match.group(1) or match.group(2) or "S"
        content = match.group(3)
        ops = extract_operations_sequence(content)
        if len(ops) >= 2:
            candidate_schedules.append({
                "label": f"Schedule {label.upper()}",
                "schedule_text": ", ".join(ops),
                "operation_count": len(ops)
            })

    # 2. Check for Table format: Time/Step rows or T1 | T2 columns
    table_ops = extract_table_schedule(cleaned)
    if len(table_ops) >= 2:
        candidate_schedules.append({
            "label": "Tabular Schedule",
            "schedule_text": ", ".join(table_ops),
            "operation_count": len(table_ops)
        })

    # 3. Global operation extractor across entire document
    all_ops = extract_operations_sequence(cleaned)
    if len(all_ops) >= 1:
        candidate_schedules.append({
            "label": "Full Extracted Schedule",
            "schedule_text": ", ".join(all_ops),
            "operation_count": len(all_ops)
        })

    # Pick primary candidate
    primary_schedule = candidate_schedules[0]["schedule_text"] if candidate_schedules else ""
    
    # Identify uncertain tokens (e.g. malformed read/write like "R(X)" without tx or "W1")
    uncertain_parts = []
    malformed_matches = re.findall(r'\b[RW]\s*\([A-Za-z]\)', cleaned, re.IGNORECASE)
    for m in malformed_matches:
        uncertain_parts.append(f"Missing transaction identifier in '{m}'")

    return {
        "raw_text": text.strip(),
        "parsed_schedule": primary_schedule,
        "candidate_schedules": candidate_schedules,
        "operation_count": len(primary_schedule.split(', ')) if primary_schedule else 0,
        "uncertain_parts": uncertain_parts
    }

def extract_operations_sequence(text: str) -> List[str]:
    """
    Extracts ordered list of operations:
    Matches:
      - R1(X), W2(Y), r1(x), w2(y)
      - T1: R(X), T2: W(Y)
      - R[1](X)
    """
    operations: List[str] = []

    # Pattern A: Standard R1(X) or W1(X) or lowercase r1(x) or R_1(X)
    pattern_standard = re.compile(
        r'\b([RW])\s*_?\s*([0-9]+)\s*\(\s*([A-Za-z0-9_]+)\s*\)',
        re.IGNORECASE
    )
    
    # Pattern B: T1: R(X) or T1: W(X)
    pattern_colon = re.compile(
        r'\bT([0-9]+)\s*:\s*([RW])\s*\(\s*([A-Za-z0-9_]+)\s*\)',
        re.IGNORECASE
    )

    # Combined scanning by position in text
    matches: List[Tuple[int, str]] = []

    for m in pattern_standard.finditer(text):
        op_type = m.group(1).upper()
        tx = m.group(2)
        item = m.group(3).upper()
        formatted = f"{op_type}{tx}({item})"
        matches.append((m.start(), formatted))

    for m in pattern_colon.finditer(text):
        tx = m.group(1)
        op_type = m.group(2).upper()
        item = m.group(3).upper()
        formatted = f"{op_type}{tx}({item})"
        matches.append((m.start(), formatted))

    # Sort in order of appearance in the text
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

    for idx, line in enumerate(lines[:5]):
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
        # Find R(X) or W(X)
        for m in re.finditer(r'([RW])\s*\(\s*([A-Za-z0-9_]+)\s*\)', line, re.IGNORECASE):
            op_pos = m.start()
            op_type = m.group(1).upper()
            item = m.group(2).upper()

            # Find closest transaction header column by horizontal position
            closest_tx = min(tx_header_match, key=lambda x: abs(x[0] - op_pos))[1]
            tx_num = closest_tx.replace("T", "")
            operations.append(f"{op_type}{tx_num}({item})")

    return operations
