import sys
import os
import traceback
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

# Add backend directory to path so imports work
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend'))
sys.path.insert(0, backend_path)

# Initialize app at the top level so Vercel's AST parser detects it
app = FastAPI()

@app.get("/api/health-check")
async def basic_health():
    backend_exists = os.path.isdir(backend_path)
    main_exists = os.path.isfile(os.path.join(backend_path, 'main.py'))
    cwd = os.getcwd()
    files_in_root = os.listdir('..') if os.path.isdir('..') else ['N/A']
    
    return {
        "status": "alive", 
        "backend_path": backend_path,
        "backend_exists": backend_exists,
        "main_py_exists": main_exists,
        "cwd": cwd,
        "files_in_root": files_in_root
    }

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
