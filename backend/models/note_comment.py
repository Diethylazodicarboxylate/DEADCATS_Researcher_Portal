from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func

from core.database import Base


class NoteComment(Base):
    __tablename__ = "note_comments"

    id = Column(Integer, primary_key=True, index=True)
    note_id = Column(Integer, ForeignKey("notes.id"), nullable=False, index=True)
    parent_id = Column(Integer, ForeignKey("note_comments.id"), nullable=True)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    author_handle = Column(String(50), nullable=False)
    content = Column(Text, nullable=False)
    resolved = Column(Boolean, default=False, nullable=False)
    resolved_by = Column(String(50), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "note_id": self.note_id,
            "parent_id": self.parent_id,
            "author_id": self.author_id,
            "author_handle": self.author_handle,
            "content": self.content or "",
            "resolved": bool(self.resolved),
            "resolved_by": self.resolved_by,
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
