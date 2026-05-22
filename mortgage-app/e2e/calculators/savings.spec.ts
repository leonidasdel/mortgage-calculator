import { test, expect } from '@playwright/test';
import { CalculatorPage } from '../helpers/calculator.page';
import { golden } from '../helpers/golden';
import { formatEuro } from '../helpers/money';
import { Savings } from '../helpers/test-ids';

test.describe('Savings calculator', () => {
  test('projects final balance for lump-sum deposit', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await page.goto('/savings');

    await calc.fill(Savings.inputInitialDeposit, 1000);
    await calc.fill(Savings.inputMonthlyContribution, 0);
    await calc.fill(Savings.inputAnnualReturn, 5);
    await calc.fill(Savings.inputDurationYears, 10);
    await calc.get(Savings.inputApplyTax).uncheck();

    const { finalBalance, decimals } = golden.savings.lumpSum10y;
    await expect(calc.hero(Savings.heroFinalBalance)).toContainText(
      formatEuro(finalBalance, decimals),
      { timeout: 5000 },
    );
  });
});
