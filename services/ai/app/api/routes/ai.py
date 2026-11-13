from fastapi import APIRouter, Depends

from app.dependencies import get_internal_context
from app.schemas import AIQuuestionRequest, AIQuestionResponse
from app.services.ai_service import process_ai_question

router = APIRouter()


@router.post("/ask", response_model=AIQuestionResponse)
async def ask_ai(
    request: AIQuuestionRequest,
    internal_context: dict = Depends(get_internal_context),
):
    return await process_ai_question(
        question=request.question,
        user_id=internal_context["sub"],
        organization_id=internal_context["organizationId"],
        internal_token=internal_context["_internal_token"],
    )