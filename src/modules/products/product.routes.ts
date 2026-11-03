import { Router } from "express";
import { productController } from "./product.controller";
import { requireAuth } from "../../middleware/requireAuth";

const router = Router();

// Protect all product routes
router.use(requireAuth);

// Static routes
router.get("/", productController.getAll);
router.get("/search", productController.search);
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

// Permanent deletion should also require ADMIN authorization
router.delete("/:id/permanently", productController.deletePermanently);

// Product transaction history
router.get("/:id/transactions", productController.getTransactions);

export default router;
