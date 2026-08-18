import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";
import { getServerEnv } from "@/lib/env";

const globalForDatabase = globalThis as typeof globalThis & {
  landoPrisma?: PrismaClient;
};

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: getServerEnv().DATABASE_URL,
  });

  return new PrismaClient({ adapter });
}

export const db = globalForDatabase.landoPrisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForDatabase.landoPrisma = db;
}

export { db as prisma };
