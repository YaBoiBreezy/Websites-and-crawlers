import { PrismaClient } from "@prisma/client";
import products from "./products.js";

let prisma = new PrismaClient();

try {
  for (let { dimensions, ...product } of products) {
    await prisma.product.create({
      data: {
        ...product,
        dimensions: { create: dimensions },
      },
    });
  }
} catch (error) {
  console.error(error);
} finally {
  await prisma.$disconnect();
}
