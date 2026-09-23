import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.api.deps import get_current_linked_user, get_db
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import NotificationRead, UnreadCount

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


def _shape(n: Notification) -> NotificationRead:
    return NotificationRead(
        id=n.id,
        type=n.type,
        message=n.message,
        entry_id=n.entry_id,
        is_read=n.read_at is not None,
        created_at=n.created_at,
    )


@router.get("", response_model=list[NotificationRead])
def list_notifications(
    user: User = Depends(get_current_linked_user),
    db: Session = Depends(get_db),
    unread_only: bool = False,
    limit: int = Query(default=20, le=100),
) -> list[NotificationRead]:
    stmt = select(Notification).where(Notification.user_id == user.id)
    if unread_only:
        stmt = stmt.where(Notification.read_at.is_(None))
    stmt = stmt.order_by(Notification.created_at.desc()).limit(limit)
    return [_shape(n) for n in db.scalars(stmt).all()]


@router.get("/unread-count", response_model=UnreadCount)
def unread_count(user: User = Depends(get_current_linked_user), db: Session = Depends(get_db)) -> UnreadCount:
    count = db.scalar(
        select(func.count())
        .select_from(Notification)
        .where(Notification.user_id == user.id, Notification.read_at.is_(None))
    )
    return UnreadCount(count=count or 0)


@router.put("/{notification_id}/read", response_model=NotificationRead)
def mark_read(
    notification_id: uuid.UUID,
    user: User = Depends(get_current_linked_user),
    db: Session = Depends(get_db),
) -> NotificationRead:
    notification = db.scalar(
        select(Notification).where(Notification.id == notification_id, Notification.user_id == user.id)
    )
    if notification is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notificación no encontrada")
    if notification.read_at is None:
        notification.read_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(notification)
    return _shape(notification)


@router.put("/read-all", response_model=UnreadCount)
def mark_all_read(user: User = Depends(get_current_linked_user), db: Session = Depends(get_db)) -> UnreadCount:
    db.execute(
        update(Notification)
        .where(Notification.user_id == user.id, Notification.read_at.is_(None))
        .values(read_at=datetime.now(timezone.utc))
    )
    db.commit()
    return UnreadCount(count=0)
