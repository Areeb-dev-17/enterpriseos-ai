import jwt from "jsonwebtoken";
import "../config/env.js";

const AI_SERVICE_JWT_SECRET = process.env.AI_SERVICE_JWT_SECRET;

if (!AI_SERVICE_JWT_SECRET) {
  throw new Error("AI_SERVICE_JWT_SECRET is not configured");
}

interface AIServiceTokenPayload{
    userId:string;
    organizationId:string;
}

export const generateAIServiceToken =(
    payload:AIServiceTokenPayload
): string =>{
    return jwt.sign(
        {
            organizationId: payload.organizationId,
          },
          AI_SERVICE_JWT_SECRET,
          {
            algorithm: "HS256",
            subject: payload.userId,
            issuer: "enterpriseos-api",
            audience: "enterpriseos-ai",
            expiresIn: "60s",
          }
    )
}