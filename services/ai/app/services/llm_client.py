
import asyncio
import json
import logging
from time import perf_counter

from google import genai
from google.genai import types
from google.genai.errors import ServerError

from app.config import GEMINI_API_KEY
from app.services.ai_tools import inventory_tool
from app.services.tool_executor import (
    execute_tool,
    ToolExecutionError,
)


gemini_client = genai.Client(
    api_key=GEMINI_API_KEY,
    http_options={"timeout": 120000},
)

logger = logging.getLogger(__name__)

GEMINI_MODEL = "gemini-3.1-flash-lite"

MAX_TOOL_ROUNDS = 5
MAX_TOTAL_TOOL_CALLS = 8
MAX_GEMINI_ATTEMPTS = 3
AI_REQUEST_TIMEOUT_SECONDS = 120


async def generate_ai_response(prompt: str) -> str:
    max_attempts = 3

    for attempt in range(1, max_attempts + 1):
        try:
            logger.info(
                "Sending request to Gemini",
                extra={"attempt": attempt},
            )

            response = await gemini_client.aio.models.generate_content(
                model=GEMINI_MODEL,
                contents=prompt,
            )

            if not response.text:
                raise RuntimeError("Gemini returned an empty response")

            return response.text

        except ServerError as error:
            if error.code != 503 or attempt == max_attempts:
                raise

            wait_seconds = attempt * 3

            logger.warning(
                "Gemini model overloaded | attempt=%s | retry_delay=%ss",
                attempt,
                wait_seconds,
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
        if (
            model.supported_actions
            and "generateContent" in model.supported_actions
        ):
            print(
                model.name,
                model.supported_actions,
                flush=True,
            )


async def generate_ai_response_with_tools(
    prompt: str,
    internal_token: str,
    request_id: str,
) -> dict:
    request_started_at = perf_counter()

    contents = [
        types.Content(
            role="user",
            parts=[types.Part.from_text(text=prompt)],
        )
    ]

    tool_rounds = 0
    total_tool_calls = 0
    tool_results = {}

    # Token usage across successful Gemini calls.
    total_input_tokens = 0
    total_output_tokens = 0
    total_thinking_tokens = 0
    total_reported_tokens = 0

    # Request-level monitoring.
    gemini_call_count = 0
    gemini_attempt_count = 0
    gemini_latency_ms = 0
    tool_latency_ms = 0
    tool_execution_count = 0
    tool_cache_hits = 0

    # Cache successful tool results only within this request.
    tool_cache = {}

    def log_request_summary(status: str):
        total_latency_ms = round(
            (perf_counter() - request_started_at) * 1000
        )

        logger.info(
            "AI request summary | "
            "request_id=%s | "
            "status=%s | "
            "model=%s | "
            "gemini_calls=%s | "
            "gemini_attempts=%s | "
            "tool_calls=%s | "
            "tool_executions=%s | "
            "tool_cache_hits=%s | "
            "input_tokens=%s | "
            "output_tokens=%s | "
            "thinking_tokens=%s | "
            "total_tokens=%s | "
            "gemini_latency_ms=%s | "
            "tool_latency_ms=%s | "
            "total_latency_ms=%s",
            request_id,
            status,
            GEMINI_MODEL,
            gemini_call_count,
            gemini_attempt_count,
            total_tool_calls,
            tool_execution_count,
            tool_cache_hits,
            total_input_tokens,
            total_output_tokens,
            total_thinking_tokens,
            total_reported_tokens,
            gemini_latency_ms,
            tool_latency_ms,
            total_latency_ms,
        )

    async def request_gemini():
        nonlocal total_input_tokens, total_output_tokens
        nonlocal total_thinking_tokens, total_reported_tokens
        nonlocal gemini_call_count, gemini_attempt_count
        nonlocal gemini_latency_ms

        for attempt in range(1, MAX_GEMINI_ATTEMPTS + 1):
            gemini_attempt_count += 1

            logger.info(
                "Sending request to Gemini | "
                "request_id=%s | attempt=%s",
                request_id,
                attempt,
            )

            started_at = perf_counter()

            try:
                response = await gemini_client.aio.models.generate_content(
                    model=GEMINI_MODEL,
                    contents=contents,
                    config=types.GenerateContentConfig(
                        tools=[inventory_tool],
                        automatic_function_calling=(
                            types.AutomaticFunctionCallingConfig(
                                disable=True
                            )
                        ),
                    ),
                )

            except ServerError as error:
                latency_ms = round(
                    (perf_counter() - started_at) * 1000
                )
                gemini_latency_ms += latency_ms

                if error.code not in (503, 504):
                    raise

                if attempt == MAX_GEMINI_ATTEMPTS:
                    raise

                wait_seconds = attempt * 3

                logger.warning(
                    "Temporary Gemini server error | "
                    "request_id=%s | "
                    "status_code=%s | "
                    "attempt=%s | "
                    "retry_delay=%ss",
                    request_id,
                    error.code,
                    attempt,
                    wait_seconds,
                )

                await asyncio.sleep(wait_seconds)
                continue

            except Exception:
                latency_ms = round(
                    (perf_counter() - started_at) * 1000
                )
                gemini_latency_ms += latency_ms
                raise

            latency_ms = round(
                (perf_counter() - started_at) * 1000
            )
            gemini_latency_ms += latency_ms
            gemini_call_count += 1

            logger.info(
                "Gemini latency | "
                "request_id=%s | "
                "model=%s | "
                "latency_ms=%s",
                request_id,
                GEMINI_MODEL,
                latency_ms,
            )

            usage = response.usage_metadata

            if usage:
                total_input_tokens += usage.prompt_token_count or 0
                total_output_tokens += (
                    usage.candidates_token_count or 0
                )
                total_thinking_tokens += (
                    usage.thoughts_token_count or 0
                )
                total_reported_tokens += (
                    usage.total_token_count or 0
                )

            logger.info(
                "Gemini token usage | "
                "request_id=%s | "
                "model=%s | "
                "input_tokens=%s | "
                "output_tokens=%s | "
                "thinking_tokens=%s | "
                "total_tokens=%s",
                request_id,
                GEMINI_MODEL,
                usage.prompt_token_count if usage else None,
                usage.candidates_token_count if usage else None,
                usage.thoughts_token_count if usage else None,
                usage.total_token_count if usage else None,
            )

            return response

        raise RuntimeError("Gemini request failed")

    try:
        async with asyncio.timeout(AI_REQUEST_TIMEOUT_SECONDS):
            while True:
                response = await request_gemini()

                if not response.candidates:
                    raise RuntimeError(
                        "Gemini returned no response candidates"
                    )

                function_calls = response.function_calls or []

                if function_calls:
                    logger.info(
                        "Gemini selected tools | "
                        "request_id=%s | "
                        "selected_tools=%s",
                        request_id,
                        [call.name for call in function_calls],
                    )

                # Final Gemini response.
                if not function_calls:
                    if not response.text:
                        raise RuntimeError(
                            "Gemini returned an empty response"
                        )

                    log_request_summary("success")

                    return {
                        "answer": response.text,
                        "tool_results": tool_results,
                    }

                if tool_rounds >= MAX_TOOL_ROUNDS:
                    raise RuntimeError(
                        "Maximum AI tool rounds reached"
                    )

                if (
                    total_tool_calls + len(function_calls)
                    > MAX_TOTAL_TOOL_CALLS
                ):
                    raise RuntimeError(
                        "Maximum AI tool execution budget exceeded"
                    )

                model_content = response.candidates[0].content

                if model_content is None:
                    raise RuntimeError(
                        "Gemini returned an invalid tool-call response"
                    )

                contents.append(model_content)
                tool_rounds += 1

                # Execute tools sequentially.
                for function_call in function_calls:
                    total_tool_calls += 1

                    tool_name = function_call.name
                    raw_arguments = function_call.args

                    if raw_arguments is None:
                        arguments = {}
                    elif isinstance(raw_arguments, dict):
                        arguments = raw_arguments
                    else:
                        raise RuntimeError(
                            "Gemini returned invalid tool arguments"
                        )

                    cache_key = json.dumps(
                        {
                            "tool_name": tool_name,
                            "arguments": arguments,
                        },
                        sort_keys=True,
                        separators=(",", ":"),
                    )

                    cached_result = tool_cache.get(cache_key)

                    if cached_result is not None:
                        tool_cache_hits += 1

                        logger.info(
                            "Reusing cached AI tool result | "
                            "request_id=%s | tool_name=%s",
                            request_id,
                            tool_name,
                        )

                        result = cached_result

                        tool_results[tool_name] = {
                            "success": True,
                            "result": result,
                        }

                        function_response = {
                            "result": result,
                        }

                    else:
                        logger.info(
                            "Executing AI tool | "
                            "request_id=%s | "
                            "tool_name=%s | "
                            "tool_round=%s",
                            request_id,
                            tool_name,
                            tool_rounds,
                        )

                        tool_started_at = perf_counter()
                        tool_execution_count += 1

                        try:
                            result = await execute_tool(
                                tool_name=tool_name,
                                arguments=arguments,
                                internal_token=internal_token,
                                request_id=request_id,
                            )

                            tool_cache[cache_key] = result

                            tool_results[tool_name] = {
                                "success": True,
                                "result": result,
                            }

                            function_response = {
                                "result": result,
                            }

                        except ToolExecutionError as error:
                            logger.warning(
                                "AI tool execution failed | "
                                "request_id=%s | "
                                "tool_name=%s | "
                                "error_code=%s | "
                                "retryable=%s",
                                request_id,
                                tool_name,
                                error.code,
                                error.retryable,
                            )

                            tool_results[tool_name] = {
                                "success": False,
                                "error": {
                                    "code": error.code,
                                    "message": error.message,
                                    "retryable": error.retryable,
                                },
                            }

                            function_response = {
                                "error": {
                                    "code": error.code,
                                    "message": error.message,
                                    "retryable": error.retryable,
                                }
                            }

                        finally:
                            elapsed_ms = round(
                                (
                                    perf_counter() - tool_started_at
                                ) * 1000
                            )

                            tool_latency_ms += elapsed_ms

                            logger.info(
                                "AI tool latency | "
                                "request_id=%s | "
                                "tool_name=%s | "
                                "latency_ms=%s",
                                request_id,
                                tool_name,
                                elapsed_ms,
                            )

                    response_part = (
                        types.Part.from_function_response(
                            name=tool_name,
                            response=function_response,
                        )
                    )

                    contents.append(
                        types.Content(
                            role="user",
                            parts=[response_part],
                        )
                    )

    except TimeoutError as error:
        log_request_summary("timeout")

        logger.error(
            "AI request exceeded its overall deadline | "
            "request_id=%s | "
            "tool_rounds=%s | "
            "total_tool_calls=%s",
            request_id,
            tool_rounds,
            total_tool_calls,
        )

        raise RuntimeError(
            "AI request timed out. Please try again."
        ) from error

    except Exception:
        log_request_summary("error")
        raise
