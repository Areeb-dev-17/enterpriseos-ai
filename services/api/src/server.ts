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
import stockoutRiskRoutes from "./routes/stockout-risk.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import { startInventorySnapshotJob } from "./jobs/inventory-snapshot.job.js";
import aiRoutes from "./routes/ai.routes.js";
import aiInventoryRoutes from "./routes/ai-inventory.routes.js";
import aiStockoutRiskRoutes from "./routes/ai-stockout-risk.routes.js";
import aiPurchaseOrderRoutes from "./routes/ai-purchase-order.routes.js";

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
app.use("/api/v1/stockout-risks", stockoutRiskRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/ai", aiRoutes);
app.use("/api/v1/internal/ai", aiInventoryRoutes);
app.use("/api/v1/internal/ai", aiStockoutRiskRoutes);
app.use("/api/v1/internal/ai", aiPurchaseOrderRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`EnterpriseOS API running at http://localhost:${PORT}`);

  startInventorySnapshotJob();
});
