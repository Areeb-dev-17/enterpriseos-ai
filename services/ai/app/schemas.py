
from pydantic import BaseModel, Field


class AIQuuestionRequest(BaseModel):
    question: str = Field(
        min_length=3,
        max_length=1000,
        description="Question asked by the user",
    )


class ProductRiskItem(BaseModel):
    productName: str
    sku: str
    availableStock: int
    reorderLevel: int
    riskLevel: str
    stockGap: int
    pendingIncomingQuantity: int
    effectiveStock: int


class InventoryAnalysis(BaseModel):
    totalProducts: int
    criticalCount: int
    highRiskCount: int
    mediumRiskCount: int
    healthyCount: int
    productsToReorder: list[ProductRiskItem]
    productsToMonitor: list[ProductRiskItem]

class StockoutRiskProduct(BaseModel):
    id: str
    productName: str
    sku: str
    availableStock: int
    reorderLevel: int
    riskLevel: str

class StockoutRiskSummary(BaseModel):
    totalRisks: int
    criticalCount: int
    highCount: int
    mediumCount: int
    products: list[StockoutRiskProduct]   


class AIQuestionResponse(BaseModel):
    received: bool
    question: str
    message: str
    answer:str
    analysis: InventoryAnalysis
    stockoutRisks: StockoutRiskSummary
    purchaseOrders: dict




