import "server-only";
import { count, eq } from "drizzle-orm";
import type { Actor } from "@/lib/auth/policy"; import { AuthorizationError } from "@/lib/auth/authorization"; import { canManageExercise } from "@/lib/auth/policy"; import type { Database } from "@/lib/db/client"; import { exerciseMedia, exercises } from "@/lib/db/schema"; import type { AssetStore } from "./asset-store"; import { validateMedia } from "./media-validation";
export async function uploadExerciseMedia(db:Database,store:AssetStore,actor:Actor,input:{exerciseId:string;bytes:Uint8Array;declaredType:string;fileName:string;alt:string}){
  const[exercise]=await db.select().from(exercises).where(eq(exercises.id,input.exerciseId));
  if(!exercise||exercise.archivedAt||!canManageExercise(actor,exercise.createdBy))throw new AuthorizationError("FORBIDDEN");
  const[{value}]=await db.select({value:count()}).from(exerciseMedia).where(eq(exerciseMedia.exerciseId,input.exerciseId));
  const meta=validateMedia({bytes:input.bytes,declaredType:input.declaredType,currentCount:value,fileName:input.fileName});
  const asset=await store.upload({bytes:input.bytes,fileName:input.fileName,contentType:meta.type,title:`${exercise.name} ${crypto.randomUUID()}`});
  try{const[row]=await db.insert(exerciseMedia).values({exerciseId:exercise.id,kind:meta.kind,url:asset.url,contentfulAssetId:asset.id,width:asset.width||meta.width,height:asset.height||meta.height,sizeBytes:meta.sizeBytes,alt:input.alt.trim()||exercise.name,position:value}).returning();return row}catch(error){await store.delete(asset.id).catch(()=>undefined);throw error}
}
