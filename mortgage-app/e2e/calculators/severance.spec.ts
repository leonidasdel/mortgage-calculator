import { test, expect } from '@playwright/test';
import { CalculatorPage } from '../helpers/calculator.page';
import { golden } from '../helpers/golden';
import { formatEuro } from '../helpers/money';
import { Severance } from '../helpers/test-ids';

test.describe('Severance calculator', () => {
  test('calculates tax-free severance for 10 years at 2000 gross', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await page.goto('/severance');

    await calc.fill(Severance.inputGrossMonthly, 2000);
    await calc.fill(Severance.inputYearsOfService, 10);
    await calc.fill(Severance.inputMonthsExtra, 0);

    await expect(calc.hero(Severance.heroNet)).toContainText(
      formatEuro(golden.severance.gross2000_10y.netSeverance),
      { timeout: 5000 },
    );
  });
});
