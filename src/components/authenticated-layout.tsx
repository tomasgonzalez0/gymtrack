import { requireUser } from "@/lib/auth/authorization";
export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) { await requireUser(); return children; }
