
import { Router } from "express";
import { authenticateAIService } from "../middleware/ai-service-auth.middleware.js";
import { getAIPurchaseOrders } from "../controllers/ai-purchase-order.controller.js";

const router = Router();

router.get(
  "/purchase-orders",
  authenticateAIService,
  getAIPurchaseOrders
);

export default router;
