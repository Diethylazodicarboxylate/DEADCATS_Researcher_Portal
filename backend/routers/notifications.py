from fastapi import APIRouter, Depends
from sqlalchemy import or_
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import get_current_user
from models.announcement import Announcement
from models.audit_event import AuditEvent
from models.user import User

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("/")
def list_notifications(
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    announcements = (
        db.query(Announcement)
        .order_by(Announcement.created_at.desc())
        .limit(20)
        .all()
    )
    events = (
        db.query(AuditEvent)
        .filter(
            or_(
                AuditEvent.visibility == "team",
                AuditEvent.recipient_id == current.id,
                AuditEvent.actor_id == current.id,
            )
        )
        .order_by(AuditEvent.created_at.desc(), AuditEvent.id.desc())
        .limit(40)
        .all()
    )

    items = []
    for ann in announcements:
        items.append({
            "id": f"announcement-{ann.id}",
            "title": ann.title,
            "summary": ann.content or "",
            "type": ann.type or "notice",
            "author": ann.author,
            "href": "dashboard.html",
            "created_at": ann.created_at.isoformat() if ann.created_at else None,
        })
    for ev in events:
        items.append({
            "id": f"audit-{ev.id}",
            "title": ev.title,
            "summary": ev.summary or "",
            "type": ev.kind,
            "author": ev.actor_handle or "system",
            "href": ev.href or "dashboard.html",
            "created_at": ev.created_at.isoformat() if ev.created_at else None,
        })
    items.sort(key=lambda item: item.get("created_at") or "", reverse=True)
    return items[:50]
