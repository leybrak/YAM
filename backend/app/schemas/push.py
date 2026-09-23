from pydantic import BaseModel


class PushKeys(BaseModel):
    p256dh: str
    auth: str


class PushSubscriptionCreate(BaseModel):
    """Shape of PushSubscription.toJSON() from the browser's PushManager."""

    endpoint: str
    keys: PushKeys


class PushUnsubscribe(BaseModel):
    endpoint: str


class VapidPublicKey(BaseModel):
    public_key: str
