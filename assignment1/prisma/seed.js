import { PrismaClient } from "@prisma/client";
import * as data from "./data.js";

let prisma = new PrismaClient();

try {
  for (let customer of data.customers) {
    await prisma.customer.create({
      data: customer,
    });
  }

  for (let { dimensions, ...product } of data.products) {
    await prisma.product.create({
      data: {
        ...product,
        dimensionX: dimensions.x,
        dimensionY: dimensions.y,
        dimensionZ: dimensions.z,
      },
    });
  }
} catch (error) {
  console.error(error);
} finally {
  await prisma.$disconnect();
}
