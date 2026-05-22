import { test, expect } from '@playwright/test';
import { CalculatorPage } from '../helpers/calculator.page';
import { RentVsBuy } from '../helpers/test-ids';

test.describe('Rent vs buy calculator', () => {
  test('shows down payment and closing costs on default load', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await page.goto('/rent-vs-buy');

    await expect(calc.get(RentVsBuy.results)).toContainText('€50,000');
    await expect(calc.get(RentVsBuy.verdict)).toBeVisible();
  });
});
