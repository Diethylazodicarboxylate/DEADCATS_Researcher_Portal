from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from core.database import Base

class Folder(Base):
    __tablename__ = "folders"

    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String(100), nullable=False)
    parent_id  = Column(Integer, ForeignKey("folders.id"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def to_dict(self):
        return {
            "id":         self.id,
            "name":       self.name,
            "parent_id":  self.parent_id,
            "created_by": self.created_by,
            "created_at": str(self.created_at),
        }

class Note(Base):
    __tablename__ = "notes"

    id             = Column(Integer, primary_key=True, index=True)
    title          = Column(String(200), nullable=False)
    content        = Column(Text, default="")
    folder_id      = Column(Integer, ForeignKey("folders.id"), nullable=True)
    author_id      = Column(Integer, ForeignKey("users.id"))
    author_handle  = Column(String(50))
    tags           = Column(String(500), default="")   # comma separated
    published      = Column(Boolean, default=False)
    note_type      = Column(String(50), default="research-note")
    research_phase = Column(String(50), default="triage")
    target_name    = Column(String(200), default="")
    severity       = Column(String(30), default="info")
    tlp            = Column(String(20), default="team")
    review_status  = Column(String(30), default="draft")
    review_notes   = Column(Text, default="")
    reviewed_by    = Column(String(50), default="")
    reviewed_at    = Column(DateTime(timezone=True), nullable=True)
    submitted_at   = Column(DateTime(timezone=True), nullable=True)
    public_title   = Column(String(200), nullable=True)
    public_slug    = Column(String(220), unique=True, nullable=True)
    published_at   = Column(DateTime(timezone=True), nullable=True)
    created_at     = Column(DateTime(timezone=True), server_default=func.now())
    updated_at     = Column(DateTime(timezone=True), onupdate=func.now())

    def to_dict(self):
        return {
            "id":            self.id,
            "title":         self.title,
            "content":       self.content,
            "folder_id":     self.folder_id,
            "author_id":     self.author_id,
            "author_handle": self.author_handle,
            "tags":          self.tags.split(",") if self.tags else [],
            "published":     self.published,
            "note_type":     self.note_type,
            "research_phase": self.research_phase,
            "target_name":   self.target_name or "",
            "severity":      self.severity or "info",
            "tlp":           self.tlp or "team",
            "review_status": self.review_status or "draft",
            "review_notes":  self.review_notes or "",
            "reviewed_by":   self.reviewed_by or "",
            "reviewed_at":   str(self.reviewed_at) if self.reviewed_at else None,
            "submitted_at":  str(self.submitted_at) if self.submitted_at else None,
            "public_title":  self.public_title,
            "public_slug":   self.public_slug,
            "published_at":  str(self.published_at) if self.published_at else None,
            "created_at":    str(self.created_at),
            "updated_at":    str(self.updated_at) if self.updated_at else None,
        }
