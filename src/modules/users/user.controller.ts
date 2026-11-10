import type { Request, Response } from "express";
import { z } from "zod";
import { UserError, userService } from "./user.service";

function routeParam(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() ?? "";
}

const createUserSchema = z.object({
  name: z.string().trim().min(1),
  email: z.email(),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "STAFF"]).default("STAFF"),
});

const updateRoleSchema = z.object({
  role: z.enum(["ADMIN", "STAFF"]),
});

export const userController = {
  async list(_req: Request, res: Response) {
    try {
      const users = await userService.listUsers();

      res.status(200).json({
        success: true,
        data: users,
      });
    } catch (error) {
      console.error("List users error:", error);

      res.status(500).json({
        success: false,
        message: "Couldn't load accounts.",
      });
    }
  },

  async updateRole(req: Request, res: Response) {
    const id = routeParam(req.params.id);
    const parsed = updateRoleSchema.safeParse(req.body);

    if (!id || !parsed.success) {
      res.status(400).json({
        success: false,
        message: "Choose Admin or Staff.",
      });
      return;
    }

    const actorId = res.locals.user?.id as string | undefined;

    if (!actorId) {
      res.status(401).json({
        success: false,
        message: "Bearer token is missing",
      });
      return;
    }

    try {
      const user = await userService.updateRole(id, parsed.data.role, actorId);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      if (error instanceof UserError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }

      console.error("Update role error:", error);

      res.status(500).json({
        success: false,
        message: "Couldn't update that role.",
      });
    }
  },

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
