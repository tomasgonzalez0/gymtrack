import type { NextConfig } from "next";
const securityHeaders = [
  { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://images.ctfassets.net; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'" },
  { key: "X-Content-Type-Options", value: "nosniff" }, { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }, { key: "X-Frame-Options", value: "DENY" }, { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];
const config: NextConfig = { serverExternalPackages: ["@electric-sql/pglite"], allowedDevOrigins: ["127.0.0.1"], images: { unoptimized: true, remotePatterns: [{ protocol: "https", hostname: "images.ctfassets.net" }] }, async headers() { return [{ source: "/:path*", headers: securityHeaders }]; } };
export default config;
