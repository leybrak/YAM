from pydantic import BaseModel

from app.schemas.entry import EntryRead


class AnniversarySummary(BaseModel):
    days_together: int
    total_entries: int
    unlocked_entries: int
    total_photos: int
    highlight_entries: list[EntryRead]
