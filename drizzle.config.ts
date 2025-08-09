import type { Config } from "drizzle-kit";
import { config } from "./src/config";

export default {
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    connectionString: config.DATABASE_URL,
  },
} satisfies Config;
