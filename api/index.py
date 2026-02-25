import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../backend'))

from fastapi import FastAPI
from main import app as backend_app

# Create a root app that mounts the backend under /api
# This way Vercel's /api/* routes correctly map to FastAPI endpoints
app = FastAPI()
app.mount("/api", backend_app)
