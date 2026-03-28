from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import get_current_user
from models.audit_event import AuditEvent
from models.user import User

router = APIRouter(prefix="/api/audit", tags=["audit"])


@router.get("/")
def list_audit_events(
    kind: str | None = Query(None),
    operation_id: int | None = Query(None),
    mine: bool = Query(False),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    query = db.query(AuditEvent)
    if not current.is_admin:
        query = query.filter(
            or_(
                AuditEvent.visibility == "team",
                AuditEvent.recipient_id == current.id,
                AuditEvent.actor_id == current.id,
            )
        )
    if kind:
        query = query.filter(AuditEvent.kind == kind)
    if operation_id is not None:
        query = query.filter(AuditEvent.operation_id == operation_id)
    if mine:
        query = query.filter(
            or_(
                AuditEvent.recipient_id == current.id,
                AuditEvent.actor_id == current.id,
            )
        )
    rows = query.order_by(AuditEvent.created_at.desc(), AuditEvent.id.desc()).limit(limit).all()
    return [row.to_dict() for row in rows]
