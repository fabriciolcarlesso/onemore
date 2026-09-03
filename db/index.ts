import { drizzle } from "drizzle-orm/neon-http";

const databaseUrl = process.env.ONEMORE_DATABASE_URL;

if (!databaseUrl) {
  throw new Error("ONEMORE_DATABASE_URL não definida.");
}

export const db = drizzle(databaseUrl);
