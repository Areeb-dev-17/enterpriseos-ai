from fastapi import FastAPI

from app.api.routes.ai import router as ai_router

app = FastAPI(
    title="EnterpriseOS AI Service",
    description="AI services for EnterpriseOS",
    version="1.0.0",
)


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "enterpriseos-ai",
        "message": "Python AI service is running",
    }


app.include_router(ai_router)