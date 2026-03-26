from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Date, Boolean
from sqlalchemy.sql import func

from core.database import Base


class ResearchAdventureProfile(Base):
    __tablename__ = "research_adventure_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True, index=True)
    pathway_key = Column(String(40), nullable=False)
    selected_at = Column(DateTime(timezone=True), server_default=func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "pathway_key": self.pathway_key,
            "selected_at": str(self.selected_at) if self.selected_at else None,
        }


class UserAdventureSkill(Base):
    __tablename__ = "user_adventure_skills"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    skill_id = Column(String(80), nullable=False, index=True)
    points_awarded = Column(Integer, nullable=False, default=0)
    unlocked_at = Column(DateTime(timezone=True), server_default=func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "skill_id": self.skill_id,
            "points_awarded": self.points_awarded,
            "unlocked_at": str(self.unlocked_at) if self.unlocked_at else None,
        }


class AdventureDailyTask(Base):
    __tablename__ = "adventure_daily_tasks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(140), nullable=False)
    points = Column(Integer, nullable=False, default=10)
    due_date = Column(Date, nullable=False, index=True)
    status = Column(String(20), nullable=False, default="pending")
    penalty_applied = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "points": self.points,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "status": self.status,
            "penalty_applied": self.penalty_applied,
            "created_at": str(self.created_at) if self.created_at else None,
            "completed_at": str(self.completed_at) if self.completed_at else None,
        }
