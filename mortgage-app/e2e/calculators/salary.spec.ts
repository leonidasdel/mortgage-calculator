import { test, expect } from '@playwright/test';
import { CalculatorPage } from '../helpers/calculator.page';
import { golden } from '../helpers/golden';
import { formatEuro } from '../helpers/money';
import { Salary } from '../helpers/test-ids';

test.describe('Salary calculator', () => {
  test('updates net salary when gross changes', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await page.goto('/salary');

    const netHero = calc.hero(Salary.heroNet);
    await expect(netHero).toContainText(formatEuro(golden.salary.default.netMonthly));

    await calc.fill(Salary.inputGrossMonthly, 2000);

    await expect(netHero).toContainText(formatEuro(golden.salary.gross2000.netMonthly));
  });
});
