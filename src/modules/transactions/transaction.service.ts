import { prisma } from "../../lib/prisma";

interface TransactionFilters {
  page: number;
  limit: number;
  type?: "STOCK_IN" | "STOCK_OUT";
  search?: string;
}

export const transactionService = {
  async getAll(filters: TransactionFilters) {
    const { page, limit, type, search } = filters;

    const where = {
      ...(type ? { type } : {}),
      ...(search
        ? {
            product: {
              OR: [
                {
                  name: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
                {
                  sku: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
              ],
            },
          }
        : {}),
    };

    const [transactions, total] = await prisma.$transaction([
      prisma.stockTransaction.findMany({
        where,
        include: {
          product: {
            select: {
              name: true,
              sku: true,
              barcode: true,
            },
          },
          user: {
            select: {
              name: true,
            },
          },
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),

      prisma.stockTransaction.count({
        where,
      }),
    ]);

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },
};
