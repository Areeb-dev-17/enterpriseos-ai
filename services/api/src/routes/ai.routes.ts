import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { askAIController } from "../controllers/ai.controller.js";

const router = Router();

router.post("/ask", authenticateToken, askAIController);

export default router;