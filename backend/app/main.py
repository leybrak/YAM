from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth, capsules, couples, entries
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


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}
