import { prisma } from "../../lib/prisma";

export const dashboardService = {
  async getStats() {
    const now = new Date();

    // Calendar-day boundaries in the server's local timezone
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const [totalProducts, stockAggregate, todayTransactions, lowStockProducts] =
      await Promise.all([
        prisma.product.count({
          where: { isActive: true },
        }),

        prisma.product.aggregate({
          where: { isActive: true },
          _sum: { quantity: true },
        }),

        prisma.stockTransaction.count({
          where: {
            createdAt: {
              gte: startOfDay,
              lt: endOfDay,
            },
          },
        }),

        prisma.product.findMany({
          where: { isActive: true },
          select: {
            quantity: true,
            minStock: true,
          },
        }),
      ]);

    const lowStock = lowStockProducts.filter(
      (product) => product.quantity > 0 && product.quantity <= product.minStock,
    ).length;

    return {
      totalProducts,
      totalStock: stockAggregate._sum.quantity ?? 0,
      lowStock,
      todayTransactions,
    };
  },
};
