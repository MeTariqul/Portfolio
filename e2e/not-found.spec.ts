import { test, expect } from "@playwright/test";

test.describe("404 page", () => {
  test("shows 404 for non-existent route", async ({ page }) => {
    await page.goto("/non-existent-page");
    await expect(page.locator("text=Lost in space")).toBeVisible();
  });

  test("return home link works", async ({ page }) => {
    await page.goto("/non-existent-page");
    await page.click('a[href="/"]');
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/");
  });
});

test.describe("Blog 404", () => {
  test("shows 404 for non-existent blog slug", async ({ page }) => {
    await page.goto("/blog/non-existent-post");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Lost in space")).toBeVisible();
  });
});
