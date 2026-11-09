import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { pool } from "./config/database.js";
import organizationRoutes from "./routes/organization.routes.js";
import authRoutes from "./routes/auth.routes.js";
import "./config/env.js";
import inventoryRoutes from "./routes/inventory.routes.js";
import purchaseOrderRoutes from "./routes/purchase-order.routes.js";
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 4000;

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// Health check API
app.get("/api/v1/db-health", async (_req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.status(200).json({
      success: true,
      message: "Database connected successfully",
      databaseTime: result.rows[0].now,
    });
  } catch (error) {
    console.error("Database connection failed:", error);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

// Organization routes
app.use("/api/v1/organizations", organizationRoutes);
// Auth routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/inventory", inventoryRoutes);
app.use("/api/v1/purchase-orders", purchaseOrderRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`EnterpriseOS API running at http://localhost:${PORT}`);
});
