
import type { Request, Response, NextFunction } from "express";
import { getOpenPurchaseOrdersService } from "../services/purchase-order.service.js";

export const getAIPurchaseOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { organizationId } = res.locals.aiServiceContext;

    const purchaseOrders = await getOpenPurchaseOrdersService(
      organizationId
    );

    return res.status(200).json({
      success: true,
      data: purchaseOrders,
    });
  } catch (error) {
    next(error);
  }
};
