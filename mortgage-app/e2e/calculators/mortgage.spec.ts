import { test, expect } from '@playwright/test';
import { CalculatorPage } from '../helpers/calculator.page';
import { Mortgage } from '../helpers/test-ids';

test.describe('Mortgage calculator', () => {
  test('updates monthly payment when loan amount changes', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await page.goto('/mortgage');

    await expect(calc.hero(Mortgage.heroPayment)).toContainText(/€[\d,]+\.\d{2}/);

    const paymentBefore = await calc.hero(Mortgage.heroPayment).textContent();
    await calc.fill(Mortgage.inputLoanAmount, 200_000);
    await calc.fill(Mortgage.inputLoanYears, 20);

    await expect(calc.hero(Mortgage.heroPayment)).not.toHaveText(paymentBefore ?? '');
  });
});
