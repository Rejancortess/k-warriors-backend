import express from "express";
import cors from "cors";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";
import authRoutes from "./modules/auth/auth.routes";
import productRoutes from "./modules/products/product.routes";
import transactionRoutes from "./modules/transactions/transaction.routes";
import stockRoutes from "./modules/stock/stock.routes";
import userRoutes from "./modules/users/user.routes";

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://k-warriors-inventory.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());

app.get("/api/k-warriors", (_req, res) => {
  res.json({
    success: true,
    message: "K-Warriors API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);

export default app;
