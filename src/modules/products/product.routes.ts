import { Router } from "express";
import { productController } from "./product.controller";

const router = Router();

router.get("/", productController.getAllProducts);

export default router;
