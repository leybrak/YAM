"""Receiving end of the local storage backend. Mirrors what a presigned PUT
to OCI would do in production: the caller already holds a capability (the
object key, handed out by the /presign endpoints) so this doesn't require
its own auth — same trust model as an S3 presigned URL.

Only active when STORAGE_BACKEND=local; in production this 404s and the
frontend never calls it because /presign returns an OCI URL instead.
"""

import pathlib

from fastapi import APIRouter, HTTPException, Request, status

from app.core.config import settings

router = APIRouter(prefix="/api/uploads", tags=["uploads"])

MAX_UPLOAD_BYTES = 20 * 1024 * 1024


@router.put("/{storage_key:path}")
async def upload_to_local_storage(storage_key: str, request: Request) -> dict:
    if settings.STORAGE_BACKEND != "local":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=status.HTTP_413_CONTENT_TOO_LARGE, detail="Archivo demasiado grande")

    media_root = pathlib.Path(settings.MEDIA_ROOT).resolve()
    target = (media_root / storage_key).resolve()
    if media_root not in target.parents:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Clave inválida")

    body = await request.body()
    if len(body) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=status.HTTP_413_CONTENT_TOO_LARGE, detail="Archivo demasiado grande")

    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(body)
    return {"storage_key": storage_key}
