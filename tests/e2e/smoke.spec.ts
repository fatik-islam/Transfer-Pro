import { expect, test } from "@playwright/test";

test("home page presents the primary booking experience", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Private journeys, personally driven." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Lock fare" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Book now" }).first()).toBeVisible();
});

test("sign-in page does not expose demo credentials", async ({ page }) => {
  await page.goto("/sign-in");
  await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
  await expect(page.getByText(/demo password/i)).toHaveCount(0);
});
