"""
RIR (Regulatory Intelligence Report) PDF Generator
Produces a professional, corporate-grade PDF from structured AI-extracted data.
"""

from io import BytesIO
from datetime import datetime
from typing import Any

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle,
    HRFlowable, PageBreak
)

# ── Brand colours ────────────────────────────────────────────────────────────
NAVY     = colors.HexColor("#0D2B55")
GOLD     = colors.HexColor("#C9A84C")
STEEL    = colors.HexColor("#3A5F8A")
LIGHT_BG = colors.HexColor("#F4F6FA")
BORDER   = colors.HexColor("#C5CDD9")
WHITE    = colors.white
DARK     = colors.HexColor("#1A1A2E")
MUTED    = colors.HexColor("#6B7A99")

PRIORITY_COLOURS = {
    "Critical": colors.HexColor("#DC2626"),
    "High":     colors.HexColor("#EA580C"),
    "Medium":   colors.HexColor("#D97706"),
    "Low":      colors.HexColor("#16A34A"),
}


def _styles():
    base = getSampleStyleSheet()

    def make(name, parent="BodyText", **kw):
        return ParagraphStyle(name, parent=base[parent], **kw)

    return {
        "title":   make("RIRTitle",   "Title",    fontName="Helvetica-Bold", fontSize=20,
                        leading=26, textColor=WHITE, spaceAfter=4),
        "sub":     make("RIRSub",     "BodyText",  fontName="Helvetica",     fontSize=9,
                        textColor=colors.HexColor("#B8C8DE"), spaceAfter=0),
        "section": make("RIRSection", "Heading2",  fontName="Helvetica-Bold", fontSize=11,
                        leading=14, textColor=NAVY, spaceBefore=12, spaceAfter=5,
                        borderPad=4),
        "body":    make("RIRBody",    "BodyText",  fontName="Helvetica",     fontSize=8.5,
                        leading=12, textColor=DARK),
        "label":   make("RIRLabel",   "BodyText",  fontName="Helvetica-Bold", fontSize=8.5,
                        leading=12, textColor=NAVY),
        "small":   make("RIRSmall",   "BodyText",  fontName="Helvetica",     fontSize=7.5,
                        leading=10, textColor=MUTED),
        "bullet":  make("RIRBullet",  "BodyText",  fontName="Helvetica",     fontSize=8.5,
                        leading=12, textColor=DARK, leftIndent=10, bulletIndent=0),
        "tag":     make("RIRTag",     "BodyText",  fontName="Helvetica-Bold", fontSize=8,
                        textColor=WHITE),
    }


def _p(text: Any, style) -> Paragraph:
    return Paragraph(str(text) if text is not None else "—", style)


def _kv_table(rows: list[list], styles_dict: dict, col_widths=None) -> Table:
    """2-column label/value table."""
    s = styles_dict
    cell_rows = [
        [_p(k, s["label"]), _p(v, s["body"])]
        for k, v in rows
    ]
    col_widths = col_widths or [50 * mm, 120 * mm]
    t = Table(cell_rows, colWidths=col_widths, hAlign="LEFT")
    t.setStyle(TableStyle([
        ("GRID",         (0, 0), (-1, -1), 0.4, BORDER),
        ("VALIGN",       (0, 0), (-1, -1), "TOP"),
        ("BACKGROUND",   (0, 0), (0, -1),  LIGHT_BG),
        ("LEFTPADDING",  (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING",   (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 5),
    ]))
    return t


def _header_table(rows: list[list], headers: list[str],
                  col_widths: list, styles_dict: dict) -> Table:
    """Table with a navy header row."""
    s = styles_dict
    header_style = ParagraphStyle(
        "TH", parent=getSampleStyleSheet()["BodyText"],
        fontName="Helvetica-Bold", fontSize=8.2,
        textColor=WHITE
    )
    cell_rows = [[_p(h, header_style) for h in headers]]
    for row in rows:
        cell_rows.append([_p(c, s["body"]) for c in row])

    t = Table(cell_rows, colWidths=col_widths, hAlign="LEFT", repeatRows=1)
    n = len(rows)
    t.setStyle(TableStyle([
        ("BACKGROUND",   (0, 0), (-1, 0),  NAVY),
        ("GRID",         (0, 0), (-1, -1), 0.4, BORDER),
        ("VALIGN",       (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING",  (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING",   (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 5),
        ("ROWBACKGROUNDS", (0, 1), (-1, n), [WHITE, LIGHT_BG]),
    ]))
    return t


def _section_block(title: str, s: dict) -> list:
    """Return divider + section heading elements."""
    return [
        Spacer(1, 4 * mm),
        HRFlowable(width="100%", thickness=1, color=STEEL, spaceAfter=3),
        _p(title, s["section"]),
    ]


def _priority_badge(priority: str, styles_dict: dict) -> Paragraph:
    colour = PRIORITY_COLOURS.get(priority, STEEL)
    hex_c = colour.hexval() if hasattr(colour, "hexval") else "#3A5F8A"
    return Paragraph(
        f'<font color="white"><b>{priority}</b></font>',
        ParagraphStyle(
            "Badge",
            parent=getSampleStyleSheet()["BodyText"],
            backColor=colour,
            borderPadding=(2, 6, 2, 6),
            fontSize=8.5,
        )
    )


def _page_footer(canvas, doc):
    """Draw page number and timestamp at bottom of every page."""
    canvas.saveState()
    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(MUTED)
    canvas.drawString(16 * mm, 8 * mm, "CONFIDENTIAL — ReguFlow Regulatory Intelligence Report")
    canvas.drawRightString(A4[0] - 16 * mm, 8 * mm, f"Page {doc.page}")
    canvas.restoreState()


def generate_rir_pdf(circular_data: dict, intelligence: dict) -> BytesIO:
    """
    Generate the full Regulatory Intelligence Report PDF.

    Args:
        circular_data: dict with keys regulation_id, title, category, priority,
                       issue_date, effective_date
        intelligence:  dict returned by rir_agent.extract_regulatory_intelligence()

    Returns:
        BytesIO buffer containing the PDF bytes.
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=16 * mm,
        leftMargin=16 * mm,
        topMargin=12 * mm,
        bottomMargin=20 * mm,
        title=f"Regulatory Intelligence Report – {circular_data.get('regulation_id', 'N/A')}",
        author="ReguFlow AI Compliance Engine",
    )

    s = _styles()
    story = []

    # ── ① CORPORATE HEADER ──────────────────────────────────────────────────
    now_str = datetime.now().strftime("%d %B %Y, %I:%M %p")
    model_used = intelligence.get("_model_used", "AI Engine")

    header_style = ParagraphStyle(
        "HeaderCell", parent=getSampleStyleSheet()["BodyText"],
        fontName="Helvetica", fontSize=8.5, textColor=WHITE
    )
    header_title_style = ParagraphStyle(
        "HeaderTitle", parent=getSampleStyleSheet()["BodyText"],
        fontName="Helvetica-Bold", fontSize=20, textColor=WHITE, leading=24
    )
    header_sub_style = ParagraphStyle(
        "HeaderSub", parent=getSampleStyleSheet()["BodyText"],
        fontName="Helvetica", fontSize=8, textColor=colors.HexColor("#B8C8DE")
    )

    header_data = [[
        Paragraph("⚖ ReguFlow", header_title_style),
        Table(
            [
                [Paragraph("REGULATORY INTELLIGENCE REPORT", ParagraphStyle(
                    "RIRBanner", parent=getSampleStyleSheet()["BodyText"],
                    fontName="Helvetica-Bold", fontSize=10, textColor=GOLD))],
                [Paragraph(f"Regulation: {circular_data.get('regulation_id', 'N/A')}", header_style)],
                [Paragraph(f"Generated: {now_str}", header_style)],
                [Paragraph(f"AI Model: {model_used}", header_sub_style)],
            ],
            colWidths=[120 * mm],
            hAlign="RIGHT"
        )
    ]]
    header_table = Table(header_data, colWidths=[60 * mm, 120 * mm])
    header_table.setStyle(TableStyle([
        ("BACKGROUND",   (0, 0), (-1, -1), NAVY),
        ("VALIGN",       (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING",  (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING",   (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 10),
        ("LINEBELOW",    (0, 0), (-1, 0),  2, GOLD),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 5 * mm))

    # ── ② REGULATION OVERVIEW ───────────────────────────────────────────────
    story += _section_block("Section 1 — Regulation Overview", s)
    story.append(_kv_table([
        ("Regulation ID",    circular_data.get("regulation_id", "N/A")),
        ("Title",            circular_data.get("title", "N/A")),
        ("Category",         circular_data.get("category", "N/A")),
        ("Priority",         circular_data.get("priority", "N/A")),
        ("Publication Date", circular_data.get("issue_date", "N/A")),
        ("Effective Date",   circular_data.get("effective_date", "N/A")),
    ], s))

    # ── ③ EXECUTIVE SUMMARY ─────────────────────────────────────────────────
    story += _section_block("Section 2 — Executive Summary", s)
    story.append(_p(intelligence.get("executive_summary", "Not available."), s["body"]))

    # ── ④ KEY REGULATORY OBLIGATIONS ────────────────────────────────────────
    story += _section_block("Section 3 — Key Regulatory Obligations", s)
    obligations = intelligence.get("key_obligations", [])
    if obligations:
        for i, ob in enumerate(obligations, 1):
            story.append(_p(f"{i}. {ob}", s["bullet"]))
            story.append(Spacer(1, 1 * mm))
    else:
        story.append(_p("No obligations extracted.", s["body"]))

    # ── ⑤ COMPLIANCE ACTIONS REQUIRED ───────────────────────────────────────
    story += _section_block("Section 4 — Compliance Actions Required", s)
    actions = intelligence.get("compliance_actions", [])
    if actions:
        for act in actions:
            story.append(_p(f"• {act}", s["bullet"]))
            story.append(Spacer(1, 1 * mm))
    else:
        story.append(_p("No compliance actions extracted.", s["body"]))

    # ── ⑥ AFFECTED BANKING DEPARTMENTS ─────────────────────────────────────
    story += _section_block("Section 5 — Affected Banking Departments", s)
    depts = intelligence.get("affected_departments", [])
    if depts:
        dept_rows = [[d] for d in depts]
        dept_table = Table(dept_rows, colWidths=[170 * mm], hAlign="LEFT")
        dept_table.setStyle(TableStyle([
            ("GRID",         (0, 0), (-1, -1), 0.4, BORDER),
            ("VALIGN",       (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING",  (0, 0), (-1, -1), 8),
            ("TOPPADDING",   (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING",(0, 0), (-1, -1), 4),
            ("ROWBACKGROUNDS", (0, 0), (-1, -1), [WHITE, LIGHT_BG]),
            ("FONTNAME",     (0, 0), (-1, -1), "Helvetica"),
            ("FONTSIZE",     (0, 0), (-1, -1), 8.5),
        ]))
        story.append(dept_table)
    else:
        story.append(_p("No departments identified.", s["body"]))

    # ── ⑦ RISK ASSESSMENT ───────────────────────────────────────────────────
    story += _section_block("Section 6 — Risk Assessment Summary", s)
    risk = intelligence.get("risk_assessment", {})
    story.append(_kv_table([
        ("Cyber Risk",       risk.get("cyber_risk", "N/A")),
        ("Operational Risk", risk.get("operational_risk", "N/A")),
        ("Regulatory Risk",  risk.get("regulatory_risk", "N/A")),
        ("Overall Priority", risk.get("overall_priority", "N/A")),
        ("Risk Rationale",   risk.get("risk_rationale", "N/A")),
    ], s))

    # ── ⑧ IMPLEMENTATION TIMELINE ───────────────────────────────────────────
    story += _section_block("Section 7 — Implementation Timeline", s)
    timeline = intelligence.get("implementation_timeline", [])
    if timeline:
        tl_rows = [
            [item.get("action", ""), item.get("deadline", ""), item.get("priority", "")]
            for item in timeline
        ]
        story.append(_header_table(
            tl_rows,
            headers=["Action", "Deadline", "Priority"],
            col_widths=[98 * mm, 44 * mm, 28 * mm],
            styles_dict=s
        ))
    else:
        story.append(_p("No timeline data available.", s["body"]))

    # ── ⑨ MEASURABLE ACTION POINTS (MAPs) ───────────────────────────────────
    story += _section_block("Section 8 — Measurable Action Points (MAPs)", s)
    maps = intelligence.get("maps", [])
    if maps:
        for m in maps:
            story.append(_kv_table([
                ("MAP ID",          m.get("map_id", "N/A")),
                ("Task",            m.get("task", "N/A")),
                ("Assigned Owner",  m.get("assigned_owner", "N/A")),
                ("Success Criteria",m.get("success_criteria", "N/A")),
                ("Deadline",        m.get("deadline", "N/A")),
            ], s))
            story.append(Spacer(1, 3 * mm))
    else:
        story.append(_p("No MAPs generated.", s["body"]))

    # ── ⑩ AI INTERPRETATION ─────────────────────────────────────────────────
    story += _section_block("Section 9 — AI Interpretation", s)
    story.append(_p(intelligence.get("ai_interpretation", "Not available."), s["body"]))

    # ── ⑪ FINAL RECOMMENDATION ──────────────────────────────────────────────
    story += _section_block("Section 10 — Final Recommendation", s)
    rec_text = intelligence.get("final_recommendation", "Not available.")
    rec_table = Table(
        [[_p(rec_text, ParagraphStyle(
            "Rec", parent=getSampleStyleSheet()["BodyText"],
            fontName="Helvetica-Bold", fontSize=9, leading=13, textColor=NAVY
        ))]],
        colWidths=[170 * mm]
    )
    rec_table.setStyle(TableStyle([
        ("BACKGROUND",   (0, 0), (-1, -1), colors.HexColor("#EEF3FA")),
        ("LINERIGHT",    (0, 0), (0, -1),  3, GOLD),
        ("LINELEFT",     (0, 0), (0, -1),  3, GOLD),
        ("LEFTPADDING",  (0, 0), (-1, -1), 12),
        ("TOPPADDING",   (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 8),
        ("GRID",         (0, 0), (-1, -1), 0.4, BORDER),
    ]))
    story.append(rec_table)

    # ── ⑫ FOOTER DISCLAIMER ─────────────────────────────────────────────────
    story.append(Spacer(1, 8 * mm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER))
    story.append(Spacer(1, 3 * mm))
    story.append(_p(
        f"This report was generated automatically by the ReguFlow AI Compliance Engine on {now_str}. "
        f"AI Model: {model_used}. This document is confidential and intended for internal compliance "
        f"and audit use only. All obligations must be verified against the original circular.",
        s["small"]
    ))

    doc.build(story, onFirstPage=_page_footer, onLaterPages=_page_footer)
    buffer.seek(0)
    return buffer
