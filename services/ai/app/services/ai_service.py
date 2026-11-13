import asyncio
from app.services.node_api_client import (get_inventory,get_stockout_risks,get_open_purchase_orders)
from app.services.llm_client import generate_inventory_answer
import time



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
) -> dict:

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