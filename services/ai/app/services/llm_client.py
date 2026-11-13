
import json
import asyncio
from google import genai
from google.genai.errors import ServerError

from app.config import GEMINI_API_KEY


gemini_client = genai.Client(
    api_key=GEMINI_API_KEY,
    http_options={
        "timeout": 120000,
    },
)


async def generate_ai_response(prompt: str) -> str:
    max_attempts = 3

    for attempt in range(1, max_attempts + 1):
        try:
            print(
                f"[Gemini] Attempt {attempt}/{max_attempts}",
                flush=True,
            )

            response = await gemini_client.aio.models.generate_content(
                model="gemini-3.1-flash-lite",
                contents=prompt,
            )

            if not response.text:
                raise RuntimeError("Gemini returned an empty response")

            return response.text

        except ServerError as error:
            if error.code != 503 or attempt == max_attempts:
                raise

            wait_seconds = attempt * 3

            print(
                f"[Gemini] Model overloaded. Retrying in {wait_seconds}s...",
                flush=True,
            )

            await asyncio.sleep(wait_seconds)

    raise RuntimeError("Gemini request failed after retries")
async def generate_inventory_answer(
    question: str,
    analysis: dict,
    stockout_risks: dict,
    purchase_orders: dict,
) -> str:

    prompt = f"""
You are an inventory operations assistant for EnterpriseOS.

Answer the user's question using only the business data provided below.

User question:
{question}

Inventory analysis:
{json.dumps(analysis, indent=2)}

Stockout risks:
{json.dumps(stockout_risks, indent=2)}

Open purchase orders:
{json.dumps(purchase_orders, indent=2)}

Rules:
- Do not invent products, quantities, suppliers, or dates.
- Clearly distinguish current stock from incoming stock.
- If incoming stock reduces a reorder gap, mention that.
- Prioritize critical and high-risk products.
- Give a concise, practical recommendation.
"""

    return await generate_ai_response(prompt)

async def list_available_models():
    async for model in await gemini_client.aio.models.list():
        if model.supported_actions and "generateContent" in model.supported_actions:
            print(
                model.name,
                model.supported_actions,
                flush=True,
            )

          