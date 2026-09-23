import pathlib

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.routes import auth, capsules, couples, entries, uploads
from app.core.config import settings

app = FastAPI(title="YAM", description="Álbum virtual para dos", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(couples.router)
app.include_router(entries.router)
app.include_router(capsules.router)
app.include_router(uploads.router)

if settings.STORAGE_BACKEND == "local":
    pathlib.Path(settings.MEDIA_ROOT).mkdir(parents=True, exist_ok=True)
    app.mount("/media", StaticFiles(directory=settings.MEDIA_ROOT), name="media")


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}
