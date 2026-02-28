import sys
import os
import traceback
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

# Add backend directory to path
backend_dir = os.path.join(os.path.dirname(__file__), '../backend')
sys.path.insert(0, backend_dir)

# Initialize app at the top level
app = FastAPI()

@app.get("/api/health-check")
async def health_check():
    """Diagnostic endpoint that won't crash the whole function."""
    try:
        from main import app as backend_app
        return {
            "status": "online",
            "backend_import": "success",
            "python_version": sys.version,
            "cwd": os.getcwd()
        }
    except Exception as e:
        return {
            "status": "error",
            "backend_import": "failed",
            "error": str(e),
            "traceback": traceback.format_exc()
        }

# Try to mount the real backend
try:
    from main import app as backend_app
    app.mount("/api", backend_app)
except Exception as e:
    import_err = traceback.format_exc()
    
    @app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"])
    async def fallback_handler(request: Request, path: str):
        # Skip health-check so it doesn't infinite loop/redirect if we messed up
        if "health-check" in path:
            return await health_check()
            
        return JSONResponse(
            status_code=500,
            content={
                "detail": f"Backend Import Failure: {str(e)}",
                "traceback": import_err[:1000]
            }
        )
