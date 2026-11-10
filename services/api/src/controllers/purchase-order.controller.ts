
import type { Request, Response } from "express";

import {
  createPurchaseOrderService,
  getPurchaseOrdersService,
  getPurchaseOrderByIdService,
  PurchaseOrderError,
  ReceivePurchaseOrderService
} from "../services/purchase-order.service.js";

const handlePurchaseOrderError = (
  error: unknown,
  res: Response
) => {
  if (error instanceof PurchaseOrderError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  const databaseError = error as {
    code?: string;
  };

  if (databaseError.code === "23503") {
    return res.status(400).json({
      success: false,
      message: "One or more products are invalid or do not belong to your organization",
    });
  }

  if (databaseError.code === "23505") {
    return res.status(409).json({
      success: false,
      message: "Duplicate purchase order item",
    });
  }

  console.error("Purchase Order Error:", error);

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};

// POST /api/v1/purchase-orders
export const createPurchaseOrderController = async (
  req: Request,
  res: Response
) => {
  try {
    const organizationId = req.user.organizationId;

    const purchaseOrder = await createPurchaseOrderService(
      organizationId,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Purchase order created successfully",
      data: purchaseOrder,
    });
  } catch (error) {
    return handlePurchaseOrderError(error, res);
  }
};

// GET /api/v1/purchase-orders
export const getPurchaseOrdersController = async (
  req: Request,
  res: Response
) => {
  try {
    const organizationId = req.user.organizationId;

    const purchaseOrders = await getPurchaseOrdersService(
      organizationId
    );

    return res.status(200).json({
      success: true,
      data: purchaseOrders,
    });
  } catch (error) {
    return handlePurchaseOrderError(error, res);
  }
};

// GET /api/v1/purchase-orders/:id
export const getPurchaseOrderByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    const organizationId = req.user.organizationId;

    const id = req.params.id;

    if (typeof id !== "string" || !id.trim()) {
      return res.status(400).json({
        success: false,
        message: "Invalid purchase order ID",
      });
    }

    const purchaseOrder = await getPurchaseOrderByIdService(
      id,
      organizationId
    );

    return res.status(200).json({
      success: true,
      data: purchaseOrder,
    });
  } catch (error) {
    return handlePurchaseOrderError(error, res);
  }
};


export const ReceivePurchaseOrderController = async (
  req: Request,
  res: Response
) => {
  try {
    const id = req.params.id;

    if (typeof id !== "string" || !id.trim()) {
      return res.status(400).json({
        success: false,
        message: "Invalid purchase order ID",
      });
    }
    const purchaseOrder = await ReceivePurchaseOrderService(
      id,
      req.user!.organizationId,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Purchase order items received successfully",
      data: purchaseOrder,
    });
  } catch (error) {
    return handlePurchaseOrderError(error, res);
  }
};
