
import { randomBytes, createHash } from "node:crypto";

const REFRESH_TOKEN_BYTES = 64;
export const REFRESH_TOKEN_EXPIRY_DAYS = 7;

export const generateRefreshToken = (): string => {
  return randomBytes(REFRESH_TOKEN_BYTES).toString("hex");
};

export const hashRefreshToken = (token: string): string => {
  return createHash("sha256")
    .update(token)
    .digest("hex");
};

export const getRefreshTokenExpiry = (): Date => {
  const expiry = new Date();

  expiry.setDate(
    expiry.getDate() + REFRESH_TOKEN_EXPIRY_DAYS
  );

  return expiry;
};
