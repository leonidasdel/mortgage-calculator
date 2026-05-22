import { test, expect } from '@playwright/test';
import { Shell } from './helpers/test-ids';

test.describe('Navigation', () => {
  test('sidebar link navigates to mortgage calculator', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId(Shell.navLink('mortgage')).click();
    await expect(page).toHaveURL(/\/mortgage$/);
    await expect(page.getByTestId('mortgage-page-title')).toContainText('Υπολογισμός Δόσης Δανείου');
  });

  test('home search filters and navigates to salary calculator', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId(Shell.homeSearch).fill('μισθ');
    const salaryCard = page.getByTestId(Shell.homeTool('salary'));
    await expect(salaryCard).toBeVisible();
    await salaryCard.click();
    await expect(page).toHaveURL(/\/salary$/);
    await expect(page.getByTestId('salary-page-title')).toContainText('Υπολογισμός Μισθού');
  });
});
