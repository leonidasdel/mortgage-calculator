import { test, expect } from '@playwright/test';
import { CalculatorPage } from '../helpers/calculator.page';
import { golden } from '../helpers/golden';
import { formatEuro } from '../helpers/money';
import { AnnualBonus } from '../helpers/test-ids';

test.describe('Annual bonus calculator', () => {
  test('shows exact net bonus for gross 1500 and bonus 1000', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await page.goto('/annual-bonus');

    await calc.fill(AnnualBonus.inputGrossMonthly, 1500);
    await calc.fill(AnnualBonus.inputAnnualBonus, 1000);

    await expect(calc.hero(AnnualBonus.heroNet)).toContainText(
      formatEuro(golden.annualBonus.gross1500_bonus1000.netBonus),
    );
  });
});
