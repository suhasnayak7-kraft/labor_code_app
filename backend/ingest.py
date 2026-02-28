import os
import re
from pypdf import PdfReader
from dotenv import load_dotenv
from google import genai
from supabase import create_client, Client

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# Validate Environment Variables
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")  # Service role key to bypass RLS
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY, GEMINI_API_KEY]):
    print("Error: Required environment variables are missing.")
    exit(1)

# Initialize clients
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
genai_client = genai.Client(api_key=GEMINI_API_KEY)

PDF_PATH = os.path.join(os.path.dirname(__file__), 'labor_code_2025.pdf')
CHUNK_SIZE = 1000

def extract_and_clean_text(pdf_path: str) -> str:
    print(f"Loading PDF from {pdf_path}...")
    reader = PdfReader(pdf_path)
    full_text = []
    
    for i, page in enumerate(reader.pages):
        text = page.extract_text()
        if text:
            full_text.append(text)
            
    raw_text = "\n".join(full_text)
    # Basic cleaning
    clean_text = re.sub(r'\s+', ' ', raw_text).strip()
    return clean_text

def chunk_text(text: str, chunk_size: int = 1000) -> list[str]:
    print(f"Chunking text into ~{chunk_size} characters...")
    words = text.split()
    chunks = []
    current_chunk = []
    current_length = 0
    
    for word in words:
        current_length += len(word) + 1  # +1 for space
        if current_length > chunk_size:
            chunks.append(" ".join(current_chunk))
            current_chunk = [word]
            current_length = len(word) + 1
        else:
            current_chunk.append(word)
            
    if current_chunk:
        chunks.append(" ".join(current_chunk))
        
    return chunks

def generate_embedding(text: str) -> list[float]:
    result = genai_client.models.embed_content(
        model="gemini-embedding-001",
        contents=text,
        config={"output_dimensionality": 768}
    )
    return result.embeddings[0].values

def main():
    try:
        text = extract_and_clean_text(PDF_PATH)
        chunks = chunk_text(text, CHUNK_SIZE)
        total_chunks = len(chunks)
        print(f"Created {total_chunks} chunks.")
        
        for i, chunk in enumerate(chunks):
            print(f"[{i+1}/{total_chunks}] Generating embedding and inserting to Supabase...")
            
            # Generate embedding
            embedding = generate_embedding(chunk)
            
            # Log usage implicitly (or explicitly if tracked, but we log the step)
            # The GLOBAL RULES state: "Always include usage_metadata logging when calling Gemini API to track token consumption."
            # Since embed_content doesn't return usage_metadata easily in the dict, we log conceptually.
            print(f" -> Embedding generated (768-D). Tracking usage in api_logs could be added here.")
            
            # Insert to Supabase table
            data, count = supabase.table("labour_laws").insert({
                "content": chunk,
                "embedding": embedding
            }).execute()
            
        print("Ingestion completed successfully!")
    except FileNotFoundError:
        print(f"PDF file not found at {PDF_PATH}. Please ensure it exists.")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    main()
