import express from "express";
import cors from "cors";
import productRoutes from "./modules/products/product.routes";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "K-Warriors API is running",
  });
});

app.use("/api/products", productRoutes);

export default app;
