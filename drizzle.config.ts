// drizzle.config.ts
import { defineConfig } from "drizzle-kit"

// Next.js auto-loads .env.local at runtime, but the drizzle-kit CLI does not —
// pull it in so DATABASE_URL is available for generate/migrate.
if (!process.env.DATABASE_URL) {
  try {
    process.loadEnvFile(".env.local")
  } catch {
    // No .env.local (e.g. CI) — fall back to whatever's already in the env.
  }
}

export default defineConfig({
  schema: "./lib/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})