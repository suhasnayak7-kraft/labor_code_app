import os
import io
import re
import json
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pypdf import PdfReader
from dotenv import load_dotenv
from google import genai
from pydantic import BaseModel
from supabase import create_client, Client

# Load environment variables
load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY, GEMINI_API_KEY]):
    raise RuntimeError("Missing required environment variables.")

# Initialize clients
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
genai_client = genai.Client(api_key=GEMINI_API_KEY)

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

class AuditResponse(BaseModel):
    compliance_score: int
    findings: list[str]

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
    result = genai_client.models.embed_content(
        model="gemini-embedding-001",
        contents=text,
        config={"output_dimensionality": 768}
    )
    return result.embeddings[0].values

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
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

@app.post("/audit", response_model=AuditResponse)
async def audit_policy(
    file: UploadFile = File(...),
    user = Depends(get_current_user)
):
    # 1. GATEKEEPER CHECK: Ensure user is not locked and hasn't exceeded limits
    profile_res = supabase.table("profiles").select("*").eq("id", user.id).execute()
    if not profile_res.data:
        raise HTTPException(status_code=403, detail="Account not found. Contact Administrator.")
    
    profile = profile_res.data[0]
    
    if profile.get("is_locked"):
        raise HTTPException(status_code=403, detail="Account Locked. Contact Administrator.")
    
    if profile.get("is_deleted"):
        raise HTTPException(status_code=403, detail="Account not found. Contact Administrator.")

    today_str = datetime.utcnow().date().isoformat()
    logs_res = supabase.table("api_logs").select("id").eq("user_id", user.id).gte("created_at", today_str).execute()
    
    usage_count = len(logs_res.data) if logs_res.data else 0
    daily_limit = profile.get("daily_audit_limit", 3)
    
    if usage_count >= daily_limit:
        raise HTTPException(status_code=403, detail="Daily limit reached. Please contact Suhasa to increase your quota.")

    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
        
    try:
        # 1. Convert PDF to text
        file_bytes = await file.read()
        policy_text = extract_and_clean_text(file_bytes)
        
        if not policy_text:
            raise HTTPException(status_code=400, detail="Could not extract text from the PDF.")
            
        # 2. Generate Embedding for the policy text
        # If the policy is very long, we might just embed the first chunk or create a summary, 
        # but for this requirement we embed the whole text or a representative chunk.
        # Truncating to ~5000 characters for embedding to avoid limits
        truncated_text = policy_text[:5000]
        query_embedding = generate_embedding(truncated_text)
        
        # 3. Vector Similarity Search
        # Note: This requires a Postgres RPC function named `match_labour_laws` to be created in Supabase.
        # See Supabase pgvector documentation for the SQL to create this function.
        similar_docs = supabase.rpc(
            "match_labour_laws", 
            {
                "query_embedding": query_embedding, 
                "match_threshold": 0.5, 
                "match_count": 5
            }
        ).execute()
        
        context_texts = [doc['content'] for doc in similar_docs.data] if similar_docs.data else []
        legal_context = "\n\n---\n\n".join(context_texts)
        
        if not legal_context:
            legal_context = "No relevant legal context found in the database. Provide general review based on typical labour laws."

        # 4. Generate Analysis with Gemini 2.5 Flash
        prompt = f"""
You are an expert Indian Labour Law Compliance Auditor specializing in the 4 new Labour Codes (2020-2025).
Review the following Employee Policy against the provided Legal Context.

LEGAL CONTEXT (Relevant Sections of Indian Labour Codes):
{legal_context}

EMPLOYEE POLICY:
{policy_text}

Analyze the policy for compliance with the legal context. For each finding, cite the specific Labour Code section violated or satisfied.

Provide a strict JSON response in the following schema exactly (no markdown formatting, just raw JSON):
{{
    "compliance_score": <number between 0 and 100, where 100 means FULLY COMPLIANT and 0 means CRITICALLY NON-COMPLIANT>,
    "findings": [
        "<finding 1: describe the specific gap or compliance issue with the relevant law section>",
        "<finding 2>",
        "<finding 3>"
    ]
}}

Score guidance:
- 90-100: Fully compliant, minor or no gaps
- 70-89: Mostly compliant, a few gaps that need attention
- 50-69: Moderate compliance issues, corrective action recommended
- Below 50: Critical non-compliance, immediate legal risk
"""
        # Call Gemini 2.5 Flash
        response = genai_client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        
        response_text = response.text.strip()
        
        # Clean up markdown code blocks if the model insists on returning them
        if response_text.startswith("```json"):
            response_text = response_text[7:-3].strip()
        elif response_text.startswith("```"):
            response_text = response_text[3:-3].strip()
            
        try:
            parsed_response = json.loads(response_text)
        except json.JSONDecodeError:
            # Fallback if the AI returns malformed JSON
            parsed_response = {
                "compliance_score": 50,
                "findings": ["Failed to parse AI response. Please try again.", response_text[:200]]
            }

        compliance_score = parsed_response.get("compliance_score", 50)

        # 5. Save usage metadata to API logs
        if response.usage_metadata:
            supabase.table("api_logs").insert({
                "endpoint": "/audit",
                "prompt_tokens": response.usage_metadata.prompt_token_count,
                "completion_tokens": response.usage_metadata.candidates_token_count,
                "total_tokens": response.usage_metadata.total_token_count,
                "filename": file.filename,
                "risk_score": 100 - compliance_score,  # keep DB field for backward compat
                "user_id": user.id
            }).execute()
        else:
            supabase.table("api_logs").insert({
                "endpoint": "/audit",
                "prompt_tokens": 0,
                "completion_tokens": 0,
                "total_tokens": 0,
                "filename": file.filename,
                "risk_score": 100 - compliance_score,
                "user_id": user.id
            }).execute()

        return AuditResponse(
            compliance_score=compliance_score,
            findings=parsed_response.get("findings", [])
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
        raise HTTPException(status_code=500, detail=f"Failed to fetch logs: {str(e)}")

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
        raise HTTPException(status_code=500, detail=f"Error provisioning user: {str(e)}")

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
        raise HTTPException(status_code=500, detail=f"Error resetting password: {str(e)}")
