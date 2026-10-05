import { PrismaClient, type Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

type PgConfig = ConstructorParameters<typeof PrismaPg>[0];
type Adapter = NonNullable<Prisma.PrismaClientOptions["adapter"]>;

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

/**
 * `next build` imports every route, and with it this file, on machines that have no database settings (CI, a
 * preview deployment that was not given them). So nothing may be read, checked or opened while the client is
 * being created: the first query does that, and fails with a plain message if DATABASE_URL is missing.
 * Prisma 5 behaved the same way, and the build relies on it.
 */
function lazyAdapter(connectionString: string | undefined): Adapter {
  let pg: PrismaPg | undefined;
  return {
    provider: "postgres",
    adapterName: "@prisma/adapter-pg",
    async connect() {
      const url = connectionString ?? process.env.DATABASE_URL;
      if (!url) throw new Error("DATABASE_URL is not set. Add it to .env.local, or to the environment variables of the host.");
      pg ??= new PrismaPg(pgConfig(url));
      return pg.connect();
    },
  };
}

export function createPrismaClient(
  options: Omit<Prisma.PrismaClientOptions, "adapter" | "accelerateUrl"> = {},
  connectionString?: string,
) {
  return new PrismaClient({ ...options, adapter: lazyAdapter(connectionString) });
}
