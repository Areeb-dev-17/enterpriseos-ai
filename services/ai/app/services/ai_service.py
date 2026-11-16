import asyncio
from app.services.node_api_client import (get_inventory,get_stockout_risks,get_open_purchase_orders)
from app.services.llm_client import generate_inventory_answer
import logging
import time

from app.services.llm_client import generate_ai_response_with_tools

logger = logging.getLogger(__name__)



def analyze_inventory(
    products: list[dict],
    incoming_by_product: list[dict],
) -> dict:
    critical_products = []
    high_risk_products = []
    medium_risk_products = []
    healthy_count = 0

    # Create a lookup using product ID.
    incoming_lookup = {
        item["productId"]: int(item["pendingQuantity"])
        for item in incoming_by_product
    }

    for product in products:
        stock = int(product["availableStock"])
        reorder_level = int(product["reorderLevel"])

        pending_incoming = incoming_lookup.get(product["id"], 0)

        effective_stock = stock + pending_incoming

        # Remaining quantity needed after considering incoming stock.
        stock_gap = max(reorder_level - effective_stock, 0)

        product_analysis = {
            "productName": product["productName"],
            "sku": product["sku"],
            "availableStock": stock,
            "reorderLevel": reorder_level,
            "riskLevel": None,
            "stockGap": stock_gap,
            "pendingIncomingQuantity": pending_incoming,
            "effectiveStock": effective_stock,
        }

        if stock == 0:
            product_analysis["riskLevel"] = "Critical"
            critical_products.append(product_analysis)

        elif stock <= reorder_level:
            product_analysis["riskLevel"] = "High"
            high_risk_products.append(product_analysis)

        elif stock <= reorder_level * 1.5:
            product_analysis["riskLevel"] = "Medium"
            medium_risk_products.append(product_analysis)

        else:
            healthy_count += 1

    # Only recommend products that still have a stock gap
    # after considering incoming purchase orders.
    products_to_reorder = [
        product
        for product in critical_products + high_risk_products
        if product["stockGap"] > 0
    ]

    return {
        "totalProducts": len(products),
        "criticalCount": len(critical_products),
        "highRiskCount": len(high_risk_products),
        "mediumRiskCount": len(medium_risk_products),
        "healthyCount": healthy_count,
        "productsToReorder": products_to_reorder,
        "productsToMonitor": medium_risk_products,
    }

def validate_inventory_analysis(
    analysis: dict,
    stockout_data: dict,
) -> None:
    expected_counts = {
        "criticalCount": stockout_data["criticalCount"],
        "highRiskCount": stockout_data["highCount"],
        "mediumRiskCount": stockout_data["mediumCount"],
    }

    for field, expected in expected_counts.items():
        actual = analysis[field]

        if actual != expected:
            raise ValueError(
                f"Inventory analysis mismatch for {field}: "
                f"Python calculated {actual}, "
                f"Node returned {expected}"
            )



async def process_ai_question(
    question: str,
    user_id: str,
    organization_id: str,
    internal_token: str,
    request_id: str
) -> dict:

    start_time = time.perf_counter()

    logger.info("Starting AI question processing")

    prompt = f"""
You are EnterpriseOS, an AI inventory operations assistant.

Answer the user's question using the organization's actual business data.

User question:
{question}

Available tools:
- get_inventory: Current products, stock levels, reorder levels and prices.
- get_stockout_risks: Current critical, high and medium stockout risks.
- get_open_purchase_orders: Open purchase orders and incoming quantities.

Instructions:
1. Decide which tools are necessary to answer the question.
2. Call only the tools relevant to the question.
3. For questions requiring multiple data sources, call the necessary tools.
4. Do not request the same tool repeatedly if its result is already available.
5. Use only the data returned by the tools.
6. Never invent product names, quantities, suppliers, prices or dates.
7. Clearly distinguish available stock from incoming stock.
8. If a required tool fails, explain that the information is unavailable.
9. If the available data is insufficient, clearly state the limitation.
10. Give a concise, practical answer.

You must not assume that incoming purchase orders have already been received.
"""

    try:
        llm_result = await generate_ai_response_with_tools(
            prompt=prompt,
            internal_token=internal_token,
            request_id=request_id
        )

        tool_results = llm_result["tool_results"]

        def get_successful_tool_data(tool_name: str):
            tool_result = tool_results.get(tool_name)

            if not tool_result or not tool_result.get("success"):
                return None

            response = tool_result.get("result")

            if not isinstance(response, dict):
                return None

            if response.get("success") is not True:
                return None

            return response.get("data")

        inventory_data = get_successful_tool_data("get_inventory")
        stockout_data = get_successful_tool_data("get_stockout_risks")
        purchase_order_data = get_successful_tool_data(
            "get_open_purchase_orders"
        )

        analysis = None

        # Accurate stock-gap analysis requires both current inventory
        # and incoming quantities from open purchase orders.
        if (
            isinstance(inventory_data, list)
            and isinstance(purchase_order_data, dict)
            and isinstance(
                purchase_order_data.get("incomingByProduct"),
                list,
            )
        ):
            analysis = analyze_inventory(
                inventory_data,
                purchase_order_data["incomingByProduct"],
            )

            # Cross-check Python calculations against Node's
            # stockout calculations whenever that data is available.
            if isinstance(stockout_data, dict):
                validate_inventory_analysis(
                    analysis,
                    stockout_data,
                )

        elapsed = time.perf_counter() - start_time

        logger.info(
            "AI question processing completed",
            extra={
                "duration_seconds": round(elapsed, 2),
                "retrieved_tools": list(tool_results.keys()),
            },
        )

        return {
            "received": True,
            "question": question,
            "message": "AI response generated successfully",
            "answer": llm_result["answer"],
            "analysis": analysis,
            "stockoutRisks": stockout_data,
            "purchaseOrders": purchase_order_data,
        }

    except Exception:
        logger.exception(
            "AI question processing failed",
            extra={
                "duration_seconds": round(
                    time.perf_counter() - start_time,
                    2,
                ),
            },
        )
        raise


    start_time = time.perf_counter()

    print("[AI] Starting inventory data fetch...", flush=True)

    try:
        inventory_response, stockout_response, purchase_order_response = (
            await asyncio.gather(
                get_inventory(internal_token),
                get_stockout_risks(internal_token),
                get_open_purchase_orders(internal_token),
            )
        )

        print(
            f"[AI] All business APIs completed in "
            f"{time.perf_counter() - start_time:.2f}s",
            flush=True,
        )

        products = inventory_response["data"]
        stockout_data = stockout_response["data"]
        purchase_order_data = purchase_order_response["data"]

        print("[AI] Starting inventory analysis...", flush=True)

        analysis = analyze_inventory(
            products,
            purchase_order_data["incomingByProduct"],
        )

        validate_inventory_analysis(analysis, stockout_data)

        print("[AI] Inventory analysis completed.", flush=True)

        llm_start = time.perf_counter()

        print("[AI] Sending request to Gemini...", flush=True)

        answer = await generate_inventory_answer(
            question=question,
            analysis=analysis,
            stockout_risks=stockout_data,
            purchase_orders=purchase_order_data,
        )

        print(
            f"[AI] Gemini completed in "
            f"{time.perf_counter() - llm_start:.2f}s",
            flush=True,
        )

        print(
            f"[AI] Total processing time: "
            f"{time.perf_counter() - start_time:.2f}s",
            flush=True,
        )

        return {
            "received": True,
            "question": question,
            "message": "Inventory, stockout and purchase order analysis completed successfully",
            "answer": answer,
            "analysis": analysis,
            "stockoutRisks": stockout_data,
            "purchaseOrders": purchase_order_data,
        }

    except Exception as error:
        print(
            f"[AI] Failed after {time.perf_counter() - start_time:.2f}s: "
            f"{type(error).__name__}: {error}",
            flush=True,
        )
        raise