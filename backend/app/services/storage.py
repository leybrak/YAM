"""Object storage on OCI, via its S3-compatible API.

The app server (Hetzner) never proxies image bytes: the frontend asks this
service for a short-lived presigned PUT URL, uploads the file straight to
OCI, and stores the resulting object key. Reads go through a presigned GET
unless OCI_PUBLIC_BASE_URL is set (e.g. a bucket fronted by a CDN), in which
case we just build the public URL directly.
"""

import uuid

import boto3
from botocore.client import Config

from app.core.config import settings

_client = None


def get_client():
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
    return get_client().generate_presigned_url(
        "put_object",
        Params={
            "Bucket": settings.OCI_BUCKET_NAME,
            "Key": object_key,
            "ContentType": content_type,
        },
        ExpiresIn=expires_in,
    )


def resolve_read_url(object_key: str, expires_in: int = 3600) -> str:
    if settings.OCI_PUBLIC_BASE_URL:
        return f"{settings.OCI_PUBLIC_BASE_URL.rstrip('/')}/{object_key}"
    return get_client().generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.OCI_BUCKET_NAME, "Key": object_key},
        ExpiresIn=expires_in,
    )
