import "./envConfig";
import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.ONEMORE_DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "ONEMORE_DATABASE_URL não definida. Sincronize as variáveis da Vercel antes de acessar o banco.",
  );
}

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
  strict: true,
  verbose: true,
});
