import { PrismaClient, type Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

type PgConfig = ConstructorParameters<typeof PrismaPg>[0];

/**
 * The schema uses `engineType = "client"`, so Prisma runs queries through the `pg` driver instead of a
 * native query engine (which Windows Smart App Control blocks). `pg` doesn't understand the Prisma-only
 * URL params from `.env.example` (`pgbouncer=true`, `connection_limit=N`), so strip them and map
 * `connection_limit` onto the pool size.
 */
function pgConfig(connectionString: string): PgConfig {
  const url = new URL(connectionString);
  const limit = Number(url.searchParams.get("connection_limit"));
  url.searchParams.delete("pgbouncer");
  url.searchParams.delete("connection_limit");
  return { connectionString: url.toString(), ...(limit > 0 ? { max: limit } : {}) };
}

export function createPrismaClient(
  options: Omit<Prisma.PrismaClientOptions, "adapter" | "accelerateUrl"> = {},
  connectionString = process.env.DATABASE_URL,
) {
  if (!connectionString) throw new Error("DATABASE_URL is not set.");
  return new PrismaClient({ ...options, adapter: new PrismaPg(pgConfig(connectionString)) });
}
