import type { Request, Response } from "express";
import { z } from "zod";
import { AuthError, authService } from "./auth.service";

const syncSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
});

export const authController = {
  async sync(req: Request, res: Response) {
    const header = req.headers.authorization;

    if (!header?.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "Bearer token is missing",
      });
      return;
    }

    const token = header.slice(7).trim();

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Bearer token is empty",
      });
      return;
    }

    const parsed = syncSchema.safeParse(req.body ?? {});

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Invalid profile data",
      });
      return;
    }

    try {
      const user = await authService.syncUser(token, parsed.data.name);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      if (error instanceof AuthError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }

      console.error("Sync user error:", error);

      res.status(500).json({
        success: false,
        message: "Unable to save user",
      });
    }
  },
};
