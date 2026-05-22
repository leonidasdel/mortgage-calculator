import { test, expect } from '@playwright/test';
import { CalculatorPage } from './helpers/calculator.page';

test.describe('Consumer loan calculator', () => {
  test('shows monthly payment and keeps 48-month pill active', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await page.goto('/consumer-loan');

    const payment = calc.heroValIn('cl-results');
    await expect(payment).toContainText(/€[\d,]+\.\d{2}/);

    const pill48 = page.locator('.cl-pill.active').filter({ hasText: '4 έτη' });
    await expect(pill48).toBeVisible();

    const paymentBefore = await payment.textContent();
    await pill48.click();
    await expect(payment).toHaveText(paymentBefore ?? '');
  });
});
