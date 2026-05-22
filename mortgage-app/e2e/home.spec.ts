import { test, expect } from '@playwright/test';
import { Shell } from './helpers/test-ids';

test.describe('Home page', () => {
  test('shows title, tool cards, and law footer', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByTestId(Shell.homeTitle)).toContainText('Salaries.gr');
    await expect(page.getByTestId(Shell.lawFooter)).toBeVisible();

    const toolCards = page.locator('[data-testid^="home-tool-"]');
    expect(await toolCards.count()).toBeGreaterThanOrEqual(16);
  });

  test('search filters tool cards by keyword', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId(Shell.homeSearch).fill('κρυπτο');

    await expect(page.getByTestId(Shell.homeTool('crypto-tax'))).toBeVisible();
    await expect(page.getByTestId(Shell.homeTool('mortgage'))).toHaveCount(0);
  });
});
