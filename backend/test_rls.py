import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
SUPABASE_URL = os.environ.get("SUPABASE_URL")
# Use the Anon key! Just like the frontend.
load_dotenv("frontend/.env") # make sure we get the frontend ones too

# Actually we need sign in to get a token
supabase = create_client(SUPABASE_URL, os.environ.get("VITE_SUPABASE_ANON_KEY"))

try:
    res = supabase.auth.sign_in_with_password({
        "email": "suhasnayak7@gmail.com",
        "password": "Password123!" # I don't know the password...
    })
    print("Signed in!")
except Exception as e:
    print(f"Could not sign in: {e}")
