from pathlib import Path
import os
from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parents[3]
load_dotenv(PROJECT_ROOT / ".env")

AI_SERVICE_JWT_SECRET = os.getenv("AI_SERVICE_JWT_SECRET")
if not AI_SERVICE_JWT_SECRET:
    raise RuntimeError("AI_SERVICE_JWT_SECRET is not configured")

AI_SERVICE_JWT_ISSUER = "enterpriseos-api"
AI_SERVICE_JWT_AUDIENCE = "enterpriseos-ai"

NODE_API_URL = os.getenv("NODE_API_URL")

if not NODE_API_URL:
    raise RuntimeError("NODE_API_URL is not configured")


GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY is not configured")