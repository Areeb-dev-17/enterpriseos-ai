import dotenv from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";

// Load .env from the project root
const currentDir = dirname(fileURLToPath(import.meta.url));
dotenv.config({
  path: resolve(currentDir, "../../../../.env"),
});

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured");
}

export const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on("connect", () => {
  console.log("Connected to PostgreSQL");
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL error:", error);
});