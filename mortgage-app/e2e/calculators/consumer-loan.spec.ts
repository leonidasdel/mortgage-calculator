import { test, expect } from '@playwright/test';
import { CalculatorPage } from '../helpers/calculator.page';
import { ConsumerLoan } from '../helpers/test-ids';

test.describe('Consumer loan calculator', () => {
  test('shows monthly payment and keeps 48-month pill active', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await page.goto('/consumer-loan');

    const payment = calc.hero(ConsumerLoan.heroPayment);
    await expect(payment).toContainText(/€[\d,]+\.\d{2}/);

    const pill48 = page.getByTestId(ConsumerLoan.pillMonths(48));
    await expect(pill48).toHaveClass(/active/);

    const paymentBefore = await payment.textContent();
    await pill48.click();
    await expect(payment).toHaveText(paymentBefore ?? '');
  });
});
