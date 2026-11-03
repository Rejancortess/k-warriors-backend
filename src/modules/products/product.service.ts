import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";

export interface ProductInput {
  name: string;
  sku: string;
  barcode?: string | null;
  description?: string | null;
  quantity?: number;
  minStock?: number;
  price?: number | null;
}

export const productService = {
  getAllProducts() {
    return prisma.product.findMany({
      where: { isActive: true },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
  },

  async getStats() {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { quantity: true, minStock: true },
    });

    return {
      total: products.length,
      lowStock: products.filter(
        (product) => product.quantity > 0 && product.quantity <= product.minStock,
      ).length,
      outOfStock: products.filter((product) => product.quantity === 0).length,
      totalQuantity: products.reduce((sum, product) => sum + product.quantity, 0),
    };
  },

  async getLowStock() {
    const products = await prisma.product.findMany({
      where: { isActive: true, quantity: { gt: 0 } },
      orderBy: [{ quantity: "asc" }, { name: "asc" }],
    });

    return products.filter((product) => product.quantity <= product.minStock);
  },

  getOutOfStock() {
    return prisma.product.findMany({
      where: { isActive: true, quantity: 0 },
      orderBy: [{ name: "asc" }, { id: "asc" }],
    });
  },

  getByBarcode(barcode: string) {
    return prisma.product.findFirst({
      where: { barcode, isActive: true },
    });
  },

  getBySku(sku: string) {
    return prisma.product.findFirst({
      where: { sku, isActive: true },
    });
  },

  getById(id: string) {
    return prisma.product.findUnique({
      where: { id },
    });
  },

  create(data: ProductInput) {
    return prisma.product.create({ data });
  },

  update(id: string, data: Prisma.ProductUpdateInput) {
    return prisma.product.update({
      where: { id },
      data,
    });
  },

  archive(id: string) {
    return prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  },

  restore(id: string) {
    return prisma.product.update({
      where: { id },
      data: { isActive: true },
    });
  },

  async getTransactions(productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      return null;
    }

    return prisma.stockTransaction.findMany({
      where: { productId },
      include: {
        user: {
          select: { name: true },
        },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
  },
};
