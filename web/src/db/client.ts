import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL ?? "postgres://build:build@localhost:5432/build";
// Default to a single connection (safe for serverless, where every invocation
// gets its own client). Set DATABASE_POOL_MAX on a long-lived/pooled host to
// allow concurrent queries.
const poolMax = Number(process.env.DATABASE_POOL_MAX) || 1;
const client = postgres(url, { prepare: false, max: poolMax, onnotice: () => {} });
export const db = drizzle(client, { schema });
export { schema };
