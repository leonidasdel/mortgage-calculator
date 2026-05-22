import { test, expect } from '@playwright/test';
import { ROUTES } from './helpers/routes';
import { PAGE_TITLE_BY_PATH } from './helpers/test-ids';

for (const route of ROUTES) {
  test(`loads ${route.path}`, async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', err => pageErrors.push(err.message));

    await page.goto(route.path);
    await expect(page).toHaveTitle(route.title);

    const pageTitleTestId = PAGE_TITLE_BY_PATH[route.path];
    await expect(page.getByTestId(pageTitleTestId)).toContainText(route.heading);

    expect(pageErrors, `Unexpected page errors on ${route.path}`).toEqual([]);
  });
}
