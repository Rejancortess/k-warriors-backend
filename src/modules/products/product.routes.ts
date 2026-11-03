import { Router } from "express";
import { productController } from "./product.controller";

const router = Router();

// Static routes
router.get("/", productController.getAll);
router.get("/stats", productController.getStats);
router.get("/low-stock", productController.getLowStock);
router.get("/out-of-stock", productController.getOutOfStock);

// Product lookups
router.get("/barcode/:barcode", productController.getByBarcode);
router.get("/sku/:sku", productController.getBySku);

// Product CRUD
router.post("/", productController.create);
router.get("/:id", productController.getById);
router.patch("/:id", productController.update);
router.delete("/:id", productController.archive);
router.patch("/:id/restore", productController.restore);

// Product transaction history
router.get("/:id/transactions", productController.getTransactions);

export default router;
