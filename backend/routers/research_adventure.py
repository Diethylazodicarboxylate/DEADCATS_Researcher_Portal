from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import get_current_user
from core.validation import clean_text, reject_html
from models.research_adventure import AdventureDailyTask, ResearchAdventureProfile, UserAdventureSkill
from models.user import User
from research_adventure_data import PATHWAYS, SEQUENCE_MILESTONES, SKILL_INDEX, SPECIALIZATIONS

router = APIRouter(prefix="/api/research-adventure", tags=["research_adventure"])


class SelectPathwayRequest(BaseModel):
    pathway_key: str = Field(min_length=3, max_length=40)


class UnlockSkillRequest(BaseModel):
    skill_id: str = Field(min_length=3, max_length=80)


class CreateDailyTaskRequest(BaseModel):
    title: str = Field(min_length=3, max_length=140)
    points: int = Field(default=15, ge=5, le=30)
    due_date: date | None = None


def _apply_overdue_penalties(db: Session, user_id: int):
    today = date.today()
    overdue = (
        db.query(AdventureDailyTask)
        .filter(
            AdventureDailyTask.user_id == user_id,
            AdventureDailyTask.status == "pending",
            AdventureDailyTask.penalty_applied == False,
            AdventureDailyTask.due_date < today,
        )
        .all()
    )
    changed = False
    for task in overdue:
        task.status = "missed"
        task.penalty_applied = True
        changed = True
    if changed:
        db.commit()


def _task_points_breakdown(db: Session, user_id: int) -> tuple[int, int]:
    tasks = db.query(AdventureDailyTask).filter(AdventureDailyTask.user_id == user_id).all()
    completed = sum(int(task.points or 0) for task in tasks if task.status == "completed")
    penalties = sum(int(task.points or 0) for task in tasks if task.status == "missed" and task.penalty_applied)
    return completed, penalties


def _sequence_for_points(points: int) -> dict:
    non_negative = max(points, 0)
    current = SEQUENCE_MILESTONES[0]
    next_step = None
    for milestone in SEQUENCE_MILESTONES:
        if non_negative >= milestone["min_points"]:
            current = milestone
            continue
        next_step = milestone
        break
    return {
        "sequence": current["sequence"],
        "current_min_points": current["min_points"],
        "next_sequence": None if not next_step else next_step["sequence"],
        "next_min_points": None if not next_step else next_step["min_points"],
        "progress_points": non_negative - current["min_points"],
        "needed_points": 0 if not next_step else max(next_step["min_points"] - non_negative, 0),
    }


def _completion_summary(completed: int, total: int) -> dict:
    ratio = 1 if total <= 0 else round(completed / total, 4)
    return {
        "completed": completed,
        "total": total,
        "is_complete": total > 0 and completed == total,
        "ratio": ratio,
    }


def _roadmap_state(unlocked_map: dict[str, UserAdventureSkill]):
    unlocked_ids = set(unlocked_map)
    specializations = []
    specialization_summary = {}

    for specialization in SPECIALIZATIONS:
        specialization_points = 0
        specialization_leaf_total = 0
        specialization_leaf_done = 0
        level_nodes = []
        previous_level_complete = True

        for level_index, level in enumerate(specialization["levels"]):
            level_points = 0
            level_leaf_total = 0
            level_leaf_done = 0
            topic_nodes = []
            previous_topic_complete = True

            for topic_index, topic in enumerate(level["topics"]):
                topic_points = 0
                topic_leaf_total = len(topic["skills"])
                topic_leaf_done = 0
                skill_nodes = []
                topic_unlocked = (level_index == 0 and topic_index == 0) or (previous_level_complete and previous_topic_complete)

                for skill_index, skill in enumerate(topic["skills"]):
                    row = unlocked_map.get(skill["id"])
                    unlocked = row is not None
                    previous_skill_complete = skill_index == 0 or bool(unlocked_map.get(topic["skills"][skill_index - 1]["id"]))
                    available = topic_unlocked and previous_skill_complete and not unlocked
                    if unlocked:
                        topic_leaf_done += 1
                        topic_points += int(skill["points"])
                    skill_nodes.append(
                        {
                            **skill,
                            "kind": "skill",
                            "unlocked": unlocked,
                            "available": available,
                            "unlocked_at": str(row.unlocked_at) if row and row.unlocked_at else None,
                        }
                    )

                topic_completion = _completion_summary(topic_leaf_done, topic_leaf_total)
                previous_topic_complete = topic_completion["is_complete"]
                level_leaf_total += topic_leaf_total
                level_leaf_done += topic_leaf_done
                level_points += topic_points

                topic_nodes.append(
                    {
                        "id": topic["id"],
                        "kind": "topic",
                        "name": topic["name"],
                        "summary": topic["summary"],
                        "unlocked": topic_unlocked,
                        "available": topic_unlocked and not topic_completion["is_complete"],
                        "points_earned": topic_points,
                        "completion": topic_completion,
                        "skills": skill_nodes,
                    }
                )

            level_completion = _completion_summary(level_leaf_done, level_leaf_total)
            previous_level_complete = level_completion["is_complete"]
            specialization_leaf_total += level_leaf_total
            specialization_leaf_done += level_leaf_done
            specialization_points += level_points

            level_nodes.append(
                {
                    "id": level["id"],
                    "kind": "level",
                    "name": level["name"],
                    "title": level["title"],
                    "summary": level["summary"],
                    "unlocked": level_index == 0 or level_nodes[-1]["completion"]["is_complete"],
                    "available": level_index == 0 or level_nodes[-1]["completion"]["is_complete"],
                    "points_earned": level_points,
                    "completion": level_completion,
                    "topics": topic_nodes,
                }
            )

        specialization_completion = _completion_summary(specialization_leaf_done, specialization_leaf_total)
        specialization_summary[specialization["id"]] = specialization_completion
        specializations.append(
            {
                "id": specialization["id"],
                "kind": "specialization",
                "name": specialization["name"],
                "icon": specialization["icon"],
                "theme": specialization["theme"],
                "color": specialization["color"],
                "summary": specialization["summary"],
                "points_earned": specialization_points,
                "completion": specialization_completion,
                "levels": level_nodes,
            }
        )

    return specializations, specialization_summary, sorted(unlocked_ids)


def _profile_for_user(db: Session, user: User):
    _apply_overdue_penalties(db, user.id)
    profile = db.query(ResearchAdventureProfile).filter(ResearchAdventureProfile.user_id == user.id).first()
    unlocked_rows = db.query(UserAdventureSkill).filter(UserAdventureSkill.user_id == user.id).all()
    unlocked_map = {row.skill_id: row for row in unlocked_rows}
    skill_points = sum(int(row.points_awarded or 0) for row in unlocked_rows)
    task_points, penalty_points = _task_points_breakdown(db, user.id)
    total_points = skill_points + task_points - penalty_points
    seq_state = _sequence_for_points(total_points)
    pathway = PATHWAYS.get(profile.pathway_key) if profile else None

    specializations, specialization_summary, unlocked_skill_ids = _roadmap_state(unlocked_map)

    tasks = (
        db.query(AdventureDailyTask)
        .filter(AdventureDailyTask.user_id == user.id)
        .order_by(AdventureDailyTask.due_date.asc(), AdventureDailyTask.created_at.asc())
        .all()
    )

    sequence_entry = None
    if pathway:
        sequence_entry = next(
            (entry for entry in pathway["sequences"] if entry["sequence"] == seq_state["sequence"]),
            pathway["sequences"][0],
        )

    return {
        "selected": bool(profile),
        "pathway": pathway,
        "selected_at": str(profile.selected_at) if profile and profile.selected_at else None,
        "sequence": sequence_entry,
        "sequence_progress": seq_state,
        "points": {
            "total": total_points,
            "skills": skill_points,
            "daily_completed": task_points,
            "daily_penalties": penalty_points,
        },
        "unlocked_skill_ids": unlocked_skill_ids,
        "specializations": specializations,
        "specialization_completion": specialization_summary,
        "daily_tasks": [task.to_dict() for task in tasks],
        "limits": {
            "max_daily_tasks": 5,
            "daily_task_create_window": "tomorrow_only",
        },
    }


def _require_profile(db: Session, user: User) -> ResearchAdventureProfile:
    _apply_overdue_penalties(db, user.id)
    profile = db.query(ResearchAdventureProfile).filter(ResearchAdventureProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=409, detail="Choose a pathway before using Research Adventure")
    return profile


def _can_unlock(skill_id: str, state: dict) -> bool:
    for specialization in state["specializations"]:
        for level in specialization["levels"]:
            for topic in level["topics"]:
                for skill in topic["skills"]:
                    if skill["id"] == skill_id:
                        return bool(skill["available"])
    return False


@router.get("/meta")
def get_meta(_: User = Depends(get_current_user)):
    return {
        "pathways": list(PATHWAYS.values()),
        "sequence_milestones": SEQUENCE_MILESTONES,
        "specializations": SPECIALIZATIONS,
    }


@router.get("/me")
def get_my_adventure(db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    return _profile_for_user(db, current)


@router.get("/profile/{handle}")
def get_public_adventure_profile(
    handle: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    user = db.query(User).filter(User.handle == handle).first()
    if not user:
        raise HTTPException(status_code=404, detail="Member not found")
    return _profile_for_user(db, user)


@router.post("/select-pathway", status_code=status.HTTP_201_CREATED)
def select_pathway(
    payload: SelectPathwayRequest,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    pathway_key = clean_text(payload.pathway_key, field="pathway_key", max_len=40).strip().lower()
    if pathway_key not in PATHWAYS:
        raise HTTPException(status_code=400, detail="Unknown pathway")
    existing = db.query(ResearchAdventureProfile).filter(ResearchAdventureProfile.user_id == current.id).first()
    if existing:
        raise HTTPException(status_code=409, detail="Pathway already chosen and cannot be changed")
    profile = ResearchAdventureProfile(user_id=current.id, pathway_key=pathway_key)
    db.add(profile)
    db.commit()
    return _profile_for_user(db, current)


@router.post("/unlock-skill", status_code=status.HTTP_201_CREATED)
def unlock_skill(
    payload: UnlockSkillRequest,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    _require_profile(db, current)
    skill_id = clean_text(payload.skill_id, field="skill_id", max_len=80).strip()
    skill = SKILL_INDEX.get(skill_id)
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    existing = (
        db.query(UserAdventureSkill)
        .filter(UserAdventureSkill.user_id == current.id, UserAdventureSkill.skill_id == skill_id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="Skill already unlocked")

    state = _profile_for_user(db, current)
    if not _can_unlock(skill_id, state):
        raise HTTPException(status_code=400, detail="Complete the previous roadmap node first")

    row = UserAdventureSkill(user_id=current.id, skill_id=skill_id, points_awarded=int(skill["points"]))
    db.add(row)
    db.commit()
    return _profile_for_user(db, current)


@router.get("/daily-tasks")
def list_daily_tasks(db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    _require_profile(db, current)
    return _profile_for_user(db, current)["daily_tasks"]


@router.post("/daily-tasks", status_code=status.HTTP_201_CREATED)
def create_daily_task(
    payload: CreateDailyTaskRequest,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    _require_profile(db, current)
    tomorrow = date.today() + timedelta(days=1)
    due_date = payload.due_date or tomorrow
    if due_date != tomorrow:
        raise HTTPException(status_code=400, detail="Daily tasks can only be planned for tomorrow")
    active_count = (
        db.query(AdventureDailyTask)
        .filter(AdventureDailyTask.user_id == current.id, AdventureDailyTask.status == "pending")
        .count()
    )
    if active_count >= 5:
        raise HTTPException(status_code=400, detail="You can have at most 5 active daily tasks")
    task = AdventureDailyTask(
        user_id=current.id,
        title=reject_html(clean_text(payload.title, field="title", max_len=140), field="title"),
        points=int(payload.points),
        due_date=due_date,
    )
    db.add(task)
    db.commit()
    return _profile_for_user(db, current)


@router.post("/daily-tasks/{task_id}/complete")
def complete_daily_task(
    task_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    _require_profile(db, current)
    _apply_overdue_penalties(db, current.id)
    task = db.query(AdventureDailyTask).filter(AdventureDailyTask.id == task_id, AdventureDailyTask.user_id == current.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.status == "missed":
        raise HTTPException(status_code=400, detail="Missed tasks cannot be completed")
    task.status = "completed"
    task.completed_at = datetime.now(timezone.utc)
    db.commit()
    return _profile_for_user(db, current)


@router.delete("/daily-tasks/{task_id}")
def delete_daily_task(
    task_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    _require_profile(db, current)
    _apply_overdue_penalties(db, current.id)
    task = db.query(AdventureDailyTask).filter(AdventureDailyTask.id == task_id, AdventureDailyTask.user_id == current.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.status != "pending":
        raise HTTPException(status_code=400, detail="Only pending tasks can be deleted")
    db.delete(task)
    db.commit()
    return _profile_for_user(db, current)
