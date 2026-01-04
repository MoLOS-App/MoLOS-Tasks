import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./server/db/schema/tables";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "path";

/**
 * Creates an in-memory SQLite database for testing the MoLOS-Tasks module with all migrations applied.
 */
export async function createTestDb() {
  const client = new Database(":memory:");
  const db = drizzle(client, { schema });

  // Apply migrations
  const migrationsPath = path.resolve("drizzle");
  migrate(db, { migrationsFolder: migrationsPath });

  return db;
}

/**
 * Helper to create a mock user for testing.
 */
export const createMockUser = (overrides = {}) => ({
  id: "test-user-id",
  email: "test@example.com",
  emailVerified: true,
  name: "Test User",
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});
