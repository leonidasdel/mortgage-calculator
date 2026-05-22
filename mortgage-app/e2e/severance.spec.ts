import { test, expect } from '@playwright/test';
import { CalculatorPage } from './helpers/calculator.page';

test.describe('Severance calculator', () => {
  test('calculates tax-free severance for 10 years at 2000 gross', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await page.goto('/severance');

    await calc.fillNumber('grossMonthly', 2000);
    await calc.fillNumber('yearsOfService', 10);
    await calc.fillNumber('monthsExtra', 0);

    await expect(calc.heroValIn('sv-results')).toContainText('€13,999.98', { timeout: 5000 });
  });
});
