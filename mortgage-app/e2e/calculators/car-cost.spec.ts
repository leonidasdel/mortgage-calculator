import { test, expect } from '@playwright/test';
import { CalculatorPage } from '../helpers/calculator.page';
import { CarCost } from '../helpers/test-ids';

test.describe('Car cost calculator', () => {
  test('shows insurance-only total for EV', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await page.goto('/car-cost');

    await calc.get(CarCost.inputIsEv).check();
    await calc.fill(CarCost.inputInsuranceYear, 400);
    await calc.fill(CarCost.inputMaintenanceYear, 300);

    await expect(calc.hero(CarCost.heroTotalAnnual)).toContainText('€700.00', { timeout: 5000 });
  });
});
