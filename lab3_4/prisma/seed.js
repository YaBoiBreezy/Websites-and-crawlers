import { PrismaClient } from "@prisma/client";

let prisma = new PrismaClient();

await prisma.$disconnect();
