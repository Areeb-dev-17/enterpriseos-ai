
import type { Request, Response, NextFunction } from "express";
import { getStockoutRisks } from "../services/stockout-risk.service.js";

export const getAIStockoutRisks = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { organizationId } = res.locals.aiServiceContext;

    const risks = await getStockoutRisks(organizationId);

    return res.status(200).json({
      success: true,
      data: risks,
    });
  } catch (error) {
    next(error);
  }
};
