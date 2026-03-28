from datetime import datetime, timezone
import re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional
from core.database import get_db
from core.security import get_current_user, require_admin
from core.validation import clean_text, reject_html
from models.note import Note, Folder
from models.user import User

router = APIRouter(prefix="/api/notes", tags=["notes"])

# ── Schemas ───────────────────────────────────────────────────────

class CreateFolderRequest(BaseModel):
    name:      str = Field(min_length=1, max_length=100)
    parent_id: Optional[int] = None

class CreateNoteRequest(BaseModel):
    title:          str = Field(min_length=1, max_length=200)
    content:        Optional[str] = Field(default="", max_length=50000)
    folder_id:      Optional[int] = None
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
    tags:           Optional[str] = Field(default=None, max_length=500)
    note_type:      Optional[str] = Field(default=None, max_length=50)
    research_phase: Optional[str] = Field(default=None, max_length=50)
    target_name:    Optional[str] = Field(default=None, max_length=200)
    severity:       Optional[str] = Field(default=None, max_length=30)
    tlp:            Optional[str] = Field(default=None, max_length=20)

class PublishNoteRequest(BaseModel):
    public_title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    slug:         Optional[str] = Field(default=None, min_length=3, max_length=220)

class ReviewNoteRequest(BaseModel):
    review_notes: Optional[str] = Field(default="", max_length=4000)


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


def _apply_note_fields(note: Note, data: dict):
    for field, value in data.items():
        if field == "title":
            value = reject_html(clean_text(value, field="Title", max_len=200), field="Title")
        elif field == "content":
            value = clean_text(value, field="Content", max_len=50000, strip=False)
        elif field == "tags":
            value = clean_text(value, field="Tags", max_len=500)
        elif field == "note_type":
            value = _normalize_choice(value, allowed=ALLOWED_NOTE_TYPES, field="note_type", fallback="research-note")
        elif field == "research_phase":
            value = _normalize_choice(value, allowed=ALLOWED_RESEARCH_PHASES, field="research_phase", fallback="triage")
        elif field == "target_name":
            value = clean_text(value or "", field="target_name", max_len=200)
        elif field == "severity":
            value = _normalize_choice(value, allowed=ALLOWED_SEVERITIES, field="severity", fallback="info")
        elif field == "tlp":
            value = _normalize_choice(value, allowed=ALLOWED_TLP, field="tlp", fallback="team")
        setattr(note, field, value)


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
    notes = query.order_by(Note.updated_at.desc().nullslast(), Note.created_at.desc()).all()
    # Return without full content for listing
    result = []
    for n in notes:
        d = n.to_dict()
        content = d.get("content") or ""
        d["content"] = content[:200] + "..." if len(content) > 200 else content
        result.append(d)
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
    note = Note(
        folder_id      = payload.folder_id,
        author_id      = current.id,
        author_handle  = current.handle,
    )
    _apply_note_fields(note, payload.model_dump())
    note.review_status = "draft"
    db.add(note)
    db.commit()
    db.refresh(note)
    return note.to_dict()

@router.get("/{note_id}")
def get_note(
    note_id: int,
    db:      Session = Depends(get_db),
    _:       User    = Depends(get_current_user)
):
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note.to_dict()

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
    if note.author_id != current.id and not current.is_admin:
        raise HTTPException(status_code=403, detail="You can only edit your own notes")
    if payload.folder_id is not None:
        folder = db.query(Folder).filter(Folder.id == payload.folder_id).first()
        if not folder:
            raise HTTPException(status_code=404, detail="Folder not found")
    changes = payload.model_dump(exclude_none=True)
    _apply_note_fields(note, changes)
    significant_fields = {"title", "content", "tags", "note_type", "research_phase", "target_name", "severity", "tlp", "folder_id"}
    if note.review_status in {"approved", "published"} and any(field in significant_fields for field in changes):
        note.review_status = "draft"
        if note.published:
            note.published = False
            note.published_at = None
    if note.review_status == "changes_requested":
        note.review_status = "draft"
    db.commit()
    db.refresh(note)
    return note.to_dict()

@router.post("/{note_id}/submit-review")
def submit_note_for_review(
    note_id: int,
    db:      Session = Depends(get_db),
    current: User    = Depends(get_current_user)
):
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    if note.author_id != current.id and not current.is_admin:
        raise HTTPException(status_code=403, detail="You can only submit your own notes for review")
    if not (note.content or "").strip():
        raise HTTPException(status_code=400, detail="Add content before submitting for review")
    _set_review_state(note, status="in_review", review_notes=note.review_notes or "")
    db.commit()
    db.refresh(note)
    return note.to_dict()

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
    db.commit()
    db.refresh(note)
    return note.to_dict()

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
    db.commit()
    db.refresh(note)
    return note.to_dict()

@router.post("/{note_id}/review/revert-draft")
def revert_note_to_draft(
    note_id: int,
    db:      Session = Depends(get_db),
    current: User    = Depends(get_current_user)
):
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    if note.author_id != current.id and not current.is_admin:
        raise HTTPException(status_code=403, detail="You can only revert your own notes to draft")
    _set_review_state(note, status="draft", review_notes=note.review_notes or "")
    db.commit()
    db.refresh(note)
    return note.to_dict()

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
    base_title = payload.public_title or note.title
    clean_title = reject_html(clean_text(base_title, field="Public title", max_len=200), field="Public title")
    requested_slug = payload.slug or clean_title
    slug = _slugify(clean_text(requested_slug, field="slug", max_len=220))
    if len(slug) < 3:
        raise HTTPException(status_code=400, detail="Slug must be at least 3 characters")
    note.public_title = clean_title
    note.public_slug = _ensure_unique_slug(db, slug, note.id)
    note.published = True
    note.published_at = datetime.now(timezone.utc)
    note.review_status = "published"
    if note.research_phase != "published":
        note.research_phase = "published"
    db.commit()
    db.refresh(note)
    return note.to_dict()

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
    db.commit()
    db.refresh(note)
    return note.to_dict()


@router.get("/public")
def list_public_notes(db: Session = Depends(get_db)):
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
        d["excerpt"] = content[:280] + "..." if len(content) > 280 else content
        result.append(d)
    return result


@router.get("/public/{slug}")
def get_public_note(slug: str, db: Session = Depends(get_db)):
    note = db.query(Note).filter(Note.public_slug == slug, Note.published.is_(True)).first()
    if not note:
        raise HTTPException(status_code=404, detail="Public note not found")
    data = note.to_dict()
    data["title"] = data.get("public_title") or data.get("title")
    return data

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
    db.delete(note)
    db.commit()
    return {"message": "Note deleted"}
