import { test, expect } from '@playwright/test';
import { CalculatorPage } from '../helpers/calculator.page';
import { golden } from '../helpers/golden';
import { formatEuro } from '../helpers/money';
import { PropertyPurchase } from '../helpers/test-ids';

test.describe('Property purchase calculator', () => {
  test('shows total acquisition cost for default first home', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await page.goto('/property-purchase');

    const { totalAcquisitionCost, decimals } = golden.propertyPurchase.default;
    await expect(calc.hero(PropertyPurchase.heroTotalCost)).toContainText(
      formatEuro(totalAcquisitionCost, decimals),
      { timeout: 5000 },
    );
  });
});
