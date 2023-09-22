import { PrismaClient } from "@prisma/client";
import * as data from "./data.js";

let prisma = new PrismaClient();

await prisma.$disconnect();
