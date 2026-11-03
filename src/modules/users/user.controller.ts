import type { Request, Response } from "express";
import { z } from "zod";
import { userService } from "./user.service";

const createUserSchema = z.object({
  name: z.string().trim().min(1),
  email: z.email(),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "STAFF"]).default("STAFF"),
});

export const userController = {
  async create(req: Request, res: Response) {
    const parsed = createUserSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        errors: parsed.error.flatten(),
      });
      return;
    }

    try {
      const user = await userService.createUser(parsed.data);

      res.status(201).json({
        success: true,
        message: "Staff account created",
        data: user,
      });
    } catch (error) {
      console.error("Create staff error:", error);

      res.status(500).json({
        success: false,
        message: "Unable to create staff account",
      });
    }
  },
};
