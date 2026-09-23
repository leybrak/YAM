from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.config import settings
from app.models.push_subscription import PushSubscription
from app.models.user import User
from app.schemas.push import PushSubscriptionCreate, PushUnsubscribe, VapidPublicKey

router = APIRouter(prefix="/api/push", tags=["push"])


@router.get("/vapid-public-key", response_model=VapidPublicKey)
def vapid_public_key() -> VapidPublicKey:
    return VapidPublicKey(public_key=settings.VAPID_PUBLIC_KEY)


@router.post("/subscribe", status_code=204)
def subscribe(
    payload: PushSubscriptionCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    existing = db.scalar(
        select(PushSubscription).where(PushSubscription.endpoint == payload.endpoint)
    )
    if existing:
        existing.user_id = user.id
        existing.p256dh = payload.keys.p256dh
        existing.auth = payload.keys.auth
    else:
        db.add(
            PushSubscription(
                user_id=user.id,
                endpoint=payload.endpoint,
                p256dh=payload.keys.p256dh,
                auth=payload.keys.auth,
            )
        )
    db.commit()


@router.post("/unsubscribe", status_code=204)
def unsubscribe(
    payload: PushUnsubscribe,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    existing = db.scalar(
        select(PushSubscription).where(
            PushSubscription.endpoint == payload.endpoint, PushSubscription.user_id == user.id
        )
    )
    if existing:
        db.delete(existing)
        db.commit()
