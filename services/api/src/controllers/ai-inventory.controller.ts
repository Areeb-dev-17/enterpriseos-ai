import type { Request, Response, NextFunction } from "express";
import { getProducts } from "../services/inventory.service.js";

export const getAIInventory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { organizationId } = res.locals.aiServiceContext;

    const products = await getProducts(organizationId);

    return res.status(200).json({
      success: true,
      data: products,
      count: products.length,
    });
  } catch (error) {
    next(error);
  }
};