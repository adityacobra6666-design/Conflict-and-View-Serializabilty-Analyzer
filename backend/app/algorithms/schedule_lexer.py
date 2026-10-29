import re
from typing import Dict, Any, List, Tuple, Optional
from dataclasses import dataclass, field

SUBSCRIPT_MAP = {
    '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4',
    '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9'
}

# Regex to detect explanation / definition sentences in question text
EXPLANATION_INDICATOR_PATTERNS = [
    re.compile(p, re.IGNORECASE) for p in [
        r'\bmeans\s+transaction\b',
        r'\breads?\s+data\s+item\b',
        r'\bwrites?\s+data\s+item\b',
        r'\bprecedence\s+graph\b',
        r'\bconflict-serializable\b',
        r'\bview-serializable\b',
        r'\bequivalent\s+serial\b',
        r'\bconflicting\s+operation\b',
        r'\bAnswer\s+the\s+following\b',
        r'\bDetermine\s+whether\b',
        r'\bDraw\s+the\b',
        r'\bIdentify\s+all\b',
        r'\bConsider\s+the\s+following\b',
        r'^\s*Notation\s*:',
        r'\bdenotes\s+a\s+(?:read|write)\b',
        r'\bassume\s+the\s+initial\b',
    ]
]


@dataclass
class ExtractedToken:
    raw: str
    normalized: str
    op_type: str  # 'R' or 'W'
    tx_id: str
    data_item: str
    pos_start: int
    pos_end: int
    line_num: int
    confidence: float = 1.0
    warning: Optional[str] = None


@dataclass
class CandidateScheduleResult:
    label: str
    operations: List[str]
    confidence_score: float
    warnings: List[str] = field(default_factory=list)
    source_type: str = "inline"  # inline, labeled, table, natural_language, global
    selection_reason: str = ""


def clean_ocr_artifacts(text: str) -> str:
    """
    Standardize common OCR character variations, subscripts, and structural brackets.
    Preserves exact character sequence without discarding operations.
    """
    if not text:
        return ""
    # Subscript normalization
    for sub, digit in SUBSCRIPT_MAP.items():
        text = text.replace(sub, digit)
    # Non-standard parentheses & brackets
    text = text.replace('（', '(').replace('）', ')')
    text = text.replace('［', '[').replace('］', ']')
    text = text.replace('｛', '(').replace('｝', ')')
    text = text.replace('{', '(').replace('}', ')')
    text = text.replace('\u2018', "'").replace('\u201c', '"').replace('\u201d', '"')
    text = text.replace('\u2014', '-').replace('\u2013', '-')

    # OCR double-letter stutters from bold/serif outlines (e.g., wW2 -> W2, rR1 -> R1)
    text = re.sub(r'\b[wW]([wW]\d+)', r'\1', text)
    text = re.sub(r'\b[rR]([rR]\d+)', r'\1', text)
    # OCR letter-digit combinations like Wi1(X) -> W1(X), Ri1(X) -> R1(X)
    text = re.sub(r'\b([wWrR])[iI](\d+[\(\[])', r'\1\2', text)

    return text


def is_explanation_line(line: str) -> bool:
    """Check if a line of text is part of the question prompt or notation explanation."""
    return any(p.search(line) for p in EXPLANATION_INDICATOR_PATTERNS)


def parse_tokens_from_text(
    text: str,
    line_offset: int = 0
) -> Tuple[List[ExtractedToken], List[str]]:
    """
    Tokenizes a single line or text block into DBMS operation tokens.
    Handles:
      - Standard notation: R1(X), W2(Y), r1(x), R1[X], R_1(X), R 1 ( X )
      - Colon notation: T1: R(X), T2: W(Y)
      - OCR digit confusions: WI(X) -> W1(X), Rl(Y) -> R1(Y)
    Returns list of ExtractedTokens and list of substitution warnings.
    """
    cleaned = clean_ocr_artifacts(text)
    tokens: List[ExtractedToken] = []
    warnings: List[str] = []

    # Standard pattern: (R|W) + (digits or I/l/|/!) + parens/brackets
    pattern_standard = re.compile(
        r'\b([rRwW])\s*[-_]?\s*([0-9]+|[Il|!])\s*[\(\[]\s*([A-Za-z0-9_]+)\s*[\)\]]',
        re.IGNORECASE
    )

    # Colon pattern: T<n>: R(X) or T<n>: READ(X)
    pattern_colon = re.compile(
        r'\bT([0-9]+)\s*[:.\-]?\s*([rRwW]|READ|WRITE)\s*[\(\[]\s*([A-Za-z0-9_]+)\s*[\)\]]',
        re.IGNORECASE
    )

    matches: List[Tuple[int, int, ExtractedToken]] = []

    for m in pattern_standard.finditer(cleaned):
        op_type = m.group(1).upper()
        raw_tx = m.group(2)
        warn_msg = None
        if raw_tx in ('I', 'l', '|', '!'):
            tx = '1'
            warn_msg = f"Normalized OCR artifact '{raw_tx}' to transaction ID '1' in '{m.group(0).strip()}'"
            warnings.append(warn_msg)
        else:
            tx = raw_tx

        data_item = m.group(3).upper()
        norm = f"{op_type}{tx}({data_item})"
        token = ExtractedToken(
            raw=m.group(0),
            normalized=norm,
            op_type=op_type,
            tx_id=tx,
            data_item=data_item,
            pos_start=m.start(),
            pos_end=m.end(),
            line_num=line_offset,
            warning=warn_msg
        )
        matches.append((m.start(), m.end(), token))

    for m in pattern_colon.finditer(cleaned):
        tx = m.group(1)
        raw_op = m.group(2).upper()
        op_type = 'R' if raw_op.startswith('R') else 'W'
        data_item = m.group(3).upper()
        norm = f"{op_type}{tx}({data_item})"
        token = ExtractedToken(
            raw=m.group(0),
            normalized=norm,
            op_type=op_type,
            tx_id=tx,
            data_item=data_item,
            pos_start=m.start(),
            pos_end=m.end(),
            line_num=line_offset
        )
        matches.append((m.start(), m.end(), token))

    # Sort strictly by appearance order in text
    matches.sort(key=lambda x: x[0])

    # Discard overlapping matches
    filtered: List[ExtractedToken] = []
    last_end = -1
    for start, end, token in matches:
        if start < last_end:
            continue
        filtered.append(token)
        last_end = end

    return filtered, warnings


def extract_schedule_blocks(text: str) -> List[Tuple[str, str, int]]:
    """
    Finds labeled schedule blocks such as:
      Schedule S: | R1(X), ...
      Schedule 1:\n R1(X), ...
      S = R1(X), ...
      S1 = ... ; S2 = ...
    Returns list of (label, schedule_content, starting_line_number).
    """
    blocks: List[Tuple[str, str, int]] = []
    lines = text.splitlines()

    # First check for inline multi-schedule statements: e.g. "S1 = R1(X), W2(X); S2 = W2(X), R1(X)"
    multi_inline = re.compile(
        r'(?:Schedule\s*([A-Za-z0-9_]{1,4})|S([0-9]+))\s*[:=]\s*([^;\n]+?)(?=(?:;\s*(?:Schedule|S[0-9]+))|;|\Z)',
        re.IGNORECASE
    )
    inline_matches = list(multi_inline.finditer(text))
    if len(inline_matches) >= 2:
        for m in inline_matches:
            label_val = m.group(1) or m.group(2) or "S"
            content = m.group(3).strip()
            tokens, _ = parse_tokens_from_text(content)
            if tokens:
                blocks.append((f"Schedule {label_val.upper()}", content, 0))
        if blocks:
            return blocks

    # Line-by-line block extractor
    label_pattern = re.compile(
        r'(?:^|\b)(?:Schedule\s*([A-Za-z0-9_]{1,4})|S([0-9]+))\s*[:=|]\s*(.*)$',
        re.IGNORECASE
    )

    for i, line in enumerate(lines):
        m = label_pattern.match(line)
        if m:
            label_val = m.group(1) or m.group(2) or "S"
            label = f"Schedule {label_val.upper()}"
            trailing_content = m.group(3).strip()

            content_lines = []
            if trailing_content and not is_explanation_line(trailing_content):
                # Clean leading pipe or semicolon artifacts from OCR
                cleaned_trailing = re.sub(r'^[|;:\- ]+', '', trailing_content).strip()
                if cleaned_trailing:
                    content_lines.append(cleaned_trailing)

            # Look ahead to subsequent lines
            for j in range(i + 1, min(i + 6, len(lines))):
                next_line = lines[j].strip()
                if not next_line:
                    continue
                if is_explanation_line(next_line):
                    break
                if label_pattern.match(next_line) or re.match(r'^(?:Question|Problem|Notation|Answer|Step)\b', next_line, re.IGNORECASE):
                    break
                tokens, _ = parse_tokens_from_text(next_line)
                if tokens:
                    content_lines.append(next_line)
                else:
                    if content_lines:
                        break

            if content_lines:
                blocks.append((label, "\n".join(content_lines), i))

    return blocks
