import { z } from "zod";
const schema = z.object({
  DATABASE_URL: z.string().url().optional(), AUTH_SECRET: z.string().min(16).optional(), AUTH_GOOGLE_ID: z.string().optional(), AUTH_GOOGLE_SECRET: z.string().optional(),
  ALLOWED_EMAILS: z.string().default("tomasgz2006@gmail.com,ivannacc07@gmail.com"), CONTENTFUL_SPACE_ID: z.string().optional(), CONTENTFUL_ENVIRONMENT: z.string().default("master"), CONTENTFUL_MANAGEMENT_TOKEN: z.string().optional(),
  E2E_TEST_MODE: z.enum(["true", "false"]).optional(), VERCEL: z.string().optional(),
});
export type ServerEnv = z.infer<typeof schema>;
export function parseEnv(input: Record<string, string | undefined>): ServerEnv { const env = schema.parse(input); if (env.VERCEL && env.E2E_TEST_MODE === "true") throw new Error("E2E_TEST_MODE está prohibido en Vercel"); return env; }
export const allowedEmails = (env: ServerEnv) => new Set(env.ALLOWED_EMAILS.split(",").map((v) => v.trim().toLowerCase()).filter(Boolean));
