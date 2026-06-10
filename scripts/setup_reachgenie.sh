#!/usr/bin/env bash
# ReachGenie automated setup — run from repo root: bash scripts/setup_reachgenie.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "=== ReachGenie Setup ==="
echo "Repo: $REPO_ROOT"
echo ""

# --- Python version ---
if ! command -v python3 &>/dev/null; then
  echo "ERROR: python3 not found. Install Python 3.12+ first."
  exit 1
fi

PY_VERSION=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
echo "Python: $PY_VERSION"
if python3 -c "import sys; exit(0 if sys.version_info >= (3, 12) else 1)"; then
  echo "  ✓ Python 3.12+"
else
  echo "  ⚠ Python 3.12+ recommended (you have $PY_VERSION)"
fi

# --- Virtual environment ---
if [[ ! -d venv ]]; then
  echo ""
  echo "Creating virtual environment..."
  if ! python3 -m venv venv 2>/dev/null; then
    echo "  ⚠ venv module unavailable — trying python3-venv package..."
    if command -v apt-get &>/dev/null; then
      sudo apt-get update -qq && sudo apt-get install -y -qq python3-venv python3.12-venv 2>/dev/null || true
      python3 -m venv venv || {
        echo "  ⚠ Could not create venv. Install manually: apt install python3-venv"
        echo "    Continuing with system python3..."
      }
    else
      echo "  ⚠ Could not create venv. Install python3-venv for your OS."
      echo "    Continuing with system python3..."
    fi
  fi
fi

if [[ -f venv/bin/activate ]]; then
  # shellcheck disable=SC1091
  source venv/bin/activate
  echo "  ✓ venv activated"
else
  echo "  ⚠ Using system python3 (no venv)"
fi

# --- Dependencies ---
echo ""
echo "Installing dependencies (this may take a few minutes)..."
pip install --upgrade pip -q
pip install -r requirements.txt -q
echo "  ✓ requirements.txt installed"

# --- Verify import ---
python3 -c "from fastapi import FastAPI; print('  ✓ fastapi import OK')"

# --- .env ---
if [[ ! -f .env ]]; then
  cp .env.example .env
  echo ""
  echo "  ✓ Created .env from .env.example — EDIT THIS FILE with your credentials"
else
  echo ""
  echo "  ✓ .env already exists"
fi

# --- Redis check ---
echo ""
if command -v redis-cli &>/dev/null && redis-cli ping &>/dev/null; then
  echo "  ✓ Redis is running"
else
  echo "  ⚠ Redis not detected. Start it before running campaigns:"
  echo "      redis-server"
fi

# --- Docker check ---
echo ""
if command -v docker &>/dev/null; then
  echo "  ✓ Docker available (optional: docker compose up -d)"
else
  echo "  ⚠ Docker not installed (optional — use manual uvicorn + celery instead)"
fi

# --- Postgres check ---
echo ""
if [[ -f .env ]] && grep -qE '^POSTGRES_HOST=.+|^SUPABASE_URL=.+https' .env 2>/dev/null; then
  echo "  ✓ Database env vars appear configured in .env"
else
  echo "  ⚠ Database not configured in .env yet"
  echo "      Set SUPABASE_URL + keys, or POSTGRES_HOST/USER/PASSWORD/DB"
fi

# --- Done ---
echo ""
echo "============================================"
echo "  Setup complete. Remaining manual steps:"
echo "============================================"
echo ""
echo "  1. Edit .env with your API keys and database credentials"
echo "  2. Run schema.sql on your Postgres/Supabase database"
echo "  3. Start Redis:        redis-server"
echo "  4. Start API:          uvicorn src.main:app --reload --port 8000"
echo "  5. Start Celery:       celery -A src.celery_app.tasks worker --loglevel=info"
echo "  6. Open API docs:      http://localhost:8000/docs"
echo ""
echo "  Full guide: docs/outbound-pipeline/REACHGENIE_SETUP.md"
echo "  Lightweight alternative: outbound-pipeline/README.md"
echo ""
