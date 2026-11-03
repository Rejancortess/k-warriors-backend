import { Router } from "express";
import { transactionController } from "./transaction.controller";

const router = Router();

router.get("/", transactionController.getAll);

export default router;
