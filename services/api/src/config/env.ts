import dotenv from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));

dotenv.config({
  path: resolve(currentDir, "../../../../.env"),
});

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not configured");
}

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not configured");
}