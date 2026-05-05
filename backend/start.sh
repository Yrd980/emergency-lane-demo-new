#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
mkdir -p data/evidence
uv run uvicorn app.main:app --host "${HOST:-0.0.0.0}" --port "${PORT:-8000}" --reload
