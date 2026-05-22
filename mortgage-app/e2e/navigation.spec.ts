import { test, expect } from '@playwright/test';
import { PAGE_TITLE_BY_PATH, Shell, routeToSlug } from './helpers/test-ids';

const NAV_ROUTES = Object.entries(PAGE_TITLE_BY_PATH)
  .filter(([path]) => path !== '/')
  .map(([path, pageTitleTestId]) => ({
    slug: routeToSlug(path),
    path,
    pageTitleTestId,
  }));

test.describe('Full navigation matrix', () => {
  for (const { slug, path, pageTitleTestId } of NAV_ROUTES) {
    test(`nav-link-${slug} navigates to ${path}`, async ({ page }) => {
      await page.goto('/');
      await page.getByTestId(Shell.navLink(slug)).click();
      await expect(page).toHaveURL(new RegExp(`${path.replace('/', '\\/')}$`));
      await expect(page.getByTestId(pageTitleTestId)).toBeVisible();
    });
  }
});
