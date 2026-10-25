import type { Metadata } from "next";
import "./globals.css";
import { messages } from "@/messages/es";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
export const metadata: Metadata = { title: { default: messages.brand, template: `%s · ${messages.brand}` }, description: "Tu entrenamiento, claro y medible", manifest: "/manifest.webmanifest" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="es-CO"><body>{children}<ServiceWorkerRegister/></body></html>; }
