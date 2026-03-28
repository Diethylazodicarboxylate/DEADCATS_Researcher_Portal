from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func

from core.database import Base


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, index=True)
    kind = Column(String(40), nullable=False)
    action = Column(String(60), nullable=False)
    title = Column(String(200), nullable=False)
    summary = Column(Text, default="")
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    actor_handle = Column(String(50), default="")
    target_type = Column(String(40), default="")
    target_id = Column(Integer, nullable=True)
    note_id = Column(Integer, ForeignKey("notes.id"), nullable=True)
    operation_id = Column(Integer, ForeignKey("operations.id"), nullable=True)
    recipient_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    href = Column(String(500), default="")
    visibility = Column(String(20), default="team")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "kind": self.kind,
            "action": self.action,
            "title": self.title,
            "summary": self.summary or "",
            "actor_id": self.actor_id,
            "actor_handle": self.actor_handle or "",
            "target_type": self.target_type or "",
            "target_id": self.target_id,
            "note_id": self.note_id,
            "operation_id": self.operation_id,
            "recipient_id": self.recipient_id,
            "href": self.href or "",
            "visibility": self.visibility or "team",
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
