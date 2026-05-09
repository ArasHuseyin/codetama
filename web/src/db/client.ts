import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL ?? "postgres://build:build@localhost:5432/build";
const client = postgres(url, { prepare: false, max: 1, onnotice: () => {} });
export const db = drizzle(client, { schema });
export { schema };
