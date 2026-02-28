import sys
import os
import traceback
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

# Add backend directory to path so imports work
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../backend'))

# Initialize app at the top level so Vercel's AST parser detects it
app = FastAPI()

try:
    from main import app as backend_app
    app.mount("/api", backend_app)
except Exception as e:
    err_str = traceback.format_exc()
    
    @app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"])
    async def fallback_handler(request: Request, path: str):
        return JSONResponse(
            status_code=500,
            content={"detail": f"Vercel Import Error (api/index.py crashed): {str(e)}\n{err_str[:500]}"}
        )
