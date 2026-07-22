import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  // Use a placeholder message rather than throwing instantly on import, 
  // ensuring the app can build static files without requiring the database key.
  console.warn("DATABASE_URL is not set. Database connections will fail until configured.");
}

const connectionString = process.env.DATABASE_URL || "";

// Prevents multiple client connections during Next.js hot-reloading in dev mode
const globalForDb = globalThis as unknown as {
  pool: Pool | undefined;
};

const pool = globalForDb.pool ?? new Pool({ connectionString });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool;
}

export const db = drizzle({ client: pool });
export type DbClient = typeof db;
