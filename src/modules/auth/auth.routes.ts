import { Router } from "express";
import { authController } from "./auth.controller";
import { requireAuth } from "../../middleware/requireAuth";

const router = Router();

router.post("/sync", authController.sync);
router.patch("/profile", requireAuth, authController.updateProfile);

export default router;
