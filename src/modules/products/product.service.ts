import { prisma } from "../../lib/prisma";

export const productService = {
  async getAllProducts() {
    return prisma.product.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },
};
