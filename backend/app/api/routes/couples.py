import secrets
import string
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.couple import Couple, CoupleStatus
from app.models.user import User
from app.schemas.couple import CoupleInvite, CoupleJoin, CoupleRead

router = APIRouter(prefix="/api/couples", tags=["couples"])

_ALPHABET = string.ascii_uppercase + string.digits


def _generate_invite_code(db: Session, length: int = 6) -> str:
    while True:
        code = "".join(secrets.choice(_ALPHABET) for _ in range(length))
        if not db.scalar(select(Couple).where(Couple.invite_code == code)):
            return code


@router.post("/invite", response_model=CoupleInvite, status_code=status.HTTP_201_CREATED)
def create_invite(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> CoupleInvite:
    """The 'ritual de entrada': generates the first half of the key."""
    if user.couple_id is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Ya estás vinculado o tenés una invitación activa"
        )

    couple = Couple(invite_code=_generate_invite_code(db), creator_id=user.id, status=CoupleStatus.PENDING)
    db.add(couple)
    db.flush()
    user.couple_id = couple.id
    db.commit()
    db.refresh(couple)
    return CoupleInvite(invite_code=couple.invite_code, status=couple.status)


@router.post("/join", response_model=CoupleRead)
def join_couple(payload: CoupleJoin, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Couple:
    """The other half of the key: joins an existing invite and unlocks the shared space."""
    if user.couple_id is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Ya estás vinculado o tenés una invitación activa"
        )

    couple = db.scalar(select(Couple).where(Couple.invite_code == payload.invite_code.upper()))
    if couple is None or couple.status != CoupleStatus.PENDING:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Código inválido o ya usado")
    if couple.creator_id == user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No podés unirte a tu propia invitación")

    couple.status = CoupleStatus.LINKED
    couple.linked_at = datetime.now(timezone.utc)
    user.couple_id = couple.id
    db.commit()
    db.refresh(couple)
    return couple


@router.get("/me", response_model=CoupleRead)
def my_couple(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Couple:
    if user.couple_id is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Todavía no tenés un vínculo")
    couple = db.get(Couple, user.couple_id)
    if couple is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vínculo no encontrado")
    return couple
