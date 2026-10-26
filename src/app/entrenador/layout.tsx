import { redirect } from "next/navigation"; import { requireUser } from "@/lib/auth/authorization";
export default async function TrainerLayout({ children }: { children: React.ReactNode }) { const actor=await requireUser();if(actor.role!=="trainer"&&actor.role!=="admin")redirect("/hoy?error=forbidden");return children; }
