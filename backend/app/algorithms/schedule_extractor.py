import re
from typing import Dict, Any, List, Tuple, Optional
from app.algorithms.parser import parse_schedule_text
from app.algorithms.validator import validate_schedule
from app.algorithms.schedule_lexer import (
    parse_tokens_from_text,
    extract_schedule_blocks,
    clean_ocr_artifacts,
    is_explanation_line,
    SUBSCRIPT_MAP,
)


def normalize_text_notation(text: str) -> str:
    """Normalize subscript digits, unicode characters, and common OCR artifacts."""
    return clean_ocr_artifacts(text)


def parse_schedule_from_text(text: str) -> Dict[str, Any]:
    """
    Intelligently extracts DBMS transaction schedule operations from freeform text,
    OCR output, or tabular schedules with high accuracy.
    Preserves exact chronological order of operations and handles OCR variations.
    Filters out question text and notation explanations to avoid duplicate/phantom operations.
    Validates extracted schedule against application rules.
    """
    cleaned = normalize_text_notation(text or "")
    candidate_schedules: List[Dict[str, Any]] = []
    seen_schedules = set()
    collected_warnings: List[str] = []

    def add_candidate(label: str, ops: List[str], source_type: str = "inline", warnings: List[str] = None):
        if not ops:
            return
        sched_text = ", ".join(ops)
        if sched_text not in seen_schedules:
            seen_schedules.add(sched_text)
            candidate_schedules.append({
                "label": label,
                "schedule_text": sched_text,
                "operation_count": len(ops),
                "source_type": source_type,
                "warnings": warnings or []
            })

    # 1. Check for labeled schedules: e.g. "Schedule S: ...", "S1 = ...", "S2: ..."
    labeled_blocks = extract_schedule_blocks(cleaned)
    for label, content, _ in labeled_blocks:
        tokens, warns = parse_tokens_from_text(content)
        ops = [t.normalized for t in tokens]
        if ops:
            collected_warnings.extend(warns)
            add_candidate(label, ops, source_type="labeled", warnings=warns)

    # 2. Check for Table format: Time/Step rows or T1 | T2 columns
    table_ops = extract_table_schedule(cleaned)
    if len(table_ops) >= 2:
        add_candidate("Tabular Schedule", table_ops, source_type="table")

    # 3. Natural language schedule extraction
    nl_ops = extract_natural_language_schedule(cleaned)
    if len(nl_ops) >= 2:
        add_candidate("Natural Language Schedule", nl_ops, source_type="natural_language")

    # 4. Line-by-line coherent inline schedules (skipping explanation lines)
    for line in cleaned.splitlines():
        trimmed = line.strip()
        if not trimmed or is_explanation_line(trimmed):
            continue
        tokens, warns = parse_tokens_from_text(trimmed)
        ops = [t.normalized for t in tokens]
        if len(ops) >= 2:
            collected_warnings.extend(warns)
            add_candidate("Inline Schedule", ops, source_type="inline", warnings=warns)

    # 5. Global operation extractor across non-explanation lines
    all_non_expl_ops = extract_operations_sequence(cleaned)
    if len(all_non_expl_ops) >= 1:
        add_candidate("Full Extracted Schedule", all_non_expl_ops, source_type="global")

    # Pick primary candidate:
    # Priority order:
    # 1. Labeled schedule (e.g. Schedule S, Schedule 1)
    # 2. Tabular schedule
    # 3. Inline schedule with highest operation count
    # 4. Natural language schedule
    # 5. Full extracted schedule
    primary_candidate: Optional[Dict[str, Any]] = None
    if candidate_schedules:
        # Prefer labeled candidate first if available
        labeled_candidates = [c for c in candidate_schedules if c.get("source_type") == "labeled"]
        if labeled_candidates:
            primary_candidate = max(labeled_candidates, key=lambda c: c["operation_count"])
        else:
            primary_candidate = max(candidate_schedules, key=lambda c: c["operation_count"])

    primary_schedule = primary_candidate["schedule_text"] if primary_candidate else ""
    selection_reason = ""
    if primary_candidate:
        source = primary_candidate.get("source_type", "inline")
        count = primary_candidate["operation_count"]
        selection_reason = f"Selected {primary_candidate['label']} ({source}) containing {count} operations."

    # Identify uncertain / incomplete tokens:
    uncertain_parts: List[str] = []
    # If schedule is derived from a table layout (column headers T1, T2...),
    # bare operations R(A), W(A) in the text were resolved by table geometry
    is_table_schedule = bool(
        (primary_candidate and (
            primary_candidate.get("source_type") == "table" or
            "table" in primary_candidate.get("label", "").lower()
        )) or (
            re.search(r'\bT\s*1\b', cleaned, re.IGNORECASE) and
            re.search(r'\bT\s*2\b', cleaned, re.IGNORECASE)
        )
    )

    # 1. Operations missing transaction identifier: R(X) or W(X) not preceded by T<num> or digit
    if not is_table_schedule:
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

    # Validate primary schedule using existing analyzer validation rules
    if primary_schedule:
        parsed_ops, parse_errors = parse_schedule_text(primary_schedule)
        is_valid, val_errors, val_warnings = validate_schedule(parsed_ops)
        all_errors = parse_errors + val_errors
    else:
        is_valid = False
        all_errors = ["No recognizable transaction operations found. Please verify the uploaded question or enter operations manually."]
        val_warnings = []

    # Calibrate confidence score and status:
    op_count = len(primary_schedule.split(', ')) if primary_schedule else 0
    confidence_score = 0.0
    status = "ocr_error"

    if not cleaned.strip():
        status = "ocr_error"
        confidence_score = 0.0
    elif op_count == 0:
        status = "parse_error"
        confidence_score = 0.0
    else:
        # Base confidence
        if is_valid and not all_errors:
            confidence_score = 0.95
        elif is_valid:
            confidence_score = 0.85
        else:
            confidence_score = 0.50

        # Adjust for uncertain parts or OCR substitutions
        if collected_warnings:
            confidence_score = max(0.60, confidence_score - 0.10)
        if uncertain_parts:
            confidence_score = max(0.40, confidence_score - 0.25)

        # Status assignment
        if confidence_score >= 0.95 and not uncertain_parts and not collected_warnings:
            status = "exact_match"
        elif confidence_score >= 0.80 and not uncertain_parts:
            status = "high_confidence"
        else:
            status = "needs_review"

    return {
        "raw_text": text.strip() if text else "",
        "parsed_schedule": primary_schedule,
        "candidate_schedules": candidate_schedules,
        "operation_count": op_count,
        "uncertain_parts": uncertain_parts,
        "is_valid": is_valid,
        "validation_errors": all_errors,
        "validation_warnings": val_warnings,
        "confidence_score": round(confidence_score, 2),
        "status": status,
        "warnings": collected_warnings,
        "selection_reason": selection_reason,
    }


def extract_schedule_candidates(text: str) -> List[Dict[str, Any]]:
    """Extract list of candidate schedules from text."""
    res = parse_schedule_from_text(text)
    return res.get("candidate_schedules", [])


def extract_operations_sequence(text: str) -> List[str]:
    """
    Extracts ordered list of operations from text while filtering out
    explanation sentences (e.g. definitions in 'Notation: ...').
    Preserves exact chronological order.
    """
    non_expl_lines = []
    for line in text.splitlines():
        trimmed = line.strip()
        if not trimmed or is_explanation_line(trimmed):
            continue
        non_expl_lines.append(trimmed)

    non_expl_text = "\n".join(non_expl_lines)
    tokens, _ = parse_tokens_from_text(non_expl_text)
    return [t.normalized for t in tokens]


def extract_table_schedule(text: str) -> List[str]:
    """
    Parses schedules presented in column-based table format:
    e.g.
    T1      T2      T3
    R(A)
            W(X)
                    W(Y)

    Uses character position analysis to assign operations to the correct
    transaction column based on the horizontal position of the operation
    relative to the transaction headers.
    """
    lines = text.splitlines()
    if not lines:
        return []

    # Find the header line with transaction labels
    tx_header_match = None
    header_idx = -1

    for idx, line in enumerate(lines[:8]):
        stripped = line.strip()
        if not stripped:
            continue
        tx_matches = list(re.finditer(r'\bT([0-9]+)\b', line, re.IGNORECASE))
        if len(tx_matches) >= 2:
            standalone_count = 0
            for tm in tx_matches:
                after_pos = tm.end()
                after_text = line[after_pos:after_pos + 10].strip()
                if not re.match(r'^[:.\-]?\s*[rRwW(]', after_text):
                    standalone_count += 1
            if standalone_count >= 2:
                tx_header_match = [(tm.start(), f"T{tm.group(1)}") for tm in tx_matches]
                header_idx = idx
                break

    if not tx_header_match or header_idx == -1:
        return []

    tx_header_match.sort(key=lambda x: x[0])
    columns: List[Tuple[int, int, str]] = []  # (start, end, tx_name)
    for i, (pos, tx_name) in enumerate(tx_header_match):
        if i + 1 < len(tx_header_match):
            col_end = tx_header_match[i + 1][0]
        else:
            col_end = 99999
        columns.append((pos, col_end, tx_name))

    operations: List[str] = []
    op_pattern = re.compile(
        r'([rRwW]|READ|WRITE)\s*[\(\[]\s*([A-Za-z0-9_]+)\s*[\)\]]',
        re.IGNORECASE
    )
    op_with_tx_pattern = re.compile(
        r'([rRwW])\s*([0-9]+)\s*[\(\[]\s*([A-Za-z0-9_]+)\s*[\)\]]',
        re.IGNORECASE
    )

    for line in lines[header_idx + 1:]:
        if not line.strip() or is_explanation_line(line):
            continue

        header_check = list(re.finditer(r'\bT([0-9]+)\b', line, re.IGNORECASE))
        standalone_headers = 0
        for tm in header_check:
            after_pos = tm.end()
            after_text = line[after_pos:after_pos + 10].strip()
            if not re.match(r'^[:.\-]?\s*[rRwW(]', after_text):
                standalone_headers += 1
        if standalone_headers >= 2:
            continue

        # Operations with explicit tx IDs
        for m in op_with_tx_pattern.finditer(line):
            op_type = m.group(1).upper()
            tx = m.group(2)
            item = m.group(3).upper()
            operations.append(f"{op_type}{tx}({item})")

        # Operations without tx IDs (assigned to column)
        for m in op_pattern.finditer(line):
            pre_char = line[m.start() - 1] if m.start() > 0 else ''
            if pre_char.isdigit():
                continue

            op_pos = m.start()
            raw_op = m.group(1).upper()
            op_type = 'R' if raw_op.startswith('R') else 'W'
            item = m.group(2).upper()

            assigned_tx = None
            for col_start, col_end, tx_name in columns:
                if col_start <= op_pos < col_end:
                    assigned_tx = tx_name
                    break

            if assigned_tx is None:
                assigned_tx = min(columns, key=lambda c: abs(c[0] - op_pos))[2]

            tx_num = assigned_tx.replace("T", "").replace("t", "")
            operations.append(f"{op_type}{tx_num}({item})")

    return operations


def extract_table_schedule_from_boxes(image_bytes: bytes) -> List[str]:
    """
    Uses pytesseract bounding box data (image_to_data) to extract table-format
    schedules with accurate spatial positioning across columns T1, T2, T3...
    Returns operations in global chronological order (top-to-bottom, left-to-right).
    """
    try:
        import pytesseract
        from PIL import Image
        import io
        from app.algorithms.image_preprocessor import normalize_image_mode

        im = Image.open(io.BytesIO(image_bytes))
        rgb = normalize_image_mode(im)
        w, h = rgb.size

        # Passes: if large (w>=1000 and h>=600), original/grayscale avoids destructive resizing.
        # If small (<1000 or <600), scaled helps Tesseract recognize small fonts.
        passes = []
        if w >= 1000 and h >= 600:
            passes.append(('original', rgb))
            passes.append(('gray', rgb.convert('L')))
        else:
            scale = max(2, min(3, int(1600 / max(w, 1))))
            scaled = rgb.resize((w * scale, h * scale), Image.Resampling.LANCZOS)
            passes.append(('scaled', scaled))
            passes.append(('scaled_gray', scaled.convert('L')))
            passes.append(('original', rgb))

        for pass_name, img_var in passes:
            for psm in (6, 3, 11):
                try:
                    data = pytesseract.image_to_data(
                        img_var,
                        config=f'--psm {psm}',
                        output_type=pytesseract.Output.DICT
                    )
                    words = []
                    for i in range(len(data.get('text', []))):
                        t = data['text'][i].strip()
                        if not t:
                            continue
                        words.append({
                            'text': t,
                            'conf': int(data['conf'][i]) if data['conf'][i] != '-1' else 0,
                            'left': data['left'][i],
                            'top': data['top'][i],
                            'w': data['width'][i],
                            'h': data['height'][i],
                            'cx': data['left'][i] + data['width'][i] // 2,
                            'cy': data['top'][i] + data['height'][i] // 2,
                        })

                    # Find transaction column headers (T1, T2, T3, T_1, etc.)
                    tx_headers = []
                    for w_obj in words:
                        m = re.match(r'^T[_\-]?(\d+)$', w_obj['text'], re.IGNORECASE)
                        if m:
                            tx_headers.append({
                                'num': m.group(1),
                                'name': f"T{m.group(1)}",
                                'cx': w_obj['cx'],
                                'top': w_obj['top'],
                            })

                    if len(tx_headers) >= 2:
                        tx_headers.sort(key=lambda h: h['cx'])
                        dedup = [tx_headers[0]]
                        for h_obj in tx_headers[1:]:
                            if abs(h_obj['cx'] - dedup[-1]['cx']) > 30:
                                dedup.append(h_obj)

                        if len(dedup) >= 2:
                            tx_headers = dedup
                            col_ranges = []
                            for i, h_obj in enumerate(tx_headers):
                                x_start = 0 if i == 0 else (tx_headers[i - 1]['cx'] + h_obj['cx']) // 2
                                x_end = 99999 if i == len(tx_headers) - 1 else (h_obj['cx'] + tx_headers[i + 1]['cx']) // 2
                                col_ranges.append((x_start, x_end, h_obj['num']))

                            header_y = max(h_obj['top'] for h_obj in tx_headers)

                            op_regex = re.compile(r'^([rRwW]|READ|WRITE)\s*[\(\[]\s*([A-Za-z0-9_]+)\s*[\)\]]$', re.IGNORECASE)
                            op_with_tx = re.compile(r'^([rRwW])\s*[-_]?(\d+)\s*[\(\[]\s*([A-Za-z0-9_]+)\s*[\)\]]$', re.IGNORECASE)

                            ops = []
                            for w_obj in words:
                                if w_obj['top'] <= header_y:
                                    continue
                                m_tx = op_with_tx.match(w_obj['text'])
                                if m_tx:
                                    ops.append((w_obj['top'], w_obj['cx'], f"{m_tx.group(1).upper()}{m_tx.group(2)}({m_tx.group(3).upper()})"))
                                    continue
                                m_op = op_regex.match(w_obj['text'])
                                if m_op:
                                    op_type = 'R' if m_op.group(1).upper().startswith('R') else 'W'
                                    item = m_op.group(2).upper()
                                    assigned_tx = None
                                    for x1, x2, num in col_ranges:
                                        if x1 <= w_obj['cx'] < x2:
                                            assigned_tx = num
                                            break
                                    if assigned_tx:
                                        ops.append((w_obj['top'], w_obj['cx'], f"{op_type}{assigned_tx}({item})"))

                            if len(ops) >= 2:
                                ops.sort(key=lambda x: (x[0], x[1]))
                                return [op[2] for op in ops]
                except Exception:
                    pass
    except Exception as e:
        print(f"Bounding box table extraction error: {e}")
    return []


def extract_natural_language_schedule(text: str) -> List[str]:
    """
    Extract schedule operations from natural language descriptions.
    Examples:
      - "T1 reads X, T2 writes X, then T1 writes X"
      - "Transaction 1 reads A, Transaction 2 writes A"
    """
    nl_pattern = re.compile(
        r'(?:T|Transaction\s*)(\d+)\s+(?:reads?|READ)\s+([A-Za-z0-9_]+)',
        re.IGNORECASE
    )
    nl_pattern_write = re.compile(
        r'(?:T|Transaction\s*)(\d+)\s+(?:writes?|WRITE)\s+([A-Za-z0-9_]+)',
        re.IGNORECASE
    )

    matches: List[Tuple[int, str]] = []
    for m in nl_pattern.finditer(text):
        tx = m.group(1)
        item = m.group(2).upper()
        matches.append((m.start(), f"R{tx}({item})"))

    for m in nl_pattern_write.finditer(text):
        tx = m.group(1)
        item = m.group(2).upper()
        matches.append((m.start(), f"W{tx}({item})"))

    matches.sort(key=lambda x: x[0])
    return [op for _, op in matches]


def deduplicate_ocr_ops(text: str) -> str:
    """
    Given text from multiple OCR passes concatenated together,
    detect and remove the duplicated second half if it's a near-exact repeat.
    """
    if not text or len(text) < 20:
        return text

    lines = text.strip().split('\n')
    n = len(lines)

    for split_point in range(n // 3, (2 * n) // 3 + 1):
        first_half = '\n'.join(lines[:split_point]).strip()
        second_half = '\n'.join(lines[split_point:]).strip()

        if not first_half or not second_half:
            continue

        norm_first = re.sub(r'\s+', ' ', first_half).strip().lower()
        norm_second = re.sub(r'\s+', ' ', second_half).strip().lower()

        if norm_first == norm_second:
            return first_half
        if len(norm_second) > 10 and norm_second in norm_first:
            return first_half
        if len(norm_first) > 10 and norm_first in norm_second:
            return second_half

    return text
