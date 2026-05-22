import { test, expect } from '@playwright/test';
import { ROUTES } from './helpers/routes';

for (const route of ROUTES) {
  test(`loads ${route.path}`, async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', err => pageErrors.push(err.message));

    await page.goto(route.path);
    await expect(page).toHaveTitle(route.title);

    const headingSelector = route.headingSelector ?? 'h1.page-title';
    await expect(page.locator(headingSelector)).toContainText(route.heading);

    expect(pageErrors, `Unexpected page errors on ${route.path}`).toEqual([]);
  });
}
