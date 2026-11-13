
import {
    createPurchaseOrder,
    getPurchaseOrders,
    getPurchaseOrderById,
    ReceivePurchaseOrder,
    type CreatePurchaseOrderInput,
    type ReceivePurchaseOrderInput,
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


export const ReceivePurchaseOrderService = async (
  purchaseOrderId: string,
  organizationId: string,
  data: ReceivePurchaseOrderInput
) => {
  // 1. Validate purchase order ID.
  if (!isValidUUID(purchaseOrderId)) {
    throw new PurchaseOrderError(
      "Invalid purchase order ID",
      400
    );
  }

  // 2. Validate receiving items.
  if (!data || !Array.isArray(data.items) || data.items.length === 0) {
    throw new PurchaseOrderError(
      "At least one item is required for receiving",
      400
    );
  }

  // 3. Validate each item.
  const receivedItemIds = new Set<string>();

  for (const item of data.items) {
    if (!isValidUUID(item.itemId)) {
      throw new PurchaseOrderError(
        "Invalid purchase order item ID",
        400
      );
    }

    if (
      !Number.isInteger(item.quantity) ||
      item.quantity <= 0
    ) {
      throw new PurchaseOrderError(
        "Received quantity must be a positive integer",
        400
      );
    }

    if (receivedItemIds.has(item.itemId)) {
      throw new PurchaseOrderError(
        "Duplicate purchase order items are not allowed",
        400
      );
    }

    receivedItemIds.add(item.itemId);
  }

  // 4. Execute the database receiving transaction.
  try {
    const purchaseOrder = await ReceivePurchaseOrder(
      purchaseOrderId,
      organizationId,
      data
    );

    // 5. Handle missing purchase order.
    if (!purchaseOrder) {
      throw new PurchaseOrderError(
        "Purchase order not found",
        404
      );
    }

    return purchaseOrder;
  } catch (error) {
    if (error instanceof PurchaseOrderError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.message.startsWith("Cannot receive a purchase order")) {
        throw new PurchaseOrderError(error.message, 409);
      }

      if (
        error.message.includes("remaining quantity") ||
        error.message.includes("do not belong") ||
        error.message.includes("more than once")
      ) {
        throw new PurchaseOrderError(error.message, 400);
      }
    }

    throw error;
  }
};

  

export const getOpenPurchaseOrdersService = async (
  organizationId: string
) => {
  const purchaseOrders = await getPurchaseOrders(organizationId);

  const openStatuses = [
    "Pending",
    "Approved",
    "Partially Received",
  ];

  const openOrders = purchaseOrders
    .filter((order) => openStatuses.includes(order.status))
    .map((order) => {
      const items = order.items
        .map((item: any) => ({
          ...item,
          remainingQuantity: Math.max(
            Number(item.quantity) - Number(item.receivedQuantity),
            0
          ),
        }))
        .filter((item: any) => item.remainingQuantity > 0);

      return {
        id: order.id,
        supplierName: order.supplierName,
        status: order.status,
        expectedDate: order.expectedDate,
        items,
      };
    })
    .filter((order) => order.items.length > 0);

  const incomingMap = new Map<string, any>();

  for (const order of openOrders) {
    for (const item of order.items) {
      const existing = incomingMap.get(item.productId);

      if (existing) {
        existing.pendingQuantity += item.remainingQuantity;
      } else {
        incomingMap.set(item.productId, {
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          pendingQuantity: item.remainingQuantity,
        });
      }
    }
  }

  const incomingByProduct = Array.from(incomingMap.values());

  return {
    totalOpenOrders: openOrders.length,
    totalIncomingUnits: incomingByProduct.reduce(
      (total, item) => total + item.pendingQuantity,
      0
    ),
    incomingByProduct,
    orders: openOrders,
  };
};
