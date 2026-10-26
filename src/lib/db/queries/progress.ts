import "server-only";
import { and, asc, eq, gte } from "drizzle-orm";
import type { Actor } from "@/lib/auth/policy"; import type { Database } from "@/lib/db/client"; import { sessionExercises, setLogs, workoutSessions } from "@/lib/db/schema"; import { sessionMetrics } from "@/lib/progression/metrics";
export type ProgressRange="4w"|"3m"|"6m"|"all";
export async function getProgress(db:Database,actor:Actor,exerciseId:string,range:ProgressRange){
  const since=range==="all"?new Date(0):new Date(Date.now()-({"4w":28,"3m":92,"6m":184}[range])*86_400_000);
  const rows=await db.select({sessionId:workoutSessions.id,date:workoutSessions.finishedAt,weight:setLogs.weightKg,reps:setLogs.reps,warmup:setLogs.isWarmup}).from(workoutSessions).innerJoin(sessionExercises,eq(sessionExercises.sessionId,workoutSessions.id)).innerJoin(setLogs,eq(setLogs.sessionExerciseId,sessionExercises.id)).where(and(eq(workoutSessions.athleteId,actor.id),eq(workoutSessions.status,"completed"),eq(sessionExercises.exerciseId,exerciseId),gte(workoutSessions.finishedAt,since))).orderBy(asc(workoutSessions.finishedAt));
  const grouped=new Map<string,typeof rows>();for(const row of rows){const items=grouped.get(row.sessionId)??[];items.push(row);grouped.set(row.sessionId,items)}
  return [...grouped.values()].map((items)=>({date:items[0]?.date?.toISOString()??"",...sessionMetrics(items.map((item)=>({weightKg:Number(item.weight),reps:item.reps,isWarmup:item.warmup})))}));
}
