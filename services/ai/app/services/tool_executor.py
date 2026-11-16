
import asyncio
import json
import logging
from time import perf_counter
from typing import Any, Awaitable, Callable

import httpx

from app.services.node_api_client import (
    get_inventory,
    get_stockout_risks,
    get_open_purchase_orders,
)


logger = logging.getLogger(__name__)

# Initial execution policies. We can move these to config later.
TOOL_TIMEOUT_SECONDS = 15
MAX_TOOL_RESULT_BYTES = 256 * 1024


class ToolExecutionError(Exception):
    def __init__(
        self,
        code: str,
        message: str,
        retryable: bool = False,
    ):
        super().__init__(message)
        self.code = code
        self.message = message
        self.retryable = retryable


ToolFunction = Callable[[str], Awaitable[dict[str, Any]]]


TOOL_REGISTRY: dict[str, ToolFunction] = {
    "get_inventory": get_inventory,
    "get_stockout_risks": get_stockout_risks,
    "get_open_purchase_orders": get_open_purchase_orders,
}


def validate_tool_arguments(arguments: dict[str, Any]) -> None:
    if not isinstance(arguments, dict):
        raise ToolExecutionError(
            code="invalid_arguments",
            message="Tool arguments must be an object.",
        )

    # All currently registered tools are read-only
    # and do not accept any arguments.
    if arguments:
        raise ToolExecutionError(
            code="invalid_arguments",
            message="This tool does not accept arguments.",
        )


async def execute_tool(
    tool_name: str,
    arguments: dict[str, Any] | None,
    internal_token: str,
    request_id: str
) -> dict[str, Any]:

    started_at = perf_counter()

    if not isinstance(tool_name, str) or tool_name not in TOOL_REGISTRY:
        logger.warning(
            "Rejected unsupported AI tool",
            extra={"tool_name": str(tool_name)[:100]},
        )

        raise ToolExecutionError(
            code="unsupported_tool",
            message="The requested tool is not available.",
        )

    if not isinstance(internal_token, str) or not internal_token:
        raise ToolExecutionError(
            code="missing_service_context",
            message="Service authentication context is missing.",
        )

    validate_tool_arguments(arguments or {})

    tool_function = TOOL_REGISTRY[tool_name]

    try:
        result = await asyncio.wait_for(
            tool_function(internal_token),
            timeout=TOOL_TIMEOUT_SECONDS,
        )

        if not isinstance(result, dict):
            raise ToolExecutionError(
                code="invalid_tool_response",
                message="The tool returned an invalid response.",
            )

        result_size = len(
            json.dumps(result, default=str).encode("utf-8")
        )

        if result_size > MAX_TOOL_RESULT_BYTES:
            raise ToolExecutionError(
                code="result_too_large",
                message="The tool response exceeded the allowed size.",
            )

        logger.info(
            "AI tool execution completed",
            extra={
                "request_id": request_id,
                "tool_name": tool_name,
                "duration_ms": round(
                    (perf_counter() - started_at) * 1000
                ),
                "result_size_bytes": result_size,
                "success": True,
            },
        )

        return result

    except asyncio.CancelledError:
        logger.warning(
            "AI tool execution cancelled",
            extra={"tool_name": tool_name},
        )
        raise

    except ToolExecutionError:
        raise

    except asyncio.TimeoutError as error:
        logger.warning(
            "AI tool execution timed out",
            extra={"tool_name": tool_name},
        )

        raise ToolExecutionError(
            code="tool_timeout",
            message="The requested business data took too long to retrieve.",
            retryable=True,
        ) from error

    except httpx.HTTPStatusError as error:
        status_code = error.response.status_code

        logger.error(
            "Node API returned an HTTP error",
            extra={
                "tool_name": tool_name,
                "status_code": status_code,
            },
        )

        raise ToolExecutionError(
            code="node_api_error",
            message="The business data service could not complete the request.",
            retryable=status_code == 408
            or status_code == 429
            or status_code >= 500,
        ) from error

    except httpx.RequestError as error:
        logger.error(
            "Node API connection failed",
            extra={"tool_name": tool_name},
        )

        raise ToolExecutionError(
            code="node_api_unavailable",
            message="The business data service is temporarily unavailable.",
            retryable=True,
        ) from error

    except Exception as error:
        logger.exception(
            "Unexpected AI tool execution failure",
            extra={"tool_name": tool_name},
        )

        raise ToolExecutionError(
            code="internal_tool_error",
            message="The requested business data could not be retrieved.",
        ) from error
