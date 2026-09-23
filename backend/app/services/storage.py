"""Photo storage, swappable between a local disk backend (dev) and OCI
Object Storage via its S3-compatible API (prod), picked by
settings.STORAGE_BACKEND. Either way the app server never proxies image
bytes through itself: the frontend asks this module for a short-lived
upload URL, PUTs the file straight there, and stores the resulting object
key. The frontend code is identical in both cases — it just PUTs to
whatever URL it's given.
"""

import uuid

import boto3
from botocore.client import Config

from app.core.config import settings

_client = None


def _get_oci_client():
    global _client
    if _client is None:
        _client = boto3.client(
            "s3",
            endpoint_url=settings.OCI_ENDPOINT_URL,
            aws_access_key_id=settings.OCI_ACCESS_KEY_ID,
            aws_secret_access_key=settings.OCI_SECRET_ACCESS_KEY,
            region_name=settings.OCI_REGION,
            config=Config(signature_version="s3v4"),
        )
    return _client


def build_object_key(couple_id: uuid.UUID, entry_id: uuid.UUID, filename: str) -> str:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "jpg"
    return f"couples/{couple_id}/entries/{entry_id}/{uuid.uuid4()}.{ext}"


def presigned_upload_url(object_key: str, content_type: str, expires_in: int = 900) -> str:
    if settings.STORAGE_BACKEND == "local":
        return f"{settings.PUBLIC_BASE_URL.rstrip('/')}/api/uploads/{object_key}"

    return _get_oci_client().generate_presigned_url(
        "put_object",
        Params={
            "Bucket": settings.OCI_BUCKET_NAME,
            "Key": object_key,
            "ContentType": content_type,
        },
        ExpiresIn=expires_in,
    )


def resolve_read_url(object_key: str, expires_in: int = 3600) -> str:
    if settings.STORAGE_BACKEND == "local":
        return f"{settings.PUBLIC_BASE_URL.rstrip('/')}/media/{object_key}"

    if settings.OCI_PUBLIC_BASE_URL:
        return f"{settings.OCI_PUBLIC_BASE_URL.rstrip('/')}/{object_key}"
    return _get_oci_client().generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.OCI_BUCKET_NAME, "Key": object_key},
        ExpiresIn=expires_in,
    )
