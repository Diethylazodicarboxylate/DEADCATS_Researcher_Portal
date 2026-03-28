from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional
from core.database import get_db
from core.security import get_current_user
from core.validation import clean_text, csv_safe_cell
from models.ioc import IOC
from models.operation import Operation
from models.user import User

router = APIRouter(prefix="/api/iocs", tags=["iocs"])

IOC_TYPES     = ["ip", "domain", "hash", "url", "email", "cve"]
IOC_SEVERITIES= ["low", "medium", "high", "critical"]

class CreateIOCRequest(BaseModel):
    type:     str = Field(min_length=2, max_length=20)
    value:    str = Field(min_length=1, max_length=1000)
    operation_id: Optional[int] = None
    tags:     Optional[str] = Field(default="", max_length=500)
    severity: Optional[str] = Field(default="medium", max_length=10)
    notes:    Optional[str] = Field(default="", max_length=4000)

class UpdateIOCRequest(BaseModel):
    operation_id: Optional[int] = None
    tags:     Optional[str] = Field(default=None, max_length=500)
    severity: Optional[str] = Field(default=None, max_length=10)
    notes:    Optional[str] = Field(default=None, max_length=4000)

@router.get("/")
def list_iocs(
    type:     Optional[str] = Query(None),
    operation_id: Optional[int] = Query(None),
    severity: Optional[str] = Query(None),
    search:   Optional[str] = Query(None),
    db:       Session = Depends(get_db),
    _:        User    = Depends(get_current_user)
):
    query = db.query(IOC)
    if type:     query = query.filter(IOC.type == type)
    if operation_id is not None: query = query.filter(IOC.operation_id == operation_id)
    if severity: query = query.filter(IOC.severity == severity)
    if search:   query = query.filter(IOC.value.ilike(f"%{search}%"))
    iocs = query.order_by(IOC.created_at.desc()).all()
    operation_map = {row.id: row.name for row in db.query(Operation).all()}
    result = []
    for i in iocs:
        data = i.to_dict()
        data["operation_name"] = operation_map.get(data.get("operation_id"), "")
        result.append(data)
    return result

@router.post("/", status_code=201)
def create_ioc(
    payload: CreateIOCRequest,
    db:      Session = Depends(get_db),
    current: User    = Depends(get_current_user)
):
    ioc_type = clean_text(payload.type, field="type", max_len=20).lower()
    ioc_value = clean_text(payload.value, field="value", max_len=1000, strip=False)
    severity = clean_text(payload.severity, field="severity", max_len=10).lower()
    if ioc_type not in IOC_TYPES:
        raise HTTPException(400, f"Invalid type. Choose from: {IOC_TYPES}")
    if severity not in IOC_SEVERITIES:
        raise HTTPException(400, f"Invalid severity.")
    operation_id = payload.operation_id
    if operation_id is not None and not db.query(Operation).filter(Operation.id == operation_id).first():
        raise HTTPException(404, "Operation not found")
    ioc = IOC(
        type      = ioc_type,
        value     = ioc_value,
        operation_id = operation_id,
        tags      = clean_text(payload.tags, field="tags", max_len=500),
        severity  = severity,
        notes     = clean_text(payload.notes, field="notes", max_len=4000),
        author    = current.handle,
        author_id = current.id,
    )
    db.add(ioc); db.commit(); db.refresh(ioc)
    from core.logger import log_ioc; log_ioc(current.handle, "submit", ioc_type, ioc_value)
    data = ioc.to_dict()
    if data.get("operation_id"):
        data["operation_name"] = db.query(Operation).filter(Operation.id == data["operation_id"]).first().name
    else:
        data["operation_name"] = ""
    return data


@router.patch("/{ioc_id}")
def update_ioc(
    ioc_id: int,
    payload: UpdateIOCRequest,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user)
):
    ioc = db.query(IOC).filter(IOC.id == ioc_id).first()
    if not ioc:
        raise HTTPException(404, "IOC not found")
    if ioc.author_id != current.id and not current.is_admin:
        raise HTTPException(403, "Only the author or admin can edit this IOC")

    changes = payload.model_dump(exclude_none=True)
    if "operation_id" in changes:
        operation_id = changes["operation_id"]
        if operation_id is not None and not db.query(Operation).filter(Operation.id == operation_id).first():
            raise HTTPException(404, "Operation not found")
        ioc.operation_id = operation_id
    if "tags" in changes:
        ioc.tags = clean_text(changes["tags"], field="tags", max_len=500)
    if "severity" in changes:
        severity = clean_text(changes["severity"], field="severity", max_len=10).lower()
        if severity not in IOC_SEVERITIES:
            raise HTTPException(400, "Invalid severity.")
        ioc.severity = severity
    if "notes" in changes:
        ioc.notes = clean_text(changes["notes"], field="notes", max_len=4000)
    db.commit()
    db.refresh(ioc)
    data = ioc.to_dict()
    data["operation_name"] = db.query(Operation).filter(Operation.id == ioc.operation_id).first().name if ioc.operation_id else ""
    return data

@router.delete("/{ioc_id}")
def delete_ioc(
    ioc_id:  int,
    db:      Session = Depends(get_db),
    current: User    = Depends(get_current_user)
):
    ioc = db.query(IOC).filter(IOC.id == ioc_id).first()
    if not ioc:
        raise HTTPException(404, "IOC not found")
    if ioc.author_id != current.id and not current.is_admin:
        raise HTTPException(403, "Only the author or admin can delete this IOC")
    db.delete(ioc); db.commit()
    from core.logger import log_ioc; log_ioc(current.handle, "delete", ioc.type, ioc.value)
    return {"message": "Deleted"}

@router.get("/export")
def export_iocs(
    db: Session = Depends(get_db),
    _:  User    = Depends(get_current_user)
):
    from fastapi.responses import StreamingResponse
    import csv, io
    iocs = db.query(IOC).order_by(IOC.created_at.desc()).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id","type","value","severity","tags","notes","author","created_at"])
    for i in iocs:
        writer.writerow(
            [
                i.id,
                csv_safe_cell(i.type),
                csv_safe_cell(i.value),
                csv_safe_cell(i.severity),
                csv_safe_cell(i.tags),
                csv_safe_cell(i.notes),
                csv_safe_cell(i.author),
                i.created_at,
            ]
        )
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=deadcats_iocs.csv"}
    )
