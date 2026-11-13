import type { Request, Response, NextFunction } from "express";
import { getStockoutRisks } from "../services/stockout-risk.service.js";

export const getStockoutRisksController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const risks = await getStockoutRisks(organizationId);

    return res.status(200).json({
      success: true,
      data: risks,
    });
  } catch (error) {
    next(error);
  }
};