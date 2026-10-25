export {};
const base = process.argv[2];
if (!base) throw new Error("Uso: npm run smoke:prod -- https://app.vercel.app");
const health = await fetch(new URL("/api/health", base));
if (!health.ok) throw new Error(`Health falló: ${health.status}`);
const data = await health.json() as { status: string; db: string };
if (data.status !== "ok" || data.db !== "ok") throw new Error("Health no reportó DB OK");
for (const path of ["/login", "/manifest.webmanifest"]) { const response = await fetch(new URL(path, base)); if (!response.ok) throw new Error(`${path} falló: ${response.status}`); }
const providersResponse = await fetch(new URL("/api/auth/providers", base));
const providers = await providersResponse.json() as Record<string, unknown>;
if (Object.keys(providers).some((name) => name !== "google")) throw new Error("Producción expone un proveedor no permitido");
console.log("Smoke de producción OK");
