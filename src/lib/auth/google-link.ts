export type GoogleIdentity = { email: string; sub: string; emailVerified: boolean; name?: string | null; image?: string | null };
export type StoredIdentity = { id: string; email: string; googleSub: string | null; disabled: boolean };
export interface IdentityStore { findByEmail(email: string): Promise<StoredIdentity | null>; link(id: string, input: { sub: string; name?: string | null; image?: string | null }): Promise<void> }
export async function linkGoogleIdentity(store: IdentityStore, input: GoogleIdentity, allowed: Set<string>) {
  const email = input.email.trim().toLowerCase(); const existing = await store.findByEmail(email);
  if (!input.emailVerified || (!allowed.has(email) && !existing) || existing?.disabled) return null;
  if (existing?.googleSub && existing.googleSub !== input.sub) return null;
  if (!existing) return null;
  await store.link(existing.id, { sub: input.sub, name: input.name, image: input.image });
  return existing.id;
}
