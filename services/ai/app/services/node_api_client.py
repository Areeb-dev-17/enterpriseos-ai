import httpx

from app.config import NODE_API_URL


async def get_inventory(internal_token: str) -> dict:
    headers = {
        "Authorization": f"Bearer {internal_token}",
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(
            f"{NODE_API_URL}/api/v1/internal/ai/inventory",
            headers=headers,
        )

        response.raise_for_status()

        return response.json()


async def get_stockout_risks(internal_token: str) -> dict:
    headers = {"Authorization": f"Bearer {internal_token}"}

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(
            f"{NODE_API_URL}/api/v1/internal/ai/stockout-risks",
            headers=headers,
        )
        response.raise_for_status()
        return response.json()


async def get_open_purchase_orders(internal_token: str) -> dict:
    headers = {"Authorization": f"Bearer {internal_token}"}

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(
            f"{NODE_API_URL}/api/v1/internal/ai/purchase-orders",
            headers=headers,
        )

        response.raise_for_status()
        return response.json()
