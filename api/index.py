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

import_error = None

try:
    from main import app as backend_app
    app.mount("/api", backend_app)
except Exception as e:
    import_error = traceback.format_exc()

@app.get("/api/health-check")
async def basic_health():
    backend_exists = os.path.isdir(backend_path)
    main_exists = os.path.isfile(os.path.join(backend_path, 'main.py'))
    
    return {
        "status": "alive", 
        "backend_exists": backend_exists,
        "main_py_exists": main_exists,
        "import_error": import_error
    }
