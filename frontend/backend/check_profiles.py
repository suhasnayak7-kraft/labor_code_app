import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Get all users (this requires service_role key, which is SUPABASE_KEY locally)
print("--- PROFILES ---")
profiles = supabase.table("profiles").select("*").execute()
for p in profiles.data:
    print(p)

print("\n--- AUTH LOGS ---")
# we can't easily query auth.users from client without admin API, but profiles should show what we need.
