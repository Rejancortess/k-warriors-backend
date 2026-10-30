import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create a test product if it doesn't exist
  const product = await prisma.product.upsert({
    where: {
      sku: "KW-TEST-001",
    },
    update: {},
    create: {
      name: "Karate Uniform",
      sku: "KW-TEST-001",
      barcode: "4801234567890",
      quantity: 20,
      minStock: 5,
      price: 1500,
    },
  });

  console.log("Product saved:", product);

  // Retrieve all products
  const products = await prisma.product.findMany();

  console.log("All products:", products);
}

main()
  .catch((error) => {
    console.error("Database test failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
