# AGENTS.md

## Cursor Cloud specific instructions

ReachGenie is a **FastAPI** backend (AI sales-automation / AI SDR platform). The
app code lives in `src/` (entrypoint `src/main.py`, FastAPI app `app`). It uses
the **Supabase Python client (PostgREST)** for almost all DB access (including
signup/login), a few **direct asyncpg** paths (LinkedIn/webhooks), and
**Celery + Redis** for background campaign processing.

Standard run/test/build commands are already documented in `INSTALL.md` and
`docs/development.md`; prefer those. The notes below capture only the
non-obvious, Cloud-specific caveats.

### Services and how they run here

The cloud VM has **no Docker** and **no hosted Supabase**. Instead a
Supabase-compatible stack runs natively and is started with one script:

```bash
sudo /opt/reachgenie-dev/start-services.sh   # idempotent
```

This starts/uses:
- **PostgreSQL 16** (cluster `16 main`, on `127.0.0.1:5432`, db `reachgenie`).
- **PostgREST** (`/usr/local/bin/postgrest`, config `/opt/reachgenie-dev/postgrest.conf`, port `3001`).
- **nginx gateway** on **`:54321`** that maps `/rest/v1/` → PostgREST, mimicking
  Supabase's Kong gateway. This is why `SUPABASE_URL=http://127.0.0.1:54321`
  works with `supabase.table(...)` calls (the client appends `/rest/v1`).
- **Redis** (`:6379`) for Celery.

The Supabase anon/service JWTs in `.env` are signed with the fixed `jwt-secret`
in `/opt/reachgenie-dev/postgrest.conf`. If you change one, change both.

### Running the app (dev)

```bash
source venv/bin/activate
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

API docs at `http://localhost:8000/docs`. `GET /` returns an empty body (not a
JSON health payload) — that is expected.

Celery worker (only needed for campaign/lead background jobs, not for auth/CRUD):
```bash
celery -A src.celery_app.tasks worker --loglevel=info
```

### Environment / config gotchas

- Config is `pydantic-settings` (`src/config.py`) reading `.env`. The model
  **forbids extra keys in the `.env` file**. Do **not** put `POSTGRES_USER/
  PASSWORD/HOST/DB/PORT` in `.env` — they are read via `os.getenv` and must be
  exported as OS env vars instead (extras in `os.environ` are ignored, extras in
  `.env` raise a ValidationError and the app won't start). The asyncpg paths use:
  `POSTGRES_USER=postgres POSTGRES_PASSWORD=postgres POSTGRES_HOST=127.0.0.1 POSTGRES_DB=reachgenie POSTGRES_PORT=5432`.
- Most external-service keys in `.env` are placeholders. Features that call
  OpenAI/Anthropic/Perplexity/Bland/Mailjet/Stripe will fail or no-op until real
  keys are supplied. In particular **signup's verification email cannot be sent**
  (placeholder Mailjet); signup still succeeds and stores a token.

### Database schema caveats (important, non-obvious)

- `schema.sql` has **forward-reference ordering** (e.g. `leads` references
  `upload_tasks` before it is defined). Applying it top-to-bottom once leaves
  ~20 errors; **run it 2–3 times** (it is idempotent via `IF NOT EXISTS`) until 0
  errors, then apply `postgres_functions.sql`.
- `schema.sql` is **missing a `deleted` column on `companies`** that the code
  (`get_companies_by_user_id`, `soft_delete_company`) expects. Without it
  `GET /api/companies` silently returns `[]`. It has been added in the local DB:
  `ALTER TABLE companies ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE;`
  After any DDL change, reload PostgREST's cache: `NOTIFY pgrst, 'reload schema';`
- PostgREST roles `anon`/`authenticated`/`service_role` + login role
  `authenticator` exist; `public` tables are granted to them. New tables need
  the same grants for the Supabase client to reach them.

### Verifying a user without email (for end-to-end auth testing)

Signup → login requires a verified user, but no email is sent. Pull the token
from the DB and call the verify endpoint (or set `verified=true` directly):

```bash
psql "postgres://postgres:postgres@127.0.0.1:5432/reachgenie" -tAc \
  "SELECT vt.token FROM verification_tokens vt JOIN users u ON u.id=vt.user_id WHERE u.email='YOUR_EMAIL' ORDER BY vt.expires_at DESC LIMIT 1"
# then POST {"token": "..."} to /api/auth/verify
```

### Lint / tests

- `flake8 src/` and `black --check src/` run, but the repo is **not** lint/format
  clean (thousands of pre-existing warnings, ~88 files black would reformat). Do
  not mass-reformat.
- There are **no pytest unit tests** (`pytest` collects 0). The real end-to-end
  tests are shell scripts in `tests/` (`api_workflow_test.sh`,
  `api_workflow_ci_test.sh`) that drive signup→login→company→product→campaign
  against a running server.
