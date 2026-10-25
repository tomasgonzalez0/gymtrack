import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
const publicPrefixes = ["/login", "/api/auth", "/api/health", "/manifest.webmanifest", "/icons", "/sw.js"];
export default auth((request) => {
  const path = request.nextUrl.pathname;
  if (!request.auth && !publicPrefixes.some((prefix) => path.startsWith(prefix))) {
    const login = new URL("/login", request.nextUrl.origin);
    login.searchParams.set("callbackUrl", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
});
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
