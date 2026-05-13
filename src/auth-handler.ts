import type { Page } from "playwright";
import type { LoginConfig } from "./audit-config.js";

export async function performLogin(page: Page, baseUrl: string, login: LoginConfig): Promise<void> {
  const loginPath = login.route.startsWith("/") ? login.route : `/${login.route}`;
  const expected = `${baseUrl.replace(/\/$/, "")}${loginPath}`;

  const current = new URL(page.url());
  const normalizedCurrent = `${current.origin}${current.pathname}`;
  if (normalizedCurrent !== expected) {
    await page.goto(expected, { waitUntil: "domcontentloaded", timeout: 60_000 });
  }

  await page.locator(login.usernameSelector).fill(login.username);
  await page.locator(login.passwordSelector).fill(login.password);

  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 30_000 }).catch(() => undefined),
    page.locator(login.submitSelector).click()
  ]);
}
