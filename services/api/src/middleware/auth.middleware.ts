import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { TokenPayload } from "../utils/token.js";
import "../config/env.js";

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not configured");
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authentication token is required",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;

    req.user = decoded;

    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};