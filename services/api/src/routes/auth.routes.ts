
import { Router } from "express";
import { signUp ,logIn,createMember,getMembers, changeMemberRole} from "../controllers/auth.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";


const router = Router();

router.post("/signup", signUp);
router.post("/login",logIn )
router.post(
    "/members",
    authenticateToken,
    authorizeRoles("admin"),
    createMember
  );
// Get all organization members
  router.get(
    "/members",
    authenticateToken,
    authorizeRoles("admin"),
    getMembers
  );

  router.patch(
    "/members/:id/role",
    authenticateToken,
    authorizeRoles("admin"),
    changeMemberRole
  );


export default router;
