import type { Request, Response } from "express";
import { dashboardService } from "./dashboard.service";

export const dashboardController = {
  async getStats(_req: Request, res: Response) {
    try {
      const stats = await dashboardService.getStats();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Dashboard stats error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to retrieve dashboard statistics",
      });
    }
  },
};
