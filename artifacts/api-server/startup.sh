#!/bin/bash
# Azure App Service startup script for Viral Genome Intelligence
# Set as the startup command in Azure App Service configuration:
#   bash startup.sh
#
# Or use directly:
#   uvicorn main:app --host 0.0.0.0 --port 8000

export PORT="${PORT:-8000}"
exec uvicorn main:app --host 0.0.0.0 --port "$PORT" --workers 2
