import uvicorn
import os
from datetime import datetime
from typing import Dict, Any

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from openai import OpenAI

# Load .env
load_dotenv()

app = FastAPI(
    title="Debrief Backend API",
    description="AI-powered debriefing and feedback system",
    version="1.1.0",
    root_path="/api/debrief"
)

# CORS setup - use environment variable for production
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://aimms.colo-prod-aws.arizona.edu",  # Campus server
    "https://aimms.colo-prod-aws.arizona.edu",  # Campus server (HTTPS)
]

# Add production frontend URL if it's different from defaults
if frontend_url not in allowed_origins:
    allowed_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

UPLOAD_PATH = os.getenv("UPLOAD_PATH", "uploaded_transcripts")
INSTRUCTIONS_PATH = os.getenv("INSTRUCTIONS_PATH", "instructions.txt")
os.makedirs(UPLOAD_PATH, exist_ok=True)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/")
async def root():
    return {"message": "Debrief Backend API", "version": "1.1.0", "health": "/health"}

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    if not file.filename.endswith((".txt", ".docx", ".pdf")):
        raise HTTPException(status_code=400, detail="Unsupported file type")

    file_path = os.path.join(UPLOAD_PATH, file.filename)
    with open(file_path, "wb") as f:
        f.write(await file.read())

    return {"message": "File uploaded successfully", "file_path": file_path}

@app.post("/generate-report")
async def generate_report():
    files = os.listdir(UPLOAD_PATH)
    if not files:
        raise HTTPException(status_code=404, detail="No uploaded transcript found")

    latest_file = max(
        [os.path.join(UPLOAD_PATH, f) for f in files],
        key=os.path.getctime,
    )

    with open(latest_file, "r", encoding="utf-8", errors="ignore") as f:
        transcript_text = f.read()

    if not os.path.exists(INSTRUCTIONS_PATH):
        raise HTTPException(
            status_code=500,
            detail=f"Instructions file not found at {INSTRUCTIONS_PATH}"
        )

    with open(INSTRUCTIONS_PATH, "r", encoding="utf-8") as f:
        instructions = f.read()

    prompt = f"""
You are an AI evaluator. Use the following instructions to evaluate this transcript.

--- Instructions ---
{instructions}

--- Transcript ---
{transcript_text}

Now generate the full evaluation report following the format given in the instructions.
"""

    try:
        response = client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL", "gpt-4-turbo"),
            messages=[
                {"role": "system", "content": "You are an expert educational evaluator."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.4,
        )
        report = response.choices[0].message.content
        return {"report": report}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8003))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)
