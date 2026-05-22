import { test, expect } from '@playwright/test';
import { CalculatorPage } from '../helpers/calculator.page';
import { RentalTax } from '../helpers/test-ids';

test.describe('Rental tax calculator', () => {
  test('syncs annual income from monthly rent', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await page.goto('/rental-tax');

    await page.getByTestId(RentalTax.incomeMonthlyPill).click();
    await calc.fill(RentalTax.inputMonthlyIncome, 900);

    await expect(page.getByTestId(RentalTax.annualIncome)).toContainText('€10,800', { timeout: 5000 });
  });
});
