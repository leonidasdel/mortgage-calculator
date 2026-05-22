import { test, expect } from '@playwright/test';
import { CalculatorPage } from './helpers/calculator.page';

test.describe('Mortgage calculator', () => {
  test('updates monthly payment when loan amount changes', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await page.goto('/mortgage');

    const paymentBefore = await calc.firstHeroVal().textContent();
    expect(paymentBefore).toMatch(/€/);

    await calc.fillNumber('loanAmount', 200_000);
    await calc.fillNumber('loanYears', 20);

    await expect(calc.firstHeroVal()).not.toHaveText(paymentBefore ?? '');
    await expect(calc.firstHeroVal()).toContainText('€');
  });
});
