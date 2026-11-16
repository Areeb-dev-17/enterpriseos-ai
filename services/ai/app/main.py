import uuid

from fastapi import Request
from fastapi import FastAPI

from app.api.routes.ai import router as ai_router
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)

app = FastAPI(
    title="EnterpriseOS AI Service",
    description="AI services for EnterpriseOS",
    version="1.0.0",
)

@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = str(uuid.uuid4())

    request.state.request_id = request_id

    response = await call_next(request)

    response.headers["X-Request-ID"] = request_id

    return response


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "enterpriseos-ai",
        "message": "Python AI service is running",
    }


app.include_router(ai_router)