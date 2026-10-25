import { createDb } from "../src/lib/db/client"; import { seedDatabase } from "../src/lib/db/seed";
await seedDatabase(createDb(process.env.DATABASE_URL_UNPOOLED)); console.log("Seed aplicado.");
