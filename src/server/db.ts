import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalDatabase = globalThis as unknown as { madinumDatabase?: PrismaClient };

export const db = globalDatabase.madinumDatabase ?? new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 10 }),
});

if (process.env.NODE_ENV !== "production") globalDatabase.madinumDatabase = db;
