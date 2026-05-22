import { test, expect } from '@playwright/test';
import { CalculatorPage } from '../helpers/calculator.page';
import { PropertyPurchase } from '../helpers/test-ids';

test.describe('Property purchase calculator', () => {
  test('shows total acquisition cost for default first home', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await page.goto('/property-purchase');

    await expect(calc.hero(PropertyPurchase.heroTotalCost)).toContainText('€209,890', { timeout: 5000 });
  });
});
