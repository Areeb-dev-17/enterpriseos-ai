import { Router } from "express";
import { authenticateAIService } from "../middleware/ai-service-auth.middleware.js";
import { getAIInventory } from "../controllers/ai-inventory.controller.js";

const router = Router();

router.get(
  "/inventory",
  authenticateAIService,
  getAIInventory
);

export default router;