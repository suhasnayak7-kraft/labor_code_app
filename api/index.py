from fastapi import FastAPI
from fastapi.responses import JSONResponse

app = FastAPI()

@app.get("/api/health")
async def health():
    return {"status": "ok", "message": "Vercel function is running"}

@app.get("/api/test")
async def test():
    return {"message": "Test successful"}
