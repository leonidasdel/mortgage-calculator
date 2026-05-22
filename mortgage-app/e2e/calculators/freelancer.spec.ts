import { test, expect } from '@playwright/test';
import { CalculatorPage } from '../helpers/calculator.page';
import { golden } from '../helpers/golden';
import { formatEuro } from '../helpers/money';
import { Freelancer } from '../helpers/test-ids';

test.describe('Freelancer calculator', () => {
  test('updates net monthly when revenue changes', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await page.goto('/freelancer');

    await calc.fill(Freelancer.inputAnnualRevenue, 60_000);

    await expect(calc.hero(Freelancer.heroNetMonthly)).toContainText(
      formatEuro(golden.freelancer.revenue60k.netMonthly),
    );
  });
});
