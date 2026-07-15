import { PrismaClient } from "@prisma/client";

export type DbHealth = {
  status: "not_configured" | "ready";
  provider: "postgresql";
};

declare global {
  var kfPrismaClient: PrismaClient | undefined;
}

export function getPrismaClient() {
  globalThis.kfPrismaClient ??= new PrismaClient();
  return globalThis.kfPrismaClient;
}

export function getDbHealth(): DbHealth {
  return {
    status: process.env.DATABASE_URL ? "ready" : "not_configured",
    provider: "postgresql"
  };
}
