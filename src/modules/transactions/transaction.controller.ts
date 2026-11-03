import type { Request, Response } from "express";
import { transactionService } from "./transaction.service";

export const transactionController = {
  async getAll(req: Request, res: Response) {
    try {
      const page = Number(req.query.page ?? 1);
      const limit = Number(req.query.limit ?? 10);
      const type = req.query.type;
      const search = req.query.search;

      if (
        !Number.isInteger(page) ||
        page < 1 ||
        !Number.isInteger(limit) ||
        limit < 1 ||
        limit > 100 ||
        (type !== undefined && type !== "STOCK_IN" && type !== "STOCK_OUT") ||
        (search !== undefined && typeof search !== "string")
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid query parameters",
        });
      }

      const result = await transactionService.getAll({
        page,
        limit,
        type: type as "STOCK_IN" | "STOCK_OUT" | undefined,
        search: search as string | undefined,
      });

      return res.json({
        success: true,
        data: result.transactions,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch transactions",
      });
    }
  },
};
