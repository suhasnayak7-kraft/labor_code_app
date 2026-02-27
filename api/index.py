import sys
import os

# Add backend directory to path so imports work
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../backend'))

from fastapi import FastAPI
from main import app as backend_app

# Vercel sends the FULL path to this function:
#   Request /api/logs  -> this file receives path /api/logs
#   Request /api/audit -> this file receives path /api/audit
#
# We create a thin wrapper that mounts the backend under /api,
# so /api/logs maps to the backend's @app.get("/logs") route etc.

app = FastAPI()
app.mount("/api", backend_app)
