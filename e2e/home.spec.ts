import { test, expect } from "@playwright/test";

test.describe("Home page", () => {
  test("loads successfully", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Md\. Tariqul Islam/);
  });

  test("hero section renders", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=Hello, I'm")).toBeVisible();
    await expect(page.getByText("Md. Tariqul Islam", { exact: true }).first()).toBeVisible();
  });

  test("no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    expect(errors).toHaveLength(0);
  });
});

test.describe("Navigation", () => {
  test("scrolls to about section", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);
    await page.evaluate(() => {
      document.getElementById("about")?.scrollIntoView({ behavior: "instant" });
    });
    await page.waitForTimeout(500);
    const aboutSection = page.locator("#about");
    await expect(aboutSection).toBeInViewport();
  });

  test("scrolls to projects section", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);
    await page.evaluate(() => {
      document.getElementById("projects")?.scrollIntoView({ behavior: "instant" });
    });
    await page.waitForTimeout(500);
    const projectsSection = page.locator("#projects");
    await expect(projectsSection).toBeInViewport();
  });
});

test.describe("Contact form", () => {
  test("shows validation errors for empty submission", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);
    await page.evaluate(() => {
      document.getElementById("contact")?.scrollIntoView({ behavior: "instant" });
    });
    await page.waitForTimeout(1000);
    await page.click('button[type="submit"]');
    await expect(page.locator("text=Please tell me your name")).toBeVisible();
    await expect(page.locator("text=Enter a valid email address")).toBeVisible();
    await expect(page.locator("text=Message must be at least 10 characters")).toBeVisible();
  });

  test("shows validation error for invalid email", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);
    await page.evaluate(() => {
      document.getElementById("contact")?.scrollIntoView({ behavior: "instant" });
    });
    await page.waitForTimeout(1000);
    await page.fill('input[name="name"]', "John Doe");
    await page.fill('input[name="email"]', "not-an-email");
    await page.fill('textarea[name="message"]', "Hello, I have a project inquiry.");
    await page.click('button[type="submit"]');
    await expect(page.locator("text=Enter a valid email address")).toBeVisible();
  });

  test("submits successfully with valid data", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);
    await page.evaluate(() => {
      document.getElementById("contact")?.scrollIntoView({ behavior: "instant" });
    });
    await page.waitForTimeout(1000);
    await page.fill('input[name="name"]', "Test User");
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('textarea[name="message"]', "This is a test message from Playwright.");
    await page.click('button[type="submit"]');
    await expect(page.locator("text=Message received!")).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Blog", () => {
  test("blog page loads", async ({ page }) => {
    await page.goto("/en/blog");
    await expect(page.locator("text=Notes from the lab")).toBeVisible();
  });
});

test.describe("Mobile viewport", () => {
  test("no horizontal scroll at 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const innerWidth = await page.evaluate(() => window.innerWidth);
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
  });
});
