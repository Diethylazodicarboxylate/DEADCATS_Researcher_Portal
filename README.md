# DEADCATS Research Portal

DEADCATS is a full-stack cyber research portal with:

- Team dashboard, announcements, shared wiki, vault, whiteboard, members, CTF tracking
- Auth + admin portal + profile management
- Shared wiki with markdown/code blocks, review workflow, revision history, and admin-controlled public publishing
- Integrated **PwnBox** browser terminal (`/pwnbox.html`)
- PostgreSQL backend (FastAPI + SQLAlchemy)

This README is the single source of truth for setup and deployment.

<img width="1350" height="2456" alt="Screenshot 2026-03-07 at 15-18-21 DEADCATS __ Researcher Portal" src="https://github.com/user-attachments/assets/2eedc4c4-f84e-48d7-9e2b-ecde9b66f030" />

<img width="1350" height="611" alt="Screenshot 2026-03-07 at 15-18-48 DEADCATS __ Authenticate" src="https://github.com/user-attachments/assets/570523db-9c58-4f62-811e-1a491cda85c8" />

<img width="1491" height="1477" alt="Screenshot 2026-03-07 at 15-21-25 DEADCATS __ Dashboard" src="https://github.com/user-attachments/assets/d10b69b8-6ff9-458a-8999-f3b1bf9a4163" />

![2026-03-05_00-20](https://github.com/user-attachments/assets/cc82c1e7-2d45-428f-94b3-650394b9976d)

<img width="1350" height="1364" alt="Screenshot 2026-03-07 at 15-21-46 DEADCATS __ Monitor" src="https://github.com/user-attachments/assets/e32bcd0d-7c70-4378-abbe-c9afb802239b" />

## Tech Stack

- Backend: FastAPI, SQLAlchemy
- DB: PostgreSQL
- Frontend: Static HTML/CSS/JS served by FastAPI
- PwnBox runtime: Docker SDK + host Docker daemon

## Core Workflow

- Operations give the portal its shared investigation context
- Internal research lives in the shared wiki at `/library.html`
- Operations can be created from the dashboard and reviewed on `/operations.html`
- Notes support markdown, fenced code blocks, backlinks, bookmarks, and version history
- Notes now support autosave, local draft recovery, conflict protection, and threaded comments
- Notes can be assigned to operations and the wiki can be filtered by operation
- IOCs can also be linked to operations from `/ioc-tracker.html`
- Vault files can be linked to operations from `/vault.html`
- CTF events can be linked to operations from `/ctf.html`
- Operation goals live inside the war room and the operation detail page
- The dashboard and operation pages expose a live activity timeline across notes, indicators, evidence files, goals, and CTF events
- Each operation can carry its own war room canvas and be opened directly in `/whiteboard.html?operation_id=<id>`
- Admins now have a dedicated review board at `/review-board.html`
- Authors can submit notes for review
- Admins can approve, request changes, and export approved notes into the public research feed
- Public research is grouped into separate publish folders and displayed at `/research-feed.html`

## Quick Start (Docker, Recommended)

This guide uses `docker-compose` (legacy CLI). If your machine has Compose v2 plugin, you can replace it with `docker compose`.

Before you deploy, set production secrets and decide whether you actually want PwnBox enabled on the same host. The app works without making the Docker socket a general-purpose convenience feature; with PwnBox enabled, that socket mount becomes the highest-risk part of the platform.

### 1) Clone and enter repo

```bash
git clone <your-repo-url>
cd DEADCATS_Researcher_Portal
```

### 2) Create env file

```bash
cp .env.example .env
```

Edit `.env` and set secure values (especially `JWT_SECRET`, `ADMIN_PASSWORD`).

## Coolify Deployment

Use Docker Compose deployment in Coolify. Do not upload or rely on a `.env` file from the repo. Set the variables in Coolify and let Coolify inject them at runtime.

Exact setup:

1. Create a new Coolify application from this Git repository.
2. Choose the `docker-compose.yml` deployment option.
3. Set the public domain to `research.deadcats.space`.
4. Expose the `app` service on port `8000`.
5. Keep the `db` service internal unless you are replacing it with a managed PostgreSQL service.
6. Add the environment variables below in Coolify before the first deploy.

Recommended values for your current public host:

```env
POSTGRES_USER=deadcats
POSTGRES_PASSWORD=replace_with_strong_database_password
POSTGRES_DB=deadcats_db
DATABASE_URL=postgresql://deadcats:replace_with_strong_database_password@db:5432/deadcats_db

JWT_SECRET=replace_with_long_random_secret_at_least_32_chars
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=480

ADMIN_HANDLE=deadcats_master333
ADMIN_PASSWORD=replace_with_strong_admin_password
MASTER_HANDLE=deadcats_master333

FRONTEND_ORIGIN=https://research.deadcats.space
ALLOW_SELF_REGISTER=false
REGISTER_TOKEN=
COOKIE_SECURE=true
COOKIE_SAMESITE=lax

CTFTIME_TEAM_ID=367609

PWNBOX_IMAGE=pwnbox-base:latest
PWNBOX_AUTO_BUILD=true
PWNBOX_SESSION_TTL_MINUTES=90
PWNBOX_ALLOWED_ORIGINS=https://research.deadcats.space

AI_CHAT_PROVIDER=openai
AI_CHAT_BASE_URL=https://openrouter.ai/api/v1
AI_CHAT_API_KEY=
AI_CHAT_MODEL=qwen/qwen2.5-72b-instruct:free
AI_CHAT_TIMEOUT_SECONDS=60
AI_CHAT_SITE_URL=https://research.deadcats.space
AI_CHAT_SITE_NAME=DEADCATS Research Portal
AI_CHAT_GEMINI_API_KEY=
```

Notes:

- `FRONTEND_ORIGIN` can be a comma-separated list if you need multiple allowed origins.
- `PWNBOX_ALLOWED_ORIGINS` should include the same public host used for the portal.
- `DATABASE_URL` must point to the hostname visible from the app container.
- `COOKIE_SECURE=true` should stay enabled on HTTPS deployments.
- If you keep the Compose `db` service, use `db` as the hostname inside `DATABASE_URL`.
- If you use a separate managed PostgreSQL instance, replace `DATABASE_URL` with that connection string and remove or disable the local `db` service in Coolify.
- After deploy, the app should be available at `https://research.deadcats.space/login.html`.
- Admin review, publishing, publish folders, and note revision history are created automatically by the backend on startup.

### 3) Start everything

```bash
docker-compose up -d --build
```

Expected output includes:
- `Container deadcats-db ... Healthy`
- `Container deadcats-app ... Started`

### 4) Open app

- `http://127.0.0.1:8000/login.html`
- `http://127.0.0.1:8000/dashboard.html`
- `http://127.0.0.1:8000/pwnbox.html`

### 5) Logs / status

```bash
docker-compose logs -f app
docker-compose ps
curl -s http://127.0.0.1:8000/api/health
curl -s http://127.0.0.1:8000/api/pwnbox/health
```

You should see startup lines like:
- `Admin account 'deadcats_master333' created.`
- `Uvicorn running on http://0.0.0.0:8000`

### 6) Stop

```bash
docker-compose down
```

To also delete DB data:

```bash
docker-compose down -v
```

Full reset (including all project volumes + orphan containers):

```bash
docker-compose down -v --remove-orphans
docker-compose up -d --build
```

## What Docker Compose Brings Up

- `db`: PostgreSQL 16
- `app`: FastAPI app serving API + all frontend pages

`app` mounts `/var/run/docker.sock`, so PwnBox can create user containers on the host Docker daemon.

If you do not need PwnBox in production, remove that socket mount and disable the PwnBox feature path. That single choice reduces your attack surface more than any frontend hardening.

## Environment Variables (`.env`)

Minimum recommended:

```env
POSTGRES_USER=deadcats
POSTGRES_PASSWORD=replace_with_strong_database_password
POSTGRES_DB=deadcats_db
DATABASE_URL=postgresql://deadcats:replace_with_strong_database_password@db:5432/deadcats_db

JWT_SECRET=replace_with_a_long_random_secret_at_least_32_chars
ADMIN_HANDLE=deadcats_master333
ADMIN_PASSWORD=replace_with_strong_admin_password

FRONTEND_ORIGIN=https://research.deadcats.space
ALLOW_SELF_REGISTER=false
REGISTER_TOKEN=
COOKIE_SECURE=true
COOKIE_SAMESITE=lax

PWNBOX_IMAGE=pwnbox-base:latest
PWNBOX_AUTO_BUILD=true
PWNBOX_SESSION_TTL_MINUTES=90
PWNBOX_ALLOWED_ORIGINS=https://research.deadcats.space
# Used OpenRouter
# AI Chat
AI_CHAT_PROVIDER=openai
AI_CHAT_BASE_URL=https://openrouter.ai/api/v1
AI_CHAT_API_KEY=your_provider_key
AI_CHAT_MODEL=qwen/qwen2.5-72b-instruct:free
AI_CHAT_TIMEOUT_SECONDS=60
AI_CHAT_SITE_URL=https://research.deadcats.space
AI_CHAT_SITE_NAME=DEADCATS Research Portal
AI_CHAT_GEMINI_API_KEY=
```

Notes:

- `DATABASE_URL` is required for Docker and Coolify deployments.
- `COOKIE_SECURE=true` when using HTTPS.
- If `PWNBOX_AUTO_BUILD=true`, first PwnBox start builds base image automatically.
- AI chat is available at `/ai-chat.html`.
- For OpenRouter/Qwen:
  - `AI_CHAT_PROVIDER=openai`
  - `AI_CHAT_BASE_URL=https://openrouter.ai/api/v1`
  - `AI_CHAT_MODEL=qwen/qwen2.5-72b-instruct:free`
  - `AI_CHAT_API_KEY=...`
- For Gemini API:
  - `AI_CHAT_PROVIDER=gemini`
  - `AI_CHAT_BASE_URL=https://generativelanguage.googleapis.com/v1beta`
  - `AI_CHAT_MODEL=gemini-2.0-flash`
  - `AI_CHAT_GEMINI_API_KEY=...` (or reuse `AI_CHAT_API_KEY`)

## Common Commands

Rebuild app:

```bash
docker-compose up -d --build app
```

Restart app only:

```bash
docker-compose restart app
```

See DB logs:

```bash
docker-compose logs -f db
```

Run DB shell:

```bash
docker-compose exec db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
```

## Live Dev In Docker

Use the dev override to edit code locally and test live inside Docker.

Start:

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
docker-compose logs -f app
```

Behavior:

- Backend Python changes auto-reload (`uvicorn --reload`)
- Frontend HTML/CSS/JS changes appear after browser refresh

If you change `backend/requirements.txt`, rebuild app:

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build app
```

## Local Non-Docker Run (Optional)

Requirements:

- Python 3.11+
- PostgreSQL running locally
- Docker running locally (for PwnBox)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## PwnBox Behavior

- Single active session at a time
- Session lock/state persisted on backend side
- Web terminal over WebSocket
- User shell inside isolated container
- Owner/admin protection for attach/stop paths
- First run may take ~1-3 minutes while base image is prepared

When clicking `Start` in `/pwnbox.html`:

- `POST /api/pwnbox/start 201` = new PwnBox session created
- `POST /api/pwnbox/start 409` = session already active (UI reconnects to active session)
- WebSocket log `... /api/pwnbox/ws/<session_id> [accepted]` = terminal attached successfully

If PwnBox start fails:

1. Confirm Docker socket mount is present (`/var/run/docker.sock` in app container).
2. Check app logs:
   ```bash
   docker-compose logs -f app
   ```
3. Verify API:
   ```bash
   curl -s http://127.0.0.1:8000/api/pwnbox/status
   ```

Optional live checks while waiting:

```bash
docker images | grep pwnbox-base
```

## Persistence

Compose volumes persist:

- PostgreSQL data
- `profile_uploads`
- `vault_files`
- `logs`

## Security Notes

- Set strong `JWT_SECRET` and `ADMIN_PASSWORD`.
- Do not rely on the generated fallback secrets/passwords outside local development.
- Use HTTPS + reverse proxy in production.
- Set `COOKIE_SECURE=true` under HTTPS.
- Keep `ALLOW_SELF_REGISTER=false` unless you have a controlled onboarding flow.
- Limit host access to Docker socket. If PwnBox is enabled, treat the app host as a high-trust environment.
- Review `FRONTEND_ORIGIN` and `PWNBOX_ALLOWED_ORIGINS` carefully. Do not leave them broad.
- The backend now adds stricter response headers and login throttling, but that is not a substitute for reverse-proxy rate limiting and TLS termination.

## Production Checklist

- Set long random values for `JWT_SECRET`, `ADMIN_PASSWORD`, and database credentials
- Run behind HTTPS with a reverse proxy
- Keep `COOKIE_SECURE=true`
- Keep `ALLOW_SELF_REGISTER=false` unless intentionally enabled
- Restrict database exposure to the app network only
- Decide whether PwnBox is worth the Docker socket risk on the same deployment
- Back up PostgreSQL and the named volumes regularly
- Watch app logs and auth logs for repeated failures or abuse

## Project Layout

- `backend/` - FastAPI app, routers, models
- `assets/` - shared frontend JS/CSS
- `partials/` - shared page partials
- `*.html` - frontend pages
- `pwnbox/` - legacy standalone PwnBox scaffold/scripts

Primary production path is integrated app at `/pwnbox.html` via main backend.
