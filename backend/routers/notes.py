from datetime import datetime, timezone
import difflib
import re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional
from core.database import get_db
from core.security import get_current_user, require_admin
from core.validation import clean_text, reject_html
from models.note import Note, Folder, PublishFolder, NoteRevision
from models.note_comment import NoteComment
from models.operation import Operation
from models.user import User

router = APIRouter(prefix="/api/notes", tags=["notes"])

# ── Schemas ───────────────────────────────────────────────────────

class CreateFolderRequest(BaseModel):
    name:      str = Field(min_length=1, max_length=100)
    parent_id: Optional[int] = None

class CreatePublishFolderRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)

class CreateNoteRequest(BaseModel):
    title:          str = Field(min_length=1, max_length=200)
    content:        Optional[str] = Field(default="", max_length=50000)
    folder_id:      Optional[int] = None
    operation_id:   Optional[int] = None
    tags:           Optional[str] = Field(default="", max_length=500)
    note_type:      Optional[str] = Field(default="research-note", max_length=50)
    research_phase: Optional[str] = Field(default="triage", max_length=50)
    target_name:    Optional[str] = Field(default="", max_length=200)
    severity:       Optional[str] = Field(default="info", max_length=30)
    tlp:            Optional[str] = Field(default="team", max_length=20)

class UpdateNoteRequest(BaseModel):
    title:          Optional[str] = Field(default=None, min_length=1, max_length=200)
    content:        Optional[str] = Field(default=None, max_length=50000)
    folder_id:      Optional[int] = None
    operation_id:   Optional[int] = None
    tags:           Optional[str] = Field(default=None, max_length=500)
    note_type:      Optional[str] = Field(default=None, max_length=50)
    research_phase: Optional[str] = Field(default=None, max_length=50)
    target_name:    Optional[str] = Field(default=None, max_length=200)
    severity:       Optional[str] = Field(default=None, max_length=30)
    tlp:            Optional[str] = Field(default=None, max_length=20)
    base_updated_at: Optional[str] = Field(default=None, max_length=80)

class PublishNoteRequest(BaseModel):
    public_title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    published_by: Optional[str] = Field(default=None, min_length=1, max_length=120)
    publish_folder_id: int = Field(ge=1)
    slug:         Optional[str] = Field(default=None, min_length=3, max_length=220)

class ReviewNoteRequest(BaseModel):
    review_notes: Optional[str] = Field(default="", max_length=4000)


class NoteCommentCreateRequest(BaseModel):
    content: str = Field(min_length=1, max_length=4000)
    parent_id: Optional[int] = None


class NoteCommentUpdateRequest(BaseModel):
    content: Optional[str] = Field(default=None, min_length=1, max_length=4000)
    resolved: Optional[bool] = None


ALLOWED_NOTE_TYPES = {"research-note", "finding", "playbook", "paper-draft", "methodology"}
ALLOWED_RESEARCH_PHASES = {"triage", "recon", "analysis", "validation", "drafting", "published"}
ALLOWED_SEVERITIES = {"info", "low", "medium", "high", "critical"}
ALLOWED_TLP = {"team", "amber", "green", "white"}
ALLOWED_REVIEW_STATUSES = {"draft", "in_review", "changes_requested", "approved", "published"}


def _normalize_choice(value: Optional[str], *, allowed: set[str], field: str, fallback: str) -> str:
    cleaned = clean_text(value or fallback, field=field, max_len=max(len(x) for x in allowed))
    normalized = cleaned.strip().lower()
    if normalized not in allowed:
        raise HTTPException(status_code=400, detail=f"Invalid {field}")
    return normalized


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    slug = re.sub(r"-{2,}", "-", slug)
    return slug[:220].strip("-")


def _ensure_unique_slug(db: Session, base: str, note_id: int) -> str:
    slug = base or f"note-{note_id}"
    candidate = slug
    counter = 2
    while db.query(Note).filter(Note.public_slug == candidate, Note.id != note_id).first():
        suffix = f"-{counter}"
        candidate = f"{slug[:max(1, 220 - len(suffix))]}{suffix}"
        counter += 1
    return candidate


def _normalize_note_field(field: str, value):
    if field == "title":
        return reject_html(clean_text(value, field="Title", max_len=200), field="Title")
    if field == "content":
        return clean_text(value, field="Content", max_len=50000, strip=False)
    if field == "tags":
        return clean_text(value, field="Tags", max_len=500)
    if field == "note_type":
        return _normalize_choice(value, allowed=ALLOWED_NOTE_TYPES, field="note_type", fallback="research-note")
    if field == "research_phase":
        return _normalize_choice(value, allowed=ALLOWED_RESEARCH_PHASES, field="research_phase", fallback="triage")
    if field == "target_name":
        return clean_text(value or "", field="target_name", max_len=200)
    if field == "severity":
        return _normalize_choice(value, allowed=ALLOWED_SEVERITIES, field="severity", fallback="info")
    if field == "tlp":
        return _normalize_choice(value, allowed=ALLOWED_TLP, field="tlp", fallback="team")
    return value


def _apply_note_fields(note: Note, data: dict):
    for field, value in data.items():
        setattr(note, field, _normalize_note_field(field, value))


def _parse_client_timestamp(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid note version timestamp") from exc
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed


def _set_review_state(note: Note, *, status: str, actor: User | None = None, review_notes: str = "", stamp_reviewer: bool = False):
    note.review_status = status
    if status == "in_review":
        note.submitted_at = datetime.now(timezone.utc)
        note.reviewed_at = None
        note.reviewed_by = ""
    if stamp_reviewer and actor is not None:
        note.reviewed_by = actor.handle
        note.reviewed_at = datetime.now(timezone.utc)
    if review_notes is not None:
        note.review_notes = clean_text(review_notes, field="review_notes", max_len=4000, strip=False)


def _publish_folder_name_map(db: Session) -> dict[int, str]:
    return {row.id: row.name for row in db.query(PublishFolder).all()}


def _attach_publish_folder(note_dict: dict, folder_map: dict[int, str]):
    folder_id = note_dict.get("publish_folder_id")
    note_dict["publish_folder_name"] = folder_map.get(folder_id, "")
    return note_dict


def _operation_name_map(db: Session) -> dict[int, str]:
    return {row.id: row.name for row in db.query(Operation).all()}


def _attach_operation(note_dict: dict, operation_map: dict[int, str]):
    operation_id = note_dict.get("operation_id")
    note_dict["operation_name"] = operation_map.get(operation_id, "")
    return note_dict


def _serialize_note(db: Session, note: Note):
    return _attach_operation(note.to_dict(), _operation_name_map(db))


def _can_edit_note(note: Note, user: User) -> bool:
    return bool(user.is_admin or note.author_id == user.id)


def _assert_can_edit(note: Note, user: User):
    if not _can_edit_note(note, user):
        raise HTTPException(status_code=403, detail="You can only edit your own notes")


def _create_revision(
    db: Session,
    note: Note,
    *,
    event_type: str,
    actor: User | None = None,
    reason: str = "",
):
    revision = NoteRevision(
        note_id=note.id,
        event_type=event_type,
        actor_id=actor.id if actor else None,
        actor_handle=actor.handle if actor else "",
        reason=clean_text(reason or "", field="revision_reason", max_len=4000, strip=False),
        title=note.title,
        content=note.content or "",
        folder_id=note.folder_id,
        operation_id=note.operation_id,
        tags=note.tags or "",
        note_type=note.note_type or "research-note",
        research_phase=note.research_phase or "triage",
        target_name=note.target_name or "",
        severity=note.severity or "info",
        tlp=note.tlp or "team",
        review_status=note.review_status or "draft",
        review_notes=note.review_notes or "",
        reviewed_by=note.reviewed_by or "",
        reviewed_at=note.reviewed_at,
        submitted_at=note.submitted_at,
        published=note.published,
        public_title=note.public_title,
        published_by=note.published_by,
        publish_folder_id=note.publish_folder_id,
        public_slug=note.public_slug,
        published_at=note.published_at,
    )
    db.add(revision)
    return revision


def _apply_revision_to_note(db: Session, note: Note, revision: NoteRevision):
    folder_id = revision.folder_id
    if folder_id is not None and not db.query(Folder).filter(Folder.id == folder_id).first():
        folder_id = None
    publish_folder_id = revision.publish_folder_id
    if publish_folder_id is not None and not db.query(PublishFolder).filter(PublishFolder.id == publish_folder_id).first():
        publish_folder_id = None

    note.title = revision.title
    note.content = revision.content or ""
    note.folder_id = folder_id
    operation_id = revision.operation_id
    if operation_id is not None and not db.query(Operation).filter(Operation.id == operation_id).first():
        operation_id = None
    note.operation_id = operation_id
    note.tags = revision.tags or ""
    note.note_type = revision.note_type or "research-note"
    note.research_phase = revision.research_phase or "triage"
    note.target_name = revision.target_name or ""
    note.severity = revision.severity or "info"
    note.tlp = revision.tlp or "team"
    note.review_status = revision.review_status or "draft"
    note.review_notes = revision.review_notes or ""
    note.reviewed_by = revision.reviewed_by or ""
    note.reviewed_at = revision.reviewed_at
    note.submitted_at = revision.submitted_at
    note.published = revision.published
    note.public_title = revision.public_title
    note.published_by = revision.published_by
    note.publish_folder_id = publish_folder_id
    note.public_slug = revision.public_slug
    note.published_at = revision.published_at


def _revision_document(revision: NoteRevision) -> str:
    meta_lines = [
        f"Title: {revision.title}",
        f"Type: {revision.note_type or 'research-note'}",
        f"Phase: {revision.research_phase or 'triage'}",
        f"Target: {revision.target_name or ''}",
        f"Severity: {revision.severity or 'info'}",
        f"Review Status: {revision.review_status or 'draft'}",
        f"Published: {'yes' if revision.published else 'no'}",
        f"Public Title: {revision.public_title or ''}",
        f"Published By: {revision.published_by or ''}",
        f"Tags: {revision.tags or ''}",
    ]
    return "\n".join(meta_lines) + "\n\n" + (revision.content or "")


def _serialize_revision_summary(revision: NoteRevision) -> dict:
    data = revision.to_dict()
    content = data.get("content") or ""
    data["excerpt"] = content[:180] + "..." if len(content) > 180 else content
    data.pop("content", None)
    return data


def _serialize_comment(comment: NoteComment) -> dict:
    return comment.to_dict()

# ── Folder routes ─────────────────────────────────────────────────

@router.get("/folders")
def list_folders(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    folders = db.query(Folder).all()
    return [f.to_dict() for f in folders]

@router.post("/folders", status_code=201)
def create_folder(
    payload: CreateFolderRequest,
    db:      Session = Depends(get_db),
    admin:   User    = Depends(require_admin)
):
    name = reject_html(clean_text(payload.name, field="Folder name", max_len=100), field="Folder name")
    if payload.parent_id is not None:
        parent = db.query(Folder).filter(Folder.id == payload.parent_id).first()
        if not parent:
            raise HTTPException(status_code=404, detail="Parent folder not found")
    folder = Folder(
        name       = name,
        parent_id  = payload.parent_id,
        created_by = admin.id,
    )
    db.add(folder)
    db.commit()
    db.refresh(folder)
    return folder.to_dict()


@router.get("/publish-folders")
def list_publish_folders(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    rows = db.query(PublishFolder).order_by(PublishFolder.name.asc()).all()
    return [row.to_dict() for row in rows]


@router.post("/publish-folders", status_code=201)
def create_publish_folder(
    payload: CreatePublishFolderRequest,
    db:      Session = Depends(get_db),
    admin:   User    = Depends(require_admin)
):
    name = reject_html(clean_text(payload.name, field="Publish folder name", max_len=100), field="Publish folder name")
    existing = db.query(PublishFolder).filter(PublishFolder.name == name).first()
    if existing:
        raise HTTPException(status_code=409, detail="Publish folder already exists")
    row = PublishFolder(name=name, created_by=admin.id)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row.to_dict()


@router.delete("/publish-folders/{folder_id}")
def delete_publish_folder(
    folder_id: int,
    db:        Session = Depends(get_db),
    admin:     User    = Depends(require_admin)
):
    row = db.query(PublishFolder).filter(PublishFolder.id == folder_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Publish folder not found")
    db.query(Note).filter(Note.publish_folder_id == folder_id).update({"publish_folder_id": None})
    db.delete(row)
    db.commit()
    return {"message": "Publish folder deleted"}

@router.delete("/folders/{folder_id}")
def delete_folder(
    folder_id: int,
    db:        Session = Depends(get_db),
    admin:     User    = Depends(require_admin)
):
    folder = db.query(Folder).filter(Folder.id == folder_id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    # Move notes in this folder to root
    db.query(Note).filter(Note.folder_id == folder_id).update({"folder_id": None})
    db.delete(folder)
    db.commit()
    return {"message": "Folder deleted, notes moved to root"}

# ── Note routes ───────────────────────────────────────────────────

@router.get("/")
def list_notes(
    folder_id: Optional[int] = None,
    db:        Session = Depends(get_db),
    _:         User    = Depends(get_current_user)
):
    query = db.query(Note)
    if folder_id is not None:
        query = query.filter(Note.folder_id == folder_id)
    operation_map = _operation_name_map(db)
    notes = query.order_by(Note.updated_at.desc().nullslast(), Note.created_at.desc()).all()
    # Return without full content for listing
    result = []
    for n in notes:
        d = n.to_dict()
        content = d.get("content") or ""
        d["content"] = content[:200] + "..." if len(content) > 200 else content
        result.append(_attach_operation(d, operation_map))
    return result

@router.post("/", status_code=201)
def create_note(
    payload: CreateNoteRequest,
    db:      Session = Depends(get_db),
    current: User    = Depends(get_current_user)
):
    if payload.folder_id is not None:
        folder = db.query(Folder).filter(Folder.id == payload.folder_id).first()
        if not folder:
            raise HTTPException(status_code=404, detail="Folder not found")
    if payload.operation_id is not None:
        operation = db.query(Operation).filter(Operation.id == payload.operation_id).first()
        if not operation:
            raise HTTPException(status_code=404, detail="Operation not found")
    note = Note(
        folder_id      = payload.folder_id,
        author_id      = current.id,
        author_handle  = current.handle,
    )
    _apply_note_fields(note, payload.model_dump())
    note.review_status = "draft"
    db.add(note)
    db.flush()
    _create_revision(db, note, event_type="created", actor=current)
    db.commit()
    db.refresh(note)
    return _serialize_note(db, note)

@router.get("/public")
def list_public_notes(db: Session = Depends(get_db)):
    folder_map = _publish_folder_name_map(db)
    notes = (
        db.query(Note)
        .filter(Note.published.is_(True), Note.public_slug.is_not(None))
        .order_by(Note.published_at.desc().nullslast(), Note.updated_at.desc().nullslast(), Note.created_at.desc())
        .all()
    )
    result = []
    for n in notes:
        d = n.to_dict()
        content = d.get("content") or ""
        d["title"] = d.get("public_title") or d.get("title")
        d["published_by"] = d.get("published_by") or d.get("author_handle")
        d["excerpt"] = content[:280] + "..." if len(content) > 280 else content
        result.append(_attach_publish_folder(d, folder_map))
    return result


@router.get("/review-queue")
def get_review_queue(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    operation_map = _operation_name_map(db)
    in_review = (
        db.query(Note)
        .filter(Note.review_status == "in_review")
        .order_by(Note.submitted_at.desc().nullslast(), Note.updated_at.desc().nullslast(), Note.created_at.desc())
        .limit(20)
        .all()
    )
    approved = (
        db.query(Note)
        .filter(Note.review_status == "approved", Note.published.is_(False))
        .order_by(Note.reviewed_at.desc().nullslast(), Note.updated_at.desc().nullslast(), Note.created_at.desc())
        .limit(20)
        .all()
    )
    recently_published = (
        db.query(Note)
        .filter(Note.published.is_(True))
        .order_by(Note.published_at.desc().nullslast(), Note.created_at.desc())
        .limit(20)
        .all()
    )

    def pack(items):
        return [_attach_operation(item.to_dict(), operation_map) for item in items]

    return {
        "in_review": pack(in_review),
        "approved": pack(approved),
        "recently_published": pack(recently_published),
    }


@router.get("/public/{slug}")
def get_public_note(slug: str, db: Session = Depends(get_db)):
    folder_map = _publish_folder_name_map(db)
    note = db.query(Note).filter(Note.public_slug == slug, Note.published.is_(True)).first()
    if not note:
        raise HTTPException(status_code=404, detail="Public note not found")
    data = note.to_dict()
    data["title"] = data.get("public_title") or data.get("title")
    data["published_by"] = data.get("published_by") or data.get("author_handle")
    return _attach_publish_folder(data, folder_map)


@router.get("/{note_id}")
def get_note(
    note_id: int,
    db:      Session = Depends(get_db),
    _:       User    = Depends(get_current_user)
):
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return _serialize_note(db, note)


@router.get("/{note_id}/comments")
def list_note_comments(
    note_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    comments = (
        db.query(NoteComment)
        .filter(NoteComment.note_id == note_id)
        .order_by(NoteComment.created_at.asc(), NoteComment.id.asc())
        .all()
    )
    return [_serialize_comment(comment) for comment in comments]


@router.post("/{note_id}/comments", status_code=201)
def create_note_comment(
    note_id: int,
    payload: NoteCommentCreateRequest,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    parent_id = payload.parent_id
    if parent_id is not None:
        parent = (
            db.query(NoteComment)
            .filter(NoteComment.id == parent_id, NoteComment.note_id == note_id)
            .first()
        )
        if not parent:
            raise HTTPException(status_code=404, detail="Parent comment not found")
    comment = NoteComment(
        note_id=note_id,
        parent_id=parent_id,
        author_id=current.id,
        author_handle=current.handle,
        content=clean_text(payload.content, field="comment", max_len=4000, strip=False),
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return _serialize_comment(comment)


@router.patch("/{note_id}/comments/{comment_id}")
def update_note_comment(
    note_id: int,
    comment_id: int,
    payload: NoteCommentUpdateRequest,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    comment = (
        db.query(NoteComment)
        .filter(NoteComment.note_id == note_id, NoteComment.id == comment_id)
        .first()
    )
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    can_moderate = _can_edit_note(note, current)
    if payload.content is not None:
        if comment.author_id != current.id and not current.is_admin:
            raise HTTPException(status_code=403, detail="You can only edit your own comments")
        comment.content = clean_text(payload.content, field="comment", max_len=4000, strip=False)
    if payload.resolved is not None:
        if not can_moderate:
            raise HTTPException(status_code=403, detail="Only note editors can resolve comments")
        comment.resolved = payload.resolved
        comment.resolved_by = current.handle if payload.resolved else None
        comment.resolved_at = datetime.now(timezone.utc) if payload.resolved else None
    db.commit()
    db.refresh(comment)
    return _serialize_comment(comment)


@router.delete("/{note_id}/comments/{comment_id}", status_code=204)
def delete_note_comment(
    note_id: int,
    comment_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    comment = (
        db.query(NoteComment)
        .filter(NoteComment.note_id == note_id, NoteComment.id == comment_id)
        .first()
    )
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.author_id != current.id and not _can_edit_note(note, current):
        raise HTTPException(status_code=403, detail="Not allowed to delete this comment")
    to_delete = [comment.id]
    while to_delete:
        parent_ids = list(to_delete)
        to_delete = []
        child_rows = db.query(NoteComment).filter(NoteComment.parent_id.in_(parent_ids)).all()
        for child in child_rows:
            to_delete.append(child.id)
            db.delete(child)
    db.delete(comment)
    db.commit()

@router.patch("/{note_id}")
def update_note(
    note_id: int,
    payload: UpdateNoteRequest,
    db:      Session = Depends(get_db),
    current: User    = Depends(get_current_user)
):
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    _assert_can_edit(note, current)
    if payload.folder_id is not None:
        folder = db.query(Folder).filter(Folder.id == payload.folder_id).first()
        if not folder:
            raise HTTPException(status_code=404, detail="Folder not found")
    if payload.operation_id is not None:
        operation = db.query(Operation).filter(Operation.id == payload.operation_id).first()
        if not operation:
            raise HTTPException(status_code=404, detail="Operation not found")
    changes = payload.model_dump(exclude_none=True, exclude={"base_updated_at"})
    if not changes:
        return _serialize_note(db, note)
    normalized_changes = {field: _normalize_note_field(field, value) for field, value in changes.items()}
    has_effective_changes = any(getattr(note, field) != value for field, value in normalized_changes.items())
    if payload.base_updated_at and has_effective_changes:
        client_stamp = _parse_client_timestamp(payload.base_updated_at)
        server_stamp = note.updated_at or note.created_at
        if server_stamp is not None:
            if server_stamp.tzinfo is None:
                server_stamp = server_stamp.replace(tzinfo=timezone.utc)
            if client_stamp != server_stamp:
                raise HTTPException(
                    status_code=409,
                    detail={
                        "message": "Note has been updated by someone else",
                        "current_note": _serialize_note(db, note),
                    },
                )
    _apply_note_fields(note, normalized_changes)
    significant_fields = {"title", "content", "tags", "note_type", "research_phase", "target_name", "severity", "tlp", "folder_id", "operation_id"}
    if note.review_status in {"approved", "published"} and any(field in significant_fields for field in changes):
        note.review_status = "draft"
        if note.published:
            note.published = False
            note.published_at = None
    if note.review_status == "changes_requested":
        note.review_status = "draft"
    _create_revision(db, note, event_type="updated", actor=current)
    db.commit()
    db.refresh(note)
    return _serialize_note(db, note)

@router.post("/{note_id}/submit-review")
def submit_note_for_review(
    note_id: int,
    db:      Session = Depends(get_db),
    current: User    = Depends(get_current_user)
):
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    _assert_can_edit(note, current)
    if not (note.content or "").strip():
        raise HTTPException(status_code=400, detail="Add content before submitting for review")
    _set_review_state(note, status="in_review", review_notes=note.review_notes or "")
    _create_revision(db, note, event_type="submitted_for_review", actor=current)
    db.commit()
    db.refresh(note)
    return _serialize_note(db, note)

@router.post("/{note_id}/review/approve")
def approve_note_review(
    note_id: int,
    payload: ReviewNoteRequest,
    db:      Session = Depends(get_db),
    admin:   User    = Depends(require_admin)
):
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    _set_review_state(note, status="approved", actor=admin, review_notes=payload.review_notes or "", stamp_reviewer=True)
    _create_revision(db, note, event_type="approved", actor=admin, reason=payload.review_notes or "")
    db.commit()
    db.refresh(note)
    return _serialize_note(db, note)

@router.post("/{note_id}/review/request-changes")
def request_note_changes(
    note_id: int,
    payload: ReviewNoteRequest,
    db:      Session = Depends(get_db),
    admin:   User    = Depends(require_admin)
):
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    _set_review_state(note, status="changes_requested", actor=admin, review_notes=payload.review_notes or "", stamp_reviewer=True)
    _create_revision(db, note, event_type="changes_requested", actor=admin, reason=payload.review_notes or "")
    db.commit()
    db.refresh(note)
    return _serialize_note(db, note)

@router.post("/{note_id}/review/revert-draft")
def revert_note_to_draft(
    note_id: int,
    db:      Session = Depends(get_db),
    current: User    = Depends(get_current_user)
):
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    _assert_can_edit(note, current)
    _set_review_state(note, status="draft", review_notes=note.review_notes or "")
    _create_revision(db, note, event_type="reverted_to_draft", actor=current)
    db.commit()
    db.refresh(note)
    return _serialize_note(db, note)

@router.post("/{note_id}/publish")
def publish_note(
    note_id: int,
    payload: PublishNoteRequest,
    db:      Session = Depends(get_db),
    admin:   User    = Depends(require_admin)
):
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    if note.review_status not in {"approved", "published"}:
        raise HTTPException(status_code=400, detail="Note must be approved before publishing")
    publish_folder = db.query(PublishFolder).filter(PublishFolder.id == payload.publish_folder_id).first()
    if not publish_folder:
        raise HTTPException(status_code=404, detail="Publish folder not found")
    base_title = payload.public_title or note.title
    clean_title = reject_html(clean_text(base_title, field="Public title", max_len=200), field="Public title")
    published_by = clean_text(payload.published_by or note.published_by or note.author_handle or "", field="Published by", max_len=120)
    requested_slug = payload.slug or clean_title
    slug = _slugify(clean_text(requested_slug, field="slug", max_len=220))
    if len(slug) < 3:
        raise HTTPException(status_code=400, detail="Slug must be at least 3 characters")
    note.public_title = clean_title
    note.published_by = published_by
    note.publish_folder_id = publish_folder.id
    note.public_slug = _ensure_unique_slug(db, slug, note.id)
    note.published = True
    note.published_at = datetime.now(timezone.utc)
    note.review_status = "published"
    if note.research_phase != "published":
        note.research_phase = "published"
    _create_revision(db, note, event_type="published", actor=admin, reason=clean_title)
    db.commit()
    db.refresh(note)
    return _serialize_note(db, note)

@router.post("/{note_id}/unpublish")
def unpublish_note(
    note_id: int,
    db:      Session = Depends(get_db),
    admin:   User    = Depends(require_admin)
):
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    note.published = False
    note.published_at = None
    if note.review_status == "published":
        note.review_status = "approved"
    _create_revision(db, note, event_type="unpublished", actor=admin)
    db.commit()
    db.refresh(note)
    return _serialize_note(db, note)


@router.get("/{note_id}/history")
def list_note_history(
    note_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    revisions = (
        db.query(NoteRevision)
        .filter(NoteRevision.note_id == note_id)
        .order_by(NoteRevision.id.desc())
        .all()
    )
    return [_serialize_revision_summary(revision) for revision in revisions]


@router.get("/{note_id}/history/{revision_id}")
def get_note_revision(
    note_id: int,
    revision_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    revision = (
        db.query(NoteRevision)
        .filter(NoteRevision.note_id == note_id, NoteRevision.id == revision_id)
        .first()
    )
    if not revision:
        raise HTTPException(status_code=404, detail="Revision not found")
    return revision.to_dict()


@router.get("/{note_id}/history/{revision_id}/diff")
def get_note_revision_diff(
    note_id: int,
    revision_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    revision = (
        db.query(NoteRevision)
        .filter(NoteRevision.note_id == note_id, NoteRevision.id == revision_id)
        .first()
    )
    if not revision:
        raise HTTPException(status_code=404, detail="Revision not found")
    previous = (
        db.query(NoteRevision)
        .filter(NoteRevision.note_id == note_id, NoteRevision.id < revision.id)
        .order_by(NoteRevision.id.desc())
        .first()
    )
    before = _revision_document(previous).splitlines() if previous else []
    after = _revision_document(revision).splitlines()
    diff = "\n".join(
        difflib.unified_diff(
            before,
            after,
            fromfile=f"revision-{previous.id}" if previous else "empty",
            tofile=f"revision-{revision.id}",
            lineterm="",
        )
    )
    return {
        "revision_id": revision.id,
        "previous_revision_id": previous.id if previous else None,
        "diff": diff,
    }


@router.post("/{note_id}/history/{revision_id}/restore")
def restore_note_revision(
    note_id: int,
    revision_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    _assert_can_edit(note, current)
    revision = (
        db.query(NoteRevision)
        .filter(NoteRevision.note_id == note_id, NoteRevision.id == revision_id)
        .first()
    )
    if not revision:
        raise HTTPException(status_code=404, detail="Revision not found")
    _apply_revision_to_note(db, note, revision)
    if not current.is_admin:
        note.published = False
        note.published_at = None
        note.public_title = None
        note.published_by = None
        note.publish_folder_id = None
        note.public_slug = None
        if note.review_status in {"approved", "published"}:
            note.review_status = "draft"
    _create_revision(db, note, event_type="restored", actor=current, reason=f"Restored revision {revision.id}")
    db.commit()
    db.refresh(note)
    return _serialize_note(db, note)

@router.delete("/{note_id}")
def delete_note(
    note_id: int,
    db:      Session = Depends(get_db),
    current: User    = Depends(get_current_user)
):
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    if not current.is_admin:
        raise HTTPException(status_code=403, detail="Only admins can delete notes")
    db.query(NoteComment).filter(NoteComment.note_id == note_id).delete()
    db.query(NoteRevision).filter(NoteRevision.note_id == note_id).delete()
    db.delete(note)
    db.commit()
    return {"message": "Note deleted"}
