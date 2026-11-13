import type { Request, Response, NextFunction } from "express";
import { getAnalytics } from "../services/analytics.service.js";

export const getAnalyticsController = async (
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

    const analytics = await getAnalytics(organizationId);

    return res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
};