import { test, expect } from '@playwright/test';
import { CalculatorPage } from '../helpers/calculator.page';
import { golden } from '../helpers/golden';
import { formatEuro } from '../helpers/money';
import { Interest } from '../helpers/test-ids';

test.describe('Interest calculator', () => {
  test('calculates net interest for 10000 at 3.5% over one year', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await page.goto('/interest');

    await calc.fill(Interest.inputCapital, 10_000);
    await calc.fill(Interest.inputRate, 3.5);
    await page.getByTestId(Interest.pillDuration(12)).click();

    await expect(calc.hero(Interest.heroNetInterest)).toContainText(
      formatEuro(golden.interest.capital10k_rate3_5_12mo.netInterest),
      { timeout: 5000 },
    );
  });
});
