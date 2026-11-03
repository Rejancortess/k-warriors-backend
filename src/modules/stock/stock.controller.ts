import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";

import { stockService, StockError } from "./stock.service";
import { stockMovementSchema } from "./stock.schema";

function handleStockError(error: unknown, res: Response) {
  if (error instanceof StockError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2003") {
      return res.status(400).json({
        success: false,
        message: "Invalid product or user reference",
      });
    }

    if (error.code === "P2034") {
      return res.status(409).json({
        success: false,
        message: "Concurrent stock update. Please retry.",
      });
    }
  }

  console.error("Stock operation error:", error);

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
}

export const stockController = {
  async stockIn(req: Request, res: Response) {
    try {
      const userId = res.locals.user?.id as string | undefined;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const validated = stockMovementSchema.safeParse(req.body);

      if (!validated.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid stock movement data",
          errors: validated.error.flatten(),
        });
      }

      const transaction = await stockService.stockIn(validated.data, userId);

      return res.status(201).json({
        success: true,
        message: "Stock added successfully",
        data: transaction,
      });
    } catch (error) {
      return handleStockError(error, res);
    }
  },

  async stockOut(req: Request, res: Response) {
    try {
      const userId = res.locals.user?.id as string | undefined;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const validated = stockMovementSchema.safeParse(req.body);

      if (!validated.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid stock movement data",
          errors: validated.error.flatten(),
        });
      }

      const transaction = await stockService.stockOut(validated.data, userId);

      return res.status(201).json({
        success: true,
        message: "Stock removed successfully",
        data: transaction,
      });
    } catch (error) {
      return handleStockError(error, res);
    }
  },
};
