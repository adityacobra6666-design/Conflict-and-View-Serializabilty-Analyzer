import io
import json
import csv
from typing import Dict, Any
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_pdf_report(analysis_data: Dict[str, Any], title: str = "Conflict & View Serializability Analysis Report") -> bytes:
    """
    Generate a formatted PDF report using ReportLab.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0f172a'),
        fontName='Helvetica-Bold',
        spaceAfter=6
    )
    subtitle_style = ParagraphStyle(
        'SubTitle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#475569'),
        spaceAfter=15
    )
    h2_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#1e293b'),
        fontName='Helvetica-Bold',
        spaceBefore=12,
        spaceAfter=6
    )
    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#334155')
    )

    story = []

    # Title & Header
    story.append(Paragraph("CONFLICT & VIEW SERIALIZABILITY ANALYZER", title_style))
    story.append(Paragraph(f"DBMS Schedule Intelligence Platform — Generated Analysis Report", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#3b82f6'), spaceAfter=15))

    # Executive Summary Card
    combined = analysis_data.get("combined_result", {})
    conflict_res = "✓ YES" if combined.get("conflict_serializable") else "✗ NO"
    view_res = "✓ YES" if combined.get("view_serializable") else "✗ NO"

    summary_table_data = [
        [Paragraph("<b>Schedule:</b>", body_style), Paragraph(analysis_data.get("schedule_text", ""), body_style)],
        [Paragraph("<b>Transactions:</b>", body_style), Paragraph(f"{analysis_data.get('transaction_count', 0)} ({', '.join(analysis_data.get('transactions', []))})", body_style)],
        [Paragraph("<b>Conflict Serializability:</b>", body_style), Paragraph(f"<b>{conflict_res}</b>", body_style)],
        [Paragraph("<b>View Serializability:</b>", body_style), Paragraph(f"<b>{view_res}</b>", body_style)],
        [Paragraph("<b>Interpretation:</b>", body_style), Paragraph(combined.get("summary", ""), body_style)]
    ]

    t_summary = Table(summary_table_data, colWidths=[150, 390])
    t_summary.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e1')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(t_summary)
    story.append(Spacer(1, 15))

    # Operations Breakdown Table
    story.append(Paragraph("1. Schedule Operations", h2_style))
    ops = analysis_data.get("operations", [])
    op_table_data = [["#", "Transaction", "Operation", "Data Item", "Token"]]
    for op in ops:
        op_table_data.append([
            str(op.get("id")),
            op.get("transaction"),
            op.get("type"),
            op.get("data_item"),
            op.get("raw_text")
        ])

    t_ops = Table(op_table_data, colWidths=[40, 120, 120, 120, 140])
    t_ops.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e293b')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
        ('PADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t_ops)
    story.append(Spacer(1, 15))

    # Conflict Analysis
    story.append(Paragraph("2. Conflict Serializability Analysis", h2_style))
    conflicts = analysis_data.get("conflicts", [])
    if conflicts:
        c_table_data = [["Op 1", "Op 2", "Data Item", "Conflict Type", "Precedence Edge"]]
        for c in conflicts:
            c_table_data.append([
                c.get("op1_raw"),
                c.get("op2_raw"),
                c.get("data_item"),
                c.get("conflict_type"),
                f"{c.get('from_tx')} → {c.get('to_tx')}"
            ])
        t_conflicts = Table(c_table_data, colWidths=[80, 80, 80, 140, 160])
        t_conflicts.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#334155')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('PADDING', (0, 0), (-1, -1), 4),
        ]))
        story.append(t_conflicts)
    else:
        story.append(Paragraph("No conflicting operations were detected.", body_style))

    story.append(Spacer(1, 10))
    if analysis_data.get("has_cycle"):
        cycles_str = ", ".join(analysis_data.get("formatted_cycles", []))
        story.append(Paragraph(f"<b>Cycle Detected:</b> {cycles_str} — Conflict Serializability: <b>NO</b>", body_style))
    else:
        top_orders = ", ".join(analysis_data.get("formatted_topological_orders", []))
        story.append(Paragraph(f"<b>Valid Serial Orders (Topological):</b> {top_orders}", body_style))

    story.append(Spacer(1, 15))

    # View Serializability
    story.append(Paragraph("3. View Serializability Analysis", h2_style))
    view_info = analysis_data.get("view_analysis", {})
    eq_orders = view_info.get("equivalent_orders", [])
    if eq_orders:
        story.append(Paragraph(f"<b>View Equivalent Serial Orders:</b> {', '.join(eq_orders)}", body_style))
    else:
        story.append(Paragraph("No candidate transaction order is view equivalent.", body_style))

    doc.build(story)
    return buffer.getvalue()


def generate_json_export(analysis_data: Dict[str, Any]) -> str:
    return json.dumps(analysis_data, indent=2)


def generate_csv_export(analysis_data: Dict[str, Any]) -> str:
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["SUMMARY METRICS"])
    writer.writerow(["Schedule", analysis_data.get("schedule_text", "")])
    writer.writerow(["Conflict Serializable", analysis_data.get("conflict_serializable")])
    writer.writerow(["View Serializable", analysis_data.get("view_serializable")])
    writer.writerow([])

    writer.writerow(["OPERATIONS"])
    writer.writerow(["ID", "Transaction", "Type", "Data Item", "Raw Text"])
    for op in analysis_data.get("operations", []):
        writer.writerow([op.get("id"), op.get("transaction"), op.get("type"), op.get("data_item"), op.get("raw_text")])
    writer.writerow([])

    writer.writerow(["DETECTED CONFLICTS"])
    writer.writerow(["Op1", "Op2", "Data Item", "Conflict Type", "Dependency Edge"])
    for c in analysis_data.get("conflicts", []):
        writer.writerow([c.get("op1_raw"), c.get("op2_raw"), c.get("data_item"), c.get("conflict_type"), f"{c.get('from_tx')} -> {c.get('to_tx')}"])

    return output.getvalue()
