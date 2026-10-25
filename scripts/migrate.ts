import { migrate } from "drizzle-orm/neon-http/migrator"; import { createDb } from "../src/lib/db/client";
await migrate(createDb(process.env.DATABASE_URL_UNPOOLED),{migrationsFolder:"drizzle"}); console.log("Migraciones aplicadas.");
