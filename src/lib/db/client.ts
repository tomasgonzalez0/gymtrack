import "server-only";
import { neon } from "@neondatabase/serverless"; import { PGlite } from "@electric-sql/pglite"; import { drizzle as drizzleNeon } from "drizzle-orm/neon-http"; import { drizzle as drizzlePglite } from "drizzle-orm/pglite"; import * as schema from "./schema";
const createNeonDb=(url:string)=>drizzleNeon(neon(url),{schema});export type Database=ReturnType<typeof createNeonDb>;let localDb:Database|undefined;
export function createDb(url=process.env.DATABASE_URL){if(process.env.E2E_TEST_MODE==="true"&&!process.env.VERCEL){if(!localDb)localDb=drizzlePglite(new PGlite(".pglite-e2e"),{schema})as unknown as Database;return localDb}if(!url)throw new Error("DATABASE_URL no está configurada");return createNeonDb(url)}
