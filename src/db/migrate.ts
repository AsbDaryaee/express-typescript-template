import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { config } from "../config";

const runMigrations = async () => {
  const pool = new Pool({
    connectionString: config.DATABASE_URL,
  });

  const db = drizzle(pool);

  try {
    console.log("Running migrations...");
    await migrate(db, { migrationsFolder: "./src/db/migrations" });
    console.log("Migrations completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

runMigrations();
