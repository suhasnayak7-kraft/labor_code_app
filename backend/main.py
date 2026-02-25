import os
import io
import re
import json
from datetime import datetime
from fastapi import FastAPI, UploadFile, File, HTTPException
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

# Configure CORS
origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AuditResponse(BaseModel):
    risk_score: int
    findings: list[str]

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

@app.post("/audit", response_model=AuditResponse)
async def audit_policy(file: UploadFile = File(...)):
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

        # 4. Generate Analysis with Gemini 1.5 Flash
        prompt = f"""
You are an expert Indian Labour Law Compliance Auditor.
Review the following Employee Policy against the provided Legal Context.

LEGAL CONTEXT:
{legal_context}

EMPLOYEE POLICY:
{policy_text}

Analyze the policy for compliance with the legal context. Provide a strict JSON response in the following schema exactly (no markdown formatting, just raw JSON):
{{
    "risk_score": <number between 0 and 100, where 100 is extremely risky/non-compliant>,
    "findings": [
        "<finding 1>",
        "<finding 2>"
    ]
}}
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
                "risk_score": 50,
                "findings": ["Failed to parse AI response. Please try again.", response_text[:200]]
            }

        # 5. Save usage metadata to API logs
        if response.usage_metadata:
            supabase.table("api_logs").insert({
                "endpoint": "/audit",
                "prompt_tokens": response.usage_metadata.prompt_token_count,
                "completion_tokens": response.usage_metadata.candidates_token_count,
                "total_tokens": response.usage_metadata.total_token_count,
                "filename": file.filename,
                "risk_score": parsed_response.get("risk_score")
            }).execute()
        else:
            # Fallback if usage_metadata is missing
            supabase.table("api_logs").insert({
                "endpoint": "/audit",
                "prompt_tokens": 0,
                "completion_tokens": 0,
                "total_tokens": 0,
                "filename": file.filename,
                "risk_score": parsed_response.get("risk_score")
            }).execute()

        return AuditResponse(
            risk_score=parsed_response.get("risk_score", 0),
            findings=parsed_response.get("findings", [])
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/logs")
async def get_logs():
    try:
        # Fetch logs from Supabase using the secure backend client
        response = supabase.table("api_logs").select("*").order("created_at", desc=False).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch logs: {str(e)}")
