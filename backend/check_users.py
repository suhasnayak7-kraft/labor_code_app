import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Use the admin api to get users
response = supabase.auth.admin.list_users()

print("--- AUTH USERS ---")
for u in response:
    print(f"ID: {u.id}, Email: {u.email}")

print("\n--- PROFILES ---")
profiles = supabase.table("profiles").select("*").execute()
for p in profiles.data:
    print(f"ID: {p['id']}, Role: {p['role']}")
