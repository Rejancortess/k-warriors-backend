import { Router } from "express";
import { stockController } from "./stock.controller";
import { requireAuth } from "../../middleware/requireAuth";

const router = Router();

router.post("/in", requireAuth, stockController.stockIn);
router.post("/out", requireAuth, stockController.stockOut);

export default router;
