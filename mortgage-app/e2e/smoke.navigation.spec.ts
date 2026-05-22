import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('sidebar link navigates to mortgage calculator', async ({ page }) => {
    await page.goto('/');
    await page.locator('a.nav-link[href="/mortgage"]').click();
    await expect(page).toHaveURL(/\/mortgage$/);
    await expect(page.locator('h1.page-title')).toContainText('Υπολογισμός Δόσης Δανείου');
  });

  test('home search filters and navigates to salary calculator', async ({ page }) => {
    await page.goto('/');
    await page.locator('.home-search').fill('μισθ');
    const salaryCard = page.locator('a.tool-card').filter({ hasText: 'Υπολογισμός Μισθού' });
    await expect(salaryCard).toBeVisible();
    await salaryCard.click();
    await expect(page).toHaveURL(/\/salary$/);
    await expect(page.locator('h1.page-title')).toContainText('Υπολογισμός Μισθού');
  });
});
