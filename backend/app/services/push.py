"""Web Push delivery (RFC 8292/8291) — the real, off-app notification
channel. Complements app.models.notification, which is the in-app,
polled inbox; this is what reaches the device even when YAM isn't open.

Silently a no-op when VAPID keys aren't configured, so the app keeps
working in environments that haven't set them up yet.
"""

import json
import uuid

from pywebpush import WebPushException, webpush
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.push_subscription import PushSubscription


def send_push_to_user(db: Session, user_id: uuid.UUID, title: str, body: str, url: str = "/") -> None:
    if not settings.VAPID_PRIVATE_KEY or not settings.VAPID_PUBLIC_KEY:
        return

    subscriptions = db.scalars(
        select(PushSubscription).where(PushSubscription.user_id == user_id)
    ).all()
    if not subscriptions:
        return

    payload = json.dumps({"title": title, "body": body, "url": url})
    stale: list[PushSubscription] = []

    for sub in subscriptions:
        try:
            webpush(
                subscription_info={
                    "endpoint": sub.endpoint,
                    "keys": {"p256dh": sub.p256dh, "auth": sub.auth},
                },
                data=payload,
                vapid_private_key=settings.VAPID_PRIVATE_KEY,
                vapid_claims={"sub": f"mailto:{settings.VAPID_CLAIMS_EMAIL}"},
            )
        except WebPushException as exc:
            status_code = exc.response.status_code if exc.response is not None else None
            if status_code in (404, 410):
                # The browser/OS dropped this subscription (uninstalled,
                # expired, permission revoked) — stop trying it.
                stale.append(sub)

    if stale:
        for sub in stale:
            db.delete(sub)
        db.commit()
