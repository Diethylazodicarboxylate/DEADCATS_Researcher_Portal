from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from core.database import Base


class Operation(Base):
    __tablename__ = "operations"

    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String(140), nullable=False)
    slug        = Column(String(160), unique=True, nullable=False, index=True)
    summary     = Column(Text, default="")
    status      = Column(String(30), default="active")
    priority    = Column(String(20), default="medium")
    lead_handle = Column(String(50), default="")
    whiteboard_room_url = Column(String(500), nullable=True)
    created_by  = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    updated_at  = Column(DateTime(timezone=True), onupdate=func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "summary": self.summary or "",
            "status": self.status or "active",
            "priority": self.priority or "medium",
            "lead_handle": self.lead_handle or "",
            "whiteboard_room_url": self.whiteboard_room_url,
            "created_by": self.created_by,
            "created_at": str(self.created_at),
            "updated_at": str(self.updated_at) if self.updated_at else None,
        }
