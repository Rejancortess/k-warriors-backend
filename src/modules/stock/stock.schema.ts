import { z } from "zod";

export const stockMovementSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  remarks: z.string().trim().max(500).optional(),
});

export type StockMovementInput = z.infer<typeof stockMovementSchema>;
