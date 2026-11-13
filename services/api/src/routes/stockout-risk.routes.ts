import { Router } from "express";
import { getStockoutRisksController } from "../controllers/stockout-risk.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authenticateToken, getStockoutRisksController);

export default router;