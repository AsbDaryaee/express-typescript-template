import { Pool } from "pg";
import { config } from "../config";

const testConnection = async () => {
  const pool = new Pool({
    connectionString: config.DATABASE_URL,
  });

  try {
    const client = await pool.connect();
    console.log("Database connection successful!");

    const result = await client.query("SELECT version()");
    console.log("PostgreSQL version:", result.rows[0].version);

    client.release();
  } catch (error) {
    console.error("Database connection failed:", error);
  } finally {
    await pool.end();
  }
};

testConnection();
