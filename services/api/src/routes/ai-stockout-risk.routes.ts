
import { Router } from "express";
import { authenticateAIService } from "../middleware/ai-service-auth.middleware.js";
import { getAIStockoutRisks } from "../controllers/ai-stockout-risk.controller.js";

const router = Router();

router.get(
  "/stockout-risks",
  authenticateAIService,
  getAIStockoutRisks
);

export default router;
