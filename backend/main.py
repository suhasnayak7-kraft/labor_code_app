import os
import io
import re
import json
import time
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Header, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import traceback
from pypdf import PdfReader
from dotenv import load_dotenv
from google import genai
from google.genai import types as genai_types
from pydantic import BaseModel
from supabase import create_client, Client

# Load environment variables
load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY]):
    raise RuntimeError("Missing critical environment variables (Supabase).")

if not GEMINI_API_KEY:
    raise RuntimeError("Missing GEMINI_API_KEY environment variable.")

# Initialize clients
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
gemini = genai.Client(api_key=GEMINI_API_KEY)

# Primary model: Gemini 2.5 Flash (GA, 250K TPM free tier)
# Fallback model: Gemini 1.5 Flash (higher RPD on free tier)
PRIMARY_MODEL = "gemini-2.5-flash"
FALLBACK_MODEL = "gemini-1.5-flash"

app = FastAPI(title="Labour Code Auditor API")

# Configure CORS - allow localhost for dev and all Vercel deployments for prod
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    err_msg = traceback.format_exc()
    print(f"Global UI Error Catcher: {err_msg}")
    return JSONResponse(
        status_code=500,
        content={"detail": f"Uncaught Python Error: {str(exc)} | Trace: {err_msg[:300]}"}
    )

class AuditResponse(BaseModel):
    compliance_score: int
    findings: list[str]
    model_id: str
    provider: str
    response_time_ms: int

class UserCreateRequest(BaseModel):
    email: str
    password: str
    role: str = "user"
    daily_audit_limit: int = 1
    full_name: str = ""
    company_name: str = ""
    company_size: str = ""
    industry: str = ""

class PasswordUpdateRequest(BaseModel):
    new_password: str

def extract_and_clean_text(file_bytes: bytes) -> str:
    reader = PdfReader(io.BytesIO(file_bytes))
    full_text = []
    for page in reader.pages:
        text = page.extract_text()
        if text:
            full_text.append(text)
    
    raw_text = "\n".join(full_text)
    clean_text = re.sub(r'\s+', ' ', raw_text).strip()
    return clean_text

def generate_embedding(text: str) -> list[float]:
    result = gemini.models.embed_content(
        model="gemini-embedding-001",
        contents=text,
        config=genai_types.EmbedContentConfig(output_dimensionality=768)
    )
    return list(result.embeddings[0].values)

async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    
    token = authorization.split(" ")[1]
    
    try:
        auth_response = supabase.auth.get_user(token)
        if not auth_response or not auth_response.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return auth_response.user
    except Exception as e:
        print(f"Auth error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")

@app.get("/audit/status")
async def audit_status(user = Depends(get_current_user)):
    """Returns today's usage count and daily limit for the current user."""
    profile_res = supabase.table("profiles").select("daily_audit_limit, role").eq("id", user.id).execute()
    if not profile_res.data:
        raise HTTPException(status_code=403, detail="Account not found.")
    profile = profile_res.data[0]
    is_admin = profile.get("role") == "admin"
    daily_limit = profile.get("daily_audit_limit", 3)
    today_str = datetime.utcnow().date().isoformat()
    logs_res = supabase.table("api_logs").select("id").eq("user_id", user.id).gte("created_at", today_str).execute()
    usage_count = len(logs_res.data) if logs_res.data else 0
    return {
        "usage_today": usage_count,
        "daily_limit": daily_limit,
        "remaining": max(0, daily_limit - usage_count) if not is_admin else 999,
        "is_admin": is_admin
    }

@app.post("/audit", response_model=AuditResponse)
async def audit_policy(
    file: UploadFile = File(...),
    model_id: Optional[str] = Form("gemini-1.5-flash"),
    user = Depends(get_current_user)
):
    start_time = time.perf_counter()
    # 1. GATEKEEPER CHECK: Ensure user is not locked and hasn't exceeded limits
    profile_res = supabase.table("profiles").select("*").eq("id", user.id).execute()
    if not profile_res.data:
        raise HTTPException(status_code=403, detail="Account not found. Contact Administrator.")

    profile = profile_res.data[0]
    is_admin = profile.get("role") == "admin"

    if profile.get("is_locked"):
        raise HTTPException(status_code=403, detail="Account Locked. Contact Administrator.")

    if profile.get("is_deleted"):
        raise HTTPException(status_code=403, detail="Account not found. Contact Administrator.")

    # Admins are exempt from daily rate limits
    if not is_admin:
        today_str = datetime.utcnow().date().isoformat()
        logs_res = supabase.table("api_logs").select("id").eq("user_id", user.id).gte("created_at", today_str).execute()
        usage_count = len(logs_res.data) if logs_res.data else 0
        daily_limit = profile.get("daily_audit_limit", 3)
        if usage_count >= daily_limit:
            raise HTTPException(
                status_code=403,
                detail=f"Daily audit limit reached ({usage_count}/{daily_limit}). Contact your administrator to increase your quota."
            )

    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported. Please upload a .pdf file.")

    try:
        # 1. Convert PDF to text
        file_bytes = await file.read()
        if len(file_bytes) > 20 * 1024 * 1024:  # 20MB guard
            raise HTTPException(status_code=400, detail="File too large. Maximum PDF size is 20MB.")

        try:
            policy_text = extract_and_clean_text(file_bytes)
        except Exception as pdf_err:
            print(f"PDF extraction error: {pdf_err}")
            raise HTTPException(status_code=400, detail="Could not read the PDF. The file may be corrupted, password-protected, or image-only (scanned). Please try a text-based PDF.")

        if not policy_text or len(policy_text.strip()) < 50:
            raise HTTPException(status_code=400, detail="Could not extract sufficient text from the PDF. It may be a scanned/image-based document. Please use a text-based PDF.")

        # 2. Generate Embedding — truncate to ~8000 chars (covers most policies without hitting limits)
        truncated_text = policy_text[:8000]
        query_embedding = generate_embedding(truncated_text)

        # 3. Vector Similarity Search — fault-tolerant; falls back to general review if RPC unavailable
        legal_context = ""
        try:
            similar_docs = supabase.rpc(
                "match_labour_laws",
                {
                    "query_embedding": query_embedding,
                    "match_threshold": 0.5,
                    "match_count": 3  # Reduced from 6 — each chunk is ~3000 chars; 3 = ~9000 chars total
                }
            ).execute()
            
            # Sort results deterministically by ID to ensure consistent ordering
            if similar_docs.data:
                similar_docs.data = sorted(similar_docs.data, key=lambda x: str(x.get('id', '')))
                
            # Truncate each chunk to 800 chars to cap context tokens
            context_texts = [doc['content'][:800] for doc in similar_docs.data] if similar_docs.data else []
            legal_context = "\n\n---\n\n".join(context_texts)
        except Exception as rpc_err:
            print(f"Vector search unavailable (RPC error): {rpc_err}. Proceeding with general review.")

        if not legal_context:
            legal_context = "No specific legal context found in the knowledge base. Apply your expertise on the 4 Indian Labour Codes: Code on Wages 2019, Industrial Relations Code 2020, Code on Social Security 2020, and Occupational Safety Health and Working Conditions Code 2020."

        # 4. Generate Analysis with Selected Model
        system_instructions = """You are an expert Indian Labour Law Compliance Auditor specializing in the 4 new Labour Codes enacted in 2019-2020 (in effect from 2025):
1. Code on Wages, 2019
2. Industrial Relations Code, 2020
3. Code on Social Security, 2020
4. Occupational Safety, Health and Working Conditions Code, 2020

Review the provided Employee Policy and identify specific compliance gaps or satisfied requirements. Be precise — cite specific sections/chapters of the codes."""

        prompt = f"""
LEGAL CONTEXT (Relevant Sections of Indian Labour Codes):
{legal_context}

EMPLOYEE POLICY TO AUDIT:
{policy_text[:6000]}

Analyze the policy for compliance with the Indian Labour Codes above. Identify specific gaps, violations, or well-compliant clauses. Cite the relevant Code and section for each finding.

Return ONLY a raw JSON object (no markdown, no code fences) in this exact schema:
{{
    "compliance_score": <integer 0-100, where 100=fully compliant, 0=critically non-compliant>,
    "findings": [
        "<Finding 1: specific issue or compliance with law section reference>",
        "<Finding 2>",
        "<Finding 3>",
        "<Finding 4>",
        "<Finding 5>"
    ]
}}
"""
        final_provider = "google"
        final_model = PRIMARY_MODEL
        findings = []
        comp_score = 50
        p_tokens, c_tokens, t_tokens = 0, 0, 0

        # Gemini 2.5 Flash — primary model, with automatic fallback to 1.5 Flash
        try:
            response = gemini.models.generate_content(
                model=PRIMARY_MODEL,
                contents=system_instructions + "\n\n" + prompt,
                config=genai_types.GenerateContentConfig(
                    temperature=0.0,
                    top_p=0.95,
                    top_k=40,
                    seed=42,
                    response_mime_type="application/json",
                )
            )
            response_text = response.text
            if response.usage_metadata:
                p_tokens = response.usage_metadata.prompt_token_count or 0
                c_tokens = response.usage_metadata.candidates_token_count or 0
                t_tokens = response.usage_metadata.total_token_count or 0
        except Exception as ai_err:
            err_str = str(ai_err)
            print(f"Gemini 2.5 Flash error: {ai_err}")
            # If rate-limited (429), surface a clear message instead of silently falling back
            if "429" in err_str or "quota" in err_str.lower() or "rate" in err_str.lower():
                raise HTTPException(
                    status_code=429,
                    detail="Gemini API rate limit reached. The system processes a limited number of audits per minute. Please wait 60 seconds and try again."
                )
            # For other errors, fall back to Gemini 1.5 Flash
            print(f"Falling back to {FALLBACK_MODEL}")
            final_model = FALLBACK_MODEL
            response = gemini.models.generate_content(
                model=FALLBACK_MODEL,
                contents=system_instructions + "\n\n" + prompt,
                config=genai_types.GenerateContentConfig(
                    temperature=0.0,
                    top_p=0.95,
                    top_k=40,
                    seed=42,
                    response_mime_type="application/json",
                )
            )
            response_text = response.text
            if response.usage_metadata:
                p_tokens = response.usage_metadata.prompt_token_count or 0
                c_tokens = response.usage_metadata.candidates_token_count or 0
                t_tokens = response.usage_metadata.total_token_count or 0
        
        response_text = response_text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:-3].strip()
        elif response_text.startswith("```"):
            response_text = response_text[3:-3].strip()
            
        try:
            parsed_response = json.loads(response_text)
            comp_score = parsed_response.get("compliance_score", 50)
            findings = parsed_response.get("findings", [])
        except json.JSONDecodeError:
            comp_score = 50
            findings = ["Failed to parse AI response.", response_text[:200]]

        end_time = time.perf_counter()
        resp_time_ms = int((end_time - start_time) * 1000)

        # 5. Save usage metadata to API logs
        supabase.table("api_logs").insert({
            "endpoint": "/audit",
            "prompt_tokens": p_tokens,
            "completion_tokens": c_tokens,
            "total_tokens": t_tokens,
            "filename": file.filename,
            "risk_score": 100 - comp_score,
            "user_id": user.id,
            "findings": findings,
            "model_id": final_model,
            "provider": final_provider,
            "response_time_ms": resp_time_ms
        }).execute()

        return AuditResponse(
            compliance_score=comp_score,
            findings=findings,
            model_id=final_model,
            provider=final_provider,
            response_time_ms=resp_time_ms
        )
        
    except Exception as e:
        print(f"Audit error: {e}")
        raise HTTPException(status_code=500, detail="An internal server error occurred during the audit process.")

@app.get("/logs")
async def get_logs(user = Depends(get_current_user)):
    try:
        # Admins see all logs, regular users see only theirs
        profile_res = supabase.table("profiles").select("role").eq("id", user.id).execute()
        is_admin = profile_res.data and profile_res.data[0].get("role") == "admin"
        
        query = supabase.table("api_logs").select("*").order("created_at", desc=False)
        if not is_admin:
            query = query.eq("user_id", user.id)
            
        response = query.execute()
        return response.data
    except Exception as e:
        print(f"Fetch logs error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch logs.")

@app.post("/admin/users")
async def create_admin_user(request: UserCreateRequest, admin_user = Depends(get_current_user)):
    # 1. Verify caller is an admin
    profile_res = supabase.table("profiles").select("role").eq("id", admin_user.id).execute()
    if not profile_res.data or profile_res.data[0].get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized. Admin access required.")
        
    try:
        # 2. Create the user using the Service Role Key (already initialized in 'supabase' client)
        new_user = supabase.auth.admin.create_user({
            "email": request.email,
            "password": request.password,
            "email_confirm": True,
            "user_metadata": {
                "full_name": request.full_name,
                "company_name": request.company_name
            }
        })
        
        if not new_user or not new_user.user:
            raise HTTPException(status_code=500, detail="Failed to create auth user")
            
        # 3. The trigger handles initial profile insertion, but we need to update limits and industry
        supabase.table("profiles").update({
            "daily_audit_limit": request.daily_audit_limit,
            "company_name": request.company_name,
            "company_size": request.company_size,
            "industry": request.industry,
            "role": request.role
        }).eq("id", new_user.user.id).execute()
        
        return {"success": True, "user_id": new_user.user.id, "email": new_user.user.email}
        
    except Exception as e:
        print(f"Provision user error: {e}")
        raise HTTPException(status_code=500, detail="Error provisioning user.")

@app.put("/admin/users/{target_user_id}/password")
async def reset_user_password(
    target_user_id: str, 
    request: PasswordUpdateRequest, 
    admin_user = Depends(get_current_user)
):
    # 1. Verify caller is an admin
    profile_res = supabase.table("profiles").select("role").eq("id", admin_user.id).execute()
    if not profile_res.data or profile_res.data[0].get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized. Admin access required.")
        
    try:
        # 2. Update the user's password using the Service Role Key
        res = supabase.auth.admin.update_user_by_id(
            target_user_id,
            {"password": request.new_password}
        )
        return {"success": True, "message": "Password updated successfully"}
    except Exception as e:
        print(f"Password reset error: {e}")
        raise HTTPException(status_code=500, detail="Error resetting password.")

@app.post("/admin/ingest-md")
async def ingest_markdown(
    file: UploadFile = File(...),
    admin_user = Depends(get_current_user)
):
    """
    Ingest a Markdown (.md) file into the pgvector knowledge base.
    Chunks the text into ~500-word segments, embeds each with Gemini, and upserts to 'labour_laws'.
    """
    t0 = time.time()
    # 1. Verify admin
    profile_res = supabase.table("profiles").select("role").eq("id", admin_user.id).single().execute()
    if not profile_res.data or profile_res.data.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")

    # 2. Validate file type
    if not (file.filename.endswith('.md') or 'markdown' in (file.content_type or '')):
        raise HTTPException(status_code=400, detail="Only Markdown (.md) files are supported.")

    try:
        raw_bytes = await file.read()
        if len(raw_bytes) > 5 * 1024 * 1024:  # 5MB limit
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 5MB.")

        text = raw_bytes.decode('utf-8', errors='replace')
        # Clean up excessive whitespace but preserve paragraph structure
        text = re.sub(r'\n{3,}', '\n\n', text).strip()

        # 3. Split into ~500-word chunks (roughly 3000 chars) with overlap
        chunk_size = 3000
        overlap = 300
        chunks = []
        start = 0
        while start < len(text):
            end = min(start + chunk_size, len(text))
            # Try to break at a paragraph boundary
            if end < len(text):
                last_para = text.rfind('\n\n', start, end)
                if last_para > start + overlap:
                    end = last_para
            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)
            start = end - overlap if end < len(text) else len(text)

        if not chunks:
            raise HTTPException(status_code=400, detail="No content found in the file.")

        # 4. Embed each chunk via the new google-genai SDK
        # Note: new SDK does not support batch embedding in a single call like the old SDK did;
        # we embed in small batches to stay within Vercel's 60s timeout
        try:
            embeddings = []
            for chunk in chunks:
                embed_result = gemini.models.embed_content(
                    model="gemini-embedding-001",
                    contents=chunk,
                    config=genai_types.EmbedContentConfig(output_dimensionality=768)
                )
                embeddings.append(list(embed_result.embeddings[0].values))
        except Exception as e:
            print(f"Batch embedding failed: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to generate embeddings from Gemini API: {str(e)}")

        # 5. Fast Batch Insert to Supabase
        ingested = 0
        rows_to_insert = [{"content": chunk, "embedding": emb} for chunk, emb in zip(chunks, embeddings)]
        
        # Insert in chunks of 50 to avoid payload size limits to Postgres
        for i in range(0, len(rows_to_insert), 50):
            batch = rows_to_insert[i:i+50]
            try:
                supabase.table("labour_laws").insert(batch).execute()
                ingested += len(batch)
            except Exception as e:
                print(f"Failed to insert batch {i}-{i+50}: {e}")

        # Final record keeping
        response_time_ms = int((time.time() - t0) * 1000)
        return {
            "success": True,
            "filename": file.filename,
            "chunks_ingested": ingested,
            "total_chunks": len(chunks),
            "message": f"Successfully ingested {ingested}/{len(chunks)} chunks from '{file.filename}' into the knowledge base."
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Ingest error: {e}")
        raise HTTPException(status_code=500, detail="Failed to ingest document.")


@app.get("/admin/stats")
async def get_admin_stats(user = Depends(get_current_user)):
    # 1. Verify user is admin
    profile_res = supabase.table("profiles").select("role").eq("id", user.id).single().execute()
    if not profile_res.data or profile_res.data.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    # 2. Aggregate last-60s logs for Gemini models
    from datetime import timedelta
    sixty_seconds_ago = (datetime.utcnow() - timedelta(seconds=60)).isoformat()
    logs_res = supabase.table("api_logs").select("model_id, total_tokens").gte("created_at", sixty_seconds_ago).execute()
    logs = logs_res.data if logs_res.data else []

    models_to_track = [
        {"id": PRIMARY_MODEL, "provider": "google"},
        {"id": FALLBACK_MODEL, "provider": "google"},
    ]

    stats = []
    for m in models_to_track:
        model_logs = [l for l in logs if l.get("model_id") == m["id"]]
        rpm = len(model_logs)
        tpm = sum(l.get("total_tokens", 0) for l in model_logs)
        stats.append({
            "model_id": m["id"],
            "provider": m["provider"],
            "status": "Active" if GEMINI_API_KEY else "Inactive",
            "rpm": rpm,
            "tpm": tpm
        })

    return {"models": stats}
