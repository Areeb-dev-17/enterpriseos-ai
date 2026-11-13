import type { Request, Response } from "express";
import { getInventoryTrendData } from "../services/inventory-trend.service.js";

export const getInventoryTrendController = async (
  req: Request,
  res: Response
) => {
  try {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const months = Number(req.query.months ?? 6);

    const data = await getInventoryTrendData(organizationId, months);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Failed to fetch inventory trend:", error);

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch inventory trend",
    });
  }
};