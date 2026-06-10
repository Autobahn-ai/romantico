# ReachGenie Setup Guide (from cloned repo)

Step-by-step instructions for running the **full ReachGenie backend** from your cloned repository.

> **Note:** For the simple pipeline (search → analyze → contact → email → Google Sheet), use the [minimal Python script](../../outbound-pipeline/README.md) or [n8n workflow](./n8n-workflow-guide.md) instead. ReachGenie is only needed if you want the full AI SDR platform.

## What you're setting up

| Service | Purpose | Port |
|---------|---------|------|
| FastAPI (`web`) | REST API + `/docs` UI | 8000 |
| Redis | Email/call queues, Celery broker | 6379 |
| Celery worker | Background campaign processing | — |
| Flower | Celery monitoring dashboard | 5555 |
| PostgreSQL/Supabase | Primary database | 5432 |
| Frontend (separate repo) | Web UI | 3000 |

## Prerequisites

- **Python 3.12+**
- **PostgreSQL** (Supabase recommended) or self-hosted Postgres
- **Redis** (local install or Docker)
- API keys: OpenAI, Perplexity, Mailjet (email), and others depending on features used

### OS-specific notes

| OS | Redis | Postgres |
|----|-------|----------|
| **Linux** | `sudo apt install redis-server` | `sudo apt install postgresql` or use Supabase |
| **Mac** | `brew install redis` | `brew install postgresql@15` or Supabase |
| **Windows** | WSL2 recommended, or Docker Desktop | Supabase cloud (easiest) |

---

## Option A: Automated setup script

From the repo root:

```bash
bash scripts/setup_reachgenie.sh
```

This will:
1. Create a Python virtual environment (`venv/`)
2. Install dependencies from `requirements.txt`
3. Copy `.env.example` → `.env` if missing
4. Print a checklist of remaining manual steps

Then follow the printed checklist to fill in `.env` and start services.

---

## Option B: Manual setup

### Step 1: Virtual environment + dependencies

```bash
cd /path/to/reachgenie   # repo root
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
# or: pip install -e .
```

Verify:

```bash
python -c "from fastapi import FastAPI; print('OK')"
```

### Step 2: Environment variables

```bash
cp .env.example .env
```

**Minimum to boot the API** (other features will fail until configured):

```bash
# Database (Supabase)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key

# Or self-hosted Postgres
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=yourpassword
POSTGRES_DB=reachgenie

# Auth
JWT_SECRET_KEY=generate-a-long-random-string

# AI (required for enrichment/email)
OPENAI_API_KEY=sk-...
PERPLEXITY_API_KEY=pplx-...

# Redis
REDIS_URL=redis://localhost:6379/0

# App
FRONTEND_URL=http://localhost:3000
ENVIRONMENT=development
```

See [README.md](../../README.md#environment-variables) for the full list (Stripe, Bland AI, Mailjet, Cronofy, LinkedIn, etc.).

### Step 3: Database schema

**Supabase:**
1. Create a project at [supabase.com](https://supabase.com)
2. Open SQL Editor → paste contents of `schema.sql` → Run
3. Run any files in `migrations/` as needed

**Self-hosted Postgres:**

```bash
createdb reachgenie
psql -U postgres -d reachgenie -f schema.sql
```

Verify connection:

```bash
source venv/bin/activate
python -m src.scripts.check_postgres_connection
```

### Step 4: Start Redis

```bash
# Linux/Mac
redis-server

# Or background
redis-server --daemonize yes

# Verify
redis-cli ping   # should return PONG
```

### Step 5: Start the API

```bash
source venv/bin/activate
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

Open **http://localhost:8000/docs** — you should see the Swagger UI.

Health check:

```bash
curl http://localhost:8000/
```

### Step 6: Start Celery worker (required for campaigns)

In a **second terminal**:

```bash
source venv/bin/activate
celery -A src.celery_app.tasks worker --loglevel=info
```

Optional — Flower monitoring (third terminal):

```bash
celery -A src.celery_app.tasks flower --port=5555
# http://localhost:5555  (default: admin/password in docker-compose)
```

### Step 7: Frontend (separate)

ReachGenie’s web UI is **not in this backend repo**. Set `FRONTEND_URL` to wherever your frontend runs (typically `http://localhost:3000`). Check the main ReachGenie monorepo or your team’s frontend repo.

---

## Option C: Docker Compose

```bash
cp .env.example .env
# Edit .env with real credentials

# Create the external network (required by docker-compose.yml)
docker network create supabase_network_outbound_ai_sdr

docker compose up -d
```

Services started:
- `web` → http://localhost:8000
- `redis` → localhost:6379
- `celery_worker` → background
- `flower` → http://localhost:5555

> Postgres is **not** included in docker-compose (commented out). Use Supabase or connect to an external Postgres instance via `.env`.

View logs:

```bash
docker compose logs -f web
docker compose logs -f celery_worker
```

Stop:

```bash
docker compose down
```

---

## Verify everything works

### 1. API docs load

```
http://localhost:8000/docs
```

### 2. Create a test user

```bash
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!","name":"Test User"}'
```

### 3. Run API workflow tests (optional)

```bash
cd tests
DB_HOST=localhost DB_PORT=5432 DB_NAME=reachgenie \
  DB_USER=postgres DB_PASSWORD=postgres \
  ./api_workflow_ci_test.sh
```

Requires a running backend + database.

---

## Common errors

| Error | Fix |
|-------|-----|
| `ModuleNotFoundError: No module named 'fastapi'` | Activate venv, run `pip install -r requirements.txt` |
| `Connection refused` (Postgres) | Check `POSTGRES_*` or `SUPABASE_*` in `.env`; ensure DB is running |
| `Connection refused` (Redis) | Start `redis-server`; set `REDIS_URL=redis://localhost:6379/0` |
| Celery tasks never run | Ensure Celery worker is running and Redis is up |
| `network supabase_network_outbound_ai_sdr not found` | Run `docker network create supabase_network_outbound_ai_sdr` |
| Mailjet / email errors | Set `MAILJET_*` vars; emails won't send without them |
| No UI, only JSON API | Expected — frontend is a separate app |

---

## Cron jobs (production)

For full campaign functionality, schedule the scripts in `crons/`:

```bash
crontab -e
```

Example (adjust paths):

```cron
* * * * * cd /path/to/repo && bash crons/process_email_queue.sh
*/5 * * * * cd /path/to/repo && bash crons/process_emails.sh
0 * * * * cd /path/to/repo && bash crons/send_reminders.sh
```

See [README.md](../../README.md#background-jobs--cron-tasks) for the full schedule.

---

## Which approach should you use?

| Goal | Use |
|------|-----|
| Quick prototype → Google Sheet | [outbound-pipeline/pipeline.py](../../outbound-pipeline/README.md) |
| No-code / visual automation | [n8n workflow](./n8n-workflow-guide.md) |
| Full multi-channel SDR platform | This ReachGenie setup |

---

## Current workspace status

When this guide was written, the cloned repo had:

- Source code present
- No `.env` configured
- Dependencies not installed
- Docker not available in the cloud agent environment

Run `bash scripts/setup_reachgenie.sh` locally to get through Steps 1–2 automatically.
