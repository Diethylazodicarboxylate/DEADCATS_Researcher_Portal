from core.validation import clean_text
from models.audit_event import AuditEvent


def log_audit_event(
    db,
    *,
    kind: str,
    action: str,
    title: str,
    summary: str = "",
    actor=None,
    target_type: str = "",
    target_id: int | None = None,
    note_id: int | None = None,
    operation_id: int | None = None,
    recipient_id: int | None = None,
    href: str = "",
    visibility: str = "team",
):
    event = AuditEvent(
        kind=clean_text(kind, field="audit_kind", max_len=40),
        action=clean_text(action, field="audit_action", max_len=60),
        title=clean_text(title, field="audit_title", max_len=200),
        summary=clean_text(summary or "", field="audit_summary", max_len=4000, strip=False),
        actor_id=getattr(actor, "id", None),
        actor_handle=getattr(actor, "handle", "") or "",
        target_type=clean_text(target_type or "", field="audit_target_type", max_len=40),
        target_id=target_id,
        note_id=note_id,
        operation_id=operation_id,
        recipient_id=recipient_id,
        href=clean_text(href or "", field="audit_href", max_len=500),
        visibility=clean_text(visibility or "team", field="audit_visibility", max_len=20),
    )
    db.add(event)
    return event
