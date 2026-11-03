import { Prisma, TransactionType } from "@prisma/client";

import { prisma } from "../../lib/prisma";
import type { StockMovementInput } from "./stock.schema";

export class StockError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "StockError";
  }
}

export const stockService = {
  async processMovement(
    data: StockMovementInput,
    userId: string,
    type: TransactionType,
  ) {
    const { productId, quantity, remarks } = data;

    // Retry a limited number of times if a
    // concurrent transaction causes a conflict.
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await prisma.$transaction(
          async (tx) => {
            // 1. Find the product
            const product = await tx.product.findUnique({
              where: { id: productId },
            });

            if (!product || !product.isActive) {
              throw new StockError("Product not found or archived", 404);
            }

            // 2. Validate stock availability
            if (
              type === TransactionType.STOCK_OUT &&
              product.quantity < quantity
            ) {
              throw new StockError("Insufficient stock", 400);
            }

            const previousStock = product.quantity;

            // 3. Calculate the new quantity
            const newStock =
              type === TransactionType.STOCK_IN
                ? previousStock + quantity
                : previousStock - quantity;

            // 4. Update only if the quantity
            // has not changed since we read it.
            const updated = await tx.product.updateMany({
              where: {
                id: productId,
                isActive: true,
                quantity: previousStock,
              },
              data: {
                quantity: newStock,
              },
            });

            if (updated.count !== 1) {
              throw new StockError("Stock changed. Please retry.", 409);
            }

            // 5. Save the transaction history
            const transaction = await tx.stockTransaction.create({
              data: {
                productId,
                userId,
                type,
                quantity,
                previousStock,
                newStock,
                remarks,
              },
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    sku: true,
                    barcode: true,
                  },
                },
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            });

            return transaction;
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          },
        );
      } catch (error) {
        // Prisma may report a serialization conflict.
        // Retry the complete transaction.
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2034" &&
          attempt < 2
        ) {
          continue;
        }

        throw error;
      }
    }

    throw new StockError("Unable to process stock movement", 409);
  },

  async stockIn(data: StockMovementInput, userId: string) {
    return this.processMovement(data, userId, TransactionType.STOCK_IN);
  },

  async stockOut(data: StockMovementInput, userId: string) {
    return this.processMovement(data, userId, TransactionType.STOCK_OUT);
  },
};
