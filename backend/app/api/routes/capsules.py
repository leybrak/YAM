import uuid
from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_linked_user, get_db
from app.models.capsule import TimeCapsule
from app.models.user import User
from app.schemas.capsule import CapsuleCreate, CapsuleRead
from app.services.storage import build_object_key, presigned_upload_url, resolve_read_url

router = APIRouter(prefix="/api/capsules", tags=["capsules"])


def _shape(capsule: TimeCapsule) -> CapsuleRead:
    is_open = capsule.unlock_date <= date.today()
    return CapsuleRead(
        id=capsule.id,
        created_by_user_id=capsule.created_by_user_id,
        unlock_date=capsule.unlock_date,
        title=capsule.title,
        created_at=capsule.created_at,
        is_open=is_open,
        content_text=capsule.content_text if is_open else None,
        photo_url=resolve_read_url(capsule.storage_key) if is_open and capsule.storage_key else None,
    )


@router.post("", response_model=CapsuleRead, status_code=status.HTTP_201_CREATED)
def create_capsule(
    payload: CapsuleCreate, user: User = Depends(get_current_linked_user), db: Session = Depends(get_db)
) -> CapsuleRead:
    if payload.unlock_date <= date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="La fecha de apertura debe ser futura"
        )
    capsule = TimeCapsule(
        couple_id=user.couple_id,
        created_by_user_id=user.id,
        **payload.model_dump(),
    )
    db.add(capsule)
    db.commit()
    db.refresh(capsule)
    return _shape(capsule)


@router.get("", response_model=list[CapsuleRead])
def list_capsules(
    user: User = Depends(get_current_linked_user), db: Session = Depends(get_db)
) -> list[CapsuleRead]:
    capsules = db.scalars(
        select(TimeCapsule)
        .where(TimeCapsule.couple_id == user.couple_id)
        .order_by(TimeCapsule.unlock_date.asc())
    ).all()
    return [_shape(c) for c in capsules]


@router.post("/presign")
def presign_capsule_upload(
    filename: str = Query(...),
    content_type: str = Query(default="image/jpeg"),
    user: User = Depends(get_current_linked_user),
) -> dict:
    object_key = build_object_key(user.couple_id, uuid.uuid4(), filename)
    return {
        "upload_url": presigned_upload_url(object_key, content_type),
        "storage_key": object_key,
    }


@router.put("/{capsule_id}/open", response_model=CapsuleRead)
def mark_opened(
    capsule_id: uuid.UUID, user: User = Depends(get_current_linked_user), db: Session = Depends(get_db)
) -> CapsuleRead:
    capsule = db.scalar(
        select(TimeCapsule).where(TimeCapsule.id == capsule_id, TimeCapsule.couple_id == user.couple_id)
    )
    if capsule is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cápsula no encontrada")
    if capsule.unlock_date > date.today():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Todavía no se puede abrir")
    if capsule.opened_at is None:
        capsule.opened_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(capsule)
    return _shape(capsule)
