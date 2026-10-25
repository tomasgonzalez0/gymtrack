import { expect, test } from "@playwright/test";
test("la aplicación responde sin desbordamiento horizontal", async ({page})=>{ await page.goto("/login"); await expect(page.locator("body")).toBeVisible(); const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth); expect(overflow).toBe(false); });
