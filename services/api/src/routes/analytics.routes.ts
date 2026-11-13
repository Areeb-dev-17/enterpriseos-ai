import { Router } from "express";
import { getAnalyticsController } from "../controllers/analytics.controller.js";
import { getInventoryTrendController } from "../controllers/inventory-trend.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authenticateToken, getAnalyticsController);

router.get(
  "/inventory-trend",
  authenticateToken,
  getInventoryTrendController
);

export default router;