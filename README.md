# YAM — álbum virtual para dos

Un cuaderno compartido entre dos personas: entradas por día (no por usuario), revelación
"blind drop" de fotos y comentarios (se destraban cuando ambos participaron), cápsulas de
tiempo con cuenta regresiva, y una estética de scrapbook animada con GSAP.

## Stack

- **Backend**: Python (FastAPI) + PostgreSQL (SQLAlchemy + Alembic) + JWT auth
- **Storage**: OCI Object Storage vía API S3-compatible (subida directa desde el navegador
  con URLs prefirmadas — el backend en Hetzner nunca proxea los bytes de las imágenes)
- **Frontend**: React + Vite + TypeScript + Tailwind v4 + GSAP + Zustand

## Estructura

```
backend/    API FastAPI, modelos, migraciones Alembic
frontend/   SPA React (Vite)
docker-compose.yml   Postgres local para desarrollo
```

## Desarrollo local

### 1. Base de datos

```bash
docker compose up -d db
```

### 2. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate      # Windows
pip install -r requirements.txt
copy .env.example .env      # y completar SECRET_KEY + credenciales de OCI
alembic upgrade head
uvicorn app.main:app --reload
```

La API queda en `http://localhost:8000` (docs interactivas en `/docs`).

### 3. Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

La app queda en `http://localhost:5173`.

## Modelo de datos (resumen)

- `users` — cuenta individual
- `couples` — vínculo entre dos usuarios (código de invitación = "mitad de llave")
- `entries` — una página por día, pertenece al **couple**, no a un usuario
- `entry_comments` — "lo que más me gustó hoy"; una entrada se marca `unlocked` recién
  cuando ambos usuarios comentaron
- `entry_photos` — fotos subidas por cada integrante para esa entrada (fotos cruzadas)
- `time_capsules` — mensaje/foto sellado hasta una fecha futura
- `favorites` — entradas marcadas como favoritas (insumo del resumen de aniversario)

## Pendiente / próximos pasos

- Modo presentación / resumen de aniversario animado
- Notificaciones cuando la pareja deja su comentario y se destraba una entrada
- Subida de fotos con recorte/orientación antes del presign
- Tests (pytest en backend, Vitest en frontend)
- CI en GitHub Actions + deploy a Hetzner
