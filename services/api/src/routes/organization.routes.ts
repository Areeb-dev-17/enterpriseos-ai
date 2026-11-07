import { Router } from "express";
import { getOrganizations } from "../controllers/organization.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js"
import { authorizeRoles } from "../middleware/role.middleware.js";

const router = Router();

router.get("/",authenticateToken, authorizeRoles("admin"), getOrganizations);

export default router;