
import { Router } from "express";

import { authenticateToken } from "../middleware/auth.middleware.js";

import {
  createInventoryProduct,
  getInventoryProducts,
  getInventoryProductById,
  updateInventoryProduct,
  deleteInventoryProduct,
} from "../controllers/inventory.controller.js";

const router = Router();

// All inventory endpoints require authentication.
router.use(authenticateToken);

// GET /api/v1/inventory
router.get("/", getInventoryProducts);

// POST /api/v1/inventory
router.post("/", createInventoryProduct);

// GET /api/v1/inventory/:id
router.get("/:id", getInventoryProductById);

// PATCH /api/v1/inventory/:id
router.patch("/:id", updateInventoryProduct);

// DELETE /api/v1/inventory/:id
router.delete("/:id", deleteInventoryProduct);

export default router;
