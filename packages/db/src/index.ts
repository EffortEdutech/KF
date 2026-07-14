export type DbHealth = {
  status: "not_configured" | "ready";
  provider: "postgresql";
};

export function getDbHealth(): DbHealth {
  return {
    status: process.env.DATABASE_URL ? "ready" : "not_configured",
    provider: "postgresql"
  };
}
