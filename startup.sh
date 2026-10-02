#!/bin/bash
set -e

if [ -d "/home/site/wwwroot/antenv" ]; then
    source /home/site/wwwroot/antenv/bin/activate
elif [ -d "antenv" ]; then
    source antenv/bin/activate
fi

export PYTHONPATH="${PYTHONPATH}:/home/site/wwwroot/backend:/home/site/wwwroot:./backend:."
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8000}
