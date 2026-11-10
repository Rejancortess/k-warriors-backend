import { Router, type NextFunction, type Request, type Response } from "express";
import { userController } from "./user.controller";
import { requireAuth } from "../../middleware/requireAuth";

const router = Router();

function requireAdmin(_req: Request, res: Response, next: NextFunction) {
  if (res.locals.user.role !== "ADMIN") {
    res.status(403).json({
      success: false,
      message: "Admin access required",
    });
    return;
  }

  next();
}

router.use(requireAuth);
router.get("/", requireAdmin, userController.list);
router.post("/", requireAdmin, userController.create);
router.patch("/:id", requireAdmin, userController.updateRole);

export default router;
