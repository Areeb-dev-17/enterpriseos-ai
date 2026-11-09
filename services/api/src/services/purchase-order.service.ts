
import {
    createPurchaseOrder,
    getPurchaseOrders,
    getPurchaseOrderById,
    type CreatePurchaseOrderInput,
  } from "../repositories/purchase-order.repository.js";
  
  export class PurchaseOrderError extends Error {
    statusCode: number;
  
    constructor(message: string, statusCode = 400) {
      super(message);
      this.name = "PurchaseOrderError";
      this.statusCode = statusCode;
    }
  }
  
  const isValidUUID = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  
  const validateCreatePurchaseOrder = (
    data: CreatePurchaseOrderInput
  ) => {
    if (!data || typeof data !== "object") {
      throw new PurchaseOrderError("Invalid request body");
    }
  
    if (
      typeof data.supplierName !== "string" ||
      !data.supplierName.trim()
    ) {
      throw new PurchaseOrderError("Supplier name is required");
    }
  
    if (data.supplierName.trim().length > 255) {
      throw new PurchaseOrderError("Supplier name cannot exceed 255 characters");
    }
  
    if (!Array.isArray(data.items) || data.items.length === 0) {
      throw new PurchaseOrderError("At least one product is required");
    }
  
    if (data.items.length > 100) {
      throw new PurchaseOrderError("A purchase order cannot contain more than 100 items");
    }
  
    if (
      data.expectedDate !== undefined &&
      data.expectedDate !== null
    ) {
      const date = data.expectedDate;
  
      if (
        typeof date !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        !Number.isFinite(Date.parse(`${date}T00:00:00.000Z`)) ||
        new Date(`${date}T00:00:00.000Z`).toISOString().slice(0, 10) !== date
      ) {
        throw new PurchaseOrderError("Expected date must be a valid YYYY-MM-DD date");
      }
    }
  
    const productIds = new Set<string>();
  
    for (const item of data.items) {
      if (!item || typeof item !== "object") {
        throw new PurchaseOrderError("Invalid purchase order item");
      }
  
      if (
        typeof item.productId !== "string" ||
        !isValidUUID(item.productId)
      ) {
        throw new PurchaseOrderError("Invalid product ID");
      }
  
      if (productIds.has(item.productId)) {
        throw new PurchaseOrderError("A product cannot appear twice in the same purchase order");
      }
  
      productIds.add(item.productId);
  
      if (
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0
      ) {
        throw new PurchaseOrderError("Quantity must be a positive integer");
      }
  
      if (
        typeof item.unitCost !== "number" ||
        !Number.isFinite(item.unitCost) ||
        item.unitCost < 0
      ) {
        throw new PurchaseOrderError("Unit cost must be a non-negative number");
      }
    }
  };
  
  export const createPurchaseOrderService = async (
    organizationId: string,
    data: CreatePurchaseOrderInput
  ) => {
    validateCreatePurchaseOrder(data);
  
    return createPurchaseOrder(organizationId, {
      ...data,
      supplierName: data.supplierName.trim(),
    });
  };
  
  export const getPurchaseOrdersService = async (
    organizationId: string
  ) => {
    return getPurchaseOrders(organizationId);
  };
  
  export const getPurchaseOrderByIdService = async (
    id: string,
    organizationId: string
  ) => {
    if (!isValidUUID(id)) {
      throw new PurchaseOrderError("Invalid purchase order ID");
    }
  
    const purchaseOrder = await getPurchaseOrderById(
      id,
      organizationId
    );
  
    if (!purchaseOrder) {
      throw new PurchaseOrderError("Purchase order not found", 404);
    }
  
    return purchaseOrder;
  };
  