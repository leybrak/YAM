import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_linked_user, get_db
from app.models.couple import Couple
from app.models.entry import Entry
from app.models.favorite import Favorite
from app.models.photo import EntryPhoto
from app.models.user import User
from app.models.voice_note import EntryVoiceNote
from app.schemas.entry import (
    CommentRead,
    EntryCommentCreate,
    EntryCreate,
    EntryRead,
    PhotoCreate,
    PhotoRead,
)
from app.schemas.sticker import STICKER_TYPES, StickerCreate, StickerRead
from app.schemas.summary import AnniversarySummary
from app.schemas.voice_note import VoiceNoteCreate, VoiceNoteRead
from app.services.storage import build_object_key, presigned_upload_url, resolve_read_url

router = APIRouter(prefix="/api/entries", tags=["entries"])


def _entry_query():
    return select(Entry).options(
        selectinload(Entry.comments),
        selectinload(Entry.photos).selectinload(EntryPhoto.stickers),
        selectinload(Entry.voice_notes),
    )


def _get_entry_or_404(db: Session, couple_id: uuid.UUID, entry_id: uuid.UUID) -> Entry:
    entry = db.scalar(_entry_query().where(Entry.id == entry_id, Entry.couple_id == couple_id))
    if entry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entrada no encontrada")
    return entry


def _shape_entry(entry: Entry, user: User, db: Session) -> EntryRead:
    """Applies the blind-drop rule: the partner's comment, photos and voice
    notes stay hidden until the current user has also left their own
    comment. `partner_has_commented` is a bare boolean (no content) so the
    UI can show a sealed/blurred teaser before that."""
    unlocked = entry.is_unlocked
    my_comment = next((c for c in entry.comments if c.user_id == user.id), None)
    partner_comment = next((c for c in entry.comments if c.user_id != user.id), None)
    reveal_partner = unlocked or my_comment is not None

    my_photos = [p for p in entry.photos if p.user_id == user.id]
    partner_photos = [p for p in entry.photos if p.user_id != user.id]
    my_voice_notes = [v for v in entry.voice_notes if v.user_id == user.id]
    partner_voice_notes = [v for v in entry.voice_notes if v.user_id != user.id]

    is_favorite = (
        db.scalar(
            select(Favorite).where(Favorite.entry_id == entry.id, Favorite.user_id == user.id)
        )
        is not None
    )

    def to_photo_read(p) -> PhotoRead:
        return PhotoRead(
            id=p.id,
            user_id=p.user_id,
            url=resolve_read_url(p.storage_key),
            caption=p.caption,
            taken_at=p.taken_at,
            created_at=p.created_at,
            stickers=[StickerRead.model_validate(s) for s in p.stickers],
        )

    def to_voice_note_read(v) -> VoiceNoteRead:
        return VoiceNoteRead(
            id=v.id,
            user_id=v.user_id,
            url=resolve_read_url(v.storage_key),
            duration_seconds=v.duration_seconds,
            created_at=v.created_at,
        )

    return EntryRead(
        id=entry.id,
        entry_date=entry.entry_date,
        title=entry.title,
        location_name=entry.location_name,
        weather=entry.weather,
        song=entry.song,
        song_url=entry.song_url,
        created_at=entry.created_at,
        is_unlocked=unlocked,
        is_favorite=is_favorite,
        partner_has_commented=partner_comment is not None,
        my_comment=CommentRead.model_validate(my_comment) if my_comment else None,
        partner_comment=(
            CommentRead.model_validate(partner_comment)
            if partner_comment and reveal_partner
            else None
        ),
        my_photos=[to_photo_read(p) for p in my_photos],
        partner_photos=[to_photo_read(p) for p in partner_photos] if reveal_partner else [],
        my_voice_notes=[to_voice_note_read(v) for v in my_voice_notes],
        partner_voice_notes=(
            [to_voice_note_read(v) for v in partner_voice_notes] if reveal_partner else []
        ),
    )


@router.post("", response_model=EntryRead, status_code=status.HTTP_201_CREATED)
def create_entry(
    payload: EntryCreate, user: User = Depends(get_current_linked_user), db: Session = Depends(get_db)
) -> EntryRead:
    entry = Entry(couple_id=user.couple_id, **payload.model_dump())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return _shape_entry(entry, user, db)


@router.get("", response_model=list[EntryRead])
def list_entries(
    user: User = Depends(get_current_linked_user),
    db: Session = Depends(get_db),
    limit: int = Query(default=50, le=200),
    offset: int = 0,
) -> list[EntryRead]:
    entries = db.scalars(
        _entry_query()
        .where(Entry.couple_id == user.couple_id)
        .order_by(Entry.entry_date.desc())
        .limit(limit)
        .offset(offset)
    ).all()
    return [_shape_entry(e, user, db) for e in entries]


@router.get("/summary/anniversary", response_model=AnniversarySummary)
def anniversary_summary(
    user: User = Depends(get_current_linked_user), db: Session = Depends(get_db)
) -> AnniversarySummary:
    """Feeds the animated presentation mode: overall stats plus the unlocked
    entries either partner marked as a favorite, in chronological order."""
    couple = db.get(Couple, user.couple_id)
    since = couple.linked_at.date() if couple and couple.linked_at else None
    days_together = (date.today() - since).days if since else 0

    entries = db.scalars(
        _entry_query().where(Entry.couple_id == user.couple_id).order_by(Entry.entry_date.asc())
    ).all()

    favorite_entry_ids = set(
        db.scalars(
            select(Favorite.entry_id)
            .join(Entry, Entry.id == Favorite.entry_id)
            .where(Entry.couple_id == user.couple_id)
        ).all()
    )

    total_photos = sum(len(e.photos) for e in entries)

    highlights = [e for e in entries if e.is_unlocked and e.id in favorite_entry_ids]

    return AnniversarySummary(
        days_together=days_together,
        total_entries=len(entries),
        unlocked_entries=sum(1 for e in entries if e.is_unlocked),
        total_photos=total_photos,
        highlight_entries=[_shape_entry(e, user, db) for e in highlights],
    )


@router.get("/{entry_id}", response_model=EntryRead)
def get_entry(
    entry_id: uuid.UUID, user: User = Depends(get_current_linked_user), db: Session = Depends(get_db)
) -> EntryRead:
    entry = _get_entry_or_404(db, user.couple_id, entry_id)
    return _shape_entry(entry, user, db)


@router.post("/{entry_id}/comment", response_model=EntryRead)
def add_comment(
    entry_id: uuid.UUID,
    payload: EntryCommentCreate,
    user: User = Depends(get_current_linked_user),
    db: Session = Depends(get_db),
) -> EntryRead:
    entry = _get_entry_or_404(db, user.couple_id, entry_id)
    existing = next((c for c in entry.comments if c.user_id == user.id), None)
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Ya dejaste tu comentario para este día"
        )

    from app.models.comment import EntryComment

    was_unlocked = entry.is_unlocked
    db.add(EntryComment(entry_id=entry.id, user_id=user.id, text=payload.text))
    db.commit()
    db.refresh(entry)

    if not was_unlocked and entry.is_unlocked:
        _notify_entry_unlocked(db, entry, notify_user_id=user.id)

    return _shape_entry(entry, user, db)


def _notify_entry_unlocked(db: Session, entry: Entry, notify_user_id: uuid.UUID) -> None:
    """Tells the OTHER partner (the one who was already waiting) that
    `notify_user_id` just left the comment that unlocked this entry."""
    from app.models.notification import Notification, NotificationType

    partner = db.scalar(
        select(User).where(User.couple_id == entry.couple_id, User.id != notify_user_id)
    )
    if partner is None:
        return

    when = entry.title or entry.entry_date.strftime("%d/%m/%Y")
    db.add(
        Notification(
            user_id=partner.id,
            couple_id=entry.couple_id,
            entry_id=entry.id,
            type=NotificationType.ENTRY_UNLOCKED,
            message=f"Tu pareja dejó su comentario en «{when}» y la entrada se reveló 💌",
        )
    )
    db.commit()


@router.post("/{entry_id}/photos/presign")
def presign_photo_upload(
    entry_id: uuid.UUID,
    filename: str = Query(...),
    content_type: str = Query(default="image/jpeg"),
    user: User = Depends(get_current_linked_user),
    db: Session = Depends(get_db),
) -> dict:
    _get_entry_or_404(db, user.couple_id, entry_id)
    object_key = build_object_key(user.couple_id, entry_id, filename)
    return {
        "upload_url": presigned_upload_url(object_key, content_type),
        "storage_key": object_key,
    }


@router.post("/{entry_id}/photos", response_model=EntryRead, status_code=status.HTTP_201_CREATED)
def register_photo(
    entry_id: uuid.UUID,
    payload: PhotoCreate,
    user: User = Depends(get_current_linked_user),
    db: Session = Depends(get_db),
) -> EntryRead:
    entry = _get_entry_or_404(db, user.couple_id, entry_id)

    db.add(
        EntryPhoto(
            entry_id=entry.id,
            user_id=user.id,
            storage_key=payload.storage_key,
            caption=payload.caption,
            taken_at=payload.taken_at,
        )
    )
    db.commit()
    db.refresh(entry)
    return _shape_entry(entry, user, db)


@router.post(
    "/{entry_id}/photos/{photo_id}/stickers",
    response_model=EntryRead,
    status_code=status.HTTP_201_CREATED,
)
def add_sticker(
    entry_id: uuid.UUID,
    photo_id: uuid.UUID,
    payload: StickerCreate,
    user: User = Depends(get_current_linked_user),
    db: Session = Depends(get_db),
) -> EntryRead:
    if payload.sticker_type not in STICKER_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Sticker inválido")
    entry = _get_entry_or_404(db, user.couple_id, entry_id)
    photo = next((p for p in entry.photos if p.id == photo_id), None)
    if photo is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Foto no encontrada")

    from app.models.sticker import PhotoSticker

    db.add(
        PhotoSticker(
            photo_id=photo.id,
            sticker_type=payload.sticker_type,
            x=payload.x,
            y=payload.y,
            rotation=payload.rotation,
        )
    )
    db.commit()
    db.refresh(entry)
    return _shape_entry(entry, user, db)


@router.delete("/{entry_id}/photos/{photo_id}/stickers/{sticker_id}", response_model=EntryRead)
def remove_sticker(
    entry_id: uuid.UUID,
    photo_id: uuid.UUID,
    sticker_id: uuid.UUID,
    user: User = Depends(get_current_linked_user),
    db: Session = Depends(get_db),
) -> EntryRead:
    entry = _get_entry_or_404(db, user.couple_id, entry_id)
    photo = next((p for p in entry.photos if p.id == photo_id), None)
    if photo is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Foto no encontrada")
    sticker = next((s for s in photo.stickers if s.id == sticker_id), None)
    if sticker is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sticker no encontrado")
    db.delete(sticker)
    db.commit()
    db.refresh(entry)
    return _shape_entry(entry, user, db)


@router.post("/{entry_id}/voice-notes/presign")
def presign_voice_note_upload(
    entry_id: uuid.UUID,
    user: User = Depends(get_current_linked_user),
    db: Session = Depends(get_db),
) -> dict:
    _get_entry_or_404(db, user.couple_id, entry_id)
    object_key = build_object_key(user.couple_id, entry_id, "voice.webm")
    return {
        "upload_url": presigned_upload_url(object_key, "audio/webm"),
        "storage_key": object_key,
    }


@router.post(
    "/{entry_id}/voice-notes", response_model=EntryRead, status_code=status.HTTP_201_CREATED
)
def register_voice_note(
    entry_id: uuid.UUID,
    payload: VoiceNoteCreate,
    user: User = Depends(get_current_linked_user),
    db: Session = Depends(get_db),
) -> EntryRead:
    entry = _get_entry_or_404(db, user.couple_id, entry_id)
    db.add(
        EntryVoiceNote(
            entry_id=entry.id,
            user_id=user.id,
            storage_key=payload.storage_key,
            duration_seconds=payload.duration_seconds,
        )
    )
    db.commit()
    db.refresh(entry)
    return _shape_entry(entry, user, db)


@router.put("/{entry_id}/favorite", response_model=EntryRead)
def toggle_favorite(
    entry_id: uuid.UUID, user: User = Depends(get_current_linked_user), db: Session = Depends(get_db)
) -> EntryRead:
    entry = _get_entry_or_404(db, user.couple_id, entry_id)
    existing = db.scalar(
        select(Favorite).where(Favorite.entry_id == entry.id, Favorite.user_id == user.id)
    )
    if existing:
        db.delete(existing)
    else:
        db.add(Favorite(entry_id=entry.id, user_id=user.id))
    db.commit()
    return _shape_entry(entry, user, db)
