import { Router } from "express";
import { dashboardController } from "./dashboard.controller";
import { requireAuth } from "../../middleware/requireAuth";

const router = Router();

router.get("/stats", requireAuth, dashboardController.getStats);

export default router;
