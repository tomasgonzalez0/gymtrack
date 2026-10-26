"use server";
import { revalidatePath } from "next/cache"; import { redirect } from "next/navigation"; import { requireUser } from "@/lib/auth/authorization"; import { createDb } from "@/lib/db/client"; import { startSession } from "@/lib/db/queries/sessions"; import { resolveSuggestion } from "@/lib/db/queries/suggestions";
export async function startSessionAction(form:FormData){const actor=await requireUser();const id=await startSession(createDb(),actor,String(form.get("dayId")||"")||undefined);redirect(`/sesion/${id}`)}
export async function resolveSuggestionAction(form:FormData){const actor=await requireUser();await resolveSuggestion(createDb(),actor,String(form.get("id")),form.get("status")==="accepted"?"accepted":"dismissed");revalidatePath("/hoy")}
