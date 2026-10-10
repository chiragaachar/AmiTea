import { test, expect } from "@playwright/test";
test("public navigation, accessible content, no horizontal overflow", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/amiTea/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Your campus. Your stories.",
  );
  if (isMobile) {
    const nav = page.getByRole("navigation", { name: "Mobile navigation" });
    await expect(nav).toBeVisible();
    await nav.getByRole("link", { name: "Polls", exact: true }).click();
  } else
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Campus polls" })
      .click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "campus saying",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.goto("/suggestions");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Make campus",
  );
  await page.goto("/rules");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "respectful",
  );
});
test("private and administrative routes require authentication", async ({
  page,
}) => {
  for (const path of [
    "/saved",
    "/activity",
    "/settings",
    "/admin",
    "/admin/reports",
    "/admin/posts",
    "/admin/users",
    "/admin/audit",
  ]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login\?next=/);
  }
});
test("unknown posts and pages return branded 404", async ({ page }) => {
  await page.goto("/post/not-a-uuid");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "tea has gone cold",
  );
  await page.goto("/missing");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "tea has gone cold",
  );
});
test("username/password sign-in has no email controls and supports keyboard navigation", async ({
  page,
}) => {
  await page.goto("/login");
  await expect(page.locator('input[type="email"]')).toHaveCount(0);
  await page.getByLabel("Username", { exact: true }).fill("invalid@email");
  await page
    .getByLabel("Password", { exact: true })
    .fill("a long private passphrase");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page.getByLabel("Username", { exact: true })).toBeFocused();
  await page.getByLabel("Username", { exact: true }).fill("campus_owl");
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Password", { exact: true })).toBeFocused();
  await page.goto("/signup");
  await expect(
    page.getByLabel("Confirm password", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("No email required.", { exact: false }),
  ).toBeVisible();
});
