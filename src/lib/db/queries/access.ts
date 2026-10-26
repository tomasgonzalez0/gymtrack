import "server-only";
import { eq } from "drizzle-orm";
import { AuthorizationError, assertCanAccessAthlete } from "@/lib/auth/authorization";
import type { Actor } from "@/lib/auth/policy";
import { createDb } from "@/lib/db/client";
import { workoutSessions } from "@/lib/db/schema";
export async function assertCanReadSession(actor: Actor, sessionId: string) { const [row] = await createDb().select({ athleteId: workoutSessions.athleteId }).from(workoutSessions).where(eq(workoutSessions.id, sessionId)); if (!row) throw new AuthorizationError("FORBIDDEN"); await assertCanAccessAthlete(actor, row.athleteId); return row; }
export async function assertCanWriteSession(actor: Actor, sessionId: string) { const row = await assertCanReadSession(actor, sessionId); if (actor.id !== row.athleteId) throw new AuthorizationError("FORBIDDEN"); return row; }
