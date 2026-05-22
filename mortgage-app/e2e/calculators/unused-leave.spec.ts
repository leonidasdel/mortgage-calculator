import { test, expect } from '@playwright/test';
import { CalculatorPage } from '../helpers/calculator.page';
import { golden } from '../helpers/golden';
import { formatEuro } from '../helpers/money';
import { UnusedLeave } from '../helpers/test-ids';

test.describe('Unused leave calculator', () => {
  test('updates net compensation when unused days change', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await page.goto('/unused-leave');

    const netHero = calc.hero(UnusedLeave.heroNet);
    await expect(netHero).toContainText(formatEuro(golden.unusedLeave.days10.totalNet));

    await calc.fill(UnusedLeave.inputUnusedDays, 5);

    await expect(netHero).toContainText(formatEuro(golden.unusedLeave.days5.totalNet));
  });
});
