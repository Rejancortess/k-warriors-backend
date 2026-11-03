import { Router } from "express";
import { userController } from "./user.controller";
import { requireAuth } from "../../middleware/requireAuth";

const router = Router();

router.post(
  "/",
  requireAuth,
  (req, res, next) => {
    if (res.locals.user.role !== "ADMIN") {
      res.status(403).json({
        success: false,
        message: "Admin access required",
      });
      return;
    }

    next();
  },
  userController.create,
);

export default router;
