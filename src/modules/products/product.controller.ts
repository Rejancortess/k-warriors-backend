import type { Request, Response } from "express";
import { productService } from "./product.service";

export const productController = {
  async getAllProducts(req: Request, res: Response) {
    try {
      const products = await productService.getAllProducts();

      return res.status(200).json({
        success: true,
        data: products,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch products",
      });
    }
  },
};
