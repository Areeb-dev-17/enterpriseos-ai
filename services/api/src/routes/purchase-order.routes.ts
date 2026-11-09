import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";

import {
  createPurchaseOrderController,
  getPurchaseOrdersController,
  getPurchaseOrderByIdController,
} from "../controllers/purchase-order.controller.js";

const router = Router();

router.use(authenticateToken);

router.get("/", getPurchaseOrdersController);
router.post("/", createPurchaseOrderController);
router.get("/:id", getPurchaseOrderByIdController);

export default router;
