import { Prisma } from "@prisma/client";
import type { Request, Response } from "express";
import { productService, type ProductInput } from "./product.service";

function fail(res: Response, status: number, message: string) {
  return res.status(status).json({ success: false, message });
}

function routeParam(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() ?? "";
}

function handleError(res: Response, error: unknown, message: string) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025" || error.code === "P2023") {
      return fail(res, 404, "Product not found");
    }

    if (error.code === "P2002") {
      const target = Array.isArray(error.meta?.target)
        ? error.meta.target.join(" ")
        : String(error.meta?.target ?? "");

      if (target.includes("barcode")) {
        return fail(res, 409, "Barcode already exists");
      }

      if (target.includes("sku")) {
        return fail(res, 409, "SKU already exists");
      }

      return fail(res, 409, "Product already exists");
    }
  }

  console.error(error);
  return fail(res, 500, message);
}

function readBody(body: unknown) {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }

  return body as Record<string, unknown>;
}

function readOptionalText(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return "invalid" as const;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function readOptionalCount(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    return "invalid" as const;
  }

  return value;
}

function readOptionalPrice(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return "invalid" as const;
  }

  return value;
}

function parseProductInput(body: unknown, mode: "create" | "update") {
  const input = readBody(body);

  if (!input) {
    return { error: "Invalid request body" };
  }

  const name = readOptionalText(input.name);
  const sku = readOptionalText(input.sku);
  const barcode = readOptionalText(input.barcode);
  const description = readOptionalText(input.description);
  const quantity = readOptionalCount(input.quantity);
  const minStock = readOptionalCount(input.minStock);
  const price = readOptionalPrice(input.price);

  if (
    name === "invalid" ||
    sku === "invalid" ||
    barcode === "invalid" ||
    description === "invalid" ||
    quantity === "invalid" ||
    minStock === "invalid" ||
    price === "invalid"
  ) {
    return { error: "Invalid product fields" };
  }

  if (mode === "create" && (!name || !sku)) {
    return { error: "Name and SKU are required" };
  }

  const data: Partial<ProductInput> = {};

  if (name) data.name = name;
  if (sku) data.sku = sku;
  if (barcode !== undefined) data.barcode = barcode;
  if (description !== undefined) data.description = description;
  if (quantity !== undefined) data.quantity = quantity;
  if (minStock !== undefined) data.minStock = minStock;
  if (price !== undefined) data.price = price;

  if (mode === "update" && input.name !== undefined && !name) {
    return { error: "Name cannot be empty" };
  }

  if (mode === "update" && input.sku !== undefined && !sku) {
    return { error: "SKU cannot be empty" };
  }

  if (mode === "update" && Object.keys(data).length === 0) {
    return { error: "No product fields to update" };
  }

  return { data };
}

export const productController = {
  async getAll(_req: Request, res: Response) {
    try {
      const products = await productService.getAllProducts();

      return res.status(200).json({
        success: true,
        data: products,
      });
    } catch (error) {
      return handleError(res, error, "Failed to fetch products");
    }
  },

  async getStats(_req: Request, res: Response) {
    try {
      const stats = await productService.getStats();

      return res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      return handleError(res, error, "Failed to fetch product stats");
    }
  },

  async getLowStock(_req: Request, res: Response) {
    try {
      const products = await productService.getLowStock();

      return res.status(200).json({
        success: true,
        data: products,
      });
    } catch (error) {
      return handleError(res, error, "Failed to fetch low stock products");
    }
  },

  async getOutOfStock(_req: Request, res: Response) {
    try {
      const products = await productService.getOutOfStock();

      return res.status(200).json({
        success: true,
        data: products,
      });
    } catch (error) {
      return handleError(res, error, "Failed to fetch out of stock products");
    }
  },

  async getByBarcode(req: Request, res: Response) {
    try {
      const barcode = routeParam(req.params.barcode);

      if (!barcode) {
        return fail(res, 400, "Barcode is required");
      }

      const product = await productService.getByBarcode(barcode);

      if (!product) {
        return fail(res, 404, "Product not found");
      }

      return res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      return handleError(res, error, "Failed to fetch product");
    }
  },

  async getBySku(req: Request, res: Response) {
    try {
      const sku = routeParam(req.params.sku);

      if (!sku) {
        return fail(res, 400, "SKU is required");
      }

      const product = await productService.getBySku(sku);

      if (!product) {
        return fail(res, 404, "Product not found");
      }

      return res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      return handleError(res, error, "Failed to fetch product");
    }
  },

  async create(req: Request, res: Response) {
    const parsed = parseProductInput(req.body, "create");

    if (parsed.error || !parsed.data?.name || !parsed.data.sku) {
      return fail(res, 400, parsed.error ?? "Name and SKU are required");
    }

    try {
      const product = await productService.create({
        name: parsed.data.name,
        sku: parsed.data.sku,
        barcode: parsed.data.barcode,
        description: parsed.data.description,
        quantity: parsed.data.quantity,
        minStock: parsed.data.minStock,
        price: parsed.data.price,
      });

      return res.status(201).json({
        success: true,
        data: product,
      });
    } catch (error) {
      return handleError(res, error, "Failed to create product");
    }
  },

  async getById(req: Request, res: Response) {
    const id = routeParam(req.params.id);

    if (!id) {
      return fail(res, 400, "Product id is required");
    }

    try {
      const product = await productService.getById(id);

      if (!product) {
        return fail(res, 404, "Product not found");
      }

      return res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      return handleError(res, error, "Failed to fetch product");
    }
  },

  async update(req: Request, res: Response) {
    const id = routeParam(req.params.id);
    const parsed = parseProductInput(req.body, "update");

    if (!id) {
      return fail(res, 400, "Product id is required");
    }

    if (parsed.error || !parsed.data) {
      return fail(res, 400, parsed.error ?? "Invalid product fields");
    }

    try {
      const product = await productService.update(id, parsed.data);

      return res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      return handleError(res, error, "Failed to update product");
    }
  },

  async archive(req: Request, res: Response) {
    const id = routeParam(req.params.id);

    if (!id) {
      return fail(res, 400, "Product id is required");
    }

    try {
      const product = await productService.archive(id);

      return res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      return handleError(res, error, "Failed to archive product");
    }
  },

  async restore(req: Request, res: Response) {
    const id = routeParam(req.params.id);

    if (!id) {
      return fail(res, 400, "Product id is required");
    }

    try {
      const product = await productService.restore(id);

      return res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      return handleError(res, error, "Failed to restore product");
    }
  },

  async getTransactions(req: Request, res: Response) {
    const id = routeParam(req.params.id);

    if (!id) {
      return fail(res, 400, "Product id is required");
    }

    try {
      const transactions = await productService.getTransactions(id);

      if (!transactions) {
        return fail(res, 404, "Product not found");
      }

      return res.status(200).json({
        success: true,
        data: transactions,
      });
    } catch (error) {
      return handleError(res, error, "Failed to fetch product transactions");
    }
  },
};
