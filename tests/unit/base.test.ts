import { describe, expect, it } from "vitest";
import { messages } from "@/messages/es";
import { allowedEmails, parseEnv } from "@/lib/env";
import { fail } from "@/lib/result";
describe("contratos base",()=>{ it("centraliza copy y errores",()=>{expect(messages.brand).toBe("GymTrack");expect(fail("X","Error")).toEqual({ok:false,code:"X",message_es:"Error"})}); it("normaliza allowlist",()=>{expect(allowedEmails(parseEnv({ALLOWED_EMAILS:"A@B.COM"})).has("a@b.com")).toBe(true)}); it("prohíbe login E2E en Vercel",()=>{expect(()=>parseEnv({VERCEL:"1",E2E_TEST_MODE:"true"})).toThrow()})});
