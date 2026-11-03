import { Router } from "express";
import { authController } from "./auth.controller";

const router = Router();

router.post("/sync", authController.sync);

export default router;
