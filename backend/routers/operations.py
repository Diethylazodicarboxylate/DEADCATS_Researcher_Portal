import re
import secrets
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func, case
from sqlalchemy.orm import Session

from core.audit import log_audit_event
from core.database import get_db
from core.security import get_current_user
from core.validation import clean_text, reject_html
from models.ctf import CTFEvent
from models.goal import TeamGoal
from models.ioc import IOC
from models.note import Note
from models.operation import Operation
from models.user import User
from models.vault import VaultFile

router = APIRouter(prefix="/api/operations", tags=["operations"])

ALLOWED_STATUSES = {"active", "planning", "on_hold", "closed", "archived"}
ALLOWED_PRIORITIES = {"low", "medium", "high", "critical"}


def _generate_room_url() -> str:
    room_id = secrets.token_hex(10)
    enc_key = secrets.token_urlsafe(16)[:22]
    return f"https://excalidraw.com/#room={room_id},{enc_key}"


class CreateOperationRequest(BaseModel):
    name: str = Field(min_length=1, max_length=140)
    summary: Optional[str] = Field(default="", max_length=2000)
    status: Optional[str] = Field(default="active", max_length=30)
    priority: Optional[str] = Field(default="medium", max_length=20)
    lead_handle: Optional[str] = Field(default="", max_length=50)


class UpdateOperationRequest(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=140)
    summary: Optional[str] = Field(default=None, max_length=2000)
    status: Optional[str] = Field(default=None, max_length=30)
    priority: Optional[str] = Field(default=None, max_length=20)
    lead_handle: Optional[str] = Field(default=None, max_length=50)


def _normalize_choice(value: Optional[str], *, allowed: set[str], field: str, fallback: str) -> str:
    cleaned = clean_text(value or fallback, field=field, max_len=max(len(item) for item in allowed))
    normalized = cleaned.strip().lower()
    if normalized not in allowed:
        raise HTTPException(status_code=400, detail=f"Invalid {field}")
    return normalized


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    slug = re.sub(r"-{2,}", "-", slug)
    return slug[:160].strip("-")


def _ensure_unique_slug(db: Session, base: str, *, operation_id: int | None = None) -> str:
    slug = base or "operation"
    candidate = slug
    counter = 2
    query = db.query(Operation)
    while query.filter(Operation.slug == candidate, Operation.id != operation_id).first():
        suffix = f"-{counter}"
        candidate = f"{slug[:max(1, 160 - len(suffix))]}{suffix}"
        counter += 1
    return candidate


def _serialize_operation(operation: Operation, *, note_count: int = 0, published_count: int = 0) -> dict:
    data = operation.to_dict()
    data["note_count"] = int(note_count)
    data["published_count"] = int(published_count)
    return data


def _ioc_stats_map(db: Session) -> dict[int, int]:
    rows = (
        db.query(
            IOC.operation_id,
            func.count(IOC.id).label("ioc_count"),
        )
        .filter(IOC.operation_id.is_not(None))
        .group_by(IOC.operation_id)
        .all()
    )
    return {int(row.operation_id): int(row.ioc_count or 0) for row in rows if row.operation_id is not None}


def _operation_stats_map(db: Session) -> dict[int, dict[str, int]]:
    rows = (
        db.query(
            Note.operation_id,
            func.count(Note.id).label("note_count"),
            func.sum(case((Note.published.is_(True), 1), else_=0)).label("published_count"),
        )
        .filter(Note.operation_id.is_not(None))
        .group_by(Note.operation_id)
        .all()
    )
    return {
        int(row.operation_id): {
            "note_count": int(row.note_count or 0),
            "published_count": int(row.published_count or 0),
        }
        for row in rows if row.operation_id is not None
    }


def _vault_stats_map(db: Session) -> dict[int, int]:
    rows = (
        db.query(
            VaultFile.operation_id,
            func.count(VaultFile.id).label("file_count"),
        )
        .filter(VaultFile.operation_id.is_not(None))
        .group_by(VaultFile.operation_id)
        .all()
    )
    return {int(row.operation_id): int(row.file_count or 0) for row in rows if row.operation_id is not None}


def _goal_stats_map(db: Session) -> dict[int, int]:
    rows = (
        db.query(
            TeamGoal.operation_id,
            func.count(TeamGoal.id).label("goal_count"),
        )
        .filter(TeamGoal.operation_id.is_not(None))
        .group_by(TeamGoal.operation_id)
        .all()
    )
    return {int(row.operation_id): int(row.goal_count or 0) for row in rows if row.operation_id is not None}


def _ctf_stats_map(db: Session) -> dict[int, int]:
    rows = (
        db.query(
            CTFEvent.operation_id,
            func.count(CTFEvent.id).label("ctf_count"),
        )
        .filter(CTFEvent.operation_id.is_not(None))
        .group_by(CTFEvent.operation_id)
        .all()
    )
    return {int(row.operation_id): int(row.ctf_count or 0) for row in rows if row.operation_id is not None}


def _serialize_activity_item(kind: str, payload: dict, *, operation_name: str = "") -> dict:
    return {
        "kind": kind,
        "id": payload.get("id"),
        "title": payload.get("title") or payload.get("value") or payload.get("original_name") or "Untitled",
        "author": payload.get("author_handle") or payload.get("author") or payload.get("created_by") or payload.get("added_by") or "",
        "operation_name": operation_name,
        "created_at": payload.get("updated_at") or payload.get("created_at"),
        "meta": payload,
    }


@router.get("/")
def list_operations(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    stats_map = _operation_stats_map(db)
    ioc_map = _ioc_stats_map(db)
    vault_map = _vault_stats_map(db)
    goal_map = _goal_stats_map(db)
    ctf_map = _ctf_stats_map(db)
    operations = (
        db.query(Operation)
        .order_by(
            Operation.status.asc(),
            Operation.priority.desc(),
            Operation.updated_at.desc().nullslast(),
            Operation.created_at.desc(),
        )
        .all()
    )
    return [
        _serialize_operation(
            operation,
            note_count=stats_map.get(operation.id, {}).get("note_count", 0),
            published_count=stats_map.get(operation.id, {}).get("published_count", 0),
        )
        | {
            "ioc_count": ioc_map.get(operation.id, 0),
            "file_count": vault_map.get(operation.id, 0),
            "goal_count": goal_map.get(operation.id, 0),
            "ctf_count": ctf_map.get(operation.id, 0),
        }
        for operation in operations
    ]


@router.get("/activity")
def list_activity(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    operation_map = {row.id: row.name for row in db.query(Operation).all()}
    notes = db.query(Note).order_by(Note.updated_at.desc().nullslast(), Note.created_at.desc()).limit(10).all()
    iocs = db.query(IOC).order_by(IOC.created_at.desc()).limit(10).all()
    files = db.query(VaultFile).order_by(VaultFile.created_at.desc()).limit(10).all()
    goals = db.query(TeamGoal).filter(TeamGoal.operation_id.is_not(None)).order_by(TeamGoal.created_at.desc()).limit(10).all()
    ctf_events = db.query(CTFEvent).filter(CTFEvent.operation_id.is_not(None)).order_by(CTFEvent.start_time.desc().nullslast(), CTFEvent.created_at.desc()).limit(10).all()
    items = []
    for note in notes:
        payload = note.to_dict()
        items.append(_serialize_activity_item("note", payload, operation_name=operation_map.get(payload.get("operation_id"), "")))
    for ioc in iocs:
        payload = ioc.to_dict()
        items.append(_serialize_activity_item("ioc", payload, operation_name=operation_map.get(payload.get("operation_id"), "")))
    for file in files:
        payload = file.to_dict()
        items.append(_serialize_activity_item("vault_file", payload, operation_name=operation_map.get(payload.get("operation_id"), "")))
    for goal in goals:
        payload = goal.to_dict()
        items.append(_serialize_activity_item("goal", payload | {"title": payload.get("text")}, operation_name=operation_map.get(payload.get("operation_id"), "")))
    for event in ctf_events:
        payload = event.to_dict()
        items.append(_serialize_activity_item("ctf_event", payload, operation_name=operation_map.get(payload.get("operation_id"), "")))
    items.sort(key=lambda item: item.get("created_at") or "", reverse=True)
    return items[:18]


@router.get("/{operation_id}")
def get_operation(
    operation_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    operation = db.query(Operation).filter(Operation.id == operation_id).first()
    if not operation:
        raise HTTPException(status_code=404, detail="Operation not found")
    note_stats = _operation_stats_map(db).get(operation.id, {})
    ioc_count = _ioc_stats_map(db).get(operation.id, 0)
    file_count = _vault_stats_map(db).get(operation.id, 0)
    goal_count = _goal_stats_map(db).get(operation.id, 0)
    ctf_count = _ctf_stats_map(db).get(operation.id, 0)
    note_rows = (
        db.query(Note)
        .filter(Note.operation_id == operation.id)
        .order_by(Note.updated_at.desc().nullslast(), Note.created_at.desc())
        .limit(8)
        .all()
    )
    ioc_rows = (
        db.query(IOC)
        .filter(IOC.operation_id == operation.id)
        .order_by(IOC.created_at.desc())
        .limit(12)
        .all()
    )
    file_rows = (
        db.query(VaultFile)
        .filter(VaultFile.operation_id == operation.id)
        .order_by(VaultFile.created_at.desc())
        .limit(10)
        .all()
    )
    goal_rows = (
        db.query(TeamGoal)
        .filter(TeamGoal.operation_id == operation.id)
        .order_by(TeamGoal.completed.asc(), TeamGoal.created_at.asc())
        .limit(12)
        .all()
    )
    ctf_rows = (
        db.query(CTFEvent)
        .filter(CTFEvent.operation_id == operation.id)
        .order_by(CTFEvent.start_time.desc().nullslast(), CTFEvent.created_at.desc())
        .limit(12)
        .all()
    )
    data = _serialize_operation(
        operation,
        note_count=note_stats.get("note_count", 0),
        published_count=note_stats.get("published_count", 0),
    )
    data["ioc_count"] = ioc_count
    data["file_count"] = file_count
    data["goal_count"] = goal_count
    data["ctf_count"] = ctf_count
    data["notes"] = [note.to_dict() for note in note_rows]
    data["iocs"] = [ioc.to_dict() for ioc in ioc_rows]
    data["files"] = [vf.to_dict() for vf in file_rows]
    data["goals"] = [goal.to_dict() for goal in goal_rows]
    data["ctf_events"] = [event.to_dict() for event in ctf_rows]
    activity = []
    for note in note_rows:
        payload = note.to_dict()
        activity.append(_serialize_activity_item("note", payload, operation_name=operation.name))
    for ioc in ioc_rows:
        payload = ioc.to_dict()
        activity.append(_serialize_activity_item("ioc", payload, operation_name=operation.name))
    for vf in file_rows:
        payload = vf.to_dict()
        activity.append(_serialize_activity_item("vault_file", payload, operation_name=operation.name))
    for goal in goal_rows:
        payload = goal.to_dict()
        activity.append(_serialize_activity_item("goal", payload | {"title": payload.get("text")}, operation_name=operation.name))
    for event in ctf_rows:
        payload = event.to_dict()
        activity.append(_serialize_activity_item("ctf_event", payload, operation_name=operation.name))
    activity.sort(key=lambda item: item.get("created_at") or "", reverse=True)
    data["activity"] = activity[:16]
    return data


@router.get("/{operation_id}/war-room")
def get_operation_war_room(
    operation_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    operation = db.query(Operation).filter(Operation.id == operation_id).first()
    if not operation:
        raise HTTPException(status_code=404, detail="Operation not found")
    if not operation.whiteboard_room_url:
        operation.whiteboard_room_url = _generate_room_url()
        db.commit()
        db.refresh(operation)
    return {
        "operation_id": operation.id,
        "operation_name": operation.name,
        "room_url": operation.whiteboard_room_url,
    }


@router.post("/{operation_id}/war-room/reset")
def reset_operation_war_room(
    operation_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    operation = db.query(Operation).filter(Operation.id == operation_id).first()
    if not operation:
        raise HTTPException(status_code=404, detail="Operation not found")
    if operation.created_by != current.id and not current.is_admin:
        raise HTTPException(status_code=403, detail="Only the creator or an admin can reset this war room")
    operation.whiteboard_room_url = _generate_room_url()
    db.commit()
    db.refresh(operation)
    return {
        "operation_id": operation.id,
        "operation_name": operation.name,
        "room_url": operation.whiteboard_room_url,
    }


@router.get("/slug/{slug}")
def get_operation_by_slug(
    slug: str,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    operation = db.query(Operation).filter(Operation.slug == slug).first()
    if not operation:
        raise HTTPException(status_code=404, detail="Operation not found")
    return get_operation(operation.id, db, current)


@router.post("/", status_code=201)
def create_operation(
    payload: CreateOperationRequest,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    name = reject_html(clean_text(payload.name, field="Operation name", max_len=140), field="Operation name")
    summary = clean_text(payload.summary or "", field="summary", max_len=2000, strip=False)
    status = _normalize_choice(payload.status, allowed=ALLOWED_STATUSES, field="status", fallback="active")
    priority = _normalize_choice(payload.priority, allowed=ALLOWED_PRIORITIES, field="priority", fallback="medium")
    lead_handle = reject_html(clean_text(payload.lead_handle or current.handle, field="lead_handle", max_len=50), field="lead_handle")
    slug = _ensure_unique_slug(db, _slugify(name))
    operation = Operation(
        name=name,
        slug=slug,
        summary=summary,
        status=status,
        priority=priority,
        lead_handle=lead_handle,
        whiteboard_room_url=_generate_room_url(),
        created_by=current.id,
    )
    db.add(operation)
    db.flush()
    log_audit_event(
        db,
        kind="operation",
        action="created",
        title=f"Operation created: {operation.name}",
        summary=operation.summary or "",
        actor=current,
        target_type="operation",
        target_id=operation.id,
        operation_id=operation.id,
        href=f"operations.html?id={operation.id}",
    )
    db.commit()
    db.refresh(operation)
    return _serialize_operation(operation)


@router.patch("/{operation_id}")
def update_operation(
    operation_id: int,
    payload: UpdateOperationRequest,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    operation = db.query(Operation).filter(Operation.id == operation_id).first()
    if not operation:
        raise HTTPException(status_code=404, detail="Operation not found")
    if operation.created_by != current.id and not current.is_admin:
        raise HTTPException(status_code=403, detail="Only the creator or an admin can edit this operation")

    changes = payload.model_dump(exclude_none=True)
    if "name" in changes:
        operation.name = reject_html(clean_text(changes["name"], field="Operation name", max_len=140), field="Operation name")
        operation.slug = _ensure_unique_slug(db, _slugify(operation.name), operation_id=operation.id)
    if "summary" in changes:
        operation.summary = clean_text(changes["summary"] or "", field="summary", max_len=2000, strip=False)
    if "status" in changes:
        operation.status = _normalize_choice(changes["status"], allowed=ALLOWED_STATUSES, field="status", fallback="active")
    if "priority" in changes:
        operation.priority = _normalize_choice(changes["priority"], allowed=ALLOWED_PRIORITIES, field="priority", fallback="medium")
    if "lead_handle" in changes:
        operation.lead_handle = reject_html(clean_text(changes["lead_handle"] or "", field="lead_handle", max_len=50), field="lead_handle")
    log_audit_event(
        db,
        kind="operation",
        action="updated",
        title=f"Operation updated: {operation.name}",
        summary=operation.summary or "",
        actor=current,
        target_type="operation",
        target_id=operation.id,
        operation_id=operation.id,
        href=f"operations.html?id={operation.id}",
    )
    db.commit()
    db.refresh(operation)
    stats = _operation_stats_map(db).get(operation.id, {})
    return _serialize_operation(operation, note_count=stats.get("note_count", 0), published_count=stats.get("published_count", 0))


@router.delete("/{operation_id}")
def delete_operation(
    operation_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    operation = db.query(Operation).filter(Operation.id == operation_id).first()
    if not operation:
        raise HTTPException(status_code=404, detail="Operation not found")
    if operation.created_by != current.id and not current.is_admin:
        raise HTTPException(status_code=403, detail="Only the creator or an admin can delete this operation")
    db.query(Note).filter(Note.operation_id == operation_id).update({"operation_id": None})
    db.query(IOC).filter(IOC.operation_id == operation_id).update({"operation_id": None})
    db.query(VaultFile).filter(VaultFile.operation_id == operation_id).update({"operation_id": None})
    db.query(TeamGoal).filter(TeamGoal.operation_id == operation_id).update({"operation_id": None})
    db.query(CTFEvent).filter(CTFEvent.operation_id == operation_id).update({"operation_id": None})
    log_audit_event(
        db,
        kind="operation",
        action="deleted",
        title=f"Operation deleted: {operation.name}",
        actor=current,
        target_type="operation",
        target_id=operation.id,
        operation_id=operation.id,
        href="operations.html",
    )
    db.delete(operation)
    db.commit()
    return {"message": "Operation deleted"}
