import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY]):
    print("Missing env vars.")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

try:
    # Adding filename column
    supabase.rpc(
        "exec_sql", 
        {"query": "ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS filename text;"}
    ).execute()
    
    # Adding risk_score column
    supabase.rpc(
        "exec_sql", 
        {"query": "ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS risk_score integer;"}
    ).execute()
    
    print("SUCCESS: Added 'filename' and 'risk_score' columns to api_logs.")
except Exception as e:
    print(f"FAILED: The Supabase client RPC exec_sql method failed. Ensure you have an exec_sql wrapper or manually run this in the SQL Editor: ALTER TABLE api_logs ADD COLUMN filename text; ALTER TABLE api_logs ADD COLUMN risk_score integer;")
    print(e)
