from io import BytesIO
import hashlib
import re
import uuid
from datetime import datetime, timezone
from typing import Iterable

from fastapi import APIRouter, Depends, Header, HTTPException
from fastapi.responses import StreamingResponse
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas

router = APIRouter(prefix="/api/v1/compliance", tags=["compliance-dossier"])

# ---------------------------------------------------------------------------
# Authorization constants
# ---------------------------------------------------------------------------
VALID_AUTHORIZATION_CODE = "Bharat"
AUTHORIZED_ROLES = {"Admin", "Compliance Officer"}


def clean_filename(value: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9]+", "_", value).strip("_")
    return cleaned or "REGULATION"


def text_or_empty(value: object) -> str:
    if value is None:
        return "Not recorded in source tables."
    text = str(value).strip()
    return text if text else "Not recorded in source tables."


def split_obligations(circular: models.Circular) -> list[str]:
    source = circular.full_content or circular.summary or ""
    lines = [line.strip(" -\t") for line in source.splitlines() if line.strip()]
    markers = ("must", "shall", "required", "directed", "mandatory", "submit", "implement", "ensure")
    obligations = [line for line in lines if any(marker in line.lower() for marker in markers)]
    if obligations:
        return obligations[:12]
    if circular.summary:
        return [circular.summary]
    return ["Not recorded in source tables."]


def derive_maps(circular: models.Circular, obligations: Iterable[str]) -> list[dict[str, str]]:
    departments = circular.target_departments or []
    owner = departments[0] if departments else "Not recorded in source tables."
    deadline = circular.effective_date or circular.issue_date or "Not recorded in source tables."
    maps = []
    for index, obligation in enumerate(obligations, 1):
      if obligation == "Not recorded in source tables.":
          continue
      maps.append({
          "map_id": f"MAP-{clean_filename(circular.reference_number)}-{index:02d}",
          "task": obligation,
          "owner": owner,
          "success_criteria": "Evidence uploaded and department acknowledgement recorded.",
          "deadline": deadline,
      })
    return maps or [{
        "map_id": "Not recorded in source tables.",
        "task": "Not recorded in source tables.",
        "owner": owner,
        "success_criteria": "Not recorded in source tables.",
        "deadline": deadline,
    }]


def risk_scores(priority: str) -> dict[str, str]:
    scores = {
        "Critical": ("Critical", "High", "Critical", "95"),
        "High": ("High", "Medium", "High", "80"),
        "Medium": ("Medium", "Medium", "Medium", "55"),
        "Low": ("Low", "Low", "Low", "25"),
    }
    cyber, operational, regulatory, final = scores.get(priority, scores["Medium"])
    return {
        "Cyber Risk": cyber,
        "Operational Risk": operational,
        "Regulatory Risk": regulatory,
        "Final Risk Score": final,
    }


def event_hash(event: models.Event) -> str:
    payload = f"{event.event_id}|{event.event_type}|{event.regulation_id}|{event.timestamp.isoformat()}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def build_table(rows: list[list[str]], widths: list[float], header: bool = False) -> Table:
    table = Table(rows, colWidths=widths, hAlign="LEFT")
    style = [
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#D7DEE8")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 8.2),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]
    if header:
        style.extend([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#173B6D")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ])
    else:
        style.extend([
            ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#F2F5F9")),
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ])
    table.setStyle(TableStyle(style))
    return table


def generate_pdf(circular: models.Circular, events: list[models.Event]) -> BytesIO:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=16 * mm,
        leftMargin=16 * mm,
        topMargin=15 * mm,
        bottomMargin=15 * mm,
        title=f"Compliance Dossier {circular.reference_number}",
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "DossierTitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        textColor=colors.HexColor("#173B6D"),
        spaceAfter=6,
    )
    section_style = ParagraphStyle(
        "SectionTitle",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=14,
        textColor=colors.HexColor("#173B6D"),
        spaceBefore=10,
        spaceAfter=6,
    )
    normal = ParagraphStyle("DossierNormal", parent=styles["BodyText"], fontSize=8.5, leading=11)

    def p(value: object) -> Paragraph:
        return Paragraph(text_or_empty(value).replace("\n", "<br/>"), normal)

    obligations = split_obligations(circular)
    maps = derive_maps(circular, obligations)
    risks = risk_scores(circular.priority)
    departments = circular.target_departments or []
    status = "Completed" if circular.status == "Published" and events else "Pending"
    approval_mode = "HUMAN_APPROVAL" if circular.priority in {"Critical", "High"} else "AUTO_APPROVAL"
    approver = "Compliance Officer" if approval_mode == "HUMAN_APPROVAL" else "ReguFlow Governance Engine"
    approval_ts = circular.published_at or circular.created_at

    story = [
        Paragraph("Compliance Dossier", title_style),
        Paragraph(f"Regulation ID: <b>{circular.reference_number}</b>", normal),
        Paragraph("Generated by ReguFlow for audit review", normal),
        Spacer(1, 6),
    ]

    story += [
        Paragraph("Section 1: Regulation Information", section_style),
        build_table([
            ["Regulation ID", p(circular.reference_number)],
            ["Title", p(circular.title)],
            ["Category", p(circular.category)],
            ["Priority", p(circular.priority)],
            ["Publication Date", p(circular.published_at.isoformat() if circular.published_at else None)],
        ], [38 * mm, 132 * mm]),
    ]

    story += [
        Paragraph("Section 2: AI Regulatory Interpretation", section_style),
        build_table([
            ["Extracted Summary", p(circular.summary)],
            ["Obligations", p("\n".join(f"{idx}. {item}" for idx, item in enumerate(obligations, 1)))],
            ["Deadlines", p(circular.effective_date or circular.issue_date)],
            ["Affected Systems", p(", ".join(departments))],
        ], [38 * mm, 132 * mm]),
    ]

    map_table_data = []
    for m in maps:
        map_table_data.extend([
            ["MAP ID", p(m["map_id"])],
            ["Task", p(m["task"])],
            ["Assigned Owner", p(m["owner"])],
            ["Success Criteria", p(m["success_criteria"])],
            ["Deadline", p(m["deadline"])],
            ["---", "---"]
        ])
    if map_table_data:
        map_table_data.pop()

    story += [
        Paragraph("Section 3: Generated MAPs", section_style),
        build_table(map_table_data, [38 * mm, 132 * mm]) if map_table_data else p("No MAPs generated."),
    ]

    story += [
        Paragraph("Section 4: Risk Assessment", section_style),
        build_table([[k, p(v)] for k, v in risks.items()], [38 * mm, 132 * mm]),
    ]

    story += [
        Paragraph("Section 5: Governance Decisions", section_style),
        build_table([
            ["Approval Mode", p(approval_mode)],
            ["Approver", p(approver)],
            ["Approval Timestamp", p(approval_ts.isoformat() if approval_ts else None)],
        ], [38 * mm, 132 * mm]),
    ]

    story += [
        Paragraph("Section 6: Department Routing", section_style),
        build_table([
            ["Assigned Departments", p(", ".join(departments))],
            ["Assigned Teams", p(", ".join(departments))],
            ["Routing Reason", p(f"Routed from stored target_departments for category {circular.category}.")],
        ], [38 * mm, 132 * mm]),
    ]

    story += [
        Paragraph("Section 7: Validation Results", section_style),
        build_table([
            ["Expected State", p("Published circular is available with attached PDF and generated event record.")],
            ["Observed State", p(f"Status={circular.status}; PDF={'Attached' if circular.pdf_path else 'Not attached'}; Events={len(events)}")],
            ["PASS / FAIL", p("PASS" if circular.status == "Published" and len(events) > 0 else "FAIL")],
            ["Evidence", p(circular.pdf_path or "Not recorded in source tables.")],
        ], [38 * mm, 132 * mm]),
    ]

    audit_rows = [["Event", "Timestamp", "SHA-256 Hash"]]
    if events:
        audit_rows += [[e.event_type, e.timestamp.isoformat(), event_hash(e)] for e in events]
    else:
        audit_rows += [["Not recorded in source tables.", "Not recorded in source tables.", "Not recorded in source tables."]]

    story += [
        Paragraph("Section 8: Audit Timeline", section_style),
        build_table(audit_rows, [45 * mm, 42 * mm, 83 * mm], header=True),
    ]

    story += [
        Paragraph("Section 9: Final Compliance Status", section_style),
        build_table([["Final Status", p(status)]], [38 * mm, 132 * mm]),
    ]

    doc.build(story)
    buffer.seek(0)
    return buffer


@router.get("/{regulation_id}/download")
def download_compliance_dossier(regulation_id: str, db: Session = Depends(get_db)):
    circular = (
        db.query(models.Circular)
        .filter(models.Circular.reference_number == regulation_id)
        .first()
    )
    if not circular:
        raise HTTPException(status_code=404, detail="Regulation not found")

    events = (
        db.query(models.Event)
        .filter(models.Event.regulation_id == circular.reference_number)
        .order_by(models.Event.timestamp.asc())
        .all()
    )

    pdf = generate_pdf(circular, events)
    filename = f"Compliance_Dossier_{clean_filename(circular.reference_number)}.pdf"
    return StreamingResponse(
        pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ---------------------------------------------------------------------------
# Helper — get or create a ComplianceCase row for a given case_id
# ---------------------------------------------------------------------------
def _get_or_create_case(db: Session, circular: models.Circular) -> models.ComplianceCase:
    case = (
        db.query(models.ComplianceCase)
        .filter(models.ComplianceCase.case_id == circular.reference_number)
        .first()
    )
    if not case:
        case = models.ComplianceCase(
            case_id=circular.reference_number,
            regulation_id=circular.reference_number,
            regulation_title=circular.title,
            status=models.COMPLIANCE_STATUS_AWAITING_AUTHORIZATION,
        )
        db.add(case)
        db.commit()
        db.refresh(case)
    return case


def _make_event(
    event_type: str,
    circular: models.Circular,
    category: str = "Authorization",
) -> models.Event:
    return models.Event(
        event_id=f"EVT-{uuid.uuid4().hex[:12].upper()}",
        event_type=event_type,
        regulation_id=circular.reference_number,
        regulation_title=circular.title,
        category=category,
        priority=circular.priority,
    )


# ---------------------------------------------------------------------------
# POST /api/v1/compliance/{case_id}/authorize
# ---------------------------------------------------------------------------
@router.post("/{case_id}/authorize", response_model=schemas.AuthorizationResponse)
def authorize_compliance_case(
    case_id: str,
    payload: schemas.AuthorizationRequest,
    db: Session = Depends(get_db),
    x_user_role: str = Header(default="", alias="X-User-Role"),
    x_actor: str = Header(default="Anonymous", alias="X-Actor"),
):
    """
    Authorize a compliance case with a valid authorization code.

    Role restriction: only 'Admin' or 'Compliance Officer' may call this endpoint.
    Authorization code: 'Bharat' → COMPLETED; any other → AWAITING_AUTHORIZATION (failed attempt logged).

    Audit events written:
      - COMPLIANCE_AUTHORIZED  (success)
      - AUTHORIZATION_FAILED   (wrong code)
    """
    # ── 1. Role check ────────────────────────────────────────────────────────
    if x_user_role not in AUTHORIZED_ROLES:
        raise HTTPException(
            status_code=403,
            detail=(
                f"Access denied. Role '{x_user_role}' is not authorised to approve compliance cases. "
                "Required: Admin or Compliance Officer."
            ),
        )

    # ── 2. Resolve the circular ───────────────────────────────────────────────
    circular = (
        db.query(models.Circular)
        .filter(models.Circular.reference_number == case_id)
        .first()
    )
    if not circular:
        raise HTTPException(status_code=404, detail=f"Compliance case '{case_id}' not found.")

    # ── 3. Get or create the ComplianceCase row ───────────────────────────────
    case = _get_or_create_case(db, circular)

    # ── 4. Validate authorization code ────────────────────────────────────────
    if payload.authorization_code != VALID_AUTHORIZATION_CODE:
        # Log failed attempt
        case.failed_attempts = (case.failed_attempts or 0) + 1
        db.add(_make_event("AUTHORIZATION_FAILED", circular))
        db.commit()
        db.refresh(case)

        raise HTTPException(
            status_code=401,
            detail={
                "error": "Invalid Authorization Code",
                "message": "The authorization code you entered is incorrect. Please verify and try again.",
                "case_id": case_id,
                "status": case.status,
                "failed_attempts": case.failed_attempts,
            },
        )

    # ── 5. Authorization PASSED ───────────────────────────────────────────────
    now_utc = datetime.now(timezone.utc)
    authorization_hash = hashlib.sha256(
        f"{case_id}|{x_actor}|{now_utc.isoformat()}|{circular.reference_number}".encode("utf-8")
    ).hexdigest()

    case.status = models.COMPLIANCE_STATUS_COMPLETED
    case.authorized_by = f"{x_actor} ({x_user_role})"
    case.authorized_at = now_utc
    case.authorization_hash = authorization_hash
    case.regulation_title = circular.title

    # ── 6. Write audit event ──────────────────────────────────────────────────
    db.add(_make_event("COMPLIANCE_AUTHORIZED", circular))

    db.commit()
    db.refresh(case)

    return schemas.AuthorizationResponse(
        case_id=case_id,
        status=case.status,
        message="Compliance Case Successfully Authorized",
        authorized_by=case.authorized_by,
        authorized_at=case.authorized_at.isoformat() if case.authorized_at else None,
        authorization_hash=case.authorization_hash,
        failed_attempts=case.failed_attempts,
    )


# ---------------------------------------------------------------------------
# GET /api/v1/compliance/{case_id}/status
# ---------------------------------------------------------------------------
@router.get("/{case_id}/status", response_model=schemas.ComplianceCaseOut)
def get_compliance_case_status(case_id: str, db: Session = Depends(get_db)):
    """Return the current authorization lifecycle state for a compliance case."""
    circular = (
        db.query(models.Circular)
        .filter(models.Circular.reference_number == case_id)
        .first()
    )
    if not circular:
        raise HTTPException(status_code=404, detail=f"Compliance case '{case_id}' not found.")

    case = _get_or_create_case(db, circular)
    return case


# ---------------------------------------------------------------------------
# GET /api/v1/compliance/cases/all
# ---------------------------------------------------------------------------
@router.get("/cases/all")
def list_all_compliance_cases(db: Session = Depends(get_db)):
    """Return all known compliance cases so the frontend can populate the case selector."""
    # Auto-create a ComplianceCase for every published circular that lacks one
    published = (
        db.query(models.Circular)
        .filter(models.Circular.status == "Published")
        .order_by(models.Circular.published_at.desc())
        .all()
    )
    results = []
    for circular in published:
        case = _get_or_create_case(db, circular)
        results.append({
            "case_id": case.case_id,
            "regulation_id": case.regulation_id,
            "regulation_title": case.regulation_title or circular.title,
            "status": case.status,
            "authorized_by": case.authorized_by,
            "authorized_at": case.authorized_at.isoformat() if case.authorized_at else None,
            "authorization_hash": case.authorization_hash,
            "failed_attempts": case.failed_attempts,
            "priority": circular.priority,
        })
    return results
