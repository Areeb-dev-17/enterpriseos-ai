import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import "../config/env.js";

const AI_SERVICE_JWT_SECRET = process.env.AI_SERVICE_JWT_SECRET;

if (!AI_SERVICE_JWT_SECRET) {
  throw new Error("AI_SERVICE_JWT_SECRET is not configured");
}

export interface AIServiceContext {
  userId: string;
  organizationId: string;
}

export const authenticateAIService = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Internal service token required",
      });
    }

    const token = authorization.split(" ")[1];

    const decoded = jwt.verify(token, AI_SERVICE_JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: "enterpriseos-api",
      audience: "enterpriseos-ai",
    });

    if (
      typeof decoded === "string" ||
      typeof decoded.sub !== "string" ||
      typeof decoded.organizationId !== "string"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid internal service token",
      });
    }

    res.locals.aiServiceContext = {
      userId: decoded.sub,
      organizationId: decoded.organizationId,
    } satisfies AIServiceContext;

    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired internal service token",
    });
  }
};