# 6. Backend Architecture: FastAPI Organization

How to organize FastAPI backend for multi-tool development.

---

## Folder Structure

```
backend/
├── main.py                      # FastAPI app, routes dispatcher
├── requirements.txt             # Python dependencies
│
├── tools/                       # Tool-specific endpoints
│   ├── labour_auditor.py       # Tool endpoints
│   ├── gst_checker.py
│   └── ...other tools
│
├── shared/                      # Shared utilities
│   ├── auth.py                 # User authentication
│   ├── db.py                   # Database operations
│   ├── embeddings.py           # Vector search
│   ├── storage.py              # File uploads
│   └── utils.py                # Helper functions
│
├── models/                      # Pydantic models
│   ├── common.py               # Shared request/response models
│   ├── labour_auditor.py       # Tool-specific models
│   └── gst_checker.py
│
├── middleware/                  # Request/response middleware
│   ├── auth.py                 # JWT validation
│   ├── error_handler.py        # Global error handling
│   ├── rate_limiting.py        # Rate limits
│   └── logging.py              # Request/response logging
│
├── config/                      # Configuration
│   ├── settings.py             # Environment variables
│   └── tools.py                # Tool registry
│
└── tests/                       # Unit tests
    ├── test_labour_auditor.py
    └── test_gst_checker.py
```

---

## main.py: FastAPI App Setup

```python
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
import logging

from shared.auth import get_current_user
from shared.middleware import (
    error_handler, rate_limit_middleware, request_logging_middleware
)
from tools import labour_auditor, gst_checker
from config.settings import settings

# Initialize FastAPI
app = FastAPI(
    title="Multi-Tool SaaS API",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Trusted hosts
app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.ALLOWED_HOSTS)

# Custom middleware
app.add_middleware(request_logging_middleware)
app.add_middleware(rate_limit_middleware)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logging.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error"},
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"error": "Validation error", "details": exc.errors()},
    )

# Include tool routers
app.include_router(labour_auditor.router, prefix="/api/tools")
app.include_router(gst_checker.router, prefix="/api/tools")

# Shared endpoints
@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

@app.get("/api/my-tools")
async def get_my_tools(current_user = Depends(get_current_user)):
    """Return tools available for user's plan"""
    from config.tools import get_tools_by_plan
    tools = get_tools_by_plan(current_user.subscription_tier_id)
    return {"tools": tools}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

---

## Tool Module: labour_auditor.py

```python
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from fastapi.responses import JSONResponse
import logging

from shared.auth import get_current_user
from shared.db import supabase
from shared.embeddings import generate_embedding, search_embeddings
from models.labour_auditor import AuditRequest, AuditResponse
from config.settings import settings

router = APIRouter(tags=["labour-auditor"])
logger = logging.getLogger(__name__)

@router.post("/labour-auditor/audit")
async def audit_policy(
    file: UploadFile = File(...),
    current_user = Depends(get_current_user),
):
    """Audit a policy document for Labour Code compliance"""

    try:
        # 1. Gatekeeper: Check user status
        if current_user.is_locked:
            raise HTTPException(status_code=403, detail="Account locked")

        if current_user.is_deleted:
            raise HTTPException(status_code=403, detail="Account deleted")

        # 2. Rate limiting: Check daily limit
        if not current_user.is_admin:
            if current_user.audits_run_today >= current_user.daily_audit_limit:
                raise HTTPException(
                    status_code=429,
                    detail=f"Daily limit ({current_user.daily_audit_limit}) reached"
                )

        # 3. File validation
        if file.size > 50 * 1024 * 1024:  # 50MB
            raise HTTPException(status_code=400, detail="File too large")

        # 4. Extract text from PDF/DOCX
        file_bytes = await file.read()

        if file.filename.endswith('.pdf'):
            from shared.storage import extract_text_from_pdf
            text = extract_text_from_pdf(file_bytes)
        elif file.filename.endswith('.docx'):
            from shared.storage import extract_text_from_docx
            text = extract_text_from_docx(file_bytes)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type")

        # 5. Generate embedding
        embedding = await generate_embedding(text)

        # 6. Vector search for relevant laws
        relevant_laws = await search_embeddings(
            embedding, tool_id='labour-auditor', match_count=3
        )

        # 7. AI analysis
        from shared.embeddings import call_gemini
        result = await call_gemini(
            text=text,
            relevant_context=[law['content'] for law in relevant_laws],
            tool_id='labour-auditor',
        )

        # 8. Log usage
        await supabase.table('api_logs').insert({
            'user_id': current_user.id,
            'tool_id': 'labour-auditor',
            'endpoint': '/audit',
            'method': 'POST',
            'filename': file.filename,
            'prompt_tokens': result['prompt_tokens'],
            'completion_tokens': result['completion_tokens'],
            'total_tokens': result['total_tokens'],
            'compliance_score': result['compliance_score'],
            'findings': result['findings'],
            'model_id': result['model_id'],
            'response_time_ms': result['response_time_ms'],
            'status_code': 200,
        })

        # 9. Log tool-specific result
        await supabase.table('labour_audit_logs').insert({
            'user_id': current_user.id,
            'filename': file.filename,
            'compliance_score': result['compliance_score'],
            'findings': result['findings'],
            'model_used': result['model_id'],
        })

        # 10. Increment user's daily audit count
        await supabase.table('profiles').update({
            'audits_run_today': current_user.audits_run_today + 1,
        }).eq('id', current_user.id)

        return AuditResponse(
            compliance_score=result['compliance_score'],
            findings=result['findings'],
            model_id=result['model_id'],
            response_time_ms=result['response_time_ms'],
        )

    except Exception as e:
        logger.error(f"Audit error: {e}")

        await supabase.table('api_logs').insert({
            'user_id': current_user.id,
            'tool_id': 'labour-auditor',
            'endpoint': '/audit',
            'status_code': 500,
            'error_message': str(e),
        })

        raise HTTPException(status_code=500, detail=str(e))

@router.get("/labour-auditor/status")
async def check_status(current_user = Depends(get_current_user)):
    """Check daily audit limit status"""
    remaining = current_user.daily_audit_limit - current_user.audits_run_today
    return {
        "audits_used_today": current_user.audits_run_today,
        "audits_remaining": max(0, remaining),
        "daily_limit": current_user.daily_audit_limit,
    }

@router.get("/labour-auditor/logs")
async def get_logs(current_user = Depends(get_current_user)):
    """Get audit history for user"""
    logs = await supabase.table('labour_audit_logs') \
        .select('*') \
        .eq('user_id', current_user.id) \
        .order('created_at', desc=True) \
        .execute()

    return {"logs": logs.data}
```

---

## Shared Services

### **shared/auth.py**

```python
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthCredentials

from shared.db import supabase
from config.settings import settings

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthCredentials = Depends(security)):
    """Validate JWT token and return user"""
    try:
        token = credentials.credentials

        # Verify token with Supabase
        user_response = await supabase.auth.get_user(token)
        user = user_response.user

        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")

        # Get profile from database
        profile_response = await supabase.table('profiles') \
            .select('*') \
            .eq('id', user.id) \
            .single() \
            .execute()

        profile = profile_response.data

        if profile.is_deleted:
            raise HTTPException(status_code=403, detail="Account deleted")

        return profile

    except Exception as e:
        raise HTTPException(status_code=401, detail="Unauthorized")
```

### **shared/embeddings.py**

```python
import google.generativeai as genai

async def generate_embedding(text: str):
    """Generate vector embedding for text"""
    response = genai.embed_content(
        model="models/gemini-embedding-001",
        content=text,
    )
    return response["embedding"]

async def search_embeddings(embedding, tool_id: str, match_count: int = 3):
    """Search for similar embeddings in knowledge base"""
    from shared.db import supabase

    response = await supabase.rpc(
        "match_embeddings_for_tool",
        {
            "query_embedding": embedding,
            "tool_id_filter": tool_id,
            "match_threshold": 0.7,
            "match_count": match_count,
        }
    )

    return response.data

async def call_gemini(text: str, relevant_context: list, tool_id: str):
    """Call Gemini API for analysis"""

    system_prompt = get_system_prompt(tool_id)
    context = "\n\n".join(relevant_context)

    message = genai.GenerativeAI.Message(
        model="models/gemini-2.5-flash",
        messages=[
            {"role": "user", "content": f"{system_prompt}\n\nDocument:\n{text}\n\nRelevant law sections:\n{context}"},
        ],
    )

    # Parse response and return results
    return parse_response(message)

def get_system_prompt(tool_id: str) -> str:
    """Get tool-specific system prompt"""
    prompts = {
        "labour-auditor": "You are a Labour Code compliance expert...",
        "gst-checker": "You are a GST compliance expert...",
    }
    return prompts.get(tool_id, "You are a compliance expert...")
```

---

## Models

### **models/labour_auditor.py**

```python
from pydantic import BaseModel
from typing import List

class AuditRequest(BaseModel):
    filename: str
    file_type: str  # 'pdf' or 'docx'

class Finding(BaseModel):
    severity: str  # 'low', 'medium', 'high'
    issue: str
    recommendation: str

class AuditResponse(BaseModel):
    compliance_score: int  # 0-100
    findings: List[Finding]
    model_id: str
    response_time_ms: int
```

---

## Middleware

### **middleware/rate_limiting.py**

```python
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from datetime import datetime, timedelta
import redis

redis_client = redis.Redis(host='localhost', port=6379, db=0)

class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        user_id = request.headers.get('X-User-ID')

        if user_id:
            key = f"rate_limit:{user_id}:{request.url.path}"
            count = redis_client.incr(key)

            if count == 1:
                redis_client.expire(key, 60)  # 1 minute

            if count > 100:  # 100 requests per minute
                return JSONResponse(
                    status_code=429,
                    content={"error": "Too many requests"}
                )

        return await call_next(request)
```

---

## Configuration

### **config/settings.py**

```python
import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DEBUG = os.getenv("DEBUG", "False") == "True"

    # Supabase
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY")

    # Gemini
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

    # CORS
    ALLOWED_ORIGINS = ["http://localhost:3000", "https://yourdomain.com"]
    ALLOWED_HOSTS = ["localhost", "yourdomain.com"]

    # File limits
    MAX_FILE_SIZE_MB = 50

settings = Settings()
```

---

## Testing

### **tests/test_labour_auditor.py**

```python
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

@pytest.fixture
def auth_headers():
    return {"Authorization": "Bearer mock_token"}

def test_audit_endpoint(auth_headers):
    """Test audit endpoint"""
    with open("test_file.pdf", "rb") as f:
        response = client.post(
            "/api/tools/labour-auditor/audit",
            files={"file": f},
            headers=auth_headers,
        )

    assert response.status_code == 200
    assert "compliance_score" in response.json()

def test_rate_limiting(auth_headers):
    """Test rate limiting"""
    for i in range(101):
        response = client.get(
            "/api/tools/labour-auditor/status",
            headers=auth_headers,
        )

    assert response.status_code == 429  # Too many requests
```

---

## Summary

This backend architecture ensures:
- ✅ Tool modules organized under `/tools`
- ✅ Shared code in `/shared`
- ✅ Consistent error handling
- ✅ Rate limiting & authentication
- ✅ Easy to add new tools (copy file, change logic)

**Next:** Read ADMIN_DASHBOARD_DESIGN.md for admin interface.
