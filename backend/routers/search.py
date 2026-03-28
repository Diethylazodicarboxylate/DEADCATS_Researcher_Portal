from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_, func
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import get_current_user
from models.ctf import CTFEvent
from models.ioc import IOC
from models.note import Note
from models.note_comment import NoteComment
from models.operation import Operation
from models.user import User
from models.vault import VaultFile

router = APIRouter(prefix="/api/search", tags=["search"])


def _excerpt(text: str | None, limit: int = 180) -> str:
    content = (text or "").strip()
    if len(content) <= limit:
        return content
    return content[:limit].rstrip() + "..."


@router.get("/")
def unified_search(
    q: str = Query(..., min_length=2, max_length=120),
    limit: int = Query(8, ge=1, le=20),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = q.strip().lower()
    like = f"%{query}%"
    operation_map = {row.id: row.name for row in db.query(Operation).all()}
    note_title_map = {row.id: row.title for row in db.query(Note.id, Note.title).all()}

    notes = (
        db.query(Note)
        .filter(
            or_(
                func.lower(Note.title).like(like),
                func.lower(Note.content).like(like),
                func.lower(Note.author_handle).like(like),
                func.lower(Note.tags).like(like),
                func.lower(Note.target_name).like(like),
            )
        )
        .order_by(Note.updated_at.desc().nullslast(), Note.created_at.desc())
        .limit(limit)
        .all()
    )
    operations = (
        db.query(Operation)
        .filter(
            or_(
                func.lower(Operation.name).like(like),
                func.lower(Operation.summary).like(like),
                func.lower(Operation.lead_handle).like(like),
            )
        )
        .order_by(Operation.updated_at.desc().nullslast(), Operation.created_at.desc())
        .limit(limit)
        .all()
    )
    iocs = (
        db.query(IOC)
        .filter(
            or_(
                func.lower(IOC.value).like(like),
                func.lower(IOC.type).like(like),
                func.lower(IOC.notes).like(like),
                func.lower(IOC.tags).like(like),
                func.lower(IOC.author).like(like),
            )
        )
        .order_by(IOC.created_at.desc())
        .limit(limit)
        .all()
    )
    files = (
        db.query(VaultFile)
        .filter(
            or_(
                func.lower(VaultFile.original_name).like(like),
                func.lower(VaultFile.description).like(like),
                func.lower(VaultFile.tags).like(like),
                func.lower(VaultFile.author).like(like),
                func.lower(VaultFile.sha256).like(like),
            )
        )
        .order_by(VaultFile.created_at.desc())
        .limit(limit)
        .all()
    )
    ctf_events = (
        db.query(CTFEvent)
        .filter(
            or_(
                func.lower(CTFEvent.title).like(like),
                func.lower(CTFEvent.description).like(like),
                func.lower(CTFEvent.format).like(like),
                func.lower(CTFEvent.added_by).like(like),
            )
        )
        .order_by(CTFEvent.start_time.desc().nullslast(), CTFEvent.created_at.desc())
        .limit(limit)
        .all()
    )
    comments = (
        db.query(NoteComment)
        .filter(
            or_(
                func.lower(NoteComment.content).like(like),
                func.lower(NoteComment.author_handle).like(like),
            )
        )
        .order_by(NoteComment.updated_at.desc().nullslast(), NoteComment.created_at.desc())
        .limit(limit)
        .all()
    )

    return {
        "query": q,
        "notes": [
            {
                "id": row.id,
                "title": row.title,
                "excerpt": _excerpt(row.content),
                "author": row.author_handle,
                "operation_id": row.operation_id,
                "operation_name": operation_map.get(row.operation_id, ""),
                "updated_at": str(row.updated_at) if row.updated_at else str(row.created_at),
                "href": f"library.html?note_id={row.id}",
            }
            for row in notes
        ],
        "operations": [
            {
                "id": row.id,
                "title": row.name,
                "excerpt": _excerpt(row.summary),
                "author": row.lead_handle,
                "updated_at": str(row.updated_at) if row.updated_at else str(row.created_at),
                "href": f"operations.html?id={row.id}",
            }
            for row in operations
        ],
        "iocs": [
            {
                "id": row.id,
                "title": row.value,
                "excerpt": _excerpt(row.notes),
                "author": row.author,
                "operation_id": row.operation_id,
                "operation_name": operation_map.get(row.operation_id, ""),
                "updated_at": str(row.created_at),
                "href": f"ioc-tracker.html?operation_id={row.operation_id}" if row.operation_id else "ioc-tracker.html",
            }
            for row in iocs
        ],
        "files": [
            {
                "id": row.id,
                "title": row.original_name,
                "excerpt": _excerpt(row.description),
                "author": row.author,
                "operation_id": row.operation_id,
                "operation_name": operation_map.get(row.operation_id, ""),
                "updated_at": str(row.created_at),
                "href": f"vault.html?operation_id={row.operation_id}" if row.operation_id else "vault.html",
            }
            for row in files
        ],
        "ctf_events": [
            {
                "id": row.id,
                "title": row.title,
                "excerpt": _excerpt(row.description),
                "author": row.added_by,
                "operation_id": row.operation_id,
                "operation_name": operation_map.get(row.operation_id, ""),
                "updated_at": str(row.created_at),
                "href": f"ctf.html?operation_id={row.operation_id}" if row.operation_id else "ctf.html",
            }
            for row in ctf_events
        ],
        "comments": [
            {
                "id": row.id,
                "title": note_title_map.get(row.note_id, "Note discussion"),
                "excerpt": _excerpt(row.content),
                "author": row.author_handle,
                "note_id": row.note_id,
                "updated_at": str(row.updated_at) if row.updated_at else str(row.created_at),
                "href": f"library.html?note_id={row.note_id}",
            }
            for row in comments
        ],
    }
