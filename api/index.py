import sys
import os

# Add backend directory to path so imports work
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../backend'))

import traceback

# Vercel sends the FULL path to this function:
#   Request /api/logs  -> this file receives path /api/logs
#   Request /api/audit -> this file receives path /api/audit
#
# We create a thin wrapper that mounts the backend under /api,
# so /api/logs maps to the backend's @app.get("/logs") route etc.

try:
    from fastapi import FastAPI
    from main import app as backend_app

    app = FastAPI()
    app.mount("/api", backend_app)
except Exception as e:
    from fastapi import FastAPI, Request
    from fastapi.responses import JSONResponse
    
    app = FastAPI()
    err_str = traceback.format_exc()
    
    @app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"])
    async def fallback_handler(request: Request, path: str):
        return JSONResponse(
            status_code=500,
            content={"detail": f"Vercel Import Error (api/index.py crashed): {str(e)}\n{err_str[:500]}"}
        )
