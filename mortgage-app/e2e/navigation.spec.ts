import { test, expect } from '@playwright/test';
import { PAGE_TITLE_BY_PATH, Shell, routeToSlug } from './helpers/test-ids';

/** Routes with a sidebar nav-link (not footer-only pages like /privacy). */
const SIDEBAR_NAV_SLUGS = new Set([
  'mortgage',
  'consumer-loan',
  'salary',
  'annual-bonus',
  'holiday-bonus',
  'freelancer',
  'unused-leave',
  'severance',
  'interest',
  'savings',
  'rent-vs-buy',
  'rental-tax',
  'property-purchase',
  'inheritance-gift',
  'crypto-tax',
  'car-cost',
]);

const NAV_ROUTES = Object.entries(PAGE_TITLE_BY_PATH)
  .filter(([path]) => path !== '/' && SIDEBAR_NAV_SLUGS.has(routeToSlug(path)))
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
