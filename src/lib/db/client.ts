import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
export function createDb(url=process.env.DATABASE_URL){ if(!url) throw new Error("DATABASE_URL no está configurada"); return drizzle(neon(url),{schema}); }
export type Database=ReturnType<typeof createDb>;
